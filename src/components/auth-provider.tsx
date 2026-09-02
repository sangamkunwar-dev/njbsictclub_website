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
      memberId: memberId ?? (email.includes("@") ? email.split("@")[0].toUpperCase() : generateMemberId()),
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || typeof supabase.auth === "undefined") {
      setLoading(false);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event: string, s: Session | null) => {
      setSession(s);
      setUser(s?.user ? toAppUser(s.user) : null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session);
      setUser(data.session?.user ? toAppUser(data.session.user) : null);
      setLoading(false);
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
