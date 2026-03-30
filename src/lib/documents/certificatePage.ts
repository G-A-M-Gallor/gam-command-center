import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, Color } from "pdf-lib";

/**
 * Appends a Certificate Page as the last page of a signed PDF.
 * Contains all legally required information for Israeli court admissibility:
 * - Signer names, ID (last 4), timestamps, IP addresses
 * - Document hash (SHA-256), submission ID
 * - Consent text, verification URL
 */

interface SignerInfo {
  full_name: string;
  id_last4: string;
  email?: string;
  role: string;
  signed_at: string;
  ip_address: string;
  user_agent: string;
  signature_type: string;
  otp_verified: boolean;
}

interface CertificateData {
  submission_id: string;
  document_name: string;
  document_hash: string;
  signed_pdf_hash?: string;
  signers: SignerInfo[];
  created_at: string;
  sent_at?: string;
  base_url: string;
}

/**
 * Takes existing PDF bytes and appends a certificate page.
 * Returns new PDF bytes with the certificate appended.
 */
export async function appendCertificatePage(
  pdfBytes: Uint8Array,
  cert: CertificateData,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const page = doc.addPage([595.28, 841.89]); // A4
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const submissionCode = formatSubmissionCode(cert.submission_id, cert.created_at);
  const verifyUrl = `${cert.base_url}/verify/${cert.submission_id}`;

  const black = rgb(0.1, 0.1, 0.1);
  const gray = rgb(0.4, 0.4, 0.4);
  const darkGray = rgb(0.25, 0.25, 0.25);
  const lineColor = rgb(0.8, 0.8, 0.8);

  let y = 790;
  const margin = 50;
  const width = page.getWidth() - margin * 2;

  // ── Header ─────────────────────────────────────────────────

  page.drawText("CERTIFICATE OF SIGNING", {
    x: margin,
    y,
    size: 18,
    font: helveticaBold,
    color: black,
  });
  y -= 14;
  page.drawText("אישור חתימה אלקטרונית", {
    x: margin,
    y,
    size: 10,
    font: helvetica,
    color: gray,
  });
  y -= 8;
  page.drawLine({
    start: { x: margin, y },
    end: { x: margin + width, y },
    thickness: 1,
    color: lineColor,
  });
  y -= 24;

  // ── Document Info ──────────────────────────────────────────

  y = drawField(page, helveticaBold, helvetica, "Document", cert.document_name, margin, y, black, darkGray);
  y = drawField(page, helveticaBold, helvetica, "Submission ID", submissionCode, margin, y, black, darkGray);
  y = drawField(page, helveticaBold, helvetica, "Document Hash (SHA-256)", cert.document_hash, margin, y, black, darkGray);
  if (cert.signed_pdf_hash) {
    y = drawField(page, helveticaBold, helvetica, "Signed PDF Hash", cert.signed_pdf_hash, margin, y, black, darkGray);
  }
  y = drawField(page, helveticaBold, helvetica, "Created", formatDate(cert.created_at), margin, y, black, darkGray);
  if (cert.sent_at) {
    y = drawField(page, helveticaBold, helvetica, "Sent", formatDate(cert.sent_at), margin, y, black, darkGray);
  }
  y -= 8;
  page.drawLine({
    start: { x: margin, y },
    end: { x: margin + width, y },
    thickness: 0.5,
    color: lineColor,
  });
  y -= 20;

  // ── Signers ────────────────────────────────────────────────

  page.drawText("SIGNERS", {
    x: margin,
    y,
    size: 13,
    font: helveticaBold,
    color: black,
  });
  y -= 20;

  for (const signer of cert.signers) {
    // Signer box
    page.drawRectangle({
      x: margin,
      y: y - 88,
      width,
      height: 92,
      borderColor: lineColor,
      borderWidth: 0.5,
      color: rgb(0.97, 0.97, 0.97),
    });

    const boxX = margin + 10;
    y -= 4;

    page.drawText(signer.full_name, {
      x: boxX,
      y,
      size: 11,
      font: helveticaBold,
      color: black,
    });

    const roleLabel = signer.role === "witness" ? "(Witness)" : signer.role === "approver" ? "(Approver)" : "(Signer)";
    page.drawText(roleLabel, {
      x: boxX + helveticaBold.widthOfTextAtSize(signer.full_name, 11) + 6,
      y,
      size: 9,
      font: helvetica,
      color: gray,
    });
    y -= 14;

    y = drawSmallField(page, helvetica, `ID: ***${signer.id_last4}`, boxX, y, darkGray);
    if (signer.email) {
      y = drawSmallField(page, helvetica, `Email: ${signer.email}`, boxX, y, darkGray);
    }
    y = drawSmallField(page, helvetica, `Signed: ${formatDate(signer.signed_at)}`, boxX, y, darkGray);
    y = drawSmallField(page, helvetica, `IP: ${signer.ip_address}`, boxX, y, darkGray);
    y = drawSmallField(page, helvetica, `Signature: ${signer.signature_type} | OTP: ${signer.otp_verified ? "Verified" : "N/A"}`, boxX, y, darkGray);
    y = drawSmallField(page, helvetica, `Device: ${truncate(signer.user_agent, 60)}`, boxX, y, gray);

    y -= 14;
  }

  // ── Consent ────────────────────────────────────────────────

  y -= 4;
  page.drawLine({
    start: { x: margin, y },
    end: { x: margin + width, y },
    thickness: 0.5,
    color: lineColor,
  });
  y -= 16;

  page.drawText("CONSENT TEXT", {
    x: margin,
    y,
    size: 10,
    font: helveticaBold,
    color: black,
  });
  y -= 12;

  const consentLines = wrapText(
    "All signers confirmed: (1) I have read and understood the document in full, (2) I am signing of my own free will without coercion, (3) The details I provided are true and accurate, (4) My electronic signature is equivalent in validity to a handwritten signature.",
    helvetica,
    7.5,
    width,
  );
  for (const line of consentLines) {
    page.drawText(line, { x: margin, y, size: 7.5, font: helvetica, color: gray });
    y -= 10;
  }

  // ── Verification ───────────────────────────────────────────

  y -= 10;
  page.drawText("VERIFY THIS DOCUMENT", {
    x: margin,
    y,
    size: 10,
    font: helveticaBold,
    color: black,
  });
  y -= 14;
  page.drawText(verifyUrl, {
    x: margin,
    y,
    size: 9,
    font: helvetica,
    color: rgb(0.3, 0.2, 0.7),
  });
  y -= 20;

  // ── Footer ─────────────────────────────────────────────────

  page.drawLine({
    start: { x: margin, y: 40 },
    end: { x: margin + width, y: 40 },
    thickness: 0.5,
    color: lineColor,
  });
  page.drawText(`Generated by vBrain.io Document Engine | ${submissionCode}`, {
    x: margin,
    y: 28,
    size: 7,
    font: helvetica,
    color: gray,
  });
  page.drawText(new Date().toISOString(), {
    x: margin + width - 100,
    y: 28,
    size: 7,
    font: helvetica,
    color: gray,
  });

  return doc.save();
}

// ── Helpers ──────────────────────────────────────────────────

function formatSubmissionCode(id: string, createdAt: string): string {
  const year = new Date(createdAt).getFullYear();
  const short = id.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `SUB-${year}-${short}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jerusalem",
  });
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawField(page: PDFPage, boldFont: PDFFont, font: PDFFont, label: string, value: string, x: number, y: number, labelColor: Color, valueColor: Color): number {
  page.drawText(`${label}:`, { x, y, size: 9, font: boldFont, color: labelColor });
  y -= 13;
  page.drawText(value, { x: x + 4, y, size: 8.5, font, color: valueColor });
  y -= 16;
  return y;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawSmallField(page: PDFPage, font: PDFFont, text: string, x: number, y: number, color: Color): number {
  page.drawText(text, { x, y, size: 8, font, color });
  return y - 11;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  return lines;
}
