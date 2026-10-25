import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "njbsictclub@gmail.com";

type CreateUserRequest = {
  email?: string;
  password?: string;
  name?: string;
  memberId?: string;
  accessToken?: string;
};

function createServiceClient(url: string, key: string) {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: Request) {
  try {
    const primaryUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const primaryKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const devPulseUrl = process.env.DEVPULSE_SUPABASE_URL;
    const devPulseKey = process.env.DEVPULSE_SUPABASE_SERVICE_ROLE_KEY;

    if (!primaryUrl || !primaryKey) {
      console.error("[create-user] ICT Club Supabase admin credentials are missing.", {
        hasUrl: Boolean(primaryUrl),
        hasServiceRoleKey: Boolean(primaryKey),
      });
      return Response.json(
        { error: "Server is missing the ICT Club Supabase admin credentials." },
        { status: 500 },
      );
    }

    if (!devPulseUrl || !devPulseKey) {
      console.error("[create-user] DevPulse Supabase admin credentials are missing.");
    }

    const body = (await request.json()) as CreateUserRequest;
    if (!body.email?.trim() || !body.password || !body.memberId?.trim()) {
      return Response.json(
        { error: "Email, Member ID, and password are required." },
        { status: 400 },
      );
    }
    if (!body.accessToken) {
      return Response.json(
        { error: "Your admin session has expired. Please sign in again." },
        { status: 401 },
      );
    }

    const primaryAdmin = createServiceClient(primaryUrl, primaryKey);
    const { data: sessionUser, error: sessionError } = await primaryAdmin.auth.getUser(
      body.accessToken,
    );
    if (sessionError || sessionUser.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
      return Response.json(
        { error: "Admin access is required to create member accounts." },
        { status: 403 },
      );
    }

    const email = body.email.trim().toLowerCase();
    const metadata = {
      full_name: body.name?.trim() ?? "",
      name: body.name?.trim() ?? "",
      role: "member",
      memberId: body.memberId.trim().toUpperCase(),
      member_id: body.memberId.trim().toUpperCase(),
    };

    const { data: created, error } = await primaryAdmin.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) return Response.json({ error: error.message }, { status: 400 });

    if (devPulseUrl && devPulseKey) {
      try {
        const devPulseAdmin = createServiceClient(devPulseUrl, devPulseKey);
        const { error: devPulseError } = await devPulseAdmin.auth.admin.createUser({
          email,
          password: body.password,
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

    return Response.json({ id: created.user.id });
  } catch (error) {
    console.error("[create-user] Request failed:", error);
    return Response.json({ error: "Could not create the member account." }, { status: 500 });
  }
}
