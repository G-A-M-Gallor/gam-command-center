import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { commSendSchema } from "@/lib/api/schemas";
import { sendTextMessage, sendTemplateMessage } from "@/lib/wati/client";
import { _createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/comms/send
 * Send a WhatsApp message via WATI and log to comm_messages.
 */
export async function POST(_request: NextRequest) {
  const { _user, error: authError } = await requireAuth(_request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = commSendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid _request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { phone, message, template_name, template_params, entity_id } = parsed.data;

    // Send via WATI
    let result;
    if (template_name) {
      const params = (template_params ?? []).map((p) => ({
        name: p.name,
        value: p.value,
      }));
      result = await sendTemplateMessage(phone, template_name, params);
    } else {
      result = await sendTextMessage(phone, message!);
    }

    // Log to comm_messages
    const supabase = getServiceClient();
    const { error: insertError } = await supabase.from("comm_messages").insert([
      {
        entity_id: entity_id ?? null,
        entity_phone: phone.replace(/\D/g, ''),
        channel: "whatsapp",
        direction: "outbound",
        sender_name: user!.email ?? "System",
        body: message || `[Template: ${template_name}]`,
        channel_meta: {
          wati_response_id: result.id,
          template_name: template_name ?? null,
        },
        external_id: result.id ?? null,
        is_read: true,
      },
    ]);

    if (insertError) {
      console.error("Failed to log comm message:", insertError.message);
    }

    return NextResponse.json({ success: true, wati_id: result.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
