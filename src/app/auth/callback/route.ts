import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Only these emails can access the dashboard
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const mode = searchParams.get("mode"); // "register" skips ALLOWED_EMAILS

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check allowlist — skip for registration flow
      if (mode !== "register") {
        const { data: { user } } = await supabase.auth.getUser();
        const email = user?.email?.toLowerCase() || "";

        if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) {
          // Not allowed — sign out and redirect
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?error=unauthorized`);
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
