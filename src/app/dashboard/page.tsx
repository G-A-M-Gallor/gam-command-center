"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  FileText,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  ChevronRight,
  Plus,
  ArrowRight,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";
import { PageHeader } from "@/components/command-center/PageHeader";
import { getHealthStatus } from "@/components/command-center/HealthBadge";

interface DashboardData {
  projectCount: number;
  activeProjects: number;
  avgHealth: number;
  documentCount: number;
  recentProjects: Array<{ id: string; name: string; health_score: number; status: string; updated_at: string }>;
  todayEvents: Array<{ time: string; title: { he: string; en: string }; type: string }>;
}

export default function DashboardPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const d = t.dashboardHome;
  const router = useRouter();
  const isRtl = language === "he";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [projectsRes, docsRes, eventsRes] = await Promise.all([
        supabase.from("projects").select("id, name, health_score, status, updated_at").order("updated_at", { ascending: false }).limit(10),
        supabase.from("vb_records").select("id", { count: "exact", head: true }),
        fetch("/api/events/today").then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }).catch(() => ({ events: [] })),
      ]);

      const projects = projectsRes.data || [];
      const active = projects.filter((p) => p.status === "active");
      const avgHealth = active.length > 0
        ? Math.round(active.reduce((s, p) => s + (p.health_score || 0), 0) / active.length)
        : 0;

      setData({
        projectCount: projects.length,
        activeProjects: active.length,
        avgHealth,
        documentCount: docsRes.count || 0,
        recentProjects: projects.slice(0, 5),
        todayEvents: eventsRes.events || [],
      });
    } catch {
      setError(true);
      setData(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const HealthIcon = !data ? Minus : data.avgHealth >= 70 ? TrendingUp : data.avgHealth >= 40 ? Minus : TrendingDown;
  const healthColor = !data ? "text-slate-400" : data.avgHealth >= 70 ? "text-emerald-400" : data.avgHealth >= 40 ? "text-amber-400" : "text-red-400";

  const statCards = [
    {
      label: d.activeProjects,
      value: data?.activeProjects ?? "-",
      icon: FolderOpen,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      href: "/dashboard/layers",
    },
    {
      label: d.documents,
      value: data?.documentCount ?? "-",
      icon: FileText,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      href: "/dashboard/editor",
    },
    {
      label: d.avgHealth,
      value: data ? `${data.avgHealth}%` : "-",
      icon: HealthIcon,
      color: healthColor,
      bg: !data ? "bg-slate-500/10" : data.avgHealth >= 70 ? "bg-emerald-500/10" : data.avgHealth >= 40 ? "bg-amber-500/10" : "bg-red-500/10",
      border: !data ? "border-slate-500/20" : data.avgHealth >= 70 ? "border-emerald-500/20" : data.avgHealth >= 40 ? "border-amber-500/20" : "border-red-500/20",
      href: "/dashboard/layers",
    },
    {
      label: d.todayEvents,
      value: data?.todayEvents.length ?? "-",
      icon: Calendar,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      href: null,
    },
  ];

  const quickActions = [
    { label: d.newProject, icon: Plus, href: "/dashboard/layers" },
    { label: d.newDocument, icon: FileText, href: "/dashboard/editor" },
    { label: d.storyMap, icon: Activity, href: "/dashboard/story-map" },
  ];

  return (
    <div className="flex min-h-full flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader pageKey="dashboard" />

      <div className="flex flex-1 flex-col gap-6 pt-6">
        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-6">
            <AlertCircle size={18} className="text-red-400" />
            <span className="text-sm text-red-400">{d.loadError}</span>
            <button
              type="button"
              onClick={load}
              className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-600"
            >
              <RefreshCw size={12} />
              {d.retry}
            </button>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={() => card.href && router.push(card.href)}
              className={`group rounded-xl border ${card.border} bg-slate-800/50 p-4 text-start transition-all hover:bg-slate-800 ${card.href ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.bg}`}>
                  <card.icon size={20} className={card.color} />
                </div>
                {card.href && (
                  <ChevronRight size={14} className={`text-slate-600 group-hover:text-slate-400 transition-colors ${isRtl ? "rotate-180" : ""}`} />
                )}
              </div>
              <div className="text-2xl font-bold text-slate-100 mb-1">
                {loading ? (
                  <span className="inline-block h-7 w-12 animate-pulse rounded bg-slate-700" />
                ) : (
                  card.value
                )}
              </div>
              <div className="text-xs text-slate-500">{card.label}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Projects */}
          <div className="lg:col-span-2 rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200">
                {d.recentProjects}
              </h3>
              <button
                type="button"
                onClick={() => router.push("/dashboard/layers")}
                className="flex items-center gap-1 text-xs text-[var(--cc-accent-400)] hover:text-[var(--cc-accent-300)] transition-colors"
              >
                {d.viewAll}
                <ArrowRight size={12} className={isRtl ? "rotate-180" : ""} />
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-700/50" />
                ))}
              </div>
            ) : (data?.recentProjects.length || 0) === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                {d.noProjects}
              </p>
            ) : (
              <div className="space-y-1">
                {data!.recentProjects.map((p) => {
                  const healthStatus = getHealthStatus(p.health_score);
                  const dotColor = healthStatus === "green" ? "bg-emerald-500" : healthStatus === "yellow" ? "bg-amber-500" : "bg-red-500";
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => router.push(`/dashboard/layers/${p.id}`)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors hover:bg-slate-700/30"
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                      <span className="flex-1 min-w-0 truncate text-sm text-slate-300">{p.name}</span>
                      <span className="shrink-0 text-xs text-slate-500">{p.health_score}%</span>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${
                        p.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700 text-slate-400"
                      }`}>
                        {p.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Today's Events */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">
                {d.todayEvents}
              </h3>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-8 animate-pulse rounded bg-slate-700/50" />
                  ))}
                </div>
              ) : (data?.todayEvents.length || 0) === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">
                  {d.noEvents}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {data!.todayEvents.slice(0, 5).map((ev, i) => (
                    <div key={i} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-700/30 transition-colors">
                      <Clock size={12} className="shrink-0 text-cyan-400" />
                      <span className="shrink-0 text-[11px] font-medium text-[var(--cc-accent-400)]">
                        {ev.time}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-sm text-slate-300">
                        {ev.title[language === "he" ? "he" : "en"]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">
                {d.quickActions}
              </h3>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => router.push(action.href)}
                    className="flex w-full items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-700/50"
                  >
                    <action.icon size={14} className="text-[var(--cc-accent-400)]" />
                    {action.label}
                    <ChevronRight size={12} className={`ms-auto text-slate-600 ${isRtl ? "rotate-180" : ""}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
