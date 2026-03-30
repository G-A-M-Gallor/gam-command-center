"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { JSONContent } from "@tiptap/react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import { supabase } from "@/lib/supabaseClient";

const TiptapEditor = dynamic(
  () => import("@/components/editor/TiptapEditor"),
  { ssr: false },
);
import {
  ArrowLeft,
  Eye,
  Lock,
  Unlock,
  MessageSquare,
  ScrollText,
  Send,
  _Clock,
  _Shield,
  Users,
  FileText,
  Globe,
  ChevronDown,
  ChevronUp,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Upload,
  FileCheck,
  FileX,
  Loader2,
  Download,
  UserPlus,
  Trash2,
  Copy,
  Link,
  _ExternalLink,
  Edit3,
  Check,
  _X,
  RefreshCw,
  Bell,
  Ban,
} from "lucide-react";
import type { SubmitterRole } from "@/lib/supabase/schema";
import type {
  DocumentSubmission,
  DocumentSubmitter,
  DocumentView,
  DocumentFieldLock,
  DocumentMessage,
  DocumentAuditEntry,
  DocumentChecklistItem,
  DocumentChecklistUpload,
} from "@/lib/supabase/schema";

// ── Tab types ─────────────────────────────────────────────
type Tab = "overview" | "editor" | "fields" | "signers" | "views" | "locks" | "messages" | "checklist" | "audit";

interface TemplateFieldDef {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  sort_order: number;
}

const TAB_CONFIG: { key: Tab; icon: React.ElementType; i18nKey: string }[] = [
  { key: "overview", icon: FileText, i18nKey: "overview" },
  { key: "editor", icon: Edit3, i18nKey: "editContent" },
  { key: "fields", icon: ClipboardCheck, i18nKey: "fieldValues" },
  { key: "signers", icon: Users, i18nKey: "signers" },
  { key: "views", icon: Eye, i18nKey: "viewHistory" },
  { key: "locks", icon: Lock, i18nKey: "fieldLocks" },
  { key: "messages", icon: MessageSquare, i18nKey: "messages" },
  { key: "checklist", icon: ClipboardCheck, i18nKey: "checklist" },
  { key: "audit", icon: ScrollText, i18nKey: "auditLog" },
];

// ── Main Component ───────────────────────────────────────
export default function DocumentDetailPage() {
  const params = useParams();
  const _router = useRouter();
  const id = params.id as string;
  const { language } = useSettings();
  const _t = getTranslations(language);
  const dc = t.docControl;
  const isRtl = language === "he";

  const [tab, setTab] = useState<Tab>("overview");
  const [submission, setSubmission] = useState<DocumentSubmission | null>(null);
  const [submitters, setSubmitters] = useState<DocumentSubmitter[]>([]);
  const [views, setViews] = useState<DocumentView[]>([]);
  const [locks, setLocks] = useState<DocumentFieldLock[]>([]);
  const [messages, setMessages] = useState<DocumentMessage[]>([]);
  const [auditLog, setAuditLog] = useState<DocumentAuditEntry[]>([]);
  const [checklistItems, setChecklistItems] = useState<DocumentChecklistItem[]>([]);
  const [checklistUploads, setChecklistUploads] = useState<DocumentChecklistUpload[]>([]);
  const [templateFields, setTemplateFields] = useState<TemplateFieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgBody, setMsgBody] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // ── Fetch all data ──────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [subRes, submittersRes, viewsRes, locksRes, msgsRes, auditRes, uploadsRes] = await Promise.all([
      supabase.from("document_submissions").select("*").eq("id", id).single(),
      supabase.from("document_submitters").select("*").eq("submission_id", id).order("sort_order"),
      supabase.from("document_views").select("*").eq("submission_id", id).order("created_at", { ascending: false }),
      supabase.from("document_field_locks").select("*").eq("submission_id", id),
      supabase.from("document_messages").select("*").eq("submission_id", id).order("created_at", { ascending: true }),
      supabase.from("document_audit_log").select("*").eq("submission_id", id).order("created_at", { ascending: false }).limit(100),
      supabase.from("document_checklist_uploads").select("*").eq("submission_id", id).order("created_at", { ascending: false }),
    ]);

    if (subRes.data) setSubmission(subRes.data as DocumentSubmission);
    if (submittersRes.data) setSubmitters(submittersRes.data as DocumentSubmitter[]);
    if (viewsRes.data) setViews(viewsRes.data as DocumentView[]);
    if (locksRes.data) setLocks(locksRes.data as DocumentFieldLock[]);
    if (msgsRes.data) setMessages(msgsRes.data as DocumentMessage[]);
    if (auditRes.data) setAuditLog(auditRes.data as DocumentAuditEntry[]);
    if (uploadsRes.data) setChecklistUploads(uploadsRes.data as DocumentChecklistUpload[]);

    // Fetch checklist items and template fields if submission has a template
    const sub = subRes.data as DocumentSubmission | null;
    if (sub?.template_id) {
      const [checklistRes, templateRes] = await Promise.all([
        supabase.from("document_checklist_items").select("*").eq("template_id", sub.template_id).order("sort_order"),
        supabase.from("document_templates").select("fields").eq("id", sub.template_id).single(),
      ]);
      if (checklistRes.data) setChecklistItems(checklistRes.data as DocumentChecklistItem[]);
      if (templateRes.data?.fields) setTemplateFields(templateRes.data.fields as unknown as TemplateFieldDef[]);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // Avoid synchronous setState cascade by deferring to next tick
    const timer = setTimeout(() => {
      fetchAll();
    }, 0);
    return () => clearTimeout(timer);
  }, [id]);

  // ── Realtime ──────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`doc-control-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "document_submissions", filter: `id=eq.${id}` }, () => fetchAll())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "document_views", filter: `submission_id=eq.${id}` }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "document_field_locks", filter: `submission_id=eq.${id}` }, () => fetchAll())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "document_messages", filter: `submission_id=eq.${id}` }, () => fetchAll())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "document_audit_log", filter: `submission_id=eq.${id}` }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, fetchAll]);

  // ── Actions ───────────────────────────────────────────
  const handleUnlockField = async (lockId: string) => {
    await supabase.from("document_field_locks").delete().eq("id", lockId);
    setLocks((prev) => prev.filter((l) => l.id !== lockId));
  };

  const handleSendMessage = async () => {
    if (!msgBody.trim() || sendingMsg) return;
    setSendingMsg(true);
    const { data } = await supabase
      .from("document_messages")
      .insert([{ submission_id: id, sender_type: "internal", body: msgBody.trim() }])
      .select()
      .single();
    if (data) {
      setMessages((prev) => [...prev, data as DocumentMessage]);
      setMsgBody("");
    }
    setSendingMsg(false);
  };

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [sendingForSign, setSendingForSign] = useState(false);
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<JSONContent | null>(null);
  const [editorSaveState, setEditorSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [editorLastSaved, setEditorLastSaved] = useState<Date | undefined>();
  const editorSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize editor content from submission
  useEffect(() => {
    if (submission?.content_snapshot && typeof submission.content_snapshot === "object") {
      // Defer to avoid cascading setState
      const timer = setTimeout(() => {
        setEditorContent(submission.content_snapshot as JSONContent);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [submission]);

  const handleEditorSave = useCallback(
    async (json: JSONContent) => {
      setEditorSaveState("saving");
      const { error } = await supabase
        .from("document_submissions")
        .update({ content_snapshot: json })
        .eq("id", id);
      if (error) {
        setEditorSaveState("error");
      } else {
        setEditorSaveState("saved");
        setEditorLastSaved(new Date());
        if (editorSaveTimeout.current) clearTimeout(editorSaveTimeout.current);
        editorSaveTimeout.current = setTimeout(() => setEditorSaveState("idle"), 2000);
      }
    },
    [id],
  );

  const handleFieldValueChange = useCallback(
    async (fieldId: string, value: unknown) => {
      if (!submission) return;
      const newValues = { ...submission.field_values, [fieldId]: value };
      setSubmission((prev) => prev ? { ...prev, field_values: newValues } : prev);
      await supabase
        .from("document_submissions")
        .update({ field_values: newValues })
        .eq("id", id);
    },
    [id, submission],
  );

  const handleAddSubmitter = async (data: { full_name: string; email: string; phone: string; role: SubmitterRole }) => {
    const { data: newSub } = await supabase
      .from("document_submitters")
      .insert([{
        submission_id: id,
        role: data.role,
        sort_order: submitters.length,
        full_name: data.full_name || null,
        email: data.email || null,
        phone: data.phone || null,
        status: "pending",
        otp_verified: false,
        consent_given: false,
        meta: {},
      }])
      .select()
      .single();
    if (newSub) setSubmitters((prev) => [...prev, newSub as DocumentSubmitter]);
  };

  const handleUpdateSubmitter = async (subId: string, updates: Partial<DocumentSubmitter>) => {
    await supabase.from("document_submitters").update(updates).eq("id", subId);
    setSubmitters((prev) => prev.map((s) => s.id === subId ? { ...s, ...updates } : s));
  };

  const handleDeleteSubmitter = async (subId: string) => {
    await supabase.from("document_submitters").delete().eq("id", subId);
    setSubmitters((prev) => prev.filter((s) => s.id !== subId));
  };

  const handleSendForSigning = async () => {
    setSendingForSign(true);
    try {
      const res = await fetch("/api/documents/send", {
        method: "POST",
        _headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: id }),
      });
      const data = await res.json();
      if (data.ok) {
        setSigningUrl(data.signing_url);
        fetchAll();
      }
    } catch (err) {
      console.error("Send failed:", err);
    }
    setSendingForSign(false);
  };

  const handleResend = async () => {
    setSendingForSign(true);
    try {
      const res = await fetch("/api/documents/resend", {
        method: "POST",
        _headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: id }),
      });
      const data = await res.json();
      if (data.ok) {
        setSigningUrl(data.signing_url);
        fetchAll();
      }
    } catch (err) {
      console.error("Resend failed:", err);
    }
    setSendingForSign(false);
  };

  const handleRevoke = async () => {
    try {
      const res = await fetch("/api/documents/revoke", {
        method: "POST",
        _headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: id }),
      });
      const data = await res.json();
      if (data.ok) fetchAll();
    } catch (err) {
      console.error("Revoke failed:", err);
    }
  };

  const handleReminder = async () => {
    try {
      const res = await fetch("/api/documents/reminder", {
        method: "POST",
        _headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: id }),
      });
      await res.json();
    } catch (err) {
      console.error("Reminder failed:", err);
    }
  };

  const handleGeneratePdf = async (store = false) => {
    setGeneratingPdf(true);
    try {
      const res = await fetch("/api/documents/pdf", {
        method: "POST",
        _headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: id, store }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${submission?.name || "document"}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (store) fetchAll(); // refresh to show pdf_path
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
    setGeneratingPdf(false);
  };

  const handleUpdateStatus = async (status: string) => {
    const updates: Record<string, unknown> = { status };
    if (status === "cancelled") updates.cancelled_at = new Date().toISOString();
    await supabase.from("document_submissions").update(updates).eq("id", id);
    setSubmission((prev) => prev ? { ...prev, status: status as DocumentSubmission["status"], ...(status === "cancelled" ? { cancelled_at: new Date().toISOString() } : {}) } : prev);
  };

  // ── Live viewing check ────────────────────────────────
  const [currentTime] = useState(() => Date.now());
  const isLiveViewing = useMemo(() => {
    if (views.length === 0) return false;
    const fiveMinAgo = currentTime - 5 * 60 * 1000;
    return views.some((v) => new Date(v.created_at).getTime() > fiveMinAgo);
  }, [views, currentTime]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-_t-transparent" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-400">
        <AlertTriangle className="h-12 w-12" />
        <p>{dc.notFound}</p>
        <button onClick={() => router.push("/dashboard/documents")} className="text-purple-400 hover:text-purple-300">
          {dc.backToList}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <PageHeader pageKey="documents">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/documents")}
            className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-slate-600 hover:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-200">{submission.name}</h2>
            {isLiveViewing && <span className="animate-pulse text-sm" title={dc.liveViewing}>👁️</span>}
            <StatusBadge status={submission.status} dc={dc} />
          </div>
        </div>
      </PageHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* Tab sidebar */}
        <div className="flex w-48 flex-shrink-0 flex-col border-e border-slate-800 bg-slate-900/30">
          {TAB_CONFIG.map(({ key, icon: Icon, i18nKey }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-start text-sm transition-colors ${
                tab === key
                  ? "border-e-2 border-purple-500 bg-purple-500/10 text-purple-400"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{dc[i18nKey as keyof typeof dc]}</span>
              {key === "signers" && submitters.length > 0 && (
                <span className="ms-auto rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-400">
                  {submitters.filter((s) => s.status === "signed").length}/{submitters.length}
                </span>
              )}
              {key === "messages" && messages.filter((m) => !m.is_read && m.sender_type === "submitter").length > 0 && (
                <span className="ms-auto rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400">
                  {messages.filter((m) => !m.is_read && m.sender_type === "submitter").length}
                </span>
              )}
              {key === "views" && isLiveViewing && (
                <span className="ms-auto h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "overview" && (
            <OverviewTab
              onGeneratePdf={handleGeneratePdf}
              generatingPdf={generatingPdf}
              submission={submission}
              submitters={submitters}
              views={views}
              locks={locks}
              messages={messages}
              dc={dc}
              onStatusChange={handleUpdateStatus}
            />
          )}
          {tab === "editor" && (
            <div className="mx-auto max-w-4xl">
              {submission.status !== "draft" && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-800/50 bg-amber-900/10 px-4 py-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-xs text-amber-400">{dc.editWarning}</span>
                </div>
              )}
              {editorContent ? (
                <TiptapEditor
                  content={editorContent}
                  onChange={setEditorContent}
                  onSave={handleEditorSave}
                  editable={submission.status === "draft"}
                  autoFocus
                  saveStatus={editorSaveState}
                  lastSavedAt={editorLastSaved}
                />
              ) : (
                <TiptapEditor
                  content={{ type: "doc", content: [{ type: "paragraph" }] }}
                  onChange={setEditorContent}
                  onSave={handleEditorSave}
                  editable={submission.status === "draft"}
                  autoFocus
                  saveStatus={editorSaveState}
                  lastSavedAt={editorLastSaved}
                />
              )}
            </div>
          )}
          {tab === "fields" && (
            <FieldValuesTab
              submission={submission}
              templateFields={templateFields}
              dc={dc}
              onChange={handleFieldValueChange}
            />
          )}
          {tab === "signers" && (
            <SignersTab
              submission={submission}
              submitters={submitters}
              dc={dc}
              onAdd={handleAddSubmitter}
              onUpdate={handleUpdateSubmitter}
              onDelete={handleDeleteSubmitter}
              onSend={handleSendForSigning}
              onResend={handleResend}
              onRevoke={handleRevoke}
              onReminder={handleReminder}
              sending={sendingForSign}
              signingUrl={signingUrl}
            />
          )}
          {tab === "views" && <ViewsTab views={views} dc={dc} />}
          {tab === "locks" && <LocksTab locks={locks} dc={dc} onUnlock={handleUnlockField} />}
          {tab === "messages" && (
            <MessagesTab
              messages={messages}
              dc={dc}
              msgBody={msgBody}
              onBodyChange={setMsgBody}
              onSend={handleSendMessage}
              sending={sendingMsg}
            />
          )}
          {tab === "checklist" && (
            <ChecklistTab
              items={checklistItems}
              uploads={checklistUploads}
              submissionId={id}
              dc={dc}
              onUploadComplete={fetchAll}
            />
          )}
          {tab === "audit" && <AuditTab auditLog={auditLog} dc={dc} />}
        </div>
      </div>
    </div>
  );
}

// ── Status Badge ────────────────────────────────────────
function StatusBadge({ status, dc }: { status: string; dc: Record<string, string> }) {
  const colors: Record<string, string> = {
    draft: "bg-slate-700 text-slate-300",
    sent: "bg-blue-900/50 text-blue-400",
    viewed: "bg-amber-900/50 text-amber-400",
    partially_signed: "bg-orange-900/50 text-orange-400",
    signed: "bg-emerald-900/50 text-emerald-400",
    expired: "bg-red-900/50 text-red-400",
    cancelled: "bg-red-900/50 text-red-400",
    archived: "bg-slate-800 text-slate-500",
  };
  const labels: Record<string, string> = {
    draft: dc.statusDraft,
    sent: dc.statusSent,
    viewed: dc.statusViewed,
    partially_signed: dc.statusPartial,
    signed: dc.statusSigned,
    expired: dc.statusExpired,
    cancelled: dc.statusCancelled,
    archived: dc.statusArchived,
  };

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || colors.draft}`}>
      {labels[status] || status}
    </span>
  );
}

// ── Overview Tab ─────────────────────────────────────────
function OverviewTab({
  submission,
  submitters,
  views,
  locks,
  messages,
  dc,
  onStatusChange,
  onGeneratePdf,
  generatingPdf,
}: {
  submission: DocumentSubmission;
  submitters: DocumentSubmitter[];
  views: DocumentView[];
  locks: DocumentFieldLock[];
  messages: DocumentMessage[];
  dc: Record<string, string>;
  onStatusChange: (status: string) => void;
  onGeneratePdf: (store?: boolean) => void;
  generatingPdf: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const signedCount = submitters.filter((s) => s.status === "signed").length;
  const unreadMsgs = messages.filter((m) => !m.is_read && m.sender_type === "submitter").length;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label={dc.submitters} value={`${signedCount}/${submitters.length}`} color="text-blue-400" />
        <StatCard icon={Eye} label={dc.totalViews} value={String(views.length)} color="text-amber-400" />
        <StatCard icon={Lock} label={dc.lockedFields} value={String(locks.length)} color="text-orange-400" />
        <StatCard icon={MessageSquare} label={dc.unreadMessages} value={String(unreadMsgs)} color="text-purple-400" />
      </div>

      {/* Document Info */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
        <h3 className="mb-3 text-sm font-medium text-slate-300">{dc.documentInfo}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoRow label={dc.created} value={fmtDate(submission.created_at)} />
          {submission.sent_at && <InfoRow label={dc.sentAt} value={fmtDate(submission.sent_at)} />}
          {submission.signed_at && <InfoRow label={dc.signedAt} value={fmtDate(submission.signed_at)} />}
          {submission.expires_at && (
            <InfoRow
              label={dc.expiresAt}
              value={fmtDate(submission.expires_at)}
              warn={new Date(submission.expires_at) < new Date()}
            />
          )}
          {submission.cancelled_at && <InfoRow label={dc.cancelledAt} value={fmtDate(submission.cancelled_at)} />}
          {submission.pdf_hash && <InfoRow label={dc.pdfHash} value={submission.pdf_hash.slice(0, 16) + "..."} />}
        </div>
      </div>

      {/* Field Values Preview */}
      {submission.field_values && Object.keys(submission.field_values).length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <h3 className="mb-3 text-sm font-medium text-slate-300">{dc.fieldValues}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(submission.field_values).map(([key, value]) => (
              <div key={key} className="rounded-lg border border-slate-800 bg-slate-900/50 p-2">
                <div className="text-[10px] text-slate-500">{key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</div>
                <div className="text-xs text-slate-300 mt-0.5 truncate">{String(value ?? "—")}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Preview */}
      {submission.content_snapshot && typeof submission.content_snapshot === "object" && (
        <ContentPreview content={submission.content_snapshot as TiptapNode} dc={dc} />
      )}

      {/* Submitters */}
      {submitters.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <h3 className="mb-3 text-sm font-medium text-slate-300">{dc.submitters}</h3>
          <div className="space-y-2">
            {submitters.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                <SubmitterStatusIcon status={s.status} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-200">{s.full_name || s.business_name || dc.unnamed}</div>
                  <div className="text-xs text-slate-500">
                    {dc[`role_${s.role}` as keyof typeof dc] || s.role}
                    {s.email && ` · ${s.email}`}
                  </div>
                </div>
                {s.signed_at && (
                  <span className="text-xs text-emerald-400">{fmtDate(s.signed_at)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
        <button
          onClick={() => setShowActions(!showActions)}
          className="flex w-full items-center justify-between text-sm font-medium text-slate-300"
        >
          {dc.actions}
          {showActions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showActions && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => onGeneratePdf(false)}
              disabled={generatingPdf}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50"
            >
              {generatingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {dc.downloadPdf}
            </button>
            <button
              onClick={() => onGeneratePdf(true)}
              disabled={generatingPdf}
              className="flex items-center gap-1.5 rounded-lg border border-purple-700 px-3 py-1.5 text-sm text-purple-400 hover:bg-purple-900/30 disabled:opacity-50"
            >
              {generatingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileCheck className="h-4 w-4" />
              )}
              {dc.generateAndStore}
            </button>
            {submission.status === "draft" && (
              <ActionBtn label={dc.markSent} color="blue" onClick={() => onStatusChange("sent")} />
            )}
            {["sent", "viewed", "partially_signed"].includes(submission.status) && (
              <ActionBtn label={dc.cancel} color="red" onClick={() => onStatusChange("cancelled")} />
            )}
            {submission.status === "signed" && (
              <ActionBtn label={dc.archive} color="slate" onClick={() => onStatusChange("archived")} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Signers Tab ─────────────────────────────────────────
function SignersTab({
  submission,
  submitters,
  dc,
  onAdd,
  onUpdate,
  onDelete,
  onSend,
  onResend,
  onRevoke,
  onReminder,
  sending,
  signingUrl,
}: {
  submission: DocumentSubmission;
  submitters: DocumentSubmitter[];
  dc: Record<string, string>;
  onAdd: (data: { full_name: string; email: string; phone: string; role: SubmitterRole }) => void;
  onUpdate: (id: string, updates: Partial<DocumentSubmitter>) => void;
  onDelete: (id: string) => void;
  onSend: () => void;
  onResend: () => void;
  onRevoke: () => void;
  onReminder: () => void;
  sending: boolean;
  signingUrl: string | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ full_name: "", email: "", phone: "", role: "signer" as SubmitterRole });
  const [copied, setCopied] = useState(false);

  const isDraft = submission.status === "draft";
  const isSent = ["sent", "viewed", "partially_signed"].includes(submission.status);

  const handleSubmitAdd = () => {
    if (!formData.full_name.trim()) return;
    onAdd(formData);
    setFormData({ full_name: "", email: "", phone: "", role: "signer" });
    setShowForm(false);
  };

  const handleCopyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Send for Signing Section */}
      {isDraft && submitters.length > 0 && (
        <div className="rounded-xl border border-purple-800/50 bg-purple-900/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-purple-300">{dc.sendForSigning}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{dc.sendForSigningDesc}</p>
            </div>
            <button
              onClick={onSend}
              disabled={sending || submitters.length === 0}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {dc.sendNow}
            </button>
          </div>
        </div>
      )}

      {/* Signing Link */}
      {(signingUrl || isSent) && (
        <div className="rounded-xl border border-emerald-800/50 bg-emerald-900/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Link className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-medium text-emerald-300">{dc.signingLink}</h3>
          </div>
          {signingUrl ? (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={signingUrl}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-300 font-mono"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={() => handleCopyLink(signingUrl)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-emerald-600 hover:text-emerald-400"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? dc.copied : dc.copyLink}
              </button>
              <a
                href={signingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-blue-600 hover:text-blue-400"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : (
            <p className="text-xs text-slate-500">{dc.documentSentInfo}</p>
          )}
        </div>
      )}

      {/* Actions for sent documents */}
      {isSent && (
        <div className="flex items-center gap-2">
          <button
            onClick={onResend}
            disabled={sending}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-blue-600 hover:text-blue-400 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {dc.resendLink}
          </button>
          <button
            onClick={onReminder}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-amber-600 hover:text-amber-400"
          >
            <Bell className="h-3.5 w-3.5" />
            {dc.sendReminder}
          </button>
          <button
            onClick={onRevoke}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-red-400 hover:border-red-600 hover:text-red-300"
          >
            <Ban className="h-3.5 w-3.5" />
            {dc.revokeDocument}
          </button>
        </div>
      )}

      {/* Submitter List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-300">{dc.signers} ({submitters.length})</h3>
          {isDraft && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:border-purple-600 hover:text-purple-400"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {dc.addSigner}
            </button>
          )}
        </div>

        {/* Add form */}
        {showForm && (
          <div className="mb-4 rounded-lg border border-purple-800/50 bg-purple-900/10 p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={formData.full_name}
                onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                placeholder={dc.fullName}
                className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder={dc.emailAddress}
                type="email"
                className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                placeholder={dc.phoneNumber}
                type="tel"
                className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value as SubmitterRole }))}
                className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="signer">{dc.role_signer}</option>
                <option value="witness">{dc.role_witness}</option>
                <option value="approver">{dc.role_approver}</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowForm(false); setFormData({ full_name: "", email: "", phone: "", role: "signer" }); }}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-300"
              >
                {dc.cancelAction}
              </button>
              <button
                onClick={handleSubmitAdd}
                disabled={!formData.full_name.trim()}
                className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs text-white hover:bg-purple-500 disabled:opacity-50"
              >
                {dc.addSigner}
              </button>
            </div>
          </div>
        )}

        {/* Submitter cards */}
        {submitters.length === 0 ? (
          <EmptyState icon={Users} message={dc.noSigners} />
        ) : (
          <div className="space-y-2">
            {submitters.map((s) => (
              <SubmitterCard
                key={s.id}
                submitter={s}
                dc={dc}
                isDraft={isDraft}
                editing={editingId === s.id}
                onEdit={() => setEditingId(editingId === s.id ? null : s.id)}
                onUpdate={(updates) => { onUpdate(s.id, updates); setEditingId(null); }}
                onDelete={() => onDelete(s.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SubmitterCard({
  submitter: s,
  dc,
  isDraft,
  editing,
  onEdit,
  onUpdate,
  onDelete,
}: {
  submitter: DocumentSubmitter;
  dc: Record<string, string>;
  isDraft: boolean;
  editing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Partial<DocumentSubmitter>) => void;
  onDelete: () => void;
}) {
  const [editForm, setEditForm] = useState({
    full_name: s.full_name || "",
    email: s.email || "",
    phone: s.phone || "",
    role: s.role,
  });

  const canModify = isDraft && s.status === "pending";
  const roleLabel = dc[`role_${s.role}` as keyof typeof dc] || s.role;

  if (editing && canModify) {
    return (
      <div className="rounded-lg border border-purple-800/50 bg-purple-900/10 p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            value={editForm.full_name}
            onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))}
            placeholder={dc.fullName}
            className="rounded border border-slate-700 bg-slate-800/50 px-2 py-1 text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
          />
          <input
            value={editForm.email}
            onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
            placeholder={dc.emailAddress}
            type="email"
            className="rounded border border-slate-700 bg-slate-800/50 px-2 py-1 text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
          />
          <input
            value={editForm.phone}
            onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder={dc.phoneNumber}
            className="rounded border border-slate-700 bg-slate-800/50 px-2 py-1 text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
          />
          <select
            value={editForm.role}
            onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value as SubmitterRole }))}
            className="rounded border border-slate-700 bg-slate-800/50 px-2 py-1 text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
          >
            <option value="signer">{dc.role_signer}</option>
            <option value="witness">{dc.role_witness}</option>
            <option value="approver">{dc.role_approver}</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onEdit} className="rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-300">
            {dc.cancelAction}
          </button>
          <button
            onClick={() => onUpdate({
              full_name: editForm.full_name || null,
              email: editForm.email || null,
              phone: editForm.phone || null,
              role: editForm.role,
            })}
            className="rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-500"
          >
            <Check className="inline h-3 w-3 me-1" />{dc.save}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
      <SubmitterStatusIcon status={s.status} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-200">{s.full_name || s.business_name || dc.unnamed}</span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">{roleLabel}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {s.email && <span>{s.email}</span>}
          {s.phone && <span>{s.phone}</span>}
          {s.signed_at && <span className="text-emerald-400">{dc.signedAt}: {fmtDate(s.signed_at)}</span>}
          {s.status === "declined" && <span className="text-red-400">{dc.declined}</span>}
        </div>
      </div>
      {canModify && (
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="rounded p-1 text-slate-500 hover:text-purple-400" title={dc.edit}>
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="rounded p-1 text-slate-500 hover:text-red-400" title={dc.delete}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Views Tab ────────────────────────────────────────────
function ViewsTab({ views, dc }: { views: DocumentView[]; dc: Record<string, string> }) {
  if (views.length === 0) {
    return <EmptyState icon={Eye} message={dc.noViews} />;
  }

  const currentTime = useMemo(() => Date.now(), []);

  return (
    <div className="space-y-2">
      <h3 className="mb-3 text-sm font-medium text-slate-300">{dc.viewHistory} ({views.length})</h3>
      {views.map((v) => {
        const isRecent = currentTime - new Date(v.created_at).getTime() < 5 * 60 * 1000;
        return (
          <div key={v.id} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            {isRecent ? (
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            ) : (
              <Eye className="h-4 w-4 text-slate-500" />
            )}
            <div className="flex-1">
              <div className="text-sm text-slate-300">
                {v.ip_address && <span className="me-2 text-slate-500">{v.ip_address}</span>}
                {v.duration_sec != null && (
                  <span className="text-xs text-slate-500">{dc.duration}: {v.duration_sec}s</span>
                )}
              </div>
              {v.sections_viewed && v.sections_viewed.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {v.sections_viewed.map((s) => (
                    <span key={s} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">{s}</span>
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs text-slate-500">{fmtDate(v.created_at)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Locks Tab ────────────────────────────────────────────
function LocksTab({
  locks,
  dc,
  onUnlock,
}: {
  locks: DocumentFieldLock[];
  dc: Record<string, string>;
  onUnlock: (id: string) => void;
}) {
  if (locks.length === 0) {
    return <EmptyState icon={Unlock} message={dc.noLocks} />;
  }

  return (
    <div className="space-y-2">
      <h3 className="mb-3 text-sm font-medium text-slate-300">{dc.fieldLocks} ({locks.length})</h3>
      {locks.map((lock) => (
        <div key={lock.id} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <Lock className="h-4 w-4 text-orange-400" />
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-300">{lock.field_path}</div>
            <div className="text-xs text-slate-500">
              {lock.locked_by && <span>{dc.lockedBy}: {lock.locked_by}</span>}
              {lock.reason && <span className="ms-2">· {lock.reason}</span>}
            </div>
          </div>
          <button
            onClick={() => onUnlock(lock.id)}
            className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:border-red-600 hover:text-red-400"
          >
            <Unlock className="me-1 inline h-3 w-3" />
            {dc.unlock}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Messages Tab ────────────────────────────────────────
function MessagesTab({
  messages,
  dc,
  msgBody,
  onBodyChange,
  onSend,
  sending,
}: {
  messages: DocumentMessage[];
  dc: Record<string, string>;
  msgBody: string;
  onBodyChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-3 text-sm font-medium text-slate-300">{dc.messages} ({messages.length})</h3>

      {/* Message list */}
      <div className="flex-1 space-y-2 overflow-y-auto pb-4">
        {messages.length === 0 && <EmptyState icon={MessageSquare} message={dc.noMessages} />}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[80%] rounded-lg p-3 ${
              msg.sender_type === "internal"
                ? "ms-auto border border-purple-800/30 bg-purple-900/20"
                : "me-auto border border-slate-800 bg-slate-900/50"
            }`}
          >
            <div className="mb-1 flex items-center gap-2 text-[10px] text-slate-500">
              <span>{msg.sender_type === "internal" ? dc.internal : dc.submitterMsg}</span>
              <span>{fmtDate(msg.created_at)}</span>
            </div>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{msg.body}</p>
          </div>
        ))}
      </div>

      {/* Compose */}
      <div className="border-t border-slate-800 pt-3">
        <div className="flex gap-2">
          <input
            value={msgBody}
            onChange={(e) => onBodyChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            placeholder={dc.typeMessage}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={onSend}
            disabled={!msgBody.trim() || sending}
            className="rounded-lg bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-500 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Audit Tab ───────────────────────────────────────────
function AuditTab({ auditLog, dc }: { auditLog: DocumentAuditEntry[]; dc: Record<string, string> }) {
  if (auditLog.length === 0) {
    return <EmptyState icon={ScrollText} message={dc.noAudit} />;
  }

  const actorIcons: Record<string, React.ElementType> = {
    user: Users,
    submitter: FileText,
    system: _Shield,
    automation: Globe,
  };

  return (
    <div className="space-y-1">
      <h3 className="mb-3 text-sm font-medium text-slate-300">{dc.auditLog} ({auditLog.length})</h3>
      {auditLog.map((entry) => {
        const Icon = actorIcons[entry.actor_type] || Shield;
        return (
          <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <Icon className="mt-0.5 h-4 w-4 text-slate-500" />
            <div className="flex-1">
              <div className="text-sm text-slate-300">
                <span className="font-medium">{entry.action}</span>
              </div>
              {entry.details && Object.keys(entry.details).length > 0 && (
                <pre className="mt-1 text-[10px] text-slate-500">{JSON.stringify(entry.details, null, 2)}</pre>
              )}
              <div className="mt-1 text-[10px] text-slate-500">
                {entry.actor_type}
                {entry.ip_address && ` · ${entry.ip_address}`}
              </div>
            </div>
            <span className="whitespace-nowrap text-xs text-slate-500">{fmtDate(entry.created_at)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Checklist Tab ───────────────────────────────────
function ChecklistTab({
  items,
  uploads,
  submissionId,
  dc,
  onUploadComplete,
}: {
  items: DocumentChecklistItem[];
  uploads: DocumentChecklistUpload[];
  submissionId: string;
  dc: Record<string, string>;
  onUploadComplete: () => void;
}) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Map uploads by checklist_item_id
  const uploadsByItem = useMemo(() => {
    const map = new Map<string, DocumentChecklistUpload[]>();
    for (const u of uploads) {
      const existing = map.get(u.checklist_item_id) || [];
      existing.push(u);
      map.set(u.checklist_item_id, existing);
    }
    return map;
  }, [uploads]);

  const handleFileUpload = async (itemId: string, file: File) => {
    setUploading(itemId);
    const path = `checklist/${submissionId}/${itemId}/${file.name}`;
    const { error: storageError } = await supabase.storage
      .from("documents")
      .upload(path, file, { upsert: true });

    if (storageError) {
      console.error("Upload failed:", storageError.message);
      setUploading(null);
      return;
    }

    await supabase.from("document_checklist_uploads").insert([{
      submission_id: submissionId,
      checklist_item_id: itemId,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
      status: "pending",
    }]);

    setUploading(null);
    onUploadComplete();
  };

  const handleReview = async (uploadId: string, status: "approved" | "rejected", note?: string) => {
    await supabase.from("document_checklist_uploads").update({
      status,
      review_note: note || null,
      reviewed_at: new Date().toISOString(),
    }).eq("id", uploadId);
    setReviewingId(null);
    onUploadComplete();
  };

  if (items.length === 0) {
    return <EmptyState icon={ClipboardCheck} message={dc.noChecklist} />;
  }

  const completedCount = items.filter((item) => {
    const itemUploads = uploadsByItem.get(item.id) || [];
    return itemUploads.some((u) => u.status === "approved");
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">
          {dc.checklist} ({completedCount}/{items.length})
        </h3>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {items.map((item) => {
        const itemUploads = uploadsByItem.get(item.id) || [];
        const hasApproved = itemUploads.some((u) => u.status === "approved");
        const hasPending = itemUploads.some((u) => u.status === "pending");

        return (
          <div
            key={item.id}
            className={`rounded-xl border p-4 ${
              hasApproved
                ? "border-emerald-800/50 bg-emerald-900/10"
                : item.is_required
                  ? "border-amber-800/50 bg-slate-900/30"
                  : "border-slate-800 bg-slate-900/30"
            }`}
          >
            {/* Item header */}
            <div className="mb-2 flex items-start gap-3">
              {hasApproved ? (
                <FileCheck className="mt-0.5 h-5 w-5 text-emerald-400" />
              ) : (
                <ClipboardCheck className="mt-0.5 h-5 w-5 text-slate-500" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200">{item.label}</span>
                  {item.is_required && (
                    <span className="rounded bg-red-900/30 px-1.5 py-0.5 text-[10px] text-red-400">{dc.required}</span>
                  )}
                </div>
                {item.description && (
                  <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                )}
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-600">
                  {item.accepted_types.length > 0 && (
                    <span>{dc.acceptedTypes}: {item.accepted_types.join(", ")}</span>
                  )}
                  {item.max_size_mb > 0 && (
                    <span>{dc.maxSize}: {item.max_size_mb}MB</span>
                  )}
                </div>
              </div>
            </div>

            {/* Uploaded files */}
            {itemUploads.length > 0 && (
              <div className="mb-3 ms-8 space-y-1.5">
                {itemUploads.map((upload) => (
                  <div key={upload.id} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 p-2">
                    <UploadStatusIcon status={upload.status} />
                    <span className="flex-1 truncate text-xs text-slate-300">{upload.file_name}</span>
                    {upload.size_bytes && (
                      <span className="text-[10px] text-slate-500">{formatBytes(upload.size_bytes)}</span>
                    )}
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${
                      upload.status === "approved" ? "bg-emerald-900/30 text-emerald-400" :
                      upload.status === "rejected" ? "bg-red-900/30 text-red-400" :
                      "bg-amber-900/30 text-amber-400"
                    }`}>
                      {dc[`review_${upload.status}` as keyof typeof dc] || upload.status}
                    </span>

                    {/* Review actions for pending uploads */}
                    {upload.status === "pending" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleReview(upload.id, "approved")}
                          className="rounded p-1 text-emerald-500 hover:bg-emerald-900/30"
                          title={dc.approve}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setReviewingId(reviewingId === upload.id ? null : upload.id)}
                          className="rounded p-1 text-red-500 hover:bg-red-900/30"
                          title={dc.reject}
                        >
                          <FileX className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {upload.review_note && (
                      <span className="text-[10px] text-slate-500" title={upload.review_note}>
                        💬
                      </span>
                    )}
                  </div>
                ))}

                {/* Reject reason input */}
                {reviewingId && itemUploads.some((u) => u.id === reviewingId) && (
                  <RejectInput
                    dc={dc}
                    onReject={(note) => handleReview(reviewingId, "rejected", note)}
                    onCancel={() => setReviewingId(null)}
                  />
                )}
              </div>
            )}

            {/* Upload button */}
            {!hasApproved && (
              <div className="ms-8">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-700 px-3 py-2 text-xs text-slate-400 transition-colors hover:border-purple-600 hover:text-purple-400">
                  {uploading === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {hasPending ? dc.uploadAnother : dc.uploadFile}
                  <input
                    type="file"
                    className="hidden"
                    accept={item.accepted_types.length > 0 ? item.accepted_types.join(",") : undefined}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(item.id, file);
                      e.target.value = "";
                    }}
                    disabled={uploading === item.id}
                  />
                </label>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function UploadStatusIcon({ status }: { status: string }) {
  if (status === "approved") return <FileCheck className="h-3.5 w-3.5 text-emerald-400" />;
  if (status === "rejected") return <FileX className="h-3.5 w-3.5 text-red-400" />;
  return <Clock className="h-3.5 w-3.5 text-amber-400" />;
}

function RejectInput({ dc, onReject, onCancel }: { dc: Record<string, string>; onReject: (note: string) => void; onCancel: () => void }) {
  const [note, setNote] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={dc.rejectReason}
        className="flex-1 rounded border border-slate-700 bg-slate-800/50 px-2 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
        autoFocus
      />
      <button
        onClick={() => onReject(note)}
        className="rounded bg-red-600/80 px-2 py-1 text-xs text-white hover:bg-red-500"
      >
        {dc.reject}
      </button>
      <button onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-400">
        {dc.cancelAction}
      </button>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ── Content Preview ──────────────────────────────────────

interface TiptapNode {
  type?: string;
  text?: string;
  content?: TiptapNode[];
  attrs?: Record<string, unknown>;
  marks?: { type: string }[];
}

function ContentPreview({ content, dc }: { content: TiptapNode; dc: Record<string, string> }) {
  const [expanded, setExpanded] = useState(false);
  const textBlocks = extractPlainText(content);
  const preview = textBlocks.slice(0, expanded ? textBlocks.length : 5);

  if (textBlocks.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">{dc.contentPreview}</h3>
        {textBlocks.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            {expanded ? dc.showLess : dc.showMore}
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {preview.map((block, i) => (
          <div key={i} className={`text-xs leading-relaxed ${block.heading ? "font-medium text-slate-200 mt-2" : "text-slate-400"}`}>
            {block.text}
          </div>
        ))}
        {!expanded && textBlocks.length > 5 && (
          <div className="text-[10px] text-slate-600">... +{textBlocks.length - 5} {dc.moreLines}</div>
        )}
      </div>
    </div>
  );
}

function extractPlainText(node: TiptapNode): { text: string; heading?: boolean }[] {
  const results: { text: string; heading?: boolean }[] = [];

  function walk(n: TiptapNode) {
    if (!n) return;
    if (n.type === "heading") {
      const text = collectText(n).trim();
      if (text) results.push({ text, heading: true });
      return;
    }
    if (n.type === "paragraph" || n.type === "listItem") {
      const text = collectText(n).trim();
      const prefix = n.type === "listItem" ? "\u2022 " : "";
      if (text) results.push({ text: prefix + text });
      return;
    }
    if (n.type === "bulletList" || n.type === "orderedList") {
      (n.content || []).forEach((item, i) => {
        const text = collectText(item).trim();
        const prefix = n.type === "orderedList" ? `${i + 1}. ` : "\u2022 ";
        if (text) results.push({ text: prefix + text });
      });
      return;
    }
    if (n.content) {
      for (const child of n.content) walk(child);
    }
  }

  function collectText(n: TiptapNode): string {
    if (n.type === "text") return n.text || "";
    return (n.content || []).map(collectText).join("");
  }

  walk(node);
  return results;
}

// ── Shared Components ────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
      <div className="mb-1 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className="text-lg font-semibold text-slate-200">{value}</div>
    </div>
  );
}

function InfoRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <span className="text-xs text-slate-500">{label}</span>
      <div className={`text-sm ${warn ? "text-red-400" : "text-slate-300"}`}>{value}</div>
    </div>
  );
}

function SubmitterStatusIcon({ status }: { status: string }) {
  if (status === "signed") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "declined") return <XCircle className="h-4 w-4 text-red-400" />;
  if (status === "viewed") return <Eye className="h-4 w-4 text-amber-400" />;
  return <Clock className="h-4 w-4 text-slate-500" />;
}

function ActionBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  const colors: Record<string, string> = {
    blue: "border-blue-700 text-blue-400 hover:bg-blue-900/30",
    red: "border-red-700 text-red-400 hover:bg-red-900/30",
    slate: "border-slate-700 text-slate-400 hover:bg-slate-800/30",
  };
  return (
    <button onClick={onClick} className={`rounded-lg border px-3 py-1.5 text-sm ${colors[color] || colors.slate}`}>
      {label}
    </button>
  );
}

// ── Field Values Tab ────────────────────────────────────

function FieldValuesTab({
  submission,
  templateFields,
  dc,
  onChange,
}: {
  submission: DocumentSubmission;
  templateFields: TemplateFieldDef[];
  dc: Record<string, string>;
  onChange: (fieldId: string, value: unknown) => void;
}) {
  const isDraft = submission.status === "draft";
  const values = submission.field_values || {};

  // If no template fields, allow free-form key-value editing
  if (templateFields.length === 0) {
    const entries = Object.entries(values);
    return (
      <div className="space-y-4">
        {entries.length === 0 ? (
          <EmptyState icon={ClipboardCheck} message={dc.noFieldValues || "No field values"} />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
            <h3 className="mb-3 text-sm font-medium text-slate-300">{dc.fieldValues}</h3>
            <div className="space-y-3">
              {entries.map(([key, value]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </label>
                  <input
                    value={String(value ?? "")}
                    onChange={(e) => isDraft && onChange(key, e.target.value)}
                    readOnly={!isDraft}
                    className={`w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-purple-500 focus:outline-none ${!isDraft ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isDraft && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-800/50 bg-amber-900/10 px-4 py-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <span className="text-xs text-amber-400">{dc.fieldsReadOnly}</span>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
        <h3 className="mb-4 text-sm font-medium text-slate-300">
          {dc.fieldValues}
          <span className="ms-2 text-xs text-slate-500">
            ({templateFields.filter((f) => values[f.id] !== undefined && values[f.id] !== "").length}/{templateFields.length})
          </span>
        </h3>
        <div className="space-y-4">
          {templateFields
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((field) => (
              <FieldInput
                key={field.id}
                field={field}
                value={values[field.id]}
                onChange={(v) => onChange(field.id, v)}
                readOnly={!isDraft}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: TemplateFieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  readOnly: boolean;
}) {
  const baseClass = `w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500 focus:outline-none ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`;

  return (
    <div>
      <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-400">
        {field.label || field.id}
        {field.required && <span className="text-red-400">*</span>}
      </label>

      {field.type === "textarea" ? (
        <textarea
          value={String(value ?? "")}
          onChange={(e) => !readOnly && onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={field.placeholder}
          rows={3}
          className={baseClass + " resize-none"}
        />
      ) : field.type === "select" ? (
        <select
          value={String(value ?? "")}
          onChange={(e) => !readOnly && onChange(e.target.value)}
          disabled={readOnly}
          className={baseClass}
        >
          <option value="">{field.placeholder || "—"}</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.type === "checkbox" ? (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => !readOnly && onChange(e.target.checked)}
            disabled={readOnly}
            className="rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
          />
          <span className="text-sm text-slate-300">{field.placeholder || field.label}</span>
        </label>
      ) : (
        <input
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
          value={String(value ?? "")}
          onChange={(e) => !readOnly && onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
          readOnly={readOnly}
          placeholder={field.placeholder}
          className={baseClass}
        />
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      <Icon className="mb-3 h-10 w-10" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
