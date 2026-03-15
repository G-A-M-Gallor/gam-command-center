"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowLeft,
  Eye,
  Lock,
  Unlock,
  MessageSquare,
  ScrollText,
  Send,
  Clock,
  Shield,
  Users,
  FileText,
  Globe,
  ChevronDown,
  ChevronUp,
  XCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type {
  DocumentSubmission,
  DocumentSubmitter,
  DocumentView,
  DocumentFieldLock,
  DocumentMessage,
  DocumentAuditEntry,
} from "@/lib/supabase/schema";

// ── Tab types ─────────────────────────────────────────────
type Tab = "overview" | "views" | "locks" | "messages" | "audit";

const TAB_CONFIG: { key: Tab; icon: React.ElementType; i18nKey: string }[] = [
  { key: "overview", icon: FileText, i18nKey: "overview" },
  { key: "views", icon: Eye, i18nKey: "viewHistory" },
  { key: "locks", icon: Lock, i18nKey: "fieldLocks" },
  { key: "messages", icon: MessageSquare, i18nKey: "messages" },
  { key: "audit", icon: ScrollText, i18nKey: "auditLog" },
];

// ── Main Component ───────────────────────────────────────
export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { language } = useSettings();
  const t = getTranslations(language);
  const dc = t.docControl;
  const isRtl = language === "he";

  const [tab, setTab] = useState<Tab>("overview");
  const [submission, setSubmission] = useState<DocumentSubmission | null>(null);
  const [submitters, setSubmitters] = useState<DocumentSubmitter[]>([]);
  const [views, setViews] = useState<DocumentView[]>([]);
  const [locks, setLocks] = useState<DocumentFieldLock[]>([]);
  const [messages, setMessages] = useState<DocumentMessage[]>([]);
  const [auditLog, setAuditLog] = useState<DocumentAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgBody, setMsgBody] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // ── Fetch all data ──────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [subRes, submittersRes, viewsRes, locksRes, msgsRes, auditRes] = await Promise.all([
      supabase.from("document_submissions").select("*").eq("id", id).single(),
      supabase.from("document_submitters").select("*").eq("submission_id", id).order("sort_order"),
      supabase.from("document_views").select("*").eq("submission_id", id).order("created_at", { ascending: false }),
      supabase.from("document_field_locks").select("*").eq("submission_id", id),
      supabase.from("document_messages").select("*").eq("submission_id", id).order("created_at", { ascending: true }),
      supabase.from("document_audit_log").select("*").eq("submission_id", id).order("created_at", { ascending: false }).limit(100),
    ]);

    if (subRes.data) setSubmission(subRes.data as DocumentSubmission);
    if (submittersRes.data) setSubmitters(submittersRes.data as DocumentSubmitter[]);
    if (viewsRes.data) setViews(viewsRes.data as DocumentView[]);
    if (locksRes.data) setLocks(locksRes.data as DocumentFieldLock[]);
    if (msgsRes.data) setMessages(msgsRes.data as DocumentMessage[]);
    if (auditRes.data) setAuditLog(auditRes.data as DocumentAuditEntry[]);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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

  const handleUpdateStatus = async (status: string) => {
    const updates: Record<string, unknown> = { status };
    if (status === "cancelled") updates.cancelled_at = new Date().toISOString();
    await supabase.from("document_submissions").update(updates).eq("id", id);
    setSubmission((prev) => prev ? { ...prev, status: status as DocumentSubmission["status"], ...(status === "cancelled" ? { cancelled_at: new Date().toISOString() } : {}) } : prev);
  };

  // ── Live viewing check ────────────────────────────────
  const isLiveViewing = useMemo(() => {
    if (views.length === 0) return false;
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    return views.some((v) => new Date(v.created_at).getTime() > fiveMinAgo);
  }, [views]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
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
              submission={submission}
              submitters={submitters}
              views={views}
              locks={locks}
              messages={messages}
              dc={dc}
              onStatusChange={handleUpdateStatus}
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
}: {
  submission: DocumentSubmission;
  submitters: DocumentSubmitter[];
  views: DocumentView[];
  locks: DocumentFieldLock[];
  messages: DocumentMessage[];
  dc: Record<string, string>;
  onStatusChange: (status: string) => void;
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

// ── Views Tab ────────────────────────────────────────────
function ViewsTab({ views, dc }: { views: DocumentView[]; dc: Record<string, string> }) {
  if (views.length === 0) {
    return <EmptyState icon={Eye} message={dc.noViews} />;
  }

  return (
    <div className="space-y-2">
      <h3 className="mb-3 text-sm font-medium text-slate-300">{dc.viewHistory} ({views.length})</h3>
      {views.map((v) => {
        const isRecent = Date.now() - new Date(v.created_at).getTime() < 5 * 60 * 1000;
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
    system: Shield,
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
