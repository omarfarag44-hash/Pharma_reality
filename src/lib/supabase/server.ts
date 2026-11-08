import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { resolveEnv } from "@/lib/env";

/**
 * Supabase client bound to the current request's auth cookies.
 * Uses only the public anon key; Row Level Security enforces access.
 * The service-role key is never used by the web application.
 */
export async function createSupabaseServerClient() {
  const env = resolveEnv();
  if (!env.supabaseUrl || !env.supabaseAnonKey) throw new Error("Supabase is not configured.");
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are read-only there; middleware refreshes them.
        }
      },
    },
  });
}
