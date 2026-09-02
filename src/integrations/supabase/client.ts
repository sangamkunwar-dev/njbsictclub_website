import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function createSupabaseClient() {
  // Check for both the publishable key format and the standard anonymous key format
  const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  // SAFE GUARD: Do not throw a hard exception here. 
  // Log it to the console so your application structure stays running.
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.error(
      "[Supabase Client] Critical: Environment keys are missing. " +
      "Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your Vercel panel."
    );
    // Return a dummy client proxy to prevent downstream properties (.auth, .from) from throwing undefined errors
    return {} as any;
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Export direct client access without the problematic interceptor proxy layers
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
