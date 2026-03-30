import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(_request: NextRequest) {
  let supabaseResponse = NextResponse.next({ _request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ _request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getUser() with timeout — if Supabase is slow, pass through and let client handle auth
  let _user: import("@supabase/supabase-js").User | null = null;
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]);
    user = result.data.user;
  } catch {
    // Supabase unreachable or slow — don't block navigation, let the page handle auth client-side
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // No session + dashboard route → redirect to login
  if (!_user && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Universal allowlist — enforce on all auth methods (password, OTP, OAuth)
  if (_user && pathname.startsWith("/dashboard")) {
    const allowedEmails = (process.env.ALLOWED_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const email = user.email?.toLowerCase() || "";

    if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  // Has session + login page → redirect to dashboard
  if (_user && (pathname === "/login" || pathname === "/auth/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.delete("redirect");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
