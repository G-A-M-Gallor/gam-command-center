import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, Color } from "pdf-lib";
import { appendCertificatePage } from "@/lib/documents/certificatePage";
import { documentPdfSchema } from "@/lib/api/schemas";
import type { DocumentSubmission, DocumentSubmitter } from "@/lib/supabase/schema";

/**
 * POST /api/documents/pdf
 * Generates a PDF from a document submission.
 * Body: { submission_id: string; store?: boolean }
 * Returns the PDF bytes or stores in Supabase Storage.
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

  const parsed = documentPdfSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const { submission_id, store } = parsed.data;

  // Fetch submission
  const { data: sub, error: subErr } = await supabase
    .from("document_submissions")
    .select("*")
    .eq("id", submission_id)
    .single();

  if (subErr || !sub) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const submission = sub as DocumentSubmission;

  // Fetch submitters
  const { data: submittersData } = await supabase
    .from("document_submitters")
    .select("*")
    .eq("submission_id", submission_id)
    .order("sort_order");

  const submitters = (submittersData || []) as DocumentSubmitter[];

  // Generate PDF
  let pdfBytes = await generateDocumentPdf(submission, submitters);

  // Append certificate page for signed documents
  if (submission.status === "signed" && submitters.some((s) => s.signed_at)) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vbrain.io";
    pdfBytes = await appendCertificatePage(new Uint8Array(pdfBytes), {
      submission_id: submission.id,
      document_name: submission.name,
      document_hash: await hashBytes(pdfBytes),
      signers: submitters
        .filter((s) => s.signed_at)
        .map((s) => ({
          full_name: s.full_name || "N/A",
          id_last4: s.id_number ? s.id_number.slice(-4) : "----",
          email: s.email || undefined,
          role: s.role,
          signed_at: s.signed_at || "",
          ip_address: s.ip_address || "N/A",
          user_agent: s.user_agent || "N/A",
          signature_type: s.signature_type || "N/A",
          otp_verified: s.otp_verified,
        })),
      created_at: submission.created_at,
      sent_at: submission.sent_at || undefined,
      base_url: baseUrl,
    });
  }

  // Compute hash
  const pdfHash = await hashBytes(pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes));

  // Optionally store in Supabase Storage
  if (store) {
    const fileName = `submissions/${submission_id}/${submission.name.replace(/[^a-zA-Z0-9א-ת\s-]/g, "")}.pdf`;
    const { error: uploadErr } = await supabase.storage
      .from("documents")
      .upload(fileName, pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes), {
        contentType: "application/pdf",
        upsert: true,
      });

    if (!uploadErr) {
      await supabase
        .from("document_submissions")
        .update({
          pdf_path: fileName,
          pdf_hash: pdfHash,
        })
        .eq("id", submission_id);
    }
  }

  // Return PDF as download
  const rawBytes = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes);
  const responseBuffer = Buffer.from(rawBytes);
  return new NextResponse(responseBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(submission.name)}.pdf"`,
      "X-PDF-Hash": pdfHash,
    },
  });
}

// ── PDF Generation ──────────────────────────────────────────

async function generateDocumentPdf(
  submission: DocumentSubmission,
  submitters: DocumentSubmitter[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0.1, 0.1, 0.1);
  const gray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.8, 0.8, 0.8);
  const purple = rgb(0.4, 0.2, 0.7);

  const margin = 50;
  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const contentWidth = pageWidth - margin * 2;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function ensureSpace(needed: number) {
    if (y - needed < margin + 40) {
      addFooter(page, helvetica, gray, margin, contentWidth, submission.name);
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  // ── Header ──────────────────────────────────────────────
  page.drawText(submission.name, {
    x: margin,
    y,
    size: 20,
    font: helveticaBold,
    color: black,
  });
  y -= 20;

  // Status badge
  const statusText = submission.status.toUpperCase().replace("_", " ");
  page.drawText(statusText, {
    x: margin,
    y,
    size: 9,
    font: helveticaBold,
    color: purple,
  });
  y -= 8;

  // Date line
  page.drawText(
    `Created: ${formatDate(submission.created_at)}${submission.sent_at ? ` | Sent: ${formatDate(submission.sent_at)}` : ""}`,
    { x: margin, y, size: 8, font: helvetica, color: gray },
  );
  y -= 12;

  // Separator
  page.drawLine({
    start: { x: margin, y },
    end: { x: margin + contentWidth, y },
    thickness: 1,
    color: lightGray,
  });
  y -= 24;

  // ── Field Values ────────────────────────────────────────
  const fieldValues = submission.field_values || {};
  const fieldEntries = Object.entries(fieldValues);

  if (fieldEntries.length > 0) {
    ensureSpace(30);
    page.drawText("FIELD VALUES", {
      x: margin,
      y,
      size: 12,
      font: helveticaBold,
      color: black,
    });
    y -= 18;

    for (const [key, value] of fieldEntries) {
      ensureSpace(28);
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      page.drawText(`${label}:`, {
        x: margin,
        y,
        size: 9,
        font: helveticaBold,
        color: black,
      });
      y -= 13;

      const valStr = String(value ?? "—");
      const lines = wrapText(valStr, helvetica, 8.5, contentWidth - 10);
      for (const line of lines) {
        ensureSpace(12);
        page.drawText(line, {
          x: margin + 10,
          y,
          size: 8.5,
          font: helvetica,
          color: gray,
        });
        y -= 12;
      }
      y -= 4;
    }

    y -= 8;
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + contentWidth, y },
      thickness: 0.5,
      color: lightGray,
    });
    y -= 20;
  }

  // ── Document Content ────────────────────────────────────
  const contentSnapshot = submission.content_snapshot;
  if (contentSnapshot && typeof contentSnapshot === "object") {
    ensureSpace(24);
    page.drawText("DOCUMENT CONTENT", {
      x: margin,
      y,
      size: 12,
      font: helveticaBold,
      color: black,
    });
    y -= 20;

    // Walk the Tiptap JSON and render text blocks
    const textBlocks = extractTextBlocks(contentSnapshot as TiptapNode);
    for (const block of textBlocks) {
      const font = block.bold ? helveticaBold : helvetica;
      const size = block.heading ? 10 + (4 - block.heading) * 2 : 9;
      const color = block.heading ? black : gray;

      const lines = wrapText(block.text, font, size, contentWidth);
      for (const line of lines) {
        ensureSpace(size + 4);
        page.drawText(line, { x: margin, y, size, font, color });
        y -= size + 3;
      }
      y -= block.heading ? 8 : 4;
    }
  }

  // ── Submitters Section ──────────────────────────────────
  if (submitters.length > 0) {
    ensureSpace(40);
    y -= 12;
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + contentWidth, y },
      thickness: 0.5,
      color: lightGray,
    });
    y -= 20;

    page.drawText("SIGNERS", {
      x: margin,
      y,
      size: 12,
      font: helveticaBold,
      color: black,
    });
    y -= 18;

    for (const s of submitters) {
      ensureSpace(40);
      const name = s.full_name || s.business_name || "—";
      page.drawText(name, {
        x: margin,
        y,
        size: 10,
        font: helveticaBold,
        color: black,
      });

      const roleLabel = s.role === "witness" ? "(Witness)" : s.role === "approver" ? "(Approver)" : "(Signer)";
      page.drawText(roleLabel, {
        x: margin + helveticaBold.widthOfTextAtSize(name, 10) + 6,
        y,
        size: 8,
        font: helvetica,
        color: gray,
      });
      y -= 14;

      if (s.email) {
        page.drawText(`Email: ${s.email}`, { x: margin + 10, y, size: 8, font: helvetica, color: gray });
        y -= 12;
      }
      const statusLabel = s.signed_at ? `Signed: ${formatDate(s.signed_at)}` : `Status: ${s.status}`;
      page.drawText(statusLabel, { x: margin + 10, y, size: 8, font: helvetica, color: s.signed_at ? purple : gray });
      y -= 16;
    }
  }

  // Footer on last page
  addFooter(page, helvetica, gray, margin, contentWidth, submission.name);

  return doc.save();
}

// ── Tiptap JSON Text Extraction ─────────────────────────────

interface TiptapNode {
  type?: string;
  text?: string;
  content?: TiptapNode[];
  attrs?: Record<string, unknown>;
  marks?: { type: string }[];
}

interface TextBlock {
  text: string;
  heading?: number;
  bold?: boolean;
}

function extractTextBlocks(node: TiptapNode): TextBlock[] {
  const blocks: TextBlock[] = [];

  function walk(n: TiptapNode) {
    if (!n) return;

    if (n.type === "heading") {
      const text = collectText(n);
      if (text.trim()) {
        blocks.push({ text: text.trim(), heading: (n.attrs?.level as number) || 1 });
      }
      return;
    }

    if (n.type === "paragraph" || n.type === "listItem") {
      const text = collectText(n);
      if (text.trim()) {
        const prefix = n.type === "listItem" ? "• " : "";
        blocks.push({ text: prefix + text.trim() });
      }
      return;
    }

    if (n.type === "bulletList" || n.type === "orderedList") {
      (n.content || []).forEach((item, i) => {
        const text = collectText(item);
        if (text.trim()) {
          const prefix = n.type === "orderedList" ? `${i + 1}. ` : "• ";
          blocks.push({ text: prefix + text.trim() });
        }
      });
      return;
    }

    if (n.type === "blockquote") {
      const text = collectText(n);
      if (text.trim()) blocks.push({ text: `"${text.trim()}"` });
      return;
    }

    if (n.content) {
      for (const child of n.content) {
        walk(child);
      }
    }
  }

  function collectText(n: TiptapNode): string {
    if (n.type === "text") return n.text || "";
    return (n.content || []).map(collectText).join("");
  }

  walk(node);
  return blocks;
}

// ── Helpers ─────────────────────────────────────────────────

function addFooter(
  page: PDFPage,
  font: PDFFont,
  color: Color,
  margin: number,
  contentWidth: number,
  docName: string,
) {
  page.drawLine({
    start: { x: margin, y: 40 },
    end: { x: margin + contentWidth, y: 40 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  page.drawText(`${docName} — Generated by vBrain.io Document Engine`, {
    x: margin,
    y: 28,
    size: 7,
    font,
    color,
  });
  page.drawText(new Date().toISOString().split("T")[0], {
    x: margin + contentWidth - 60,
    y: 28,
    size: 7,
    font,
    color,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jerusalem",
  });
}
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  if (lines.length === 0) lines.push("");
  return lines;
}

async function hashBytes(bytes: Uint8Array | ArrayBuffer): Promise<string> {
  const { createHash } = await import("crypto");
  const buf = bytes instanceof Uint8Array ? Buffer.from(bytes) : Buffer.from(new Uint8Array(bytes));
  return createHash("sha256").update(buf).digest("hex");
}
