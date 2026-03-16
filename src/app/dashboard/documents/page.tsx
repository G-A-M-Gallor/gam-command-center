"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import { supabase } from "@/lib/supabaseClient";
import {
  FileText,
  Send,
  Eye,
  PenTool,
  CheckCircle2,
  Archive,
  Clock,
  XCircle,
  Plus,
  Search,
  RefreshCw,
  LayoutTemplate,
  X,
  BarChart3,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertTriangle,
  Timer,
} from "lucide-react";
import {
  fetchDocTemplates,
  createSubmissionFromTemplate,
  createBlankSubmission,
} from "@/lib/supabase/documentQueries";
import type { DocumentTemplate } from "@/lib/supabase/schema";

// ── Types ────────────────────────────────────────────────────

interface Submission {
  id: string;
  name: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  signed_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  origami_entity_type: string | null;
  submitter_count: number;
  signed_count: number;
  recently_viewed: boolean;
}

interface SubmitterAgg {
  submission_id: string;
  total: number;
  signed: number;
}

interface RecentView {
  submission_id: string;
}

type ColumnStatus = "draft" | "sent" | "viewed" | "partially_signed" | "signed" | "archived";

const COLUMNS: { status: ColumnStatus; i18nKey: string; icon: React.ElementType; color: string }[] = [
  { status: "draft", i18nKey: "draft", icon: FileText, color: "text-slate-400" },
  { status: "sent", i18nKey: "sent", icon: Send, color: "text-blue-400" },
  { status: "viewed", i18nKey: "viewed", icon: Eye, color: "text-amber-400" },
  { status: "partially_signed", i18nKey: "partiallySigned", icon: PenTool, color: "text-orange-400" },
  { status: "signed", i18nKey: "signedStatus", icon: CheckCircle2, color: "text-emerald-400" },
  { status: "archived", i18nKey: "archived", icon: Archive, color: "text-slate-500" },
];

// ── Main Component ───────────────────────────────────────────

export default function DocumentsPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const dp = t.documentsPage;
  const isRtl = language === "he";

  const dt = t.docTemplates;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch submissions
    const { data: subs } = await supabase
      .from("document_submissions")
      .select("id, name, status, created_at, sent_at, signed_at, expires_at, created_by, origami_entity_type")
      .order("created_at", { ascending: false });

    if (!subs) {
      setLoading(false);
      return;
    }

    const subIds = subs.map((s) => s.id);

    // Fetch submitter counts per submission
    const { data: submitterAggs } = await supabase
      .from("document_submitters")
      .select("submission_id, status")
      .in("submission_id", subIds) as { data: { submission_id: string; status: string }[] | null };

    const aggMap = new Map<string, SubmitterAgg>();
    if (submitterAggs) {
      for (const row of submitterAggs) {
        const existing = aggMap.get(row.submission_id) || { submission_id: row.submission_id, total: 0, signed: 0 };
        existing.total++;
        if (row.status === "signed") existing.signed++;
        aggMap.set(row.submission_id, existing);
      }
    }

    // Fetch recent views (last 5 minutes) for live indicator
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentViews } = await supabase
      .from("document_views")
      .select("submission_id")
      .in("submission_id", subIds)
      .gte("created_at", fiveMinAgo) as { data: RecentView[] | null };

    const recentSet = new Set(recentViews?.map((v) => v.submission_id) || []);

    const mapped: Submission[] = subs.map((s) => {
      const agg = aggMap.get(s.id);
      return {
        ...s,
        submitter_count: agg?.total || 0,
        signed_count: agg?.signed || 0,
        recently_viewed: recentSet.has(s.id),
      };
    });

    setSubmissions(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
    fetchData();
  }, [fetchData]);

  // Realtime subscription for status changes
  useEffect(() => {
    const channel = supabase
      .channel("doc-submissions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "document_submissions" },
        () => fetchData(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "document_views" },
        () => fetchData(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return submissions;
    const q = search.toLowerCase();
    return submissions.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.includes(q),
    );
  }, [submissions, search]);

  // Group by status
  const columns = useMemo(() => {
    const map = new Map<string, Submission[]>();
    for (const col of COLUMNS) map.set(col.status, []);
    for (const sub of filtered) {
      const bucket = map.get(sub.status);
      if (bucket) bucket.push(sub);
      else {
        // expired/cancelled fall into draft or handled separately
        const fallback = map.get("draft");
        if (fallback) fallback.push(sub);
      }
    }
    return map;
  }, [filtered]);

  return (
    <div className="flex h-full flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader pageKey="documents">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={dp.searchDocuments}
              className="h-8 rounded-lg border border-slate-700 bg-slate-800/50 pe-3 ps-9 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`rounded-lg border p-1.5 ${showAnalytics ? "border-purple-600 text-purple-400" : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"}`}
            title={dp.analytics}
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          <button
            onClick={fetchData}
            className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-slate-600 hover:text-slate-300"
            title={dp.refresh}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <a
            href="/dashboard/documents/templates"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-sm text-slate-400 hover:border-slate-600 hover:text-slate-300"
          >
            <LayoutTemplate className="h-4 w-4" />
            {dt.manageTemplates}
          </a>
          <button
            onClick={() => setShowTemplatePicker(true)}
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-500"
          >
            <Plus className="h-4 w-4" />
            {dp.newDocument}
          </button>
        </div>
      </PageHeader>

      {/* Analytics Panel */}
      {showAnalytics && (
        <AnalyticsPanel submissions={submissions} dp={dp} />
      )}

      {/* Pipeline Kanban */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex min-w-max gap-3" style={{ minHeight: "calc(100vh - 140px)" }}>
          {COLUMNS.map((col) => {
            const items = columns.get(col.status) || [];
            const Icon = col.icon;
            return (
              <div
                key={col.status}
                className="flex w-72 flex-shrink-0 flex-col rounded-xl border border-slate-800 bg-slate-900/30"
              >
                {/* Column header */}
                <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-2.5">
                  <Icon className={`h-4 w-4 ${col.color}`} />
                  <span className="text-sm font-medium text-slate-300">
                    {dp[col.i18nKey as keyof typeof dp]}
                  </span>
                  <span className="ms-auto rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-500">
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2 overflow-y-auto p-2">
                  {items.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-600">
                      {dp.noDocuments}
                    </div>
                  )}
                  {items.map((sub) => (
                    <SubmissionCard key={sub.id} submission={sub} dp={dp} language={language} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Template Picker Modal */}
      {showTemplatePicker && (
        <TemplatePicker
          dt={dt}
          onClose={() => setShowTemplatePicker(false)}
          onCreated={() => { setShowTemplatePicker(false); fetchData(); }}
        />
      )}

      {/* Stats bar */}
      <div className="border-t border-slate-800 px-4 py-2">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>{dp.total}: {submissions.length}</span>
          {COLUMNS.map((col) => {
            const count = columns.get(col.status)?.length || 0;
            if (count === 0) return null;
            return (
              <span key={col.status} className={col.color}>
                {dp[col.i18nKey as keyof typeof dp]}: {count}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Analytics Panel ──────────────────────────────────────────

function AnalyticsPanel({ submissions, dp }: { submissions: Submission[]; dp: ReturnType<typeof getTranslations>["documentsPage"] }) {
  const total = submissions.length;
  const signed = submissions.filter((s) => s.status === "signed").length;
  const sent = submissions.filter((s) => ["sent", "viewed", "partially_signed"].includes(s.status)).length;
  const draft = submissions.filter((s) => s.status === "draft").length;
  const expired = submissions.filter((s) => s.expires_at && new Date(s.expires_at) < new Date() && s.status !== "signed").length;

  // Completion rate (signed / total non-draft)
  const nonDraft = total - draft;
  const completionRate = nonDraft > 0 ? Math.round((signed / nonDraft) * 100) : 0;

  // Average time to sign (for signed documents with sent_at)
  const signedWithTimes = submissions.filter((s) => s.status === "signed" && s.sent_at && s.signed_at);
  let avgSignTime = 0;
  if (signedWithTimes.length > 0) {
    const totalHours = signedWithTimes.reduce((sum, s) => {
      const diff = new Date(s.signed_at!).getTime() - new Date(s.sent_at!).getTime();
      return sum + diff / 3600000;
    }, 0);
    avgSignTime = Math.round(totalHours / signedWithTimes.length);
  }

  // Signing progress (total signed submitters / total submitters)
  const totalSubmitters = submissions.reduce((sum, s) => sum + s.submitter_count, 0);
  const signedSubmitters = submissions.reduce((sum, s) => sum + s.signed_count, 0);
  const submitterRate = totalSubmitters > 0 ? Math.round((signedSubmitters / totalSubmitters) * 100) : 0;

  // Expiring soon (within 7 days)
  const now = Date.now();
  const week = 7 * 86400000;
  const expiringSoon = submissions.filter((s) =>
    s.expires_at && new Date(s.expires_at).getTime() > now && new Date(s.expires_at).getTime() < now + week && s.status !== "signed",
  ).length;

  return (
    <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Documents */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileText className="h-3.5 w-3.5" />
            {dp.total}
          </div>
          <div className="mt-1 text-xl font-semibold text-slate-200">{total}</div>
          <div className="mt-0.5 text-[10px] text-slate-600">
            {draft} {dp.draft} · {sent} {dp.pending}
          </div>
        </div>

        {/* Completion Rate */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3">
          <div className="flex items-center gap-2 text-xs text-emerald-500">
            <TrendingUp className="h-3.5 w-3.5" />
            {dp.completionRate}
          </div>
          <div className="mt-1 text-xl font-semibold text-emerald-400">{completionRate}%</div>
          <div className="mt-0.5 text-[10px] text-slate-600">
            {signed}/{nonDraft} {dp.completed}
          </div>
        </div>

        {/* Signer Progress */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3">
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <PenTool className="h-3.5 w-3.5" />
            {dp.signerProgress}
          </div>
          <div className="mt-1 text-xl font-semibold text-blue-400">{submitterRate}%</div>
          <div className="mt-0.5 text-[10px] text-slate-600">
            {signedSubmitters}/{totalSubmitters} {dp.signersSigned}
          </div>
        </div>

        {/* Avg Sign Time */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3">
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <Timer className="h-3.5 w-3.5" />
            {dp.avgSignTime}
          </div>
          <div className="mt-1 text-xl font-semibold text-amber-400">
            {avgSignTime < 24 ? `${avgSignTime}h` : `${Math.round(avgSignTime / 24)}d`}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-600">
            {signedWithTimes.length} {dp.documentsAnalyzed}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3">
          <div className="flex items-center gap-2 text-xs text-orange-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            {dp.expiringSoon}
          </div>
          <div className="mt-1 text-xl font-semibold text-orange-400">{expiringSoon}</div>
          <div className="mt-0.5 text-[10px] text-slate-600">{dp.within7Days}</div>
        </div>

        {/* Already Expired */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3">
          <div className="flex items-center gap-2 text-xs text-red-400">
            <XCircle className="h-3.5 w-3.5" />
            {dp.expired}
          </div>
          <div className="mt-1 text-xl font-semibold text-red-400">{expired}</div>
          <div className="mt-0.5 text-[10px] text-slate-600">{dp.needsAttention}</div>
        </div>
      </div>
    </div>
  );
}

// ── Submission Card ──────────────────────────────────────────

function SubmissionCard({ submission: sub, dp, language }: { submission: Submission; dp: ReturnType<typeof getTranslations>["documentsPage"]; language: string }) {
  const isExpired = sub.expires_at && new Date(sub.expires_at) < new Date();

  return (
    <a
      href={`/dashboard/documents/${sub.id}`}
      className="group block rounded-lg border border-slate-800 bg-slate-900/50 p-3 transition-colors hover:border-slate-700 hover:bg-slate-800/50"
    >
      {/* Title + live indicator */}
      <div className="mb-2 flex items-start gap-2">
        <span className="flex-1 text-sm font-medium text-slate-200 group-hover:text-slate-100">
          {sub.name}
        </span>
        {sub.recently_viewed && (
          <span className="shrink-0 animate-pulse text-sm" title={dp.currentlyViewing}>
            👁️
          </span>
        )}
      </div>

      {/* Signer progress */}
      {sub.submitter_count > 0 && (
        <div className="mb-2">
          <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>
              {sub.signed_count}/{sub.submitter_count} {dp.signed}
            </span>
            <span>{Math.round((sub.signed_count / sub.submitter_count) * 100)}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${(sub.signed_count / sub.submitter_count) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <Clock className="h-3 w-3" />
        <span>{formatRelative(sub.created_at, dp, language)}</span>
        {isExpired && (
          <span className="flex items-center gap-0.5 text-red-400">
            <XCircle className="h-3 w-3" />
            {dp.expired}
          </span>
        )}
        {sub.origami_entity_type && (
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-500">
            {sub.origami_entity_type}
          </span>
        )}
      </div>
    </a>
  );
}

// ── Template Picker Modal ────────────────────────────────────

function TemplatePicker({
  dt,
  onClose,
  onCreated,
}: {
  dt: Record<string, string>;
  onClose: () => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await fetchDocTemplates("active");
      setTemplates(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleSelect = async (tpl: DocumentTemplate) => {
    setCreating(tpl.id);
    const sub = await createSubmissionFromTemplate(tpl);
    if (sub) {
      onCreated();
      router.push(`/dashboard/documents/${sub.id}`);
    }
    setCreating(null);
  };

  const handleBlank = async () => {
    setCreating("blank");
    const sub = await createBlankSubmission(dt.blankDocument);
    if (sub) {
      onCreated();
      router.push(`/dashboard/documents/${sub.id}`);
    }
    setCreating(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h3 className="text-sm font-medium text-slate-200">{dt.selectTemplate}</h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Blank document option */}
        <div className="border-b border-slate-800 p-3">
          <button
            onClick={handleBlank}
            disabled={creating !== null}
            className="flex w-full items-center gap-3 rounded-lg border border-dashed border-slate-700 p-3 text-start transition-colors hover:border-slate-600 hover:bg-slate-800/30 disabled:opacity-50"
          >
            {creating === "blank" ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-purple-400" />
            ) : (
              <FileText className="h-5 w-5 shrink-0 text-slate-400" />
            )}
            <div>
              <div className="text-sm font-medium text-slate-300">{dt.blankDocument}</div>
              <div className="text-xs text-slate-500">{dt.startFromScratch}</div>
            </div>
          </button>
        </div>

        {/* Template list */}
        <div className="max-h-72 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-purple-400" />
            </div>
          ) : templates.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">
              {dt.noTemplates}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                {dt.useTemplate}
              </div>
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleSelect(tpl)}
                  disabled={creating !== null}
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-800 p-3 text-start transition-colors hover:border-slate-700 hover:bg-slate-800/50 disabled:opacity-50"
                >
                  {creating === tpl.id ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-purple-400" />
                  ) : (
                    <LayoutTemplate className="h-5 w-5 shrink-0 text-purple-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-200">{tpl.name}</div>
                    {tpl.description && (
                      <div className="mt-0.5 truncate text-xs text-slate-500">{tpl.description}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] text-slate-500">v{tpl.version}</span>
                    {tpl.tags.length > 0 && (
                      <span className="text-[10px] text-slate-600">{tpl.tags[0]}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function formatRelative(iso: string, dp: ReturnType<typeof getTranslations>["documentsPage"], language: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return dp.now;
  if (mins < 60) return dp.minutesAgo.replace("{n}", String(mins));
  const hours = Math.floor(mins / 60);
  if (hours < 24) return dp.hoursAgo.replace("{n}", String(hours));
  const days = Math.floor(hours / 24);
  if (days < 30) return dp.daysAgo.replace("{n}", String(days));
  return new Date(iso).toLocaleDateString(language === "he" ? "he-IL" : language === "ru" ? "ru-RU" : "en-IL");
}
