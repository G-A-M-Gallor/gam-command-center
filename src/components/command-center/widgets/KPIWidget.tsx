"use client";

import { useState, useEffect } from "react";
import {
  FolderOpen,
  FileText,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";
import type { WidgetSize } from "./WidgetRegistry";

interface KPIData {
  openProjects: number;
  totalDocuments: number;
  recentActivity: number;
  avgHealth: number;
}

export function KPIPanel() {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchKPIs = async () => {
    setLoading(true);
    try {
      const [projectsRes, docsRes, activityRes] = await Promise.all([
        supabase.from("projects").select("health_score, status"),
        supabase.from("vb_records").select("id", { count: "exact", head: true }),
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .gte(
            "updated_at",
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          ),
      ]);

      const projects = projectsRes.data || [];
      const activeProjects = projects.filter((p) => p.status === "active");
      const avgHealth =
        activeProjects.length > 0
          ? Math.round(
              activeProjects.reduce((sum, p) => sum + (p.health_score || 0), 0) /
                activeProjects.length
            )
          : 0;

      setData({
        openProjects: activeProjects.length,
        totalDocuments: docsRes.count || 0,
        recentActivity: activityRes.count || 0,
        avgHealth,
      });
    } catch {
      setData({ openProjects: 0, totalDocuments: 0, recentActivity: 0, avgHealth: 0 });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  const healthColor =
    !data
      ? "text-slate-400"
      : data.avgHealth >= 70
        ? "text-emerald-400"
        : data.avgHealth >= 40
          ? "text-amber-400"
          : "text-red-400";

  const HealthIcon =
    !data
      ? Minus
      : data.avgHealth >= 70
        ? TrendingUp
        : data.avgHealth >= 40
          ? Minus
          : TrendingDown;

  const cards = [
    {
      label: t.widgets.kpiOpenProjects,
      value: data?.openProjects ?? "-",
      icon: FolderOpen,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: t.widgets.kpiDocuments,
      value: data?.totalDocuments ?? "-",
      icon: FileText,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: t.widgets.kpiActivity7d,
      value: data?.recentActivity ?? "-",
      icon: Activity,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      label: t.widgets.kpiAvgHealth,
      value: data ? `${data.avgHealth}%` : "-",
      icon: HealthIcon,
      color: healthColor,
      bg:
        !data
          ? "bg-slate-500/10"
          : data.avgHealth >= 70
            ? "bg-emerald-500/10"
            : data.avgHealth >= 40
              ? "bg-amber-500/10"
              : "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {_t.widgets.kpiQuickMetrics}
        </span>
        <button
          type="button"
          onClick={fetchKPIs}
          disabled={loading}
          className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300 disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3 space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center ${card.bg}`}
              >
                <card.icon size={14} className={card.color} />
              </div>
            </div>
            <div className="text-lg font-bold text-slate-100">
              {loading ? (
                <span className="inline-block h-5 w-8 animate-pulse rounded bg-slate-700" />
              ) : (
                card.value
              )}
            </div>
            <div className="text-[11px] text-slate-500 leading-tight">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KPIBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  const _t = getTranslations(language);
  if (size < 2) return null;

  return (
    <span className="truncate text-xs text-slate-400">
      {_t.widgets.kpiBar}
    </span>
  );
}
