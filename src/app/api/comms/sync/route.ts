import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { _createClient } from "@supabase/supabase-js";
import { getMessages, getContacts } from "@/lib/wati/client";
import { syncWatiMessages } from "@/lib/wati/sync";
import { sendSummaryPush } from "@/lib/push/sendCommPush";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Sync messages for a single phone number. Returns count of upserted rows.
 */
async function syncPhone(
  supabase: ReturnType<typeof getServiceClient>,
  phone: string,
): Promise<number> {
  const watiMessages = await getMessages(phone, 100);
  const rows = await syncWatiMessages(supabase, watiMessages, phone);
  if (rows.length === 0) return 0;

  const { error, count } = await supabase
    .from("comm_messages")
    .upsert(rows, { onConflict: "channel,external_id", count: "exact" });

  if (error) {
    console.error(`Sync error for ${phone}:`, error.message);
    return 0;
  }
  return count ?? rows.length;
}

/**
 * POST /api/comms/sync
 *
 * Body: { phone?: string }
 * - With phone → sync messages for that specific number
 * - Without phone → bulk sync: fetch all WATI contacts, sync each one
 */
export async function POST(_request: NextRequest) {
  const { error: authError } = await requireAuth(_request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const phone: string | undefined = body.phone;
    const supabase = getServiceClient();

    // ── Single phone sync ───────────────────────────
    if (phone) {
      const synced = await syncPhone(supabase, phone);
      return NextResponse.json({ synced, contacts: 1 });
    }

    // ── Bulk sync: all WATI contacts ────────────────
    const contacts = await getContacts(100);

    let totalSynced = 0;
    let contactsSynced = 0;
    const errors: string[] = [];

    // Process contacts sequentially to avoid WATI rate limits
    for (const contact of contacts) {
      const contactPhone = contact.phone || contact.wAid;
      if (!contactPhone) continue;

      try {
        const count = await syncPhone(supabase, contactPhone);
        totalSynced += count;
        contactsSynced++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${contactPhone}: ${msg}`);
      }
    }

    // Send summary push if new messages were synced
    if (totalSynced > 0) {
      sendSummaryPush(
        supabase,
        "סנכרון WATI הושלם",
        `${totalSynced} הודעות חדשות מ-${contactsSynced} אנשי קשר`,
      ).catch(() => { /* no-op */ });
    }

    return NextResponse.json({
      synced: totalSynced,
      contacts: contactsSynced,
      totalContacts: contacts.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
