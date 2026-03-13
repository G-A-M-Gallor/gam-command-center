// ===================================================
// Resend Email Client — Multi-tenant email sending
// ===================================================
// Sends emails via Resend API, renders React Email
// templates, logs to email_sends + comm_messages.

import { Resend } from "resend";
import { render } from "@react-email/components";
import type { ReactElement } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = { from: (table: string) => any };

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not configured");
    _resend = new Resend(key);
  }
  return _resend;
}

export interface EmailTenant {
  id: string;
  name: string;
  domain: string;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  logo_url: string | null;
  signature_html: string | null;
  brand_color: string;
  is_verified: boolean;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  tenant_id?: string;
  template_id?: string;
  entity_id?: string;
  variables?: Record<string, string>;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  headers?: Record<string, string>;
}

/**
 * Look up a tenant by ID. Falls back to system tenant if not found.
 */
export async function getTenant(
  supabase: SupabaseClient,
  tenantId?: string,
): Promise<EmailTenant | null> {
  if (tenantId) {
    const { data } = await supabase
      .from("email_tenants")
      .select("*")
      .eq("id", tenantId)
      .single();
    return data;
  }
  // Default: system tenant (vbrain.io)
  const { data } = await supabase
    .from("email_tenants")
    .select("*")
    .eq("domain", "vbrain.io")
    .single();
  return data;
}

/**
 * Check if email is unsubscribed for a tenant.
 */
export async function isUnsubscribed(
  supabase: SupabaseClient,
  email: string,
  tenantId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("email_unsubscribes")
    .select("id")
    .eq("email", email)
    .eq("tenant_id", tenantId)
    .limit(1)
    .single();
  return !!data;
}

/**
 * Render a React Email component to HTML string.
 */
export async function renderTemplate(
  component: ReactElement,
): Promise<string> {
  return await render(component);
}

/**
 * Replace {{variable}} placeholders in subject/HTML.
 */
export function interpolate(
  text: string,
  variables: Record<string, string>,
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
}

/**
 * Send an email via Resend, log to email_sends + comm_messages.
 */
export async function sendEmail(
  supabase: SupabaseClient,
  options: SendEmailOptions,
): Promise<{ id: string; resend_id: string | null; status: string }> {
  const tenant = await getTenant(supabase, options.tenant_id);
  const fromAddress = tenant
    ? `${tenant.from_name} <${tenant.from_email}>`
    : "vBrain <noreply@vbrain.io>";
  const replyTo = options.replyTo || tenant?.reply_to || undefined;

  // Interpolate variables into subject and HTML
  const vars = options.variables || {};
  const subject = interpolate(options.subject, vars);
  const html = interpolate(options.html, vars);

  const toArray = Array.isArray(options.to) ? options.to : [options.to];

  // Create email_sends record first
  const { data: sendRecord, error: insertError } = await supabase
    .from("email_sends")
    .insert({
      tenant_id: tenant?.id || null,
      template_id: options.template_id || null,
      from_email: tenant?.from_email || "noreply@vbrain.io",
      to_email: toArray[0],
      cc: options.cc || null,
      bcc: options.bcc || null,
      subject,
      html_body: html,
      variables: vars,
      entity_id: options.entity_id || null,
      status: "queued",
    })
    .select("id")
    .single();

  if (insertError || !sendRecord) {
    return { id: "", resend_id: null, status: "failed" };
  }

  // Send via Resend
  try {
    const { data: resendData, error: resendError } = await getResend().emails.send({
      from: fromAddress,
      to: toArray,
      cc: options.cc,
      bcc: options.bcc,
      subject,
      html,
      replyTo,
      headers: {
        ...options.headers,
        "X-Email-Send-Id": sendRecord.id,
      },
    });

    if (resendError) {
      await supabase
        .from("email_sends")
        .update({ status: "failed", error_message: resendError.message })
        .eq("id", sendRecord.id);
      return { id: sendRecord.id, resend_id: null, status: "failed" };
    }

    const resendId = resendData?.id || null;

    // Update with Resend ID
    await supabase
      .from("email_sends")
      .update({ resend_id: resendId, status: "sent" })
      .eq("id", sendRecord.id);

    // Also log to comm_messages for unified comm timeline
    await supabase.from("comm_messages").insert({
      entity_id: options.entity_id || null,
      channel: "email",
      direction: "outbound",
      sender_name: tenant?.from_name || "vBrain",
      body: `[${subject}] ${html.replace(/<[^>]+>/g, "").slice(0, 200)}`,
      provider: "resend",
      message_type: "transactional",
      external_id: resendId,
      is_read: true,
      channel_meta: {
        resend_id: resendId,
        email_send_id: sendRecord.id,
        to: toArray,
        subject,
      },
    });

    return { id: sendRecord.id, resend_id: resendId, status: "sent" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("email_sends")
      .update({ status: "failed", error_message: msg })
      .eq("id", sendRecord.id);
    return { id: sendRecord.id, resend_id: null, status: "failed" };
  }
}
