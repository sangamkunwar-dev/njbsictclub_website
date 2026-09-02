import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface PublicIntegrations {
  gaMeasurementId?: string;
  gscVerification?: string;
}

/** Public read of the admin-managed Google integration settings (anon-readable). */
export const getIntegrations = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicIntegrations> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return {};
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data } = await client
      .from("app_data")
      .select("value")
      .eq("key", "integrations")
      .maybeSingle();
    const value = (data?.value ?? {}) as PublicIntegrations;
    return {
      gaMeasurementId: value.gaMeasurementId || undefined,
      gscVerification: value.gscVerification || undefined,
    };
  },
);
