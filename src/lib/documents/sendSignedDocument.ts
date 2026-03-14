import { Resend } from "resend";
import { appendCertificatePage } from "./certificatePage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = { from: (table: string) => any; storage: any };

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not configured");
    _resend = new Resend(key);
  }
  return _resend;
}

interface SubmissionRow {
  id: string;
  workspace_id: string;
  name: string;
  status: string;
  pdf_path: string | null;
  pdf_hash: string | null;
  signed_pdf_hash: string | null;
  created_at: string;
  sent_at: string | null;
  signed_at: string | null;
  created_by: string | null;
}

interface SubmitterRow {
  id: string;
  full_name: string | null;
  role: string;
  email: string | null;
  phone: string | null;
  signed_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  signature_type: string | null;
  otp_verified: boolean;
  status: string;
}

interface TenantInfo {
  owner_email: string;
  owner_name: string;
  company_name: string;
  from_email: string;
  from_name: string;
}

interface SendResult {
  signer_email_id: string | null;
  owner_email_id: string | null;
  errors: string[];
}

/**
 * Sends the signed PDF to both the signer and the document owner (Gal).
 * Appends a Certificate Page to the PDF before sending.
 *
 * Called after a successful signing from the Edge Function or API route.
 */
export async function sendSignedDocument(
  supabase: SupabaseClient,
  submissionId: string,
  baseUrl: string,
): Promise<SendResult> {
  const result: SendResult = { signer_email_id: null, owner_email_id: null, errors: [] };

  // ── 1. Fetch submission ──────────────────────────────────
  const { data: submission, error: subErr } = await supabase
    .from("document_submissions")
    .select("id, workspace_id, name, status, pdf_path, pdf_hash, signed_pdf_hash, created_at, sent_at, signed_at, created_by")
    .eq("id", submissionId)
    .single() as { data: SubmissionRow | null; error: unknown };

  if (subErr || !submission) {
    result.errors.push("Submission not found");
    return result;
  }

  // ── 2. Fetch submitters ──────────────────────────────────
  const { data: submitters } = await supabase
    .from("document_submitters")
    .select("id, full_name, role, email, phone, signed_at, ip_address, user_agent, signature_type, otp_verified, status")
    .eq("submission_id", submissionId)
    .order("sort_order", { ascending: true }) as { data: SubmitterRow[] | null };

  if (!submitters || submitters.length === 0) {
    result.errors.push("No submitters found");
    return result;
  }

  // ── 3. Get tenant info (workspace owner) ─────────────────
  const tenant = await getTenantInfo(supabase, submission.workspace_id, submission.created_by);

  // ── 4. Download original PDF ─────────────────────────────
  let pdfBytes: Uint8Array;
  if (submission.pdf_path) {
    const { data: pdfData, error: dlErr } = await supabase.storage
      .from("documents")
      .download(submission.pdf_path);

    if (dlErr || !pdfData) {
      result.errors.push(`Failed to download PDF: ${dlErr?.message || "unknown"}`);
      return result;
    }
    pdfBytes = new Uint8Array(await pdfData.arrayBuffer());
  } else {
    result.errors.push("No PDF path on submission");
    return result;
  }

  // ── 5. Append Certificate Page ───────────────────────────
  const signedSubmitters = submitters.filter((s) => s.status === "signed");

  const certData = {
    submission_id: submission.id,
    document_name: submission.name,
    document_hash: submission.pdf_hash || "N/A",
    signed_pdf_hash: submission.signed_pdf_hash || undefined,
    created_at: submission.created_at,
    sent_at: submission.sent_at || undefined,
    base_url: baseUrl,
    signers: signedSubmitters.map((s) => ({
      full_name: s.full_name || "—",
      id_last4: "****", // Never send full ID in email
      email: s.email || undefined,
      role: s.role,
      signed_at: s.signed_at || "",
      ip_address: s.ip_address || "unknown",
      user_agent: s.user_agent || "unknown",
      signature_type: s.signature_type || "unknown",
      otp_verified: s.otp_verified,
    })),
  };

  let finalPdf: Uint8Array;
  try {
    finalPdf = await appendCertificatePage(pdfBytes, certData);
  } catch (err) {
    result.errors.push(`Certificate generation failed: ${err instanceof Error ? err.message : "unknown"}`);
    finalPdf = pdfBytes; // Fallback: send without certificate
  }

  // ── 6. Upload signed PDF with certificate ────────────────
  const signedPath = submission.pdf_path.replace(/\.pdf$/, "_signed.pdf");
  await supabase.storage
    .from("documents")
    .upload(signedPath, finalPdf, { contentType: "application/pdf", upsert: true });

  // Update submission with signed PDF path
  await supabase
    .from("document_submissions")
    .update({ signed_pdf_path: signedPath })
    .eq("id", submissionId);

  // ── 7. Send email to signer(s) ──────────────────────────
  const resend = getResend();
  const fromAddress = `${tenant.from_name} <${tenant.from_email}>`;
  const pdfBase64 = Buffer.from(finalPdf).toString("base64");
  const fileName = `${sanitizeFileName(submission.name)}_signed.pdf`;

  for (const signer of signedSubmitters) {
    if (!signer.email) continue;

    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: signer.email,
        subject: `✅ מסמך חתום — ${submission.name}`,
        html: signerEmailHtml(submission.name, signer.full_name || "", tenant.company_name, baseUrl, submissionId),
        attachments: [{ filename: fileName, content: pdfBase64 }],
        headers: { "X-Document-Submission": submissionId },
      });

      if (error) {
        result.errors.push(`Signer email failed (${signer.email}): ${error.message}`);
      } else {
        result.signer_email_id = data?.id || null;
      }
    } catch (err) {
      result.errors.push(`Signer email error (${signer.email}): ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  // ── 8. Send email to owner (Gal) ────────────────────────
  if (tenant.owner_email) {
    try {
      const signerNames = signedSubmitters.map((s) => s.full_name || s.email || "—").join(", ");
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: tenant.owner_email,
        subject: `📄 מסמך נחתם — ${submission.name} (${signerNames})`,
        html: ownerEmailHtml(submission.name, signedSubmitters, tenant.company_name, baseUrl, submissionId),
        attachments: [{ filename: fileName, content: pdfBase64 }],
        headers: { "X-Document-Submission": submissionId },
      });

      if (error) {
        result.errors.push(`Owner email failed: ${error.message}`);
      } else {
        result.owner_email_id = data?.id || null;
      }
    } catch (err) {
      result.errors.push(`Owner email error: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  // ── 9. Log to audit ──────────────────────────────────────
  await supabase.from("document_audit_log").insert({
    workspace_id: submission.workspace_id,
    submission_id: submissionId,
    actor_type: "system",
    actor_id: "send-signed-document",
    action: "emails.sent",
    details: {
      signer_email_id: result.signer_email_id,
      owner_email_id: result.owner_email_id,
      errors: result.errors,
      recipients: signedSubmitters.map((s) => s.email).filter(Boolean),
      owner: tenant.owner_email,
    },
  });

  return result;
}

// ── Helpers ──────────────────────────────────────────────────

async function getTenantInfo(
  supabase: SupabaseClient,
  workspaceId: string,
  createdBy: string | null,
): Promise<TenantInfo> {
  // Try workspace settings
  const { data: workspace } = await supabase
    .from("vb_workspaces")
    .select("name, owner_id, settings")
    .eq("id", workspaceId)
    .single();

  let ownerEmail = "";
  let ownerName = "";

  if (workspace?.owner_id) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("email, display_name")
      .eq("id", workspace.owner_id)
      .single();
    ownerEmail = profile?.email || "";
    ownerName = profile?.display_name || "";
  }

  // Fallback to created_by
  if (!ownerEmail && createdBy) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("email, display_name")
      .eq("id", createdBy)
      .single();
    ownerEmail = profile?.email || "";
    ownerName = profile?.display_name || "";
  }

  // Try email_tenants for from address
  const { data: emailTenant } = await supabase
    .from("email_tenants")
    .select("from_email, from_name")
    .limit(1)
    .single();

  return {
    owner_email: ownerEmail,
    owner_name: ownerName,
    company_name: workspace?.name || "GAM",
    from_email: emailTenant?.from_email || "noreply@vbrain.io",
    from_name: emailTenant?.from_name || "vBrain Documents",
  };
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9\u0590-\u05FF\s_-]/g, "").replace(/\s+/g, "_").slice(0, 60);
}

function signerEmailHtml(docName: string, signerName: string, company: string, baseUrl: string, subId: string): string {
  const verifyUrl = `${baseUrl}/verify/${subId}`;
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">✅</span>
      </div>
      <h1 style="font-size: 22px; color: #1e293b; text-align: center; margin-bottom: 8px;">המסמך נחתם בהצלחה</h1>
      <p style="color: #64748b; text-align: center; margin-bottom: 32px;">שלום ${signerName},</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; color: #475569;"><strong>מסמך:</strong> ${docName}</p>
        <p style="margin: 0 0 8px; color: #475569;"><strong>חברה:</strong> ${company}</p>
        <p style="margin: 0; color: #475569;"><strong>סטטוס:</strong> <span style="color: #059669;">חתום ✓</span></p>
      </div>
      <p style="color: #64748b; font-size: 14px; margin-bottom: 16px;">
        מצורף העותק החתום של המסמך כולל אישור חתימה (Certificate Page).
        שמור את הקובץ לרשומותיך.
      </p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${verifyUrl}" style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px;">
          אמת את המסמך
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center;">
        מסמך זה נחתם באמצעות מערכת vBrain.io Document Engine<br/>
        <a href="${verifyUrl}" style="color: #7c3aed;">${verifyUrl}</a>
      </p>
    </div>
  `;
}

function ownerEmailHtml(docName: string, signers: SubmitterRow[], company: string, baseUrl: string, subId: string): string {
  const verifyUrl = `${baseUrl}/verify/${subId}`;
  const signerRows = signers
    .map((s) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${s.full_name || "—"}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${s.role === "witness" ? "עד" : s.role === "approver" ? "מאשר" : "חותם"}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #059669;">חתם ✓</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">${s.signed_at ? new Date(s.signed_at).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" }) : "—"}</td>
      </tr>
    `)
    .join("");

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">📄</span>
      </div>
      <h1 style="font-size: 22px; color: #1e293b; text-align: center; margin-bottom: 8px;">מסמך נחתם</h1>
      <p style="color: #64748b; text-align: center; margin-bottom: 32px;">${company}</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 16px; color: #475569;"><strong>מסמך:</strong> ${docName}</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 8px; text-align: right; color: #475569; font-size: 13px;">שם</th>
              <th style="padding: 8px; text-align: right; color: #475569; font-size: 13px;">תפקיד</th>
              <th style="padding: 8px; text-align: right; color: #475569; font-size: 13px;">סטטוס</th>
              <th style="padding: 8px; text-align: right; color: #475569; font-size: 13px;">תאריך</th>
            </tr>
          </thead>
          <tbody>${signerRows}</tbody>
        </table>
      </div>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${verifyUrl}" style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px;">
          צפה באימות
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center;">
        vBrain.io Document Engine<br/>
        <a href="${verifyUrl}" style="color: #7c3aed;">${verifyUrl}</a>
      </p>
    </div>
  `;
}
