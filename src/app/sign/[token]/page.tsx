import { _createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { jwtVerify } from "jose";
import { SigningFlow } from "./SigningFlow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "חתימה על מסמך — GAM",
  description: "חתימה אלקטרונית מאובטחת",
  robots: "noindex, nofollow",
};

interface SubmissionData {
  id: string;
  name: string;
  status: string;
  content_snapshot: Record<string, unknown>;
  field_values: Record<string, unknown>;
  expires_at: string | null;
  workspace_id: string;
}

interface SubmitterData {
  id: string;
  role: string;
  sort_order: number;
  status: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string | null;
  is_required: boolean;
  sort_order: number;
  accepted_types: string[];
  max_size_mb: number;
}

export default async function SignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // ── 1. Verify JWT ──────────────────────────────────────────
  const secret = new TextEncoder().encode(
    process.env.DOCUMENT_SIGNING_SECRET || process.env.SUPABASE_JWT_SECRET || ""
  );

  let payload: { sub?: string; sid?: string; exp?: number };
  try {
    const { payload: p } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    payload = p as typeof payload;
  } catch {
    return <ExpiredPage message="קישור לא תקין או שפג תוקפו" />;
  }

  const submissionId = payload.sub || payload.sid;
  if (!submissionId) {
    return <ExpiredPage message="קישור לא תקין" />;
  }

  // ── 2. Fetch submission + submitters ───────────────────────
  const supabase = await createClient();

  const { data: submission } = await supabase
    .from("document_submissions")
    .select("id, name, status, content_snapshot, field_values, expires_at, workspace_id")
    .eq("id", submissionId)
    .single() as { data: SubmissionData | null };

  if (!submission) return notFound();

  // Check expiry
  if (submission.expires_at && new Date(submission.expires_at) < new Date()) {
    return <ExpiredPage message="מסמך זה פג תוקפו" />;
  }

  // Check status
  if (submission.status === "cancelled") {
    return <ExpiredPage message="מסמך זה בוטל" />;
  }
  if (submission.status === "signed") {
    return <CompletedPage name={submission.name} />;
  }

  // Fetch submitters for this submission
  const { data: submitters } = await supabase
    .from("document_submitters")
    .select("id, role, sort_order, status, full_name, email, phone")
    .eq("submission_id", submission.id)
    .order("sort_order", { ascending: true }) as { data: SubmitterData[] | null };

  // Fetch checklist items (from the template)
  const { data: checklistItems } = await supabase
    .from("document_checklist_items")
    .select("id, label, description, is_required, sort_order, accepted_types, max_size_mb")
    .eq("template_id", submission.id)
    .order("sort_order", { ascending: true }) as { data: ChecklistItem[] | null };

  // ── 3. Render client signing flow ──────────────────────────
  return (
    <SigningFlow
      token={token}
      submission={{
        id: submission.id,
        name: submission.name,
        status: submission.status,
        contentSnapshot: submission.content_snapshot,
        fieldValues: submission.field_values,
      }}
      submitters={submitters || []}
      checklistItems={checklistItems || []}
    />
  );
}

function ExpiredPage({ message }: { message: string }) {
  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
      <div className="text-center">
        <div className="mb-4 text-5xl">⏳</div>
        <p className="text-lg text-slate-300">{message}</p>
        <p className="mt-2 text-sm text-slate-500">This document is no longer available</p>
      </div>
    </div>
  );
}

function CompletedPage({ name }: { name: string }) {
  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
      <div className="text-center">
        <div className="mb-4 text-5xl">✅</div>
        <h1 className="text-xl font-bold text-slate-100">{name}</h1>
        <p className="mt-2 text-lg text-emerald-400">מסמך זה נחתם בהצלחה</p>
        <p className="mt-1 text-sm text-slate-500">This document has been signed successfully</p>
      </div>
    </div>
  );
}
