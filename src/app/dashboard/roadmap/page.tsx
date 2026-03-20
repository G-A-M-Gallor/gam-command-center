"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  ExternalLink,
  FolderOpen,
  Layers,
  Briefcase,
  BarChart3,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/command-center/PageHeader";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import {
  LAYER_CONFIG,
  LAYER_ORDER,
  type LayerKey,
  type RoadmapRecord,
} from "@/lib/notion/roadmapLayers";

// ─── Types ───────────────────────────────────────────

type ViewMode = "hierarchy" | "portfolio" | "status" | "sprint";

interface BreadcrumbSegment {
  layer: LayerKey;
  parentId?: string;
  label: string;
}

interface LayerState {
  items: RoadmapRecord[];
  loading: boolean;
  error: string | null;
}

interface AllLayersState {
  data: Record<LayerKey, RoadmapRecord[]>;
  loading: boolean;
  error: string | null;
  loaded: boolean;
}

// ─── Supabase row → RoadmapRecord ───────────────────

function rowToRecord(row: Record<string, unknown>, layer: LayerKey): RoadmapRecord {
  const properties: Record<string, string> = {};
  for (const [key, val] of Object.entries(row)) {
    if (val != null && key !== "id") {
      properties[key] = String(val);
    }
  }

  return {
    id: String(row.notion_url ?? row.id),
    url: (row.notion_url as string) ?? "",
    title: (row.name as string) ?? "Untitled",
    status: (row.status as string) ?? "",
    layer,
    properties,
  };
}

// ─── Status Badge ────────────────────────────────────

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("done") || s.includes("complete") || s.includes("הושלם"))
    return "bg-emerald-500/20 text-emerald-400";
  if (
    s.includes("progress") ||
    s.includes("active") ||
    s.includes("פעיל") ||
    s.includes("בתהליך") ||
    s.includes("בביצוע")
  )
    return "bg-blue-500/20 text-blue-400";
  if (s.includes("block") || s.includes("חסום"))
    return "bg-red-500/20 text-red-400";
  if (s.includes("review") || s.includes("qa"))
    return "bg-amber-500/20 text-amber-400";
  if (s.includes("מושהה") || s.includes("hold") || s.includes("מתוכנן") || s.includes("planned"))
    return "bg-yellow-500/20 text-yellow-400";
  return "bg-slate-500/20 text-slate-400";
}

// ─── Status sort priority (active first) ─────────────

function statusPriority(status: string): number {
  const s = status.toLowerCase();
  if (s.includes("progress") || s.includes("active") || s.includes("פעיל") || s.includes("בתהליך") || s.includes("בביצוע")) return 0;
  if (s.includes("review") || s.includes("qa")) return 1;
  if (s.includes("block") || s.includes("חסום")) return 2;
  if (!s || s.includes("backlog") || s.includes("not started") || s.includes("טרם")) return 3;
  if (s.includes("done") || s.includes("complete") || s.includes("הושלם")) return 5;
  return 4;
}

// ─── Component ───────────────────────────────────────

export default function RoadmapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useSettings();
  const t = getTranslations(language);
  const supabase = createClient();
  const isRtl = language === "he";
  const rp = t.roadmapPage as Record<string, string>;

  const paramLayer = searchParams.get("layer") as LayerKey | null;
  const paramParent = searchParams.get("parent") ?? undefined;
  const paramView = searchParams.get("view") as ViewMode | null;

  const [viewMode, setViewMode] = useState<ViewMode>(paramView || "hierarchy");

  const currentLayer: LayerKey =
    paramLayer && LAYER_CONFIG[paramLayer] ? paramLayer : "goals";

  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbSegment[]>([]);
  const [state, setState] = useState<LayerState>({
    items: [],
    loading: true,
    error: null,
  });

  const [allLayers, setAllLayers] = useState<AllLayersState>({
    data: { goals: [], portfolios: [], projects: [], sprints: [], tasks: [], subtasks: [] },
    loading: false,
    error: null,
    loaded: false,
  });

  // ── Fetch single layer from Supabase ──────────────

  const fetchLayer = useCallback(
    async (layer: LayerKey, parentUrl?: string) => {
      setState({ items: [], loading: true, error: null });

      try {
        const config = LAYER_CONFIG[layer];
        let query = supabase.from(config.table).select("*");

        if (parentUrl && config.parentFkColumn) {
          query = query.eq(config.parentFkColumn, parentUrl);
        }

        const { data, error } = await query.order("name");

        if (error) throw new Error(error.message);

        const items = (data ?? []).map((row: Record<string, unknown>) => rowToRecord(row, layer));
        setState({ items, loading: false, error: null });
      } catch (err) {
        setState({
          items: [],
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load",
        });
      }
    },
    [supabase],
  );

  // ── Fetch all layers from Supabase (for grouped views) ─

  const fetchAllLayers = useCallback(async () => {
    if (allLayers.loaded) return;
    setAllLayers(prev => ({ ...prev, loading: true, error: null }));

    try {
      const results = await Promise.all(
        LAYER_ORDER.map(async (layer) => {
          const config = LAYER_CONFIG[layer];
          const { data, error } = await supabase
            .from(config.table)
            .select("*")
            .order("name");

          if (error) return { layer, items: [] as RoadmapRecord[] };
          return {
            layer,
            items: (data ?? []).map((row: Record<string, unknown>) => rowToRecord(row, layer)),
          };
        }),
      );

      const data = { goals: [], portfolios: [], projects: [], sprints: [], tasks: [], subtasks: [] } as Record<LayerKey, RoadmapRecord[]>;
      for (const r of results) data[r.layer] = r.items;

      setAllLayers({ data, loading: false, error: null, loaded: true });
    } catch (err) {
      setAllLayers(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load",
      }));
    }
  }, [supabase, allLayers.loaded]);

  // ── Initialize ──────────────────────────────────────

  useEffect(() => {
    if (paramLayer && paramLayer !== "goals") {
      const idx = LAYER_ORDER.indexOf(paramLayer);
      const crumbs: BreadcrumbSegment[] = [
        { layer: "goals", label: getLayerLabel("goals") },
      ];
      for (let i = 1; i < idx; i++) {
        crumbs.push({
          layer: LAYER_ORDER[i],
          label: getLayerLabel(LAYER_ORDER[i]),
        });
      }
      setBreadcrumb(crumbs);
    } else {
      setBreadcrumb([]);
    }
    fetchLayer(currentLayer, paramParent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewMode !== "hierarchy" && !allLayers.loaded && !allLayers.loading) {
      fetchAllLayers();
    }
  }, [viewMode, allLayers.loaded, allLayers.loading, fetchAllLayers]);

  function getLayerLabel(layer: LayerKey): string {
    const lang = language === "he" ? "he" : language === "ru" ? "ru" : "en";
    return LAYER_CONFIG[layer].label[lang];
  }

  // ── View switching ─────────────────────────────────

  function switchView(mode: ViewMode) {
    setViewMode(mode);
    if (mode === "hierarchy") {
      router.push("/dashboard/roadmap");
    } else {
      router.push(`/dashboard/roadmap?view=${mode}`);
    }
  }

  // ── Navigation (hierarchy view) ────────────────────

  function drillDown(record: RoadmapRecord) {
    const config = LAYER_CONFIG[record.layer];
    if (!config.childLayer) return;

    const nextLayer = config.childLayer;

    setBreadcrumb((prev) => [
      ...prev,
      {
        layer: record.layer,
        parentId: searchParams.get("parent") ?? undefined,
        label: record.title,
      },
    ]);

    const params = new URLSearchParams({
      layer: nextLayer,
      parent: record.url,
    });
    router.push(`/dashboard/roadmap?${params}`);

    fetchLayer(nextLayer, record.url);
  }

  function navigateToBreadcrumb(index: number) {
    if (index < 0) {
      setBreadcrumb([]);
      router.push("/dashboard/roadmap");
      fetchLayer("goals");
      return;
    }

    const segment = breadcrumb[index];
    setBreadcrumb((prev) => prev.slice(0, index));

    const params = new URLSearchParams({ layer: segment.layer });
    if (segment.parentId) params.set("parent", segment.parentId);

    router.push(`/dashboard/roadmap?${params}`);
    fetchLayer(segment.layer, segment.parentId);
  }

  // ── Grouped views data ─────────────────────────────

  const byPortfolio = useMemo(() => {
    if (!allLayers.loaded) return [];
    const portfolios = allLayers.data.portfolios;
    return portfolios.map(p => {
      const projects = allLayers.data.projects.filter(proj =>
        proj.properties["portfolio_url"] === p.url,
      );
      const projectUrls = new Set(projects.map(proj => proj.url));
      const sprints = allLayers.data.sprints.filter(s =>
        projectUrls.has(s.properties["project_url"]),
      );
      const sprintUrls = new Set(sprints.map(s => s.url));
      const tasks = allLayers.data.tasks.filter(t =>
        sprintUrls.has(t.properties["sprint_url"]),
      );
      const doneTasks = tasks.filter(t => {
        const s = t.status.toLowerCase();
        return s.includes("done") || s.includes("complete") || s.includes("הושלם");
      });
      return {
        portfolio: p,
        projects,
        sprints,
        tasks,
        doneTasks,
        progress: tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0,
      };
    });
  }, [allLayers]);

  const byStatus = useMemo(() => {
    if (!allLayers.loaded) return [];
    const allItems: RoadmapRecord[] = [];
    for (const layer of LAYER_ORDER) {
      allItems.push(...allLayers.data[layer]);
    }
    const groups: Record<string, RoadmapRecord[]> = {};
    for (const item of allItems) {
      const key = item.status || rp.noStatus || "No Status";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return Object.entries(groups).sort(([a], [b]) => statusPriority(a) - statusPriority(b));
  }, [allLayers, rp.noStatus]);

  interface SprintGroup {
    sprint: RoadmapRecord;
    tasks: RoadmapRecord[];
    doneTasks: RoadmapRecord[];
    progress: number;
  }
  interface BySprintData {
    sprints: SprintGroup[];
    unassignedTasks: RoadmapRecord[];
  }

  const bySprint = useMemo((): BySprintData => {
    if (!allLayers.loaded) return { sprints: [], unassignedTasks: [] };
    const sprints = allLayers.data.sprints;
    const sprintUrls = new Set(sprints.map(s => s.url));
    const unassignedTasks = allLayers.data.tasks.filter(t =>
      !t.properties["sprint_url"] || !sprintUrls.has(t.properties["sprint_url"]),
    );
    const sprintData = sprints.map(s => {
      const tasks = allLayers.data.tasks.filter(task =>
        task.properties["sprint_url"] === s.url,
      );
      const doneTasks = tasks.filter(t => {
        const st = t.status.toLowerCase();
        return st.includes("done") || st.includes("complete") || st.includes("הושלם");
      });
      return {
        sprint: s,
        tasks,
        doneTasks,
        progress: tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0,
      };
    });
    return { sprints: sprintData, unassignedTasks };
  }, [allLayers]);

  // ── Render ────────────────────────────────────────

  const layerConfig = LAYER_CONFIG[currentLayer];
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  const viewTabs: { mode: ViewMode; label: string; icon: typeof Layers }[] = [
    { mode: "hierarchy", label: rp.viewHierarchy || "Hierarchy", icon: Layers },
    { mode: "portfolio", label: rp.viewPortfolio || "By Portfolio", icon: Briefcase },
    { mode: "status", label: rp.viewStatus || "By Status", icon: BarChart3 },
    { mode: "sprint", label: rp.viewSprint || "By Sprint", icon: Zap },
  ];

  const isGroupedLoading = viewMode !== "hierarchy" && (allLayers.loading || !allLayers.loaded);

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader pageKey="roadmap" />

      {/* View Switcher */}
      <div
        className="flex items-center gap-1 px-6 pt-3 pb-2 border-b border-white/[0.04]"
        data-cc-id="roadmap.viewSwitcher"
      >
        {viewTabs.map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            type="button"
            onClick={() => switchView(mode)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === mode
                ? "bg-purple-600/20 text-purple-300"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ─── HIERARCHY VIEW ──────────────────────── */}
      {viewMode === "hierarchy" && (
        <>
          {/* Breadcrumb */}
          <div
            className="flex items-center gap-1.5 px-6 py-3 text-sm flex-wrap"
            data-cc-id="roadmap.breadcrumb"
          >
            <button
              type="button"
              onClick={() => navigateToBreadcrumb(-1)}
              className={`rounded px-2 py-0.5 transition-colors ${
                breadcrumb.length === 0
                  ? "text-slate-200 font-medium"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {getLayerLabel("goals")}
            </button>

            {breadcrumb.map((seg, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronIcon className="h-3.5 w-3.5 text-slate-600" />
                <button
                  type="button"
                  onClick={() => navigateToBreadcrumb(i)}
                  className="rounded px-2 py-0.5 text-slate-400 transition-colors hover:text-slate-200 hover:bg-slate-800"
                >
                  {seg.label}
                </button>
              </span>
            ))}

            {breadcrumb.length > 0 && (
              <span className="flex items-center gap-1.5">
                <ChevronIcon className="h-3.5 w-3.5 text-slate-600" />
                <span className="px-2 py-0.5 text-slate-200 font-medium">
                  {getLayerLabel(currentLayer)}
                </span>
              </span>
            )}
          </div>

          {/* Layer indicator */}
          <div className="px-6 pb-4 flex items-center gap-3">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: layerConfig.color }}
            />
            <span className="text-xs text-slate-500">
              {getLayerLabel(currentLayer)} &middot;{" "}
              {state.loading ? "..." : `${state.items.length} ${rp.taskCount || "items"}`}
            </span>
          </div>

          {/* Content */}
          <div className="px-6 pb-8">
            {state.loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              </div>
            )}

            {state.error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center">
                <p className="text-sm text-red-400">{state.error}</p>
                <button
                  type="button"
                  onClick={() => fetchLayer(currentLayer, paramParent)}
                  className="mt-3 rounded-md bg-red-500/10 px-4 py-1.5 text-xs text-red-300 transition-colors hover:bg-red-500/20"
                >
                  {(t.common as Record<string, string>).retry || "Retry"}
                </button>
              </div>
            )}

            {!state.loading && !state.error && state.items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <FolderOpen className="h-12 w-12 mb-3 text-slate-600" />
                <p className="text-sm">{rp.noItems || "No items found"}</p>
              </div>
            )}

            {!state.loading && !state.error && state.items.length > 0 && (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {state.items.map((record) => {
                  const hasChildren = layerConfig.childLayer !== null;
                  return (
                    <RecordCard
                      key={record.id}
                      record={record}
                      layerConfig={layerConfig}
                      hasChildren={hasChildren}
                      onDrillDown={hasChildren ? () => drillDown(record) : undefined}
                      rp={rp}
                      getLayerLabel={getLayerLabel}
                      ChevronIcon={ChevronIcon}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── GROUPED VIEWS ───────────────────────── */}
      {viewMode !== "hierarchy" && (
        <div className="px-6 py-4 pb-8">
          {isGroupedLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          )}

          {allLayers.error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center">
              <p className="text-sm text-red-400">{allLayers.error}</p>
              <button
                type="button"
                onClick={() => { setAllLayers(prev => ({ ...prev, loaded: false })); fetchAllLayers(); }}
                className="mt-3 rounded-md bg-red-500/10 px-4 py-1.5 text-xs text-red-300 transition-colors hover:bg-red-500/20"
              >
                {(t.common as Record<string, string>).retry || "Retry"}
              </button>
            </div>
          )}

          {!isGroupedLoading && !allLayers.error && viewMode === "portfolio" && (
            <div className="space-y-6" data-cc-id="roadmap.byPortfolio">
              {/* Stats bar */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{byPortfolio.length} {rp.portfolioCount || "portfolios"}</span>
                <span className="text-slate-700">|</span>
                <span>{byPortfolio.reduce((a, b) => a + b.projects.length, 0)} {rp.projectCount || "projects"}</span>
                <span className="text-slate-700">|</span>
                <span>{byPortfolio.reduce((a, b) => a + b.tasks.length, 0)} {rp.taskCount || "tasks"}</span>
              </div>
              {byPortfolio.length === 0 ? (
                <EmptyState rp={rp} />
              ) : (
                byPortfolio.map(({ portfolio, projects, tasks, doneTasks, progress }) => (
                  <GroupSection
                    key={portfolio.id}
                    title={portfolio.title}
                    status={portfolio.status}
                    color={LAYER_CONFIG.portfolios.color}
                    url={portfolio.url}
                    count={projects.length}
                    rp={rp}
                    meta={`${tasks.length} ${rp.taskCount || "tasks"} · ${doneTasks.length} ${rp.doneLabel || "done"}`}
                    progress={progress}
                  >
                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {projects.map((proj) => (
                        <MiniCard key={proj.id} record={proj} color={LAYER_CONFIG.projects.color} />
                      ))}
                    </div>
                  </GroupSection>
                ))
              )}
            </div>
          )}

          {!isGroupedLoading && !allLayers.error && viewMode === "status" && (
            <div className="space-y-6" data-cc-id="roadmap.byStatus">
              {/* Stats bar */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                {byStatus.map(([status, items]) => (
                  <span key={status} className="flex items-center gap-1">
                    <span className={`inline-block h-2 w-2 rounded-full ${statusColor(status).split(" ")[0]}`} />
                    {items.length}
                  </span>
                ))}
              </div>
              {byStatus.length === 0 ? (
                <EmptyState rp={rp} />
              ) : (
                byStatus.map(([status, items]) => (
                  <GroupSection
                    key={status}
                    title={status}
                    status={status}
                    color=""
                    count={items.length}
                    rp={rp}
                  >
                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {items.map((item) => (
                        <MiniCard key={item.id} record={item} color={LAYER_CONFIG[item.layer].color} layerLabel={getLayerLabel(item.layer)} />
                      ))}
                    </div>
                  </GroupSection>
                ))
              )}
            </div>
          )}

          {!isGroupedLoading && !allLayers.error && viewMode === "sprint" && (
            <div className="space-y-6" data-cc-id="roadmap.bySprint">
              {/* Stats bar */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{bySprint.sprints.length} {rp.sprintCount || "sprints"}</span>
                <span className="text-slate-700">|</span>
                <span>{bySprint.sprints.reduce((a, b) => a + b.tasks.length, 0)} {rp.assignedTasks || "assigned"}</span>
                {bySprint.unassignedTasks.length > 0 && (
                  <>
                    <span className="text-slate-700">|</span>
                    <span className="text-amber-500">{bySprint.unassignedTasks.length} {rp.unassignedTasks || "unassigned"}</span>
                  </>
                )}
              </div>
              {bySprint.sprints.length === 0 && bySprint.unassignedTasks.length === 0 ? (
                <EmptyState rp={rp} />
              ) : (
                <>
                  {bySprint.sprints.map(({ sprint, tasks, doneTasks, progress }) => (
                    <GroupSection
                      key={sprint.id}
                      title={sprint.title}
                      status={sprint.status}
                      color={LAYER_CONFIG.sprints.color}
                      url={sprint.url}
                      count={tasks.length}
                      rp={rp}
                      meta={`${doneTasks.length}/${tasks.length} ${rp.doneLabel || "done"}`}
                      progress={progress}
                    >
                      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {tasks.sort((a, b) => statusPriority(a.status) - statusPriority(b.status)).map((task) => (
                          <MiniCard key={task.id} record={task} color={LAYER_CONFIG.tasks.color} />
                        ))}
                      </div>
                    </GroupSection>
                  ))}
                  {bySprint.unassignedTasks.length > 0 && (
                    <GroupSection
                      title={rp.unassignedTasksTitle || "Unassigned Tasks"}
                      status=""
                      color="#ef4444"
                      count={bySprint.unassignedTasks.length}
                      rp={rp}
                    >
                      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {bySprint.unassignedTasks.map((task) => (
                          <MiniCard key={task.id} record={task} color={LAYER_CONFIG.tasks.color} />
                        ))}
                      </div>
                    </GroupSection>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────

function RecordCard({
  record,
  layerConfig,
  hasChildren,
  onDrillDown,
  rp,
  getLayerLabel,
  ChevronIcon,
}: {
  record: RoadmapRecord;
  layerConfig: { color: string; childLayer: LayerKey | null };
  hasChildren: boolean;
  onDrillDown?: () => void;
  rp: Record<string, string>;
  getLayerLabel: (layer: LayerKey) => string;
  ChevronIcon: typeof ChevronRight;
}) {
  return (
    <div
      className={`group relative rounded-lg border border-slate-700/50 bg-slate-800/30 transition-colors ${
        hasChildren
          ? "cursor-pointer hover:border-slate-600 hover:bg-slate-800/60"
          : ""
      }`}
      style={{
        borderInlineStartWidth: "3px",
        borderInlineStartColor: layerConfig.color,
      }}
      onClick={onDrillDown}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-slate-200 text-start flex-1">
            {record.title}
          </h3>
          {record.url && (
            <a
              href={record.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 rounded p-1 text-slate-600 opacity-0 transition-all hover:text-slate-300 group-hover:opacity-100"
              title={rp.openInNotion || "Open in Notion"}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {record.status && (
          <div className="mt-2">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(record.status)}`}
            >
              {record.status}
            </span>
          </div>
        )}

        {hasChildren && layerConfig.childLayer && (
          <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-600 group-hover:text-slate-400 transition-colors">
            <ChevronIcon className="h-3 w-3" />
            <span>
              {rp.drillDown || "View"}{" "}
              {getLayerLabel(layerConfig.childLayer)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function GroupSection({
  title,
  status,
  color,
  url,
  count,
  rp,
  meta,
  progress,
  children,
}: {
  title: string;
  status: string;
  color: string;
  url?: string;
  count: number;
  rp: Record<string, string>;
  meta?: string;
  progress?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
        {color && (
          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        )}
        {!color && (
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(status)}`}>
            {status}
          </span>
        )}
        <h3 className="text-sm font-medium text-slate-200 flex-1">
          {color ? title : ""}
        </h3>
        {meta && (
          <span className="text-[10px] text-slate-500">{meta}</span>
        )}
        <span className="text-[10px] text-slate-500">
          {count} {rp.taskCount || "items"}
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded p-1 text-slate-600 hover:text-slate-300 transition-colors"
            title={rp.openInNotion || "Open in Notion"}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      {progress != null && progress > 0 && (
        <div className="h-1 bg-slate-800">
          <div
            className="h-full bg-emerald-500/60 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <div className="p-3">
        {count === 0 ? (
          <p className="text-xs text-slate-600 py-2 text-center">{rp.noItems || "No items"}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function MiniCard({ record, color, layerLabel }: { record: RoadmapRecord; color: string; layerLabel?: string }) {
  return (
    <div
      className="rounded-md border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors"
      style={{ borderInlineStartWidth: "2px", borderInlineStartColor: color }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-slate-300 flex-1">{record.title}</span>
        {record.url && (
          <a
            href={record.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-slate-600 hover:text-slate-400"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
        {record.status && (
          <span className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium ${statusColor(record.status)}`}>
            {record.status}
          </span>
        )}
        {layerLabel && (
          <span
            className="inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white/50"
            style={{ backgroundColor: `${color}30` }}
          >
            {layerLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function EmptyState({ rp }: { rp: Record<string, string> }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
      <FolderOpen className="h-12 w-12 mb-3 text-slate-600" />
      <p className="text-sm">{rp.noItems || "No items found"}</p>
    </div>
  );
}
