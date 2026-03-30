import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSignedDocument } from "@/lib/documents/sendSignedDocument";

/**
 * POST /api/documents/send-signed
 * Triggered after all submitters have signed.
 * Appends Certificate Page to PDF, sends to signer + owner via Resend.
 *
 * Body: { submission_id: string }
 * Auth: service_role or internal call (checks webhook secret)
 */
export async function POST(req: NextRequest) {
  // Verify caller — either internal webhook secret or service key
  const authHeader = req.headers.get("authorization") || "";
  const webhookSecret = process.env.DOCUMENT_WEBHOOK_SECRET;

  const isServiceCall = authHeader.startsWith("Bearer ") && webhookSecret &&
    authHeader.slice(7) === webhookSecret;
  const isInternalCall = req.headers.get("x-internal-call") === "true";

  if (!isServiceCall && !isInternalCall) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { submission_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.submission_id) {
    return NextResponse.json({ ok: false, error: "submission_id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host")}`;

  const result = await sendSignedDocument(supabase, body.submission_id, baseUrl);

  return NextResponse.json({
    ok: result.errors.length === 0,
    ...result,
  });
}
