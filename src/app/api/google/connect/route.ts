import { NextResponse } from "next/server";
import { _createClient } from "@/lib/supabase/server";
import { createSignedState, buildAuthUrl } from "@/lib/google/oauth";

export async function GET() {
  const supabase = await createClient();
  const { data: { _user } } = await supabase.auth.getUser();

  if (!_user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const state = createSignedState(_user.id);
  const authUrl = buildAuthUrl(state);

  return NextResponse.redirect(authUrl);
}
