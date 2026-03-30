import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "אימות מסמך — GAM",
  description: "אימות אותנטיות מסמך חתום",
  robots: "noindex, nofollow",
};

interface Submitter {
  full_name: string | null;
  role: string;
  status: string;
  signed_at: string | null;
  ip_address: string | null;
  signature_type: string | null;
  otp_verified: boolean;
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Validate UUID format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return notFound();
  }

  const supabase = await createClient();

  // Fetch submission (public verification — limited fields)
  const { data: submission } = await supabase
    .from("document_submissions")
    .select("id, name, status, created_at, sent_at, signed_at, pdf_hash, signed_pdf_hash")
    .eq("id", id)
    .single();

  if (!submission) return notFound();

  // Fetch submitters (limited info for public display)
  const { data: submitters } = await supabase
    .from("document_submitters")
    .select("full_name, role, status, signed_at, ip_address, signature_type, otp_verified")
    .eq("submission_id", id)
    .order("sort_order", { ascending: true }) as { data: Submitter[] | null };

  const submissionCode = formatCode(submission.id, submission.created_at);
  const isSigned = submission.status === "signed";

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl">{isSigned ? "✅" : "⏳"}</div>
          <h1 className="text-2xl font-bold text-slate-100">אימות מסמך</h1>
          <p className="mt-1 text-sm text-slate-500">Document Verification</p>
        </div>

        {/* Status badge */}
        <div className="mb-8 flex justify-center">
          <span
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              isSigned
                ? "bg-emerald-600/20 text-emerald-400"
                : submission.status === "cancelled"
                  ? "bg-red-600/20 text-red-400"
                  : "bg-amber-600/20 text-amber-400"
            }`}
          >
            {statusLabel(submission.status)}
          </span>
        </div>

        {/* Document info */}
        <div className="space-y-4">
          <InfoCard title="פרטי מסמך">
            <InfoRow label="שם המסמך" value={submission.name} />
            <InfoRow label="מזהה" value={submissionCode} mono />
            <InfoRow label="תאריך יצירה" value={formatDate(submission.created_at)} />
            {submission.sent_at && <InfoRow label="נשלח" value={formatDate(submission.sent_at)} />}
            {submission.signed_at && <InfoRow label="נחתם" value={formatDate(submission.signed_at)} />}
          </InfoCard>

          {/* Hash verification */}
          <InfoCard title="אימות שלמות (Integrity)">
            {submission.pdf_hash ? (
              <InfoRow label="SHA-256 Hash" value={submission.pdf_hash} mono />
            ) : (
              <p className="text-sm text-slate-500">Hash לא זמין</p>
            )}
            {submission.signed_pdf_hash && (
              <InfoRow label="Signed PDF Hash" value={submission.signed_pdf_hash} mono />
            )}
          </InfoCard>

          {/* Signers */}
          {submitters && submitters.length > 0 && (
            <InfoCard title="חותמים">
              <div className="space-y-3">
                {submitters.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-800 bg-slate-900/50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-200">
                        {s.full_name || "—"}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          s.status === "signed"
                            ? "bg-emerald-600/20 text-emerald-400"
                            : s.status === "declined"
                              ? "bg-red-600/20 text-red-400"
                              : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {s.status === "signed" ? "חתם ✓" : s.status === "declined" ? "סירב" : "ממתין"}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      <div>
                        תפקיד: {s.role === "witness" ? "עד" : s.role === "approver" ? "מאשר" : "חותם"}
                      </div>
                      {s.signed_at && <div>חתם ב: {formatDate(s.signed_at)}</div>}
                      {s.ip_address && <div>IP: {maskIp(String(s.ip_address))}</div>}
                      {s.signature_type && <div>סוג: {s.signature_type}</div>}
                      {s.otp_verified && <div className="text-emerald-500">OTP מאומת ✓</div>}
                    </div>
                  </div>
                ))}
              </div>
            </InfoCard>
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-slate-600">
          <p>אימות זה נוצר על ידי vBrain.io Document Engine</p>
          <p className="mt-1">מזהה: {submissionCode}</p>
        </div>
      </div>
    </div>
  );
}

// ── Components ───────────────────────────────────────────────

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <h3 className="mb-3 text-sm font-medium text-slate-300">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
      <span className="text-xs text-slate-500">{label}:</span>
      <span
        className={`text-sm text-slate-300 ${mono ? "break-all font-mono text-xs" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function formatCode(id: string, createdAt: string): string {
  const year = new Date(createdAt).getFullYear();
  const short = id.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `SUB-${year}-${short}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("he-IL", {
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

function maskIp(ip: string): string {
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.***.***.${parts[3]}`;
  return ip.replace(/:.+/, ":***");
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: "טיוטה",
    sent: "נשלח",
    viewed: "נצפה",
    partially_signed: "חתום חלקית",
    signed: "חתום ✅",
    expired: "פג תוקף",
    cancelled: "בוטל",
    archived: "בארכיון",
  };
  return map[status] || status;
}
