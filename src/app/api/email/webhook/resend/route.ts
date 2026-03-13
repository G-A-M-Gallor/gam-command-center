import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Webhook } from "svix";

// Resend webhook events for email tracking
// Events: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    click?: { link: string };
    bounce?: { message: string };
    headers?: { name: string; value: string }[];
    [key: string]: unknown;
  };
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  const body = await request.text();

  // Validate webhook signature using Svix
  if (webhookSecret) {
    const svixId = request.headers.get("svix-id");
    const svixSignature = request.headers.get("svix-signature");
    const svixTimestamp = request.headers.get("svix-timestamp");
    if (!svixId || !svixSignature || !svixTimestamp) {
      return NextResponse.json({ error: "Missing webhook headers" }, { status: 401 });
    }
    try {
      const wh = new Webhook(webhookSecret);
      wh.verify(body, {
        "svix-id": svixId,
        "svix-signature": svixSignature,
        "svix-timestamp": svixTimestamp,
      });
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: ResendWebhookPayload;
  try {
    payload = JSON.parse(body) as ResendWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = payload;
  const resendId = data.email_id;
  if (!resendId) {
    return NextResponse.json({ error: "Missing email_id" }, { status: 400 });
  }

  const supabase = await createClient();

  // Find the email_send by resend_id
  const { data: emailSend } = await supabase
    .from("email_sends")
    .select("id, status, opened_count, clicked_count, first_opened_at, clicked_links")
    .eq("resend_id", resendId)
    .single();

  if (!emailSend) {
    // Unknown email — log event anyway
    await supabase.from("email_events").insert({
      resend_id: resendId,
      event_type: type,
      payload,
    });
    return NextResponse.json({ ok: true, matched: false });
  }

  // Extract metadata from headers
  const userAgent = (payload.data as Record<string, unknown>).userAgent as string || "";
  const ipAddress = (payload.data as Record<string, unknown>).ipAddress as string || "";

  // Log event
  await supabase.from("email_events").insert({
    email_send_id: emailSend.id,
    resend_id: resendId,
    event_type: type,
    payload,
    link_url: data.click?.link || null,
    user_agent: userAgent,
    ip_address: ipAddress,
  });

  // Update email_sends based on event type
  const eventType = type.replace("email.", "");
  const updates: Record<string, unknown> = {};

  switch (eventType) {
    case "sent":
      updates.status = "sent";
      break;
    case "delivered":
      updates.status = "delivered";
      break;
    case "opened":
      updates.status = "opened";
      updates.opened_count = (emailSend.opened_count || 0) + 1;
      if (!emailSend.first_opened_at) {
        updates.first_opened_at = new Date().toISOString();
      }
      updates.last_opened_at = new Date().toISOString();
      break;
    case "clicked": {
      updates.status = "clicked";
      updates.clicked_count = (emailSend.clicked_count || 0) + 1;
      if (!emailSend.first_opened_at) {
        updates.first_clicked_at = new Date().toISOString();
      }
      // Append to clicked_links
      const existingLinks = (emailSend.clicked_links || []) as { url: string; count: number; first_at: string }[];
      const clickedUrl = data.click?.link || "";
      const existingLink = existingLinks.find((l) => l.url === clickedUrl);
      if (existingLink) {
        existingLink.count++;
      } else {
        existingLinks.push({ url: clickedUrl, count: 1, first_at: new Date().toISOString() });
      }
      updates.clicked_links = existingLinks;
      break;
    }
    case "bounced":
      updates.status = "bounced";
      updates.bounce_reason = data.bounce?.message || "Unknown bounce";
      break;
    case "complained":
      updates.status = "complained";
      // Auto-unsubscribe on complaint
      if (data.to?.[0]) {
        const { data: send } = await supabase
          .from("email_sends")
          .select("tenant_id")
          .eq("id", emailSend.id)
          .single();
        if (send?.tenant_id) {
          await supabase.from("email_unsubscribes").upsert(
            { email: data.to[0], tenant_id: send.tenant_id, reason: "complaint" },
            { onConflict: "email,tenant_id" }
          );
        }
      }
      break;
  }

  if (Object.keys(updates).length > 0) {
    await supabase
      .from("email_sends")
      .update(updates)
      .eq("id", emailSend.id);
  }

  // Sync status back to comm_messages if linked
  const { data: sendData } = await supabase
    .from("email_sends")
    .select("comm_message_id")
    .eq("id", emailSend.id)
    .single();

  if (sendData?.comm_message_id && updates.status) {
    await supabase
      .from("comm_messages")
      .update({
        channel_meta: {
          email_status: updates.status,
          opened_count: updates.opened_count,
          clicked_count: updates.clicked_count,
        },
      })
      .eq("id", sendData.comm_message_id);
  }

  return NextResponse.json({ ok: true, event: eventType });
}
