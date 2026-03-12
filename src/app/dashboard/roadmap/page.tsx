"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  ExternalLink,
  FolderOpen,
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

// ─── Status Badge ────────────────────────────────────

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("done") || s.includes("complete") || s.includes("הושלם"))
    return "bg-emerald-500/20 text-emerald-400";
  if (
    s.includes("progress") ||
    s.includes("active") ||
    s.includes("בתהליך") ||
    s.includes("בביצוע")
  )
    return "bg-blue-500/20 text-blue-400";
  if (s.includes("block") || s.includes("חסום"))
    return "bg-red-500/20 text-red-400";
  if (s.includes("review") || s.includes("qa"))
    return "bg-amber-500/20 text-amber-400";
  return "bg-slate-500/20 text-slate-400";
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

  const currentLayer: LayerKey =
    paramLayer && LAYER_CONFIG[paramLayer] ? paramLayer : "goals";

  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbSegment[]>([]);
  const [state, setState] = useState<LayerState>({
    items: [],
    loading: true,
    error: null,
  });

  // ── Fetch layer data ──────────────────────────────

  const fetchLayer = useCallback(
    async (layer: LayerKey, parentId?: string) => {
      setState({ items: [], loading: true, error: null });

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setState({ items: [], loading: false, error: "Not authenticated" });
          return;
        }
        const params = new URLSearchParams({ layer });
        if (parentId) params.set("parentId", parentId);

        const res = await fetch(`/api/roadmap/layers?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error || `HTTP ${res.status}`,
          );
        }

        const data = await res.json();
        setState({
          items: data.items ?? [],
          loading: false,
          error: null,
        });
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

  // ── Initialize from URL params ────────────────────

  useEffect(() => {
    // Rebuild breadcrumb from URL
    if (paramLayer && paramLayer !== "goals") {
      const idx = LAYER_ORDER.indexOf(paramLayer);
      // We only have the current level info from URL; show minimal breadcrumb
      const crumbs: BreadcrumbSegment[] = [
        { layer: "goals", label: getLayerLabel("goals") },
      ];
      // Add intermediate layers as placeholders
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

  function getLayerLabel(layer: LayerKey): string {
    const lang = language === "he" ? "he" : language === "ru" ? "ru" : "en";
    return LAYER_CONFIG[layer].label[lang];
  }

  // ── Navigation ────────────────────────────────────

  function drillDown(record: RoadmapRecord) {
    const config = LAYER_CONFIG[record.layer];
    if (!config.childLayer) return; // leaf node

    const nextLayer = config.childLayer;

    // Push current level to breadcrumb
    setBreadcrumb((prev) => [
      ...prev,
      {
        layer: record.layer,
        parentId: searchParams.get("parent") ?? undefined,
        label: record.title,
      },
    ]);

    // Update URL
    const params = new URLSearchParams({
      layer: nextLayer,
      parent: record.id,
    });
    router.push(`/dashboard/roadmap?${params}`);

    fetchLayer(nextLayer, record.id);
  }

  function navigateToBreadcrumb(index: number) {
    if (index < 0) {
      // Go to root
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

  // ── Render ────────────────────────────────────────

  const layerConfig = LAYER_CONFIG[currentLayer];
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader pageKey="roadmap" />

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
                <div
                  key={record.id}
                  className={`group relative rounded-lg border border-slate-700/50 bg-slate-800/30 transition-colors ${
                    hasChildren
                      ? "cursor-pointer hover:border-slate-600 hover:bg-slate-800/60"
                      : ""
                  }`}
                  style={{
                    borderInlineStartWidth: "3px",
                    borderInlineStartColor: layerConfig.color,
                  }}
                  onClick={hasChildren ? () => drillDown(record) : undefined}
                >
                  <div className="p-4">
                    {/* Title row */}
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

                    {/* Status badge */}
                    {record.status && (
                      <div className="mt-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(record.status)}`}
                        >
                          {record.status}
                        </span>
                      </div>
                    )}

                    {/* Drill-down hint */}
                    {hasChildren && (
                      <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-600 group-hover:text-slate-400 transition-colors">
                        <ChevronIcon className="h-3 w-3" />
                        <span>
                          {rp.drillDown || "View"}{" "}
                          {getLayerLabel(layerConfig.childLayer!)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
