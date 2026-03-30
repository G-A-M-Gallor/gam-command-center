import { NextRequest, NextResponse } from "next/server";
import { _createClient } from "@supabase/supabase-js";
import { _findEntityByPhone } from "@/lib/wati/sync";
import { sendCommPush } from "@/lib/push/sendCommPush";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/comms/voicenter/webhook
 * Receives CDR (Call Detail Record) webhooks from Voicenter.
 * Auth via VOICENTER_WEBHOOK_SECRET header.
 */
export async function POST(_request: NextRequest) {
  try {
    // Verify webhook secret — always required
    const secret = process.env.VOICENTER_WEBHOOK_SECRET;
    if (!secret) {
      console.error("VOICENTER_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    const provided = request.headers.get("x-voicenter-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Voicenter CDR fields
    const caller: string = body.caller ?? body.src ?? "";
    const target: string = body.target ?? body.dst ?? "";
    const duration: number = Number(body.duration ?? body.billsec ?? 0);
    const status: string = body.status ?? body.disposition ?? "unknown";
    const recordingUrl: string = body.recording_url ?? body.recordingfile ?? "";
    const callId: string = body.call_id ?? body.uniqueid ?? "";
    const timestamp: string = body.timestamp ?? body.calldate ?? new Date().toISOString();
    const direction: "inbound" | "outbound" = body.direction === "outbound" ? "outbound" : "inbound";

    const phone = direction === "inbound" ? caller : target;

    if (!phone) {
      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Resolve entity
    const entityId = await findEntityByPhone(supabase, phone);

    const durationMin = Math.floor(duration / 60);
    const durationSec = duration % 60;
    const durationStr = `${durationMin}:${String(durationSec).padStart(2, "0")}`;

    const row = {
      entity_id: entityId,
      entity_phone: phone,
      channel: "phone" as const,
      direction,
      sender_name: direction === "inbound" ? caller : target,
      body: `${status === "ANSWERED" || status === "answered" ? "שיחה" : "שיחה שלא נענתה"} (${durationStr})`,
      channel_meta: {
        voicenter_id: callId,
        caller,
        target,
        duration,
        status,
        recording_url: recordingUrl || undefined,
      },
      session_id: null,
      external_id: callId || null,
      is_read: false,
      provider: "voicenter",
      message_type: "regular" as const,
      created_at: timestamp,
    };

    const { error: insertError } = await supabase
      .from("comm_messages")
      .upsert([row], { onConflict: "channel,external_id" });

    if (insertError) {
      console.error("Voicenter webhook insert error:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Send push notification for inbound calls
    if (direction === "inbound") {
      sendCommPush(supabase, row).catch(() => { /* no-op */ });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
