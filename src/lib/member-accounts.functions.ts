import { supabase } from "@/integrations/supabase/client";

const EDGE_FUNCTION = "member-account-admin";

type Call<T> = { data?: T };

async function callAdmin<T>(body: Record<string, unknown>, requireAdmin = true): Promise<T> {
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error("Unable to read your admin session. Please sign in again.");
  
  const token = data.session?.access_token;
  if (requireAdmin && !token) throw new Error("Your admin session has expired. Please sign in again.");

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
    if (message.includes("claims") || message.includes("context") || message.includes("FunctionsFetchError")) {
      throw new Error("The member account service is unavailable. Please refresh the page and sign in again.");
    }
    throw new Error(message);
  }

  if (result?.error) throw new Error(String(result.error));
  return result as T;
}

export const listMemberAccounts = async (_input?: Call<{ accessToken?: string }>): Promise<MemberAccount[]> => {
  const res = await callAdmin<any>({ op: "list" });

  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && Array.isArray(res.members)) return res.members;

  return [];
};

export const createMemberAccount = async ({ data }: Call<{ username: string; password: string; name: string; memberId: string }>) => {
  if (!data) throw new Error("Member details are missing. Please complete the form and try again.");
  return callAdmin<{ id: string }>({ 
    op: "create", 
    username: data.username,
    memberId: data.memberId || data.username, 
    password: data.password, 
    name: data.name 
  });
};

export const updateMemberAccount = async ({ data }: Call<{ userId: string; name: string; memberId: string }>) => {
  if (!data) throw new Error("Member details are missing. Please try again.");
  return callAdmin<{ ok: true }>({ op: "update", ...data });
};

export const setMemberPassword = async ({ data }: Call<{ userId: string; password: string }>) => {
  if (!data) throw new Error("Password details are missing. Please try again.");
  return callAdmin<{ ok: true }>({ op: "password", ...data });
};

export const deleteMemberAccount = async ({ data }: Call<{ userId: string }>) => {
  if (!data) throw new Error("Member details are missing. Please try again.");
  return callAdmin<{ ok: true }>({ op: "delete", ...data });
};

export const requestMemberPasswordReset = async ({ data }: Call<{ username?: string; memberId?: string; note?: string }>) => {
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
};

export const MEMBER_EMAIL_DOMAIN = "njbsict.club";
export const randomMemberId = () => `MEMBER-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export type { Call };
