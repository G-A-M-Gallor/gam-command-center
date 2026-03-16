"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  User,
  Bot,
  Zap,
  FileSignature,
  Database,
  X,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/command-center/PageHeader";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";

interface AuditEntry {
  id: string | number;
  table_name: string;
  record_id: string | null;
  action: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string | null;
  changed_at: string;
  actor_type?: string;
  _source: "system" | "document";
}

const ACTION_COLORS: Record<string, string> = {
  INSERT: "text-emerald-400 bg-emerald-500/10",
  UPDATE: "text-blue-400 bg-blue-500/10",
  DELETE: "text-red-400 bg-red-500/10",
  "sign.completed": "text-emerald-400 bg-emerald-500/10",
  "sign.failed": "text-red-400 bg-red-500/10",
  "submission.sent": "text-blue-400 bg-blue-500/10",
  "submission.fully_signed": "text-emerald-400 bg-emerald-500/10",
  "submission.viewed": "text-amber-400 bg-amber-500/10",
  "submission.revoked": "text-red-400 bg-red-500/10",
  "submission.reminded": "text-amber-400 bg-amber-500/10",
};

const ACTOR_ICONS: Record<string, React.ElementType> = {
  user: User,
  submitter: FileSignature,
  system: Bot,
  automation: Zap,
};

const SOURCE_OPTIONS = [
  { value: "", labelKey: "allSources" },
  { value: "system", labelKey: "systemLogs" },
  { value: "document", labelKey: "documentLogs" },
];

const ACTOR_TYPE_OPTIONS = [
  { value: "", labelKey: "allActors" },
  { value: "user", labelKey: "actorUser" },
  { value: "submitter", labelKey: "actorSubmitter" },
  { value: "system", labelKey: "actorSystem" },
  { value: "automation", labelKey: "actorAutomation" },
];

export default function AuditPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const al = t.auditLog;
  const isRtl = language === "he";

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [actorType, setActorType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (source) params.set("source", source);
    if (actorType) params.set("actor_type", actorType);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/audit?${params.toString()}`);
      const data = await res.json();
      if (data.entries) {
        setEntries(data.entries);
        setTotal(data.total || 0);
      }
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, source, actorType, dateFrom, dateTo, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel("audit-log-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_log" },
        () => {
          if (page === 1) fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, page]);

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.action.toLowerCase().includes(q) ||
        e.table_name.toLowerCase().includes(q) ||
        (e.changed_by && e.changed_by.toLowerCase().includes(q)) ||
        (e.record_id && e.record_id.toLowerCase().includes(q)),
    );
  }, [entries, search]);

  const totalPages = Math.ceil(total / limit);

  const clearFilters = () => {
    setSource("");
    setActorType("");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setPage(1);
  };

  const hasFilters = source || actorType || dateFrom || dateTo || search;

  return (
    <div className="flex h-full flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader pageKey="audit">
        <div className="mt-3 flex items-center gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={al.searchPlaceholder}
              className="h-8 w-64 rounded-lg border border-slate-700 bg-slate-800/50 pe-3 ps-9 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
              showFilters || hasFilters
                ? "border-purple-600 text-purple-400"
                : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            {al.filters}
            {hasFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[10px] text-white">!</span>
            )}
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1.5 text-xs text-slate-400 hover:border-slate-600 hover:text-slate-300"
            >
              <X className="h-3 w-3" />
              {al.clearFilters}
            </button>
          )}
          <button
            onClick={fetchData}
            className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-slate-600 hover:text-slate-300"
            title={al.refresh}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </PageHeader>

      {showFilters && (
        <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-slate-500">{al.source}</label>
              <select
                value={source}
                onChange={(e) => { setSource(e.target.value); setPage(1); }}
                className="h-8 rounded-lg border border-slate-700 bg-slate-800/50 px-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
              >
                {SOURCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {al[opt.labelKey as keyof typeof al]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-slate-500">{al.actorType}</label>
              <select
                value={actorType}
                onChange={(e) => { setActorType(e.target.value); setPage(1); }}
                className="h-8 rounded-lg border border-slate-700 bg-slate-800/50 px-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
              >
                {ACTOR_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {al[opt.labelKey as keyof typeof al]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-slate-500">{al.dateFrom}</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="h-8 rounded-lg border border-slate-700 bg-slate-800/50 px-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-slate-500">{al.dateTo}</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="h-8 rounded-lg border border-slate-700 bg-slate-800/50 px-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {loading && entries.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-sm text-slate-500">{al.noEntries}</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/[0.06]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-3 py-2.5 text-start text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    {al.colTimestamp}
                  </th>
                  <th className="px-3 py-2.5 text-start text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    {al.colSource}
                  </th>
                  <th className="px-3 py-2.5 text-start text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    {al.colActor}
                  </th>
                  <th className="px-3 py-2.5 text-start text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    {al.colAction}
                  </th>
                  <th className="px-3 py-2.5 text-start text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    {al.colTarget}
                  </th>
                  <th className="w-10 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  const actionColor = ACTION_COLORS[entry.action] || "text-slate-400 bg-slate-500/10";
                  const ActorIcon = entry.actor_type ? ACTOR_ICONS[entry.actor_type] || User : Database;
                  const hasDetails = entry.old_data || entry.new_data;

                  return (
                    <TableRow
                      key={`${entry._source}-${entry.id}`}
                      entry={entry}
                      isExpanded={isExpanded}
                      actionColor={actionColor}
                      ActorIcon={ActorIcon}
                      hasDetails={!!hasDetails}
                      onToggle={() => setExpandedId(isExpanded ? null : entry.id)}
                      al={al}
                      language={language}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="border-t border-slate-800 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {al.showing} {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} {al.of} {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-300 disabled:opacity-30"
            >
              {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            <span className="px-2 text-slate-300">
              {page} / {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-300 disabled:opacity-30"
            >
              {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableRow({
  entry,
  isExpanded,
  actionColor,
  ActorIcon,
  hasDetails,
  onToggle,
  al,
  language,
}: {
  entry: AuditEntry;
  isExpanded: boolean;
  actionColor: string;
  ActorIcon: React.ElementType;
  hasDetails: boolean;
  onToggle: () => void;
  al: Record<string, string>;
  language: string;
}) {
  return (
    <>
      <tr
        className={`border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] ${
          hasDetails ? "cursor-pointer" : ""
        }`}
        onClick={hasDetails ? onToggle : undefined}
      >
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="h-3 w-3 shrink-0 text-slate-600" />
            <span className="text-xs">
              {formatTimestamp(entry.changed_at, language)}
            </span>
          </div>
        </td>
        <td className="px-3 py-2.5">
          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
            entry._source === "document"
              ? "bg-purple-500/10 text-purple-400"
              : "bg-blue-500/10 text-blue-400"
          }`}>
            {entry._source === "document" ? (
              <FileSignature className="h-3 w-3" />
            ) : (
              <Database className="h-3 w-3" />
            )}
            {entry._source === "document" ? al.documentLogs : entry.table_name}
          </span>
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <ActorIcon className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs text-slate-300">
              {entry.actor_type ? al[`actor${capitalize(entry.actor_type)}` as keyof typeof al] || entry.actor_type : (entry.changed_by ? truncateId(entry.changed_by) : al.actorSystem)}
            </span>
          </div>
        </td>
        <td className="px-3 py-2.5">
          <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${actionColor}`}>
            {entry.action}
          </span>
        </td>
        <td className="px-3 py-2.5">
          <span className="text-xs text-slate-400">
            {entry.record_id ? truncateId(entry.record_id) : "—"}
          </span>
        </td>
        <td className="px-3 py-2.5 text-end">
          {hasDetails && (
            isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            )
          )}
        </td>
      </tr>
      {isExpanded && hasDetails && (
        <tr className="border-b border-white/[0.03]">
          <td colSpan={6} className="px-3 py-3">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-3">
              {entry.old_data && (
                <div className="mb-2">
                  <span className="mb-1 block text-[10px] font-medium text-red-400">{al.oldData}</span>
                  <pre className="max-h-40 overflow-auto rounded bg-slate-900 p-2 text-[11px] text-slate-400">
                    {JSON.stringify(entry.old_data, null, 2)}
                  </pre>
                </div>
              )}
              {entry.new_data && (
                <div>
                  <span className="mb-1 block text-[10px] font-medium text-emerald-400">{al.newData}</span>
                  <pre className="max-h-40 overflow-auto rounded bg-slate-900 p-2 text-[11px] text-slate-400">
                    {JSON.stringify(entry.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function formatTimestamp(iso: string, language: string): string {
  const locale = language === "he" ? "he-IL" : language === "ru" ? "ru-RU" : "en-US";
  const date = new Date(iso);
  return date.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function truncateId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}...`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
