import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { documentRevokeSchema } from "@/lib/api/schemas";

/**
 * POST /api/documents/revoke
 * Revokes a document submission, invalidating all signing links.
 * Sets status to "cancelled" and clears expires_at.
 *
 * Body: { submission_id: string; reason?: string }
 * Returns: { ok: true }
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

  const parsed = documentRevokeSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const { submission_id, reason } = parsed.data;

  // Fetch submission
  const { data: sub, error: subErr } = await supabase
    .from("document_submissions")
    .select("id, name, status, workspace_id")
    .eq("id", submission_id)
    .single();

  if (subErr || !sub) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  // Cannot revoke already signed or cancelled documents
  const nonRevocable = ["signed", "cancelled", "archived"];
  if (nonRevocable.includes(sub.status)) {
    return NextResponse.json(
      { error: `Cannot revoke document in "${sub.status}" status` },
      { status: 400 },
    );
  }

  // Update status to cancelled
  await supabase
    .from("document_submissions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      expires_at: null,
    })
    .eq("id", submission_id);

  // Audit log
  await supabase.from("document_audit_log").insert({
    workspace_id: sub.workspace_id,
    submission_id,
    actor_type: "user",
    actor_id: user.id,
    action: "document.revoked",
    details: {
      previous_status: sub.status,
      reason: reason || null,
    },
  });

  return NextResponse.json({ ok: true });
}
