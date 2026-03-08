"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw, Search, ArrowUpDown } from "lucide-react";
import {
  ProjectCard,
  type Project,
} from "@/components/command-center/ProjectCard";
import { getHealthStatus } from "@/components/command-center/HealthBadge";
import { PageHeader } from "@/components/command-center/PageHeader";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";
import { Badge, SkeletonCard } from "@/components/ui";

type StatusFilter = "all" | "active" | "completed" | "on-hold";
type LayerFilter = "all" | "product" | "infrastructure" | "client";
type SortKey = "name" | "health" | "updated";

const FALLBACK_PROJECTS: Project[] = [
  { id: "1", name: "vBrain.io Platform", status: "active", health_score: 85, layer: "product", source: "claude" },
  { id: "2", name: "GAM Command Center", status: "active", health_score: 72, layer: "infrastructure", source: "claude" },
  { id: "3", name: "Client Portal", status: "active", health_score: 45, layer: "client", source: "manual" },
  { id: "4", name: "Origami Sync Pipeline", status: "active", health_score: 92, layer: "infrastructure", source: "trigger" },
  { id: "5", name: "WATI Integration", status: "active", health_score: 28, layer: "product", source: "manual" },
];

export default function LayersPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [layerFilter, setLayerFilter] = useState<LayerFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("health");

  const loadProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status, health_score, layer, source, updated_at')
        .order('updated_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setProjects(FALLBACK_PROJECTS);
        setIsDemo(true);
      } else {
        setProjects(data);
        setIsDemo(false);
      }
    } catch {
      setProjects(FALLBACK_PROJECTS);
      setIsDemo(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/origami/sync", { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        setSyncMessage({
          type: "success",
          text: language === "he"
            ? `סונכרנו ${result.synced} לקוחות מ-Origami`
            : `Synced ${result.synced} clients from Origami`,
        });
        await loadProjects();
      } else {
        setSyncMessage({
          type: "error",
          text: result.error || "Sync failed",
        });
      }
    } catch {
      setSyncMessage({ type: "error", text: "Network error" });
    }
    setSyncing(false);
    setTimeout(() => setSyncMessage(null), 5000);
  }, [language, loadProjects]);

  const filteredProjects = useMemo(() => {
    let result = projects;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    // Status filter
    if (statusFilter !== "all") {
      const statusMap: Record<StatusFilter, string> = {
        all: "",
        active: "active",
        completed: "completed",
        "on-hold": "on-hold",
      };
      result = result.filter((p) => p.status === statusMap[statusFilter]);
    }

    // Layer filter
    if (layerFilter !== "all") {
      result = result.filter((p) => p.layer === layerFilter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "health") return (b.health_score || 0) - (a.health_score || 0);
      return 0; // "updated" — already sorted by server
    });

    return result;
  }, [projects, searchQuery, statusFilter, layerFilter, sortKey]);

  const { healthy, atRisk, critical } = filteredProjects.reduce(
    (acc, p) => {
      const status = getHealthStatus(p.health_score);
      if (status === "green") acc.healthy++;
      else if (status === "yellow") acc.atRisk++;
      else acc.critical++;
      return acc;
    },
    { healthy: 0, atRisk: 0, critical: 0 }
  );

  const isRtl = language === "he";

  if (loading) {
    return (
      <div className="flex min-h-full flex-col">
        <PageHeader pageKey="layers" />
        <div className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader pageKey="layers" />

      <div className="flex flex-1 flex-col gap-6 pt-6">
        {isDemo && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300" data-cc-id="layers.demoBanner">
            <span>⚠️</span>
            <span>{language === 'he' ? 'נתוני הדגמה — אין חיבור ל-Origami. הנתונים אינם אמיתיים.' : 'Demo data — no Origami connection. Data is not real.'}</span>
          </div>
        )}
        {/* Search + Filters toolbar */}
        <div className="flex flex-wrap items-center gap-3" data-cc-id="layers.toolbar">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-500 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.layers.searchPlaceholder}
              dir="ltr"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 pl-9 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-[var(--cc-accent-500)]"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex rounded-lg border border-slate-700 bg-slate-800/50 p-0.5 text-xs">
            {(["all", "active", "completed", "on-hold"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  statusFilter === s
                    ? "bg-slate-700 text-slate-100"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.layers[`filter${s.charAt(0).toUpperCase() + s.slice(1).replace("-h", "H")}` as keyof typeof t.layers] as string}
              </button>
            ))}
          </div>

          {/* Layer filter pills */}
          <div className="flex rounded-lg border border-slate-700 bg-slate-800/50 p-0.5 text-xs">
            {(["all", "product", "infrastructure", "client"] as LayerFilter[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLayerFilter(l === layerFilter ? "all" : l)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  layerFilter === l
                    ? "bg-slate-700 text-slate-100"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {l === "all" ? t.layers.filterAll : t.layers[l as keyof typeof t.layers] as string}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown size={12} className="text-slate-500" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-md border border-slate-700 bg-slate-800/50 px-2 py-1 text-xs text-slate-300 outline-none cursor-pointer"
            >
              <option value="health">{t.layers.sortHealth}</option>
              <option value="name">{t.layers.sortName}</option>
              <option value="updated">{t.layers.sortUpdated}</option>
            </select>
          </div>

          {/* Sync button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            data-cc-id="layers.syncButton"
            className="flex items-center gap-1.5 rounded-md bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
            {language === 'he' ? 'סנכרון' : 'Sync'}
          </button>
        </div>

        {syncMessage && (
          <div className={`rounded-lg px-4 py-2 text-sm ${
            syncMessage.type === "success"
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border border-red-500/30 bg-red-500/10 text-red-300"
          }`}>
            {syncMessage.text}
          </div>
        )}

        {/* Summary */}
        <div
          className={`flex flex-wrap items-center gap-4 text-sm ${
            isRtl ? "flex-row-reverse" : ""
          }`}
          data-cc-id="layers.summary"
        >
          <span className="font-medium text-slate-300">
            {t.layers.summaryTotal}: {filteredProjects.length} {t.layers.summaryProjects}
            {filteredProjects.length !== projects.length && (
              <span className="text-slate-500"> / {projects.length}</span>
            )}
          </span>
          <Badge intent="success" dot>{t.health.healthy}: {healthy}</Badge>
          <Badge intent="warning" dot>{t.health.atRisk}: {atRisk}</Badge>
          <Badge intent="danger" dot>{t.health.critical}: {critical}</Badge>
        </div>

        {/* Project grid */}
        {filteredProjects.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            {t.layers.noResults}
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <div key={project.id} className="min-w-0">
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
