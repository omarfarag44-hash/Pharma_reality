import { NextResponse, type NextRequest } from "next/server";
import { resolveEnv } from "@/lib/env";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";

const LOCALES = ["ar", "en"];
const DEFAULT_LOCALE = "ar";
const LOCALE_COOKIE = "PR_LOCALE";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const segment = pathname.split("/")[1] ?? "";

  // 1. Every page lives under /ar or /en. Default to Arabic (RTL).
  if (!LOCALES.includes(segment)) {
    const preferred = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale = preferred && LOCALES.includes(preferred) ? preferred : DEFAULT_LOCALE;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    url.search = search;
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pr-locale", segment);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (request.cookies.get(LOCALE_COOKIE)?.value !== segment) {
    response.cookies.set(LOCALE_COOKIE, segment, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }

  // 2. Supabase mode: refresh the session and require sign-in. Demo/Postgres modes need no auth.
  const env = resolveEnv();
  if (env.mode === "supabase" && env.supabaseUrl && env.supabaseAnonKey) {
    const signedIn = await refreshSupabaseSession(request, response, env.supabaseUrl, env.supabaseAnonKey);
    const isLogin = pathname === `/${segment}/login`;
    if (!signedIn && !isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = `/${segment}/login`;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico|webp|txt)$).*)"],
};
