// ===================================================
// Push Notification Sender for Comm Messages
// ===================================================
// Server-side helper: sends web-push notifications when
// new comm_messages arrive and logs to notification_log.

import webpush from "web-push";
import type { CommMessage } from "@/lib/wati/types";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@gam.co.il";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = { from: (table: string) => any };

const CHANNEL_LABELS: Record<string, { he: string; en: string }> = {
  whatsapp: { he: "WhatsApp", en: "WhatsApp" },
  phone: { he: "שיחה", en: "Call" },
  sms: { he: "SMS", en: "SMS" },
  email: { he: "אימייל", en: "Email" },
  note: { he: "הערה", en: "Note" },
  reminder: { he: "תזכורת", en: "Reminder" },
};

function buildNotification(msg: CommMessage): { title: string; body: string } {
  const channelLabel = CHANNEL_LABELS[msg.channel]?.he ?? msg.channel;
  const sender = msg.sender_name || msg.entity_phone || "לא ידוע";

  const title = `${channelLabel} — ${sender}`;
  const body = msg.body?.slice(0, 200) || "";

  return { title, body };
}

/**
 * Send push notifications for a new comm_message.
 * Sends to ALL subscribed users, logs each delivery to notification_log.
 * Silently no-ops if VAPID keys are not configured.
 */
export async function sendCommPush(
  supabase: SupabaseClient,
  msg: CommMessage,
): Promise<{ sent: number; failed: number }> {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return { sent: 0, failed: 0 };
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  // Fetch all push subscriptions
  const { data: subs } = (await supabase
    .from("push_subscriptions")
    .select("*")) as { data: PushSub[] | null };

  if (!subs || subs.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const { title, body } = buildNotification(msg);
  const url = "/dashboard/comms";
  const payload = JSON.stringify({ title, body, url, tag: `comm-${msg.channel}` });

  const expiredEndpoints: string[] = [];
  const logRows: NotifLogRow[] = [];
  let sent = 0;
  let failed = 0;

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        sent++;
        logRows.push(makeLogRow(sub, msg, title, body, url, "sent"));
      } catch (err) {
        failed++;
        if (err instanceof webpush.WebPushError && err.statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        }
        logRows.push(makeLogRow(sub, msg, title, body, url, "failed"));
      }
    }),
  );

  // Clean up expired subscriptions
  if (expiredEndpoints.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expiredEndpoints);
  }

  // Log to notification_log (fire-and-forget)
  if (logRows.length > 0) {
    await supabase.from("notification_log").insert(logRows);
  }

  return { sent, failed };
}

/**
 * Send a summary push notification (e.g., after bulk sync).
 */
export async function sendSummaryPush(
  supabase: SupabaseClient,
  title: string,
  body: string,
): Promise<void> {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  const { data: subs } = (await supabase
    .from("push_subscriptions")
    .select("*")) as { data: PushSub[] | null };

  if (!subs || subs.length === 0) return;

  const url = "/dashboard/comms";
  const payload = JSON.stringify({ title, body, url, tag: "comm-sync" });

  const expiredEndpoints: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
      } catch (err) {
        if (err instanceof webpush.WebPushError && err.statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    }),
  );

  if (expiredEndpoints.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expiredEndpoints);
  }

  // Log summary notification
  if (subs.length > 0) {
    await supabase.from("notification_log").insert(
      subs.map((sub) => ({
        user_id: sub.user_id,
        title,
        body,
        source_type: "comm",
        delivery_status: "sent",
        url,
        meta: { type: "sync_summary" },
      })),
    );
  }
}

// ─── Internal types ─────────────────────────────────

interface PushSub {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface NotifLogRow {
  user_id: string;
  comm_message_id: string | null;
  title: string;
  body: string;
  source_type: string;
  delivery_status: string;
  url: string;
  meta: Record<string, unknown>;
}

function makeLogRow(
  sub: PushSub,
  msg: CommMessage,
  title: string,
  body: string,
  url: string,
  status: "sent" | "failed",
): NotifLogRow {
  return {
    user_id: sub.user_id,
    comm_message_id: msg.id ?? msg.external_id ?? null,
    title,
    body,
    source_type: "comm",
    delivery_status: status,
    url,
    meta: { channel: msg.channel, provider: msg.provider },
  };
}
