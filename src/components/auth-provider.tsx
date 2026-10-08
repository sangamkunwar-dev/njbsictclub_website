import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client"; // Native central client
import type { Session, User } from "@supabase/supabase-js";
import { upsertRegisteredUser } from "@/lib/store";

export type UserRole = "visitor" | "member" | "admin";

export interface AppUser {
  id: string;
  email: string | null;
  name: string;
  avatar: string | null;
  role: UserRole;
  memberId?: string;
}

interface AuthContextValue {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ADMIN_EMAILS = new Set(["njbsictclub@gmail.com"]);
const MEMBER_EMAIL_DOMAIN = "@njbsict.club";

export function generateMemberId() {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `NJBs12134${suffix}`;
}

/**
 * Roles are decided by the account itself — never by a client-side choice:
 * - the club admin email is admin
 * - accounts created in the admin panel carry role/member_id/memberId metadata OR use @njbsict.club domain -> member
 * - everyone who signs up themselves is a visitor
 */
function resolveRole(user: User): { role: UserRole; memberId?: string } {
  const email = user.email?.toLowerCase() ?? "";
  if (ADMIN_EMAILS.has(email)) return { role: "admin", memberId: "NJBs12134-ADMIN" };

  const userMeta = (user.user_metadata ?? {}) as Record<string, string>;
  const appMeta = (user.app_metadata ?? {}) as Record<string, string>;
  const role = userMeta.role || appMeta.role;
  const memberId = userMeta.memberId || userMeta.member_id || appMeta.memberId || appMeta.member_id;

  // Admin-created accounts use explicit member metadata or the club-only
  // domain, including accounts created before metadata was repaired.
  if (role === "member" || memberId || email.endsWith(MEMBER_EMAIL_DOMAIN)) {
    return {
      role: "member",
      memberId:
        memberId ?? (email.includes("@") ? email.split("@")[0].toUpperCase() : generateMemberId()),
    };
  }

  return { role: "visitor" };
}

function toAppUser(user: User): AppUser {
  const { role, memberId } = resolveRole(user);
  const meta = user.user_metadata ?? {};

  // Clean up display name
  const rawName = meta.full_name ?? meta.name ?? (user.email ? user.email.split("@")[0] : "Member");

  const app: AppUser = {
    id: user.id,
    email: user.email ?? null,
    name: rawName,
    avatar: meta.avatar_url ?? meta.picture ?? null,
    role,
    memberId,
  };

  try {
    upsertRegisteredUser({
      id: app.id,
      email: app.email ?? "",
      name: app.name,
      avatar: app.avatar,
      role: app.role,
      memberId: app.memberId,
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Failed to update registered user store:", err);
  }

  return app;
}

async function hydrateMemberIdentity(app: AppUser): Promise<AppUser> {
  if (!app.email || app.role === "admin" || app.role === "member") return app;

  // OAuth can create a different Supabase user id from the one used by a
  // member account. Match the verified provider email to the saved member
  // record before the router decides whether the user is a visitor.
  const email = app.email.trim().toLowerCase();
  const { data: member, error } = await supabase
    .from("member_profiles")
    .select("member_id, display_name")
    .ilike("email", email)
    .maybeSingle();

  if (!error && member) {
    return {
      ...app,
      role: "member",
      memberId: member.member_id,
      name: member.display_name || app.name,
    };
  }

  // Also support profiles saved directly from the Profile page. This covers
  // records whose email lives inside the profile_data JSON instead of the
  // admin-managed member_profiles table.
  // A Google account can have a new Supabase user id even when its verified
  // email belongs to a profile saved before Google sign-in was enabled.
  const { data: savedProfile } = await supabase
    .from("profiles")
    .select("profile_data")
    .or(`id.eq.${app.id},profile_data->>email.eq.${email}`)
    .limit(2);
  const profileData = savedProfile?.find((record) => {
    const data = record.profile_data;
    return (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      typeof (data as { email?: unknown }).email === "string" &&
      (data as { email: string }).email.trim().toLowerCase() === email
    );
  })?.profile_data;
  if (!profileData || typeof profileData !== "object" || Array.isArray(profileData)) return app;

  const savedEmail = (profileData as { email?: unknown }).email;
  if (typeof savedEmail !== "string" || savedEmail.trim().toLowerCase() !== email) return app;

  const savedMemberId =
    (profileData as { memberId?: unknown; member_id?: unknown }).memberId ??
    (profileData as { member_id?: unknown }).member_id;
  return {
    ...app,
    role: "member",
    memberId: typeof savedMemberId === "string" ? savedMemberId : app.memberId,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || typeof supabase.auth === "undefined") {
      setLoading(false);
      return;
    }

    const applySession = async (s: Session | null) => {
      setSession(s);
      if (!s?.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      const appUser = await hydrateMemberIdentity(toAppUser(s.user));
      setUser(appUser);
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event: string, s: Session | null) => {
      void applySession(s);
    });

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      void applySession(data.session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (!supabase || typeof supabase.auth === "undefined") return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
