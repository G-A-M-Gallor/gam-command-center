import { NextRequest, NextResponse } from "next/server";
import { _createClient } from "@/lib/supabase/server";
import { SignJWT } from "jose";
import { documentSendSchema } from "@/lib/api/schemas";

/**
 * POST /api/documents/send
 * Generates a JWT signing link for a document submission.
 * Updates submission status to "sent" and sets sent_at.
 *
 * Body: { submission_id: string; expires_in_days?: number }
 * Returns: { ok: true, signing_url: string, token: string }
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

  const parsed = documentSendSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const { submission_id, expires_in_days } = parsed.data;

  // Fetch submission
  const { data: sub, error: subErr } = await supabase
    .from("document_submissions")
    .select("id, name, status, workspace_id")
    .eq("id", submission_id)
    .single();

  if (subErr || !sub) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  // Verify submitters exist
  const { data: submitters } = await supabase
    .from("document_submitters")
    .select("id, full_name, email, role, status")
    .eq("submission_id", submission_id);

  if (!submitters || submitters.length === 0) {
    return NextResponse.json({ error: "No submitters added to this document" }, { status: 400 });
  }

  // Generate JWT
  const secret = new TextEncoder().encode(
    process.env.DOCUMENT_SIGNING_SECRET || process.env.SUPABASE_JWT_SECRET || ""
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expires_in_days);

  const token = await new SignJWT({ sub: submission_id, sid: submission_id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host")}`;
  const signingUrl = `${baseUrl}/sign/${token}`;

  // Update submission status to sent
  await supabase
    .from("document_submissions")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", submission_id);

  // Audit log
  await supabase.from("document_audit_log").insert({
    workspace_id: sub.workspace_id,
    submission_id,
    actor_type: "user",
    actor_id: _user.id,
    action: "document.sent",
    details: {
      signing_url: signingUrl,
      expires_at: expiresAt.toISOString(),
      submitter_count: submitters.length,
    },
  });

  return NextResponse.json({
    ok: true,
    signing_url: signingUrl,
    token,
    expires_at: expiresAt.toISOString(),
  });
}
