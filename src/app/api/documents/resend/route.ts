import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SignJWT } from "jose";
import { documentResendSchema } from "@/lib/api/schemas";

/**
 * POST /api/documents/resend
 * Re-generates a JWT signing link for a document that was already sent.
 * Refreshes the expiry and updates the signing URL.
 *
 * Body: { submission_id: string; expires_in_days?: number }
 * Returns: { ok: true, signing_url: string, token: string, expires_at: string }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = documentResendSchema.safeParse(raw);
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

  // Only allow resend on sent/viewed/partial_signed documents
  const resendable = ["sent", "viewed", "partial_signed"];
  if (!resendable.includes(sub.status)) {
    return NextResponse.json(
      { error: `Cannot resend document in "${sub.status}" status` },
      { status: 400 },
    );
  }

  // Verify unsigned submitters exist
  const { data: submitters } = await supabase
    .from("document_submitters")
    .select("id, full_name, email, role, status")
    .eq("submission_id", submission_id);

  const unsigned = (submitters || []).filter((s: { status: string }) => s.status !== "signed");
  if (unsigned.length === 0) {
    return NextResponse.json({ error: "All submitters have already signed" }, { status: 400 });
  }

  // Generate new JWT
  const secret = new TextEncoder().encode(
    process.env.DOCUMENT_SIGNING_SECRET || process.env.SUPABASE_JWT_SECRET || "",
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

  // Update expiry
  await supabase
    .from("document_submissions")
    .update({ expires_at: expiresAt.toISOString() })
    .eq("id", submission_id);

  // Audit log
  await supabase.from("document_audit_log").insert({
    workspace_id: sub.workspace_id,
    submission_id,
    actor_type: "user",
    actor_id: user.id,
    action: "document.resent",
    details: {
      signing_url: signingUrl,
      expires_at: expiresAt.toISOString(),
      unsigned_count: unsigned.length,
    },
  });

  return NextResponse.json({
    ok: true,
    signing_url: signingUrl,
    token,
    expires_at: expiresAt.toISOString(),
  });
}
