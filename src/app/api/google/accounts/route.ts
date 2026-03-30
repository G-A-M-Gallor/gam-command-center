import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listGoogleAccounts, deleteGoogleAccount } from "@/lib/google/googleAccountQueries";

// GET /api/google/accounts — list connected Google accounts
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const accounts = await listGoogleAccounts(user.id);
    return NextResponse.json({ accounts });
  } catch (err) {
    console.error("List Google accounts error:", err);
    return NextResponse.json({ error: "Failed to list accounts" }, { status: 500 });
  }
}

// DELETE /api/google/accounts?id=<account_id> — disconnect a Google account
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accountId = new URL(request.url).searchParams.get("id");
  if (!accountId) {
    return NextResponse.json({ error: "Missing account id" }, { status: 400 });
  }

  try {
    await deleteGoogleAccount(accountId, user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete Google account error:", err);
    return NextResponse.json({ error: "Failed to disconnect account" }, { status: 500 });
  }
}
