import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createClient } from "@supabase/supabase-js";
import { getMessages } from "@/lib/wati/client";
import { syncWatiMessages } from "@/lib/wati/sync";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/comms/sync
 * Manual sync — pull messages from WATI for a phone number.
 */
export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuth(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  try {
    const body = await request.json();
    const phone: string = body.phone;

    if (!phone) {
      return NextResponse.json({ error: "phone is required" }, { status: 400 });
    }

    // Fetch from WATI
    const watiMessages = await getMessages(phone, 100);

    // Convert to comm_messages rows
    const supabase = getServiceClient();
    const rows = await syncWatiMessages(supabase, watiMessages, phone);

    if (rows.length === 0) {
      return NextResponse.json({ synced: 0 });
    }

    // Upsert to avoid duplicates
    const { error: upsertError, count } = await supabase
      .from("comm_messages")
      .upsert(rows, { onConflict: "channel,external_id", count: "exact" });

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ synced: count ?? rows.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
