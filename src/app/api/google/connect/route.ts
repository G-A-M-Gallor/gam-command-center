import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSignedState, buildAuthUrl } from "@/lib/google/oauth";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const state = createSignedState(user.id);
  const authUrl = buildAuthUrl(state);

  return NextResponse.redirect(authUrl);
}
