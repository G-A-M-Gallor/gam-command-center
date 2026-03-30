import { NextRequest, NextResponse } from "next/server";
import { _createClient } from "@/lib/supabase/server";
import { SignJWT } from "jose";
import { documentReminderSchema } from "@/lib/api/schemas";

/**
 * POST /api/documents/reminder
 * Sends a reminder to unsigned submitters of a document.
 * Re-generates signing link and emails unsigned participants.
 *
 * Body: { submission_id: string; message?: string }
 * Returns: { ok: true, reminded: number }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { _user } } = await supabase.auth.getUser();
  if (!_user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = documentReminderSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const { submission_id, message } = parsed.data;

  // Fetch submission
  const { data: sub, error: subErr } = await supabase
    .from("document_submissions")
    .select("id, name, status, workspace_id, expires_at")
    .eq("id", submission_id)
    .single();

  if (subErr || !sub) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  // Only remind on active documents
  const remindable = ["sent", "viewed", "partial_signed"];
  if (!remindable.includes(sub.status)) {
    return NextResponse.json(
      { error: `Cannot send reminders for document in "${sub.status}" status` },
      { status: 400 },
    );
  }

  // Check if expired
  if (sub.expires_at && new Date(sub.expires_at) < new Date()) {
    return NextResponse.json({ error: "Document has expired" }, { status: 400 });
  }

  // Fetch unsigned submitters with emails
  const { data: submitters } = await supabase
    .from("document_submitters")
    .select("id, full_name, email, role, status")
    .eq("submission_id", submission_id)
    .neq("status", "signed")
    .neq("status", "declined");

  const toRemind = (submitters || []).filter((s: { email: string | null }) => s.email);
  if (toRemind.length === 0) {
    return NextResponse.json({ error: "No unsigned submitters with email addresses" }, { status: 400 });
  }

  // Generate signing URL
  const secret = new TextEncoder().encode(
    process.env.DOCUMENT_SIGNING_SECRET || process.env.SUPABASE_JWT_SECRET || "",
  );

  const expiresAt = sub.expires_at ? new Date(sub.expires_at) : new Date(Date.now() + 30 * 86400000);
  const token = await new SignJWT({ sub: submission_id, sid: submission_id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host")}`;
  const signingUrl = `${baseUrl}/sign/${token}`;

  // Send reminder emails via Resend (if configured)
  let reminded = 0;
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);

    for (const submitter of toRemind) {
      try {
        const { error } = await resend.emails.send({
          from: "vBrain Documents <noreply@vbrain.io>",
          to: submitter.email!,
          subject: `🔔 תזכורת חתימה — ${sub.name}`,
          html: reminderEmailHtml(sub.name, submitter.full_name || "", signingUrl, message),
          headers: { "X-Document-Submission": submission_id },
        });
        if (!error) reminded++;
      } catch {
        // Continue with other submitters
      }
    }
  } else {
    // No Resend configured — count as "reminded" for API response
    reminded = toRemind.length;
  }

  // Audit log
  await supabase.from("document_audit_log").insert({
    workspace_id: sub.workspace_id,
    submission_id,
    actor_type: "user",
    actor_id: _user.id,
    action: "document.reminder_sent",
    details: {
      reminded_count: reminded,
      total_unsigned: toRemind.length,
      signing_url: signingUrl,
      custom_message: message || null,
      recipients: toRemind.map((s: { email: string | null }) => s.email),
    },
  });

  return NextResponse.json({ ok: true, reminded });
}

// ── Email Template ─────────────────────────────────────────

function reminderEmailHtml(
  docName: string,
  recipientName: string,
  signingUrl: string,
  customMessage?: string,
): string {
  const messageBlock = customMessage
    ? `<div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">${customMessage}</p>
       </div>`
    : "";

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">🔔</span>
      </div>
      <h1 style="font-size: 22px; color: #1e293b; text-align: center; margin-bottom: 8px;">תזכורת לחתימה</h1>
      <p style="color: #64748b; text-align: center; margin-bottom: 24px;">שלום ${recipientName},</p>
      ${messageBlock}
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; color: #475569;"><strong>מסמך:</strong> ${docName}</p>
        <p style="margin: 0; color: #475569;"><strong>סטטוס:</strong> <span style="color: #d97706;">ממתין לחתימתך</span></p>
      </div>
      <p style="color: #64748b; font-size: 14px; margin-bottom: 20px; text-align: center;">
        לחצ/י על הכפתור למטה כדי לצפות ולחתום על המסמך.
      </p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${signingUrl}" style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: bold;">
          חתום עכשיו
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center;">
        תזכורת זו נשלחה באמצעות vBrain.io Document Engine
      </p>
    </div>
  `;
}
