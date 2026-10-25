import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "njbsictclub@gmail.com";

type CreateUserRequest = {
  email?: string;
  password?: string;
  name?: string;
  full_name?: string;
  memberId?: string;
  accessToken?: string;
};

function createServiceClient(url: string, key: string) {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: Request) {
  try {
    const { email, password, full_name, name, memberId, accessToken } =
      (await req.json()) as CreateUserRequest;

    if (!email?.trim() || !password || !memberId?.trim()) {
      return NextResponse.json(
        { error: "Email, Member ID, and password are required." },
        { status: 400 },
      );
    }
    if (!accessToken) {
      return NextResponse.json(
        { error: "Your admin session has expired. Please sign in again." },
        { status: 401 },
      );
    }
    const primaryUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const primaryKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const devPulseUrl = process.env.DEVPULSE_SUPABASE_URL;
    const devPulseKey = process.env.DEVPULSE_SUPABASE_SERVICE_ROLE_KEY;

    if (!primaryUrl || !primaryKey) {
      console.error("[create-user] ICT Club Supabase admin credentials are missing.", {
        hasUrl: Boolean(primaryUrl),
        hasServiceRoleKey: Boolean(primaryKey),
      });
      return NextResponse.json(
        { error: "Server is missing the ICT Club Supabase admin credentials." },
        { status: 500 },
      );
    }

    if (!devPulseUrl || !devPulseKey) {
      console.error("[create-user] DevPulse Supabase admin credentials are missing.");
    }

    const primaryAdmin = createServiceClient(primaryUrl, primaryKey);
    const { data: sessionUser, error: sessionError } = await primaryAdmin.auth.getUser(
      accessToken,
    );
    if (sessionError || sessionUser.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Admin access is required to create member accounts." },
        { status: 403 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMemberId = memberId.trim().toUpperCase();
    const metadata = {
      full_name: (full_name ?? name)?.trim() ?? "",
      name: (full_name ?? name)?.trim() ?? "",
      role: "member",
      memberId: normalizedMemberId,
      member_id: normalizedMemberId,
    };

    const { data: created, error } = await primaryAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (devPulseUrl && devPulseKey) {
      try {
        const devPulseAdmin = createServiceClient(devPulseUrl, devPulseKey);
        const { error: devPulseError } = await devPulseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true,
          user_metadata: metadata,
        });
        if (devPulseError) {
          console.error("[create-user] DevPulse user creation failed:", devPulseError);
        }
      } catch (devPulseError) {
        console.error("[create-user] DevPulse user creation threw:", devPulseError);
      }
    }

    return NextResponse.json({ success: true, user: created.user }, { status: 200 });
  } catch (error) {
    console.error("[create-user] Request failed:", error);
    return NextResponse.json({ error: "Could not create the member account." }, { status: 500 });
  }
}
