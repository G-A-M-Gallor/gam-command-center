import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { watiMessageToCommRow } from "@/lib/wati/sync";
import { findEntityByPhone } from "@/lib/wati/sync";
import type { WATIMessage } from "@/lib/wati/types";
import { sendCommPush } from "@/lib/push/sendCommPush";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/comms/wati/webhook
 * Receives incoming message webhooks from WATI.
 * No auth — WATI sends webhooks with a shared secret.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.WATI_WEBHOOK_SECRET;
    if (webhookSecret) {
      const providedSecret = request.headers.get("x-wati-secret");
      if (providedSecret !== webhookSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();

    // WATI webhook payload structure
    const waId: string = body.waId ?? body.senderPhone ?? '';
    const text: string = body.text ?? body.message ?? '';
    const msgId: string = body.id ?? body.messageId ?? '';
    const senderName: string = body.senderName ?? body.pushName ?? '';
    const timestamp: string = body.timestamp ?? new Date().toISOString();

    if (!waId) {
      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Resolve entity
    const entityId = await findEntityByPhone(supabase, waId);

    const watiMsg: WATIMessage = {
      id: msgId,
      waId,
      text,
      type: body.type ?? 'text',
      owner: false,
      timestamp,
      operatorName: senderName,
    };

    const row = watiMessageToCommRow(watiMsg, entityId, waId);

    const { error: insertError } = await supabase
      .from("comm_messages")
      .upsert([row], { onConflict: "channel,external_id" });

    if (insertError) {
      console.error("Webhook insert error:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Send push notification for inbound messages
    if (!watiMsg.owner) {
      sendCommPush(supabase, row).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
