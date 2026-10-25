import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;
let devPulseCached: SupabaseClient | null = null;

function createServiceClient(url: string, key: string): SupabaseClient {
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

export function getDevPulseSupabaseAdmin(): SupabaseClient {
  if (devPulseCached) return devPulseCached;

  const url = process.env["DEVPULSE_SUPABASE_URL"];
  const key = process.env["DEVPULSE_SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) {
    throw new Error("DevPulse account sync is not configured on the server.");
  }

  devPulseCached = createServiceClient(url, key);
  return devPulseCached;
}

/**
 * Service-role client. Read env inside the call (not at module scope) so the
 * server runtime can inject values per request.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env["SUPABASE_URL"] ?? process.env["NEXT_PUBLIC_SUPABASE_URL"];
  // Prefer the legacy service-role key when both are present. It is the key
  // supported by the Auth Admin API, while newer projects may expose the
  // equivalent opaque secret key instead.
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["SUPABASE_SECRET_KEY"];

  if (!url || !key) {
    throw new Error(
      "Server is missing its database credentials. Ask the site owner to re-check the backend connection.",
    );
  }

  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        // Opaque sb_secret_ keys are not JWTs — send them only as `apikey`.
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input as RequestInfo, { ...init, headers });
      },
    },
  });
  return cached;
}
