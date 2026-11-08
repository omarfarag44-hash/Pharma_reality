import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

/** Refreshes the Supabase session cookie and reports whether a user is signed in. */
export async function refreshSupabaseSession(
  request: NextRequest,
  response: NextResponse,
  url: string,
  anonKey: string,
): Promise<boolean> {
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  return Boolean(data.user);
}
