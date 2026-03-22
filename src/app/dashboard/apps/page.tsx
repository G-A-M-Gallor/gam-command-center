"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import {
  useAppsRegistry,
  type AppStatus,
  type AppSection,
  type AppRecord,
  type DisplayMode,
  getStatusBadge,
} from "@/lib/hooks/useAppsRegistry";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";

// ── Status config ────────────────────────────────────────

const STATUS_COLORS: Record<AppStatus, { bg: string; text: string; border: string }> = {
  built: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  "in-progress": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  planned: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  idea: { bg: "bg-slate-500/10", text: "text-slate-500", border: "border-slate-600/20" },
  hidden: { bg: "bg-slate-800/50", text: "text-slate-600", border: "border-slate-700/20" },
};

const STATUS_FILTER_ORDER: AppStatus[] = ["built", "in-progress", "planned", "idea"];

// ── Display mode toggles ────────────────────────────────

const DISPLAY_MODE_KEYS: { key: keyof DisplayMode; icon: string; tooltip: string }[] = [
  { key: "menu", icon: "🗂️", tooltip: "תפריט צד" },
  { key: "top_widget", icon: "⬆️", tooltip: "ווידג׳ט למעלה" },
  { key: "side_widget", icon: "◀️", tooltip: "ווידג׳ט בצד" },
  { key: "block", icon: "📦", tooltip: "בלוק ב-vNote" },
  { key: "bottom_bar", icon: "⬇️", tooltip: "בר תחתון" },
];

// ── App Card ─────────────────────────────────────────────

function AppCard({
  app,
  language,
  onToggleDisplayMode,
}: {
  app: AppRecord;
  language: string;
  onToggleDisplayMode: (appId: string, key: keyof DisplayMode, current: DisplayMode) => void;
}) {
  const colors = STATUS_COLORS[app.status];
  const badge = getStatusBadge(app.status);
  const name = language === "he" ? app.name_he : (app.name_en || app.name_he);
  const isClickable = app.status === "built" || app.status === "in-progress";

  const card = (
    <div
      className={`group relative rounded-xl border p-4 transition-all duration-200 ${colors.border} ${
        isClickable
          ? "hover:bg-slate-800/50 hover:border-slate-600/40 hover:shadow-lg cursor-pointer"
          : "opacity-60"
      }`}
      style={{ background: "rgba(15, 23, 42, 0.5)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl">{app.icon}</span>
        {badge && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium ${colors.bg} ${colors.text}`}>
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-3 text-sm font-medium text-slate-200 truncate">{name}</h3>
      <p className="mt-1 text-[10px] text-slate-500 capitalize">{app.type}</p>

      {/* Display mode toggles */}
      <div className="mt-3 flex items-center gap-1 border-t border-slate-700/30 pt-2">
        {DISPLAY_MODE_KEYS.map(({ key, icon, tooltip }) => {
          const active = app.display_mode[key];
          return (
            <button
              key={key}
              type="button"
              title={tooltip}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleDisplayMode(app.id, key, app.display_mode);
              }}
              className={`rounded p-1 text-xs transition-all ${
                active
                  ? "bg-purple-500/20 text-purple-300 scale-105"
                  : "text-slate-600 hover:text-slate-400 hover:bg-slate-700/30"
              }`}
            >
              {icon}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (isClickable) {
    return <Link href={app.route}>{card}</Link>;
  }
  return card;
}

// ── Section ──────────────────────────────────────────────

function SectionBlock({
  section,
  language,
  statusFilter,
  searchQuery,
  onToggleDisplayMode,
}: {
  section: AppSection;
  language: string;
  statusFilter: AppStatus | null;
  searchQuery: string;
  onToggleDisplayMode: (appId: string, key: keyof DisplayMode, current: DisplayMode) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const name = language === "he" ? section.name_he : (section.name_en || section.name_he);

  const filteredApps = section.apps.filter((app) => {
    if (app.status === "hidden") return false;
    if (statusFilter && app.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        app.name_he.toLowerCase().includes(q) ||
        (app.name_en?.toLowerCase().includes(q)) ||
        app.slug.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (filteredApps.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 px-1 py-2 w-full text-start group/section"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-slate-600 transition-transform" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-slate-600 transition-transform" />
        )}
        <span className="text-lg">{section.icon}</span>
        <span className="text-sm font-medium text-slate-300">{name}</span>
        <span className="text-[10px] text-slate-600 tabular-nums">{filteredApps.length}</span>
      </button>

      {!collapsed && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-1">
          {filteredApps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              language={language}
              onToggleDisplayMode={onToggleDisplayMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────

export default function AppsPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const { sections, allApps, isLoading } = useAppsRegistry();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppStatus | null>(null);
  const queryClient = useQueryClient();

  const isHe = language === "he";

  const handleToggleDisplayMode = useCallback(
    async (appId: string, key: keyof DisplayMode, current: DisplayMode) => {
      const updated = { ...current, [key]: !current[key] };
      await supabase
        .from("vb_apps")
        .update({ display_mode: updated })
        .eq("id", appId);
      await queryClient.invalidateQueries({ queryKey: ["apps-registry"] });
    },
    [queryClient],
  );

  // Stats
  const statusCounts = allApps.reduce<Record<string, number>>((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div dir={isHe ? "rtl" : "ltr"} className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">
            {(t.tabs as Record<string, string>).apps || "All Apps"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {allApps.length} {isHe ? "אפליקציות" : "apps"} &middot; {sections.length} {isHe ? "קטגוריות" : "sections"}
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 border border-slate-700/50 px-3 py-2 w-full sm:w-72">
          <Search className="h-4 w-4 text-slate-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isHe ? "חפש אפליקציה..." : "Search apps..."}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none"
          />
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            statusFilter === null
              ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
              : "text-slate-500 hover:text-slate-300 bg-slate-800/50"
          }`}
        >
          {isHe ? "הכל" : "All"} ({allApps.filter((a) => a.status !== "hidden").length})
        </button>
        {STATUS_FILTER_ORDER.map((status) => {
          const count = statusCounts[status] || 0;
          if (count === 0) return null;
          const colors = STATUS_COLORS[status];
          const label = status === "built" ? (isHe ? "בנוי" : "Built")
            : status === "in-progress" ? (isHe ? "בפיתוח" : "In Progress")
            : status === "planned" ? (isHe ? "מתוכנן" : "Planned")
            : (isHe ? "רעיון" : "Idea");
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(statusFilter === status ? null : status)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === status
                  ? `${colors.bg} ${colors.text}`
                  : "text-slate-500 hover:text-slate-300 bg-slate-800/50"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500" />
        </div>
      )}

      {/* Sections */}
      {!isLoading && (
        <div className="space-y-6">
          {sections.map((section) => (
            <SectionBlock
              key={section.id}
              section={section}
              language={language}
              statusFilter={statusFilter}
              searchQuery={searchQuery}
              onToggleDisplayMode={handleToggleDisplayMode}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="text-3xl">📱</span>
          <p className="text-sm text-slate-500">{isHe ? "אין אפליקציות ברישום" : "No apps in registry"}</p>
        </div>
      )}
    </div>
  );
}
