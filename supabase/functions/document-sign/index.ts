// document-sign — Supabase Edge Function
// Atomic document signing: submitter data + audit log in a single transaction
// If either write fails, the entire operation rolls back
//
// POST /functions/v1/document-sign
// Body: { access_token, submitter_id, signature_type, signature_data,
//         full_name, id_number, consent_given }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Types ────────────────────────────────────────────────────────

interface SignRequest {
  access_token: string;
  submitter_id: string;
  signature_type: "drawn" | "typed" | "uploaded";
  signature_data: string; // base64 for drawn/uploaded, text for typed
  full_name: string;
  business_name?: string;
  id_number: string;
  email?: string;
  phone?: string;
  consent_given: boolean;
}

interface SignResult {
  ok: boolean;
  submission_id?: string;
  submitter_id?: string;
  signed_at?: string;
  pdf_hash?: string;
  error?: string;
}

// ── Helpers ──────────────────────────────────────────────────────

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function jsonResponse(data: SignResult, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}

/** SHA-256 hash of raw bytes (for PDF integrity) */
async function sha256Hex(data: Uint8Array): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Luhn algorithm for Israeli ID number validation */
function luhnCheck(id: string): boolean {
  if (!/^\d{5,9}$/.test(id)) return false;
  const padded = id.padStart(9, "0");
  const sum = padded.split("").reduce((acc, digit, i) => {
    let n = parseInt(digit, 10) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    return acc + n;
  }, 0);
  return sum % 10 === 0;
}

// ── Main Handler ─────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  // Parse + validate request body
  let body: SignRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const { access_token, submitter_id, signature_type, signature_data, full_name, id_number, consent_given } = body;

  if (!access_token || !submitter_id || !signature_type || !signature_data || !full_name || !id_number) {
    return jsonResponse({ ok: false, error: "Missing required fields: access_token, submitter_id, signature_type, signature_data, full_name, id_number" }, 400);
  }

  if (!["drawn", "typed", "uploaded"].includes(signature_type)) {
    return jsonResponse({ ok: false, error: "Invalid signature_type — must be drawn, typed, or uploaded" }, 400);
  }

  if (!consent_given) {
    return jsonResponse({ ok: false, error: "consent_given must be true — signer must accept the consent text" }, 400);
  }

  // Luhn validation for Israeli ID
  if (!luhnCheck(id_number)) {
    return jsonResponse({ ok: false, error: "Invalid ID number — failed Luhn check" }, 400);
  }

  // Extract client metadata
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  // ── Supabase client (service_role — bypasses RLS for atomic write) ──
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // ── 1. Validate submission exists and is signable ──────────────

  const { data: submission, error: subError } = await supabase
    .from("document_submissions")
    .select("id, workspace_id, status, expires_at, pdf_path, access_token")
    .eq("access_token", access_token)
    .single();

  if (subError || !submission) {
    return jsonResponse({ ok: false, error: "Submission not found or invalid token" }, 404);
  }

  if (submission.status === "cancelled" || submission.status === "archived") {
    return jsonResponse({ ok: false, error: `Submission is ${submission.status} — cannot sign` }, 410);
  }

  if (submission.status === "signed") {
    return jsonResponse({ ok: false, error: "Submission is already fully signed" }, 409);
  }

  if (submission.expires_at && new Date(submission.expires_at) < new Date()) {
    return jsonResponse({ ok: false, error: "Submission has expired" }, 410);
  }

  // ── 2. Validate submitter exists and belongs to this submission ──

  const { data: submitter, error: smError } = await supabase
    .from("document_submitters")
    .select("id, submission_id, status, role")
    .eq("id", submitter_id)
    .eq("submission_id", submission.id)
    .single();

  if (smError || !submitter) {
    return jsonResponse({ ok: false, error: "Submitter not found for this submission" }, 404);
  }

  if (submitter.status === "signed") {
    return jsonResponse({ ok: false, error: "This submitter has already signed" }, 409);
  }

  if (submitter.status === "declined") {
    return jsonResponse({ ok: false, error: "This submitter has declined — cannot sign" }, 410);
  }

  // ── 3. Hash the PDF for integrity (if PDF exists) ──────────────

  let pdfHash: string | null = null;
  if (submission.pdf_path) {
    const { data: pdfData, error: pdfError } = await supabase.storage
      .from("documents")
      .download(submission.pdf_path);

    if (!pdfError && pdfData) {
      const pdfBytes = new Uint8Array(await pdfData.arrayBuffer());
      pdfHash = await sha256Hex(pdfBytes);
    }
  }

  // ── 4. Store signature file ────────────────────────────────────

  let signaturePath: string | null = null;
  if (signature_type === "drawn" || signature_type === "uploaded") {
    // Decode base64 signature image
    const cleanBase64 = signature_data.replace(/^data:image\/\w+;base64,/, "");
    const binaryStr = atob(cleanBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    signaturePath = `signatures/${submission.id}/${submitter_id}.png`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(signaturePath, bytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      return jsonResponse({ ok: false, error: `Failed to store signature: ${uploadError.message}` }, 500);
    }
  }

  // ── 5. ATOMIC TRANSACTION — sign + audit in one go ─────────────
  // Uses Supabase rpc to run both writes in a single DB transaction

  const signedAt = new Date().toISOString();

  const consentText = "אני מאשר/ת בזאת כי: (1) קראתי את המסמך במלואו והבנתי את תוכנו, (2) אני חותם/ת מרצוני החופשי ללא כפייה, (3) הפרטים שמסרתי נכונים ומדויקים, (4) חתימתי האלקטרונית שווה בתוקפה לחתימת יד.";

  const { data: result, error: txError } = await supabase.rpc("document_sign_atomic", {
    p_submitter_id: submitter_id,
    p_submission_id: submission.id,
    p_workspace_id: submission.workspace_id,
    p_full_name: full_name,
    p_business_name: body.business_name || null,
    p_id_number: id_number,
    p_email: body.email || null,
    p_phone: body.phone || null,
    p_signature_type: signature_type,
    p_signature_path: signaturePath || signature_data,
    p_ip_address: clientIp,
    p_user_agent: userAgent,
    p_consent_text: consentText,
    p_signed_at: signedAt,
    p_pdf_hash: pdfHash,
  });

  if (txError) {
    // Log the failure to audit_log (best effort, outside transaction)
    await supabase.from("document_audit_log").insert({
      workspace_id: submission.workspace_id,
      submission_id: submission.id,
      actor_type: "submitter",
      actor_id: submitter_id,
      action: "sign.failed",
      details: { error: txError.message, ip: clientIp },
      ip_address: clientIp,
      user_agent: userAgent,
    });

    return jsonResponse({ ok: false, error: `Signing failed: ${txError.message}` }, 500);
  }

  // ── 6. Check if all submitters signed → update submission status ──

  const { data: allSubmitters } = await supabase
    .from("document_submitters")
    .select("id, status")
    .eq("submission_id", submission.id);

  const allSigned = allSubmitters?.every((s) => s.status === "signed");
  const newStatus = allSigned ? "signed" : "partially_signed";

  await supabase
    .from("document_submissions")
    .update({
      status: newStatus,
      ...(allSigned ? { signed_at: signedAt, signed_pdf_hash: pdfHash } : {}),
    })
    .eq("id", submission.id);

  // Log completion + trigger email sending
  if (allSigned) {
    await supabase.from("document_audit_log").insert({
      workspace_id: submission.workspace_id,
      submission_id: submission.id,
      actor_type: "system",
      actor_id: "document-sign",
      action: "submission.fully_signed",
      details: { total_submitters: allSubmitters?.length, pdf_hash: pdfHash },
      ip_address: clientIp,
      user_agent: userAgent,
    });

    // DOC-05: Send signed PDF to signer + owner (fire-and-forget)
    const appUrl = Deno.env.get("APP_URL") || Deno.env.get("NEXT_PUBLIC_APP_URL") || "";
    const webhookSecret = Deno.env.get("DOCUMENT_WEBHOOK_SECRET") || "";
    if (appUrl && webhookSecret) {
      fetch(`${appUrl}/api/documents/send-signed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${webhookSecret}`,
        },
        body: JSON.stringify({ submission_id: submission.id }),
      }).catch(() => {}); // Fire-and-forget — don't block signing response
    }
  }

  return jsonResponse({
    ok: true,
    submission_id: submission.id,
    submitter_id: submitter_id,
    signed_at: signedAt,
    pdf_hash: pdfHash || undefined,
  });
});
