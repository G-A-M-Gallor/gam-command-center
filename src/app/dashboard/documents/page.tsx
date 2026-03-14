"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
} from "lucide-react";

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

const COLUMNS: { status: ColumnStatus; label: string; labelEn: string; icon: React.ElementType; color: string }[] = [
  { status: "draft", label: "טיוטה", labelEn: "Draft", icon: FileText, color: "text-slate-400" },
  { status: "sent", label: "נשלח", labelEn: "Sent", icon: Send, color: "text-blue-400" },
  { status: "viewed", label: "נצפה", labelEn: "Viewed", icon: Eye, color: "text-amber-400" },
  { status: "partially_signed", label: "חתום חלקי", labelEn: "Partial", icon: PenTool, color: "text-orange-400" },
  { status: "signed", label: "חתום", labelEn: "Signed", icon: CheckCircle2, color: "text-emerald-400" },
  { status: "archived", label: "ארכיון", labelEn: "Archived", icon: Archive, color: "text-slate-500" },
];

// ── Main Component ───────────────────────────────────────────

export default function DocumentsPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isHe = language === "he";

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
    <div className="flex h-full flex-col" dir={isHe ? "rtl" : "ltr"}>
      <PageHeader pageKey="documents">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isHe ? "חיפוש מסמך..." : "Search documents..."}
              className="h-8 rounded-lg border border-slate-700 bg-slate-800/50 pe-3 ps-9 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchData}
            className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-slate-600 hover:text-slate-300"
            title={isHe ? "רענן" : "Refresh"}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-500"
          >
            <Plus className="h-4 w-4" />
            {isHe ? "מסמך חדש" : "New Document"}
          </button>
        </div>
      </PageHeader>

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
                    {isHe ? col.label : col.labelEn}
                  </span>
                  <span className="ms-auto rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-500">
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2 overflow-y-auto p-2">
                  {items.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-600">
                      {isHe ? "אין מסמכים" : "No documents"}
                    </div>
                  )}
                  {items.map((sub) => (
                    <SubmissionCard key={sub.id} submission={sub} isHe={isHe} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-t border-slate-800 px-4 py-2">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>{isHe ? "סה\"כ" : "Total"}: {submissions.length}</span>
          {COLUMNS.map((col) => {
            const count = columns.get(col.status)?.length || 0;
            if (count === 0) return null;
            return (
              <span key={col.status} className={col.color}>
                {isHe ? col.label : col.labelEn}: {count}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Submission Card ──────────────────────────────────────────

function SubmissionCard({ submission: sub, isHe }: { submission: Submission; isHe: boolean }) {
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
          <span className="shrink-0 animate-pulse text-sm" title={isHe ? "צופים עכשיו" : "Currently viewing"}>
            👁️
          </span>
        )}
      </div>

      {/* Signer progress */}
      {sub.submitter_count > 0 && (
        <div className="mb-2">
          <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>
              {sub.signed_count}/{sub.submitter_count} {isHe ? "חתמו" : "signed"}
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
        <span>{formatRelative(sub.created_at, isHe)}</span>
        {isExpired && (
          <span className="flex items-center gap-0.5 text-red-400">
            <XCircle className="h-3 w-3" />
            {isHe ? "פג תוקף" : "Expired"}
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

// ── Helpers ──────────────────────────────────────────────────

function formatRelative(iso: string, isHe: boolean): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return isHe ? "עכשיו" : "now";
  if (mins < 60) return isHe ? `לפני ${mins} דק׳` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return isHe ? `לפני ${hours} שע׳` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return isHe ? `לפני ${days} ימים` : `${days}d ago`;
  return new Date(iso).toLocaleDateString(isHe ? "he-IL" : "en-IL");
}
