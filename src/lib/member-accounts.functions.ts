import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const EDGE_FUNCTION = "member-account-admin";
const ADMIN_EMAIL = "njbsictclub@gmail.com";

type CreateMemberAccountInput = {
  username: string;
  password: string;
  name: string;
  memberId: string;
  email: string;
  accessToken?: string;
};

function createServiceClient(url: string, key: string) {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input as RequestInfo, { ...init, headers });
      },
    },
  });
}

export const createMemberAccountAction = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: CreateMemberAccountInput }) => {
    const primaryUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const primaryKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const devPulseUrl = process.env.DEVPULSE_SUPABASE_URL;
    const devPulseKey = process.env.DEVPULSE_SUPABASE_SERVICE_ROLE_KEY;

    if (!primaryUrl || !primaryKey) {
      throw new Error("Server is missing the ICT Club Supabase admin credentials.");
    }
    if (!data?.email?.trim() || !data.password || !data.memberId?.trim()) {
      throw new Error("Email, Member ID, and password are required.");
    }

    const primaryAdmin = createServiceClient(primaryUrl, primaryKey);
    if (!data.accessToken) throw new Error("Your admin session has expired. Please sign in again.");
    const { data: sessionUser, error: sessionError } = await primaryAdmin.auth.getUser(
      data.accessToken,
    );
    if (sessionError || sessionUser.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
      throw new Error("Admin access is required to create member accounts.");
    }

    const email = data.email.trim().toLowerCase();
    const metadata = {
      full_name: data.name.trim(),
      name: data.name.trim(),
      role: "member",
      memberId: data.memberId.trim().toUpperCase(),
      member_id: data.memberId.trim().toUpperCase(),
    };
    const { data: created, error } = await primaryAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw new Error(error.message);

    if (devPulseUrl && devPulseKey) {
      try {
        const devPulseAdmin = createServiceClient(devPulseUrl, devPulseKey);
        const { error: devPulseError } = await devPulseAdmin.auth.admin.createUser({
          email,
          password: data.password,
          email_confirm: true,
          user_metadata: metadata,
        });
        if (devPulseError) {
          console.error("[member-account-admin] DevPulse user creation failed:", devPulseError);
        }
      } catch (devPulseError) {
        console.error("[member-account-admin] DevPulse user creation threw:", devPulseError);
      }
    } else {
      console.error("[member-account-admin] DevPulse Supabase admin credentials are missing.");
    }

    return { id: created.user.id };
  },
);

type Call<T> = { data?: T };

async function callAdmin<T>(body: Record<string, unknown>, requireAdmin = true): Promise<T> {
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error("Unable to read your admin session. Please sign in again.");

  const token = data.session?.access_token;
  if (requireAdmin && !token)
    throw new Error("Your admin session has expired. Please sign in again.");

  const payload = {
    ...body,
    ...(token ? { accessToken: token } : {}),
  };

  const { data: result, error } = await supabase.functions.invoke(EDGE_FUNCTION, {
    body: payload,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (error) {
    const message = error.message || "Could not connect to the member account service.";
    if (
      message.includes("claims") ||
      message.includes("context") ||
      message.includes("FunctionsFetchError")
    ) {
      throw new Error(
        "The member account service is unavailable. Please refresh the page and sign in again.",
      );
    }
    throw new Error(message);
  }

  if (result?.error) throw new Error(String(result.error));
  return result as T;
}

export const listMemberAccounts = async (
  _input?: Call<{ accessToken?: string }>,
): Promise<MemberAccount[]> => {
  const res = await callAdmin<
    MemberAccount[] | { data?: MemberAccount[]; members?: MemberAccount[] }
  >({ op: "list" });

  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && Array.isArray(res.members)) return res.members;

  return [];
};

export const createMemberAccount = async ({
  data,
}: Call<{
  username: string;
  password: string;
  name: string;
  memberId: string;
  email?: string;
  accessToken?: string;
}>) => {
  if (!data) throw new Error("Member details are missing. Please complete the form and try again.");
  return createMemberAccountAction({
    data: {
      username: data.username,
      memberId: data.memberId || data.username,
      password: data.password,
      name: data.name,
      email: data.email?.trim().toLowerCase() || "",
      accessToken: data.accessToken,
    },
  });
};

export const updateMemberAccount = async ({
  data,
}: Call<{ userId: string; name: string; memberId: string; email?: string }>) => {
  if (!data) throw new Error("Member details are missing. Please try again.");
  return callAdmin<{ ok: true }>({
    op: "update",
    ...data,
    email: data.email?.trim().toLowerCase() || null,
  });
};

export const setMemberPassword = async ({ data }: Call<{ userId: string; password: string }>) => {
  if (!data) throw new Error("Password details are missing. Please try again.");
  return callAdmin<{ ok: true }>({ op: "password", ...data });
};

export const deleteMemberAccount = async ({ data }: Call<{ userId: string }>) => {
  if (!data) throw new Error("Member details are missing. Please try again.");
  return callAdmin<{ ok: true }>({ op: "delete", ...data });
};

export const requestMemberPasswordReset = async ({
  data,
}: Call<{ username?: string; memberId?: string; note?: string }>) => {
  if (!data || (!data.username && !data.memberId)) {
    throw new Error("Enter your member ID or username.");
  }
  return callAdmin<{ ok: true }>({ op: "reset-request", ...data }, false);
};

export type MemberAccount = {
  id: string;
  username: string;
  name: string;
  memberId: string;
  createdAt: string;
  email?: string;
};

export const MEMBER_EMAIL_DOMAIN = "njbsict.club";
export const randomMemberId = () =>
  `MEMBER-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export type { Call };
