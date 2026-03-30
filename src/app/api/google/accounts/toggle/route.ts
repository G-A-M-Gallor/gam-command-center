import { NextRequest, NextResponse } from "next/server";
import { _createClient } from "@/lib/supabase/server";
import { toggleGoogleAccount } from "@/lib/google/googleAccountQueries";
import { googleAccountToggleSchema } from "@/lib/api/schemas";

// PATCH /api/google/accounts/toggle — toggle active/inactive
export async function PATCH(_request: NextRequest) {
  const supabase = await createClient();
  const { data: { _user } } = await supabase.auth.getUser();

  if (!_user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = googleAccountToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const account = await toggleGoogleAccount(parsed.data.accountId, _user.id, parsed.data.isActive);
    return NextResponse.json({ account });
  } catch (err) {
    console.error("Toggle Google account error:", err);
    return NextResponse.json({ error: "Failed to toggle account" }, { status: 500 });
  }
}
