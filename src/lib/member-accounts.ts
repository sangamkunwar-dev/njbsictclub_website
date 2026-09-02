// Shared (client-safe) helpers for admin-created member logins.
export const MEMBER_EMAIL_DOMAIN = "njbsict.club";
export const CLUB_ADMIN_EMAIL = "njbsictclub@gmail.com";
export const CLUB_ADMIN_USERNAME = "admin";
export const CLUB_ADMIN_MEMBER_ID = "NJB-ADMIN";

/** Turns an email, admin alias, or member ID into the Supabase login email. */
export function usernameToEmail(username: string) {
  const u = username.trim().toLowerCase();
  if (
    u === CLUB_ADMIN_USERNAME ||
    u === CLUB_ADMIN_MEMBER_ID.toLowerCase() ||
    u === CLUB_ADMIN_EMAIL
  ) {
    return CLUB_ADMIN_EMAIL;
  }
  if (u.includes("@")) return u;
  return `${u.replace(/[^a-z0-9._-]/g, "")}@${MEMBER_EMAIL_DOMAIN}`;
}

export function emailToUsername(email: string) {
  return email.toLowerCase().endsWith(`@${MEMBER_EMAIL_DOMAIN}`)
    ? email.slice(0, email.length - MEMBER_EMAIL_DOMAIN.length - 1)
    : email;
}

export interface MemberAccount {
  id: string;
  username: string;
  name: string;
  memberId: string;
  createdAt: string;
}

export function randomMemberId() {
  return `NJBs12134${Math.floor(1000 + Math.random() * 9000)}`;
}
