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
  _Plus,
  ArrowRight,
  _Clock,
  AlertCircle,
  RefreshCw,
  FileSignature,
  Send,
  Eye,
  CheckCircle2,
  AlertTriangle as AlertTriangleIcon,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";
import { fetchEntityTypes } from "@/lib/supabase/entityQueries";
import { PageHeader } from "@/components/command-center/PageHeader";
import { getHealthStatus } from "@/components/command-center/HealthBadge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { EntityType } from "@/lib/entities/types";

interface EntityTypeWithCount extends EntityType {
  noteCount: number;
}

interface DocPipelineItem {
  id: string;
  name: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  signed_at: string | null;
  expires_at: string | null;
}

interface DashboardData {
  projectCount: number;
  activeProjects: number;
  avgHealth: number;
  documentCount: number;
  recentProjects: Array<{ id: string; name: string; health_score: number; status: string; updated_at: string }>;
  todayEvents: Array<{ time: string; title: { he: string; en: string }; type: string }>;
  entityTypes: EntityTypeWithCount[];
  recentEntities: Array<{ id: string; title: string; entity_type: string; status: string; last_edited_at: string }>;
  docPipeline: DocPipelineItem[];
  docStats: { draft: number; sent: number; viewed: number; signed: number; expiringSoon: number };
}

export default function DashboardPage() {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const d = t.dashboardHome;
  const dc = t.docControl;
  const _router = useRouter();
  const isRtl = language === "he";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [projectsRes, docsRes, eventsRes, entityTypesData, recentEntitiesRes, docPipelineRes] = await Promise.all([
        supabase.from("projects").select("id, name, health_score, status, updated_at").order("updated_at", { ascending: false }).limit(10),
        supabase.from("vb_records").select("id", { count: "exact", head: true }),
        fetch("/api/events/today").then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }).catch(() => ({ events: [] })),
        fetchEntityTypes(),
        supabase.from("vb_records").select("id, title, entity_type, status, last_edited_at")
          .eq("is_deleted", false)
          .not("entity_type", "is", null)
          .order("last_edited_at", { ascending: false })
          .limit(5),
        supabase.from("document_submissions")
          .select("id, name, status, created_at, sent_at, signed_at, expires_at")
          .not("status", "in", "(archived,cancelled)")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const projects = projectsRes.data || [];
      const active = projects.filter((p) => p.status === "active");
      const avgHealth = active.length > 0
        ? Math.round(active.reduce((s, p) => s + (p.health_score || 0), 0) / active.length)
        : 0;

      // Get entity type counts — single query instead of N+1
      const { data: countRows } = await supabase.from("vb_records")
        .select("entity_type")
        .eq("is_deleted", false)
        .not("entity_type", "is", null);
      const countMap: Record<string, number> = {};
      for (const row of countRows ?? []) {
        countMap[row.entity_type] = (countMap[row.entity_type] || 0) + 1;
      }
      const entityTypesWithCounts: EntityTypeWithCount[] = entityTypesData.map((et) => ({
        ...et,
        noteCount: countMap[et.slug] ?? 0,
      }));

      const docPipeline = (docPipelineRes.data ?? []) as DocPipelineItem[];
      const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
      const docStats = {
        draft: docPipeline.filter((d) => d.status === "draft").length,
        sent: docPipeline.filter((d) => ["sent", "viewed", "partially_signed"].includes(d.status)).length,
        viewed: docPipeline.filter((d) => d.status === "viewed").length,
        signed: docPipeline.filter((d) => d.status === "signed").length,
        expiringSoon: docPipeline.filter((d) => d.expires_at && new Date(d.expires_at).getTime() < sevenDaysFromNow && new Date(d.expires_at).getTime() > Date.now()).length,
      };

      setData({
        projectCount: projects.length,
        activeProjects: active.length,
        avgHealth,
        documentCount: docsRes.count || 0,
        recentProjects: projects.slice(0, 5),
        todayEvents: eventsRes.events || [],
        entityTypes: entityTypesWithCounts,
        recentEntities: (recentEntitiesRes.data ?? []) as DashboardData["recentEntities"],
        docPipeline,
        docStats,
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
    { label: d.newProject, icon: _Plus, href: "/dashboard/layers" },
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
            <Card
              key={card.label}
              onClick={card.href ? () => router.push(card.href!) : undefined}
              className="group cursor-pointer"
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
            </Card>
          ))}
        </div>

        {/* Entity Types Row */}
        {!loading && (data?.entityTypes.length ?? 0) > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-200">{d.entityTypes}</h3>
              <button
                type="button"
                onClick={() => router.push("/dashboard/entities")}
                className="flex items-center gap-1 text-xs text-[var(--cc-accent-400)] hover:text-[var(--cc-accent-300)] transition-colors"
              >
                {d.viewAll}
                <ArrowRight size={12} className={isRtl ? "rotate-180" : ""} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {data!.entityTypes.map((et) => (
                <Card
                  key={et.slug}
                  onClick={() => router.push(`/dashboard/entities/${et.slug}`)}
                  className="group flex items-center gap-3 p-3 cursor-pointer"
                >
                  <span className="text-lg">{et.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-slate-300 truncate">
                      {et.label[isRtl ? "he" : "en"]}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {et.noteCount} {d.items}
                    </div>
                  </div>
                  <ChevronRight size={12} className={`text-slate-700 group-hover:text-slate-500 transition-colors ${isRtl ? "rotate-180" : ""}`} />
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Document Pipeline */}
        {!loading && (data?.docPipeline.length ?? 0) > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CardHeader className="p-0">
              <CardTitle>
                <FileSignature size={14} className="inline me-1.5 text-purple-400" />
                {d.docPipeline}
              </CardTitle>
            </CardHeader>
              <button
                type="button"
                onClick={() => router.push("/dashboard/documents")}
                className="flex items-center gap-1 text-xs text-[var(--cc-accent-400)] hover:text-[var(--cc-accent-300)] transition-colors"
              >
                {d.viewAll}
                <ArrowRight size={12} className={isRtl ? "rotate-180" : ""} />
              </button>
            </div>

            {/* Pipeline mini stats */}
            <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-4">
              <Card className="p-3 flex items-center gap-2 border border-white/[0.04]">
                <FileText size={14} className="text-slate-400" />
                <div>
                  <div className="text-lg font-bold text-slate-200">{data!.docStats.draft}</div>
                  <div className="text-[10px] text-slate-500">{d.docDrafts}</div>
                </div>
              </Card>
              <Card className="p-3 flex items-center gap-2 border border-blue-800/30 bg-blue-900/10">
                <Send size={14} className="text-blue-400" />
                <div>
                  <div className="text-lg font-bold text-blue-300">{data!.docStats.sent}</div>
                  <div className="text-[10px] text-slate-500">{d.docPending}</div>
                </div>
              </Card>
              <Card className="p-3 flex items-center gap-2 border border-emerald-800/30 bg-emerald-900/10">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <div>
                  <div className="text-lg font-bold text-emerald-300">{data!.docStats.signed}</div>
                  <div className="text-[10px] text-slate-500">{d.docSigned}</div>
                </div>
              </Card>
              {data!.docStats.expiringSoon > 0 && (
                <Card className="p-3 flex items-center gap-2 border border-amber-800/30 bg-amber-900/10">
                  <AlertTriangleIcon size={14} className="text-amber-400" />
                  <div>
                    <div className="text-lg font-bold text-amber-300">{data!.docStats.expiringSoon}</div>
                    <div className="text-[10px] text-slate-500">{d.docExpiring}</div>
                  </div>
                </Card>
              )}
            </div>

            {/* Recent documents list */}
            <div className="space-y-1">
              {data!.docPipeline.slice(0, 5).map((doc) => {
                const statusConfig: Record<string, { color: string; icon: typeof FileText }> = {
                  draft: { color: "text-slate-400", icon: FileText },
                  sent: { color: "text-blue-400", icon: Send },
                  viewed: { color: "text-amber-400", icon: Eye },
                  partially_signed: { color: "text-orange-400", icon: FileSignature },
                  signed: { color: "text-emerald-400", icon: CheckCircle2 },
                };
                const cfg = statusConfig[doc.status] || statusConfig.draft;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start transition-colors hover:bg-slate-700/30"
                  >
                    <cfg.icon size={14} className={cfg.color} />
                    <span className="flex-1 min-w-0 truncate text-sm text-slate-300">{doc.name}</span>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      doc.status === "signed" ? "bg-emerald-500/10 text-emerald-400" :
                      doc.status === "draft" ? "bg-slate-700 text-slate-400" :
                      "bg-blue-500/10 text-blue-400"
                    }`}>
                      {dc[doc.status as keyof typeof dc] || doc.status}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-600">
                      {new Date(doc.sent_at || doc.created_at).toLocaleDateString(isRtl ? "he-IL" : "en-US", { day: "numeric", month: "short" })}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Projects */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <CardHeader className="p-0">
              <CardTitle>{d.recentProjects}</CardTitle>
            </CardHeader>
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
          </Card>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Today's Events */}
            <Card className="p-6">
              <CardTitle className="mb-4">{d.todayEvents}</CardTitle>
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
                      <_Clock size={12} className="shrink-0 text-cyan-400" />
                      <span className="shrink-0 text-xs font-medium text-[var(--cc-accent-400)]">
                        {ev.time}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-sm text-slate-300">
                        {ev.title[language === "he" ? "he" : "en"]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Entities */}
            {!loading && (data?.recentEntities.length ?? 0) > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <CardHeader className="p-0">
                  <CardTitle>{d.recentEntities}</CardTitle>
                </CardHeader>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/entities")}
                    className="flex items-center gap-1 text-xs text-[var(--cc-accent-400)] hover:text-[var(--cc-accent-300)] transition-colors"
                  >
                    {d.viewAll}
                    <ArrowRight size={12} className={isRtl ? "rotate-180" : ""} />
                  </button>
                </div>
                <div className="space-y-1">
                  {data!.recentEntities.map((e) => {
                    const etInfo = data!.entityTypes.find(et => et.slug === e.entity_type);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => router.push(`/dashboard/entities/${e.entity_type}/${e.id}`)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start transition-colors hover:bg-slate-700/30"
                      >
                        <span className="text-sm shrink-0">{etInfo?.icon ?? "📄"}</span>
                        <span className="flex-1 min-w-0 truncate text-xs text-slate-300">{e.title}</span>
                        <span className="shrink-0 text-[10px] text-slate-600">
                          {new Date(e.last_edited_at).toLocaleDateString(isRtl ? "he-IL" : "en-US", { day: "numeric", month: "short" })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="p-6">
              <CardTitle className="mb-3">{d.quickActions}</CardTitle>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <Card
                    key={action.label}
                    onClick={() => router.push(action.href)}
                    className="flex items-center gap-3 border border-white/[0.04] text-sm text-slate-300 p-3 cursor-pointer"
                  >
                    <action.icon size={14} className="text-[var(--cc-accent-400)]" />
                    {action.label}
                    <ChevronRight size={12} className={`ms-auto text-slate-600 ${isRtl ? "rotate-180" : ""}`} />
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
