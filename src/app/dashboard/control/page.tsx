"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Compass,
  Network,
  Shield,
  ClipboardList,
  ArrowRight,
  GitCommit,
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
  Database,
  Layout,
  Boxes,
  Braces,
  Pencil,
  GripVertical,
  Check,
  EyeOff,
  Eye,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { PageHeader } from "@/components/command-center/PageHeader";
import {
  routes,
  standalonePages,
  widgets,
  contexts,
  changelogEntries,
  getOverallChecklistScoreFromEntries,
} from "@/app/dashboard/admin/data";
import { getOverallScore } from "@/lib/audit/checks";

// ─── Block IDs & Persistence ─────────────────────────────

type BlockId = "stats" | "progress" | "roadmap" | "architecture" | "devlog" | "audit" | "updates";

const DEFAULT_ORDER: BlockId[] = ["stats", "progress", "roadmap", "architecture", "devlog", "audit", "updates"];
const STORAGE_KEY = "cc-control-block-order";
const HIDDEN_KEY = "cc-control-hidden-blocks";

function loadOrder(): BlockId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BlockId[];
      // Ensure all blocks present
      const set = new Set(parsed);
      for (const id of DEFAULT_ORDER) {
        if (!set.has(id)) parsed.push(id);
      }
      return parsed.filter((id) => DEFAULT_ORDER.includes(id));
    }
  } catch {
    // Ignore localStorage parse errors - fallback to default order
  }
  return [...DEFAULT_ORDER];
}

function saveOrder(order: BlockId[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // Ignore localStorage save errors - not critical for functionality
  }
}

function loadHidden(): Set<BlockId> {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    if (raw) return new Set(JSON.parse(raw) as BlockId[]);
  } catch {
    // Ignore localStorage parse errors - fallback to empty set
  }
  return new Set();
}

function saveHidden(hidden: Set<BlockId>) {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden]));
  } catch {
    // Ignore localStorage save errors - not critical for functionality
  }
}

// ─── Section Card ────────────────────────────────────────

function SectionLink({
  href,
  icon: Icon,
  title,
  description,
  color,
  isRtl,
  children,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  isRtl: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="gam-card rounded-xl border border-white/[0.06] bg-slate-800/30 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
            <Icon size={18} className="text-current" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
            <p className="text-[11px] text-slate-500">{description}</p>
          </div>
        </div>
        <Link
          href={href}
          className="flex items-center gap-1 text-xs text-[var(--cc-accent-400)] hover:text-[var(--cc-accent-300)] transition-colors"
        >
          <ArrowRight size={14} className={isRtl ? "rotate-180" : ""} />
        </Link>
      </div>
      {children}
    </div>
  );
}

// ─── Draggable Block Wrapper ─────────────────────────────

function DraggableBlock({
  id,
  editing,
  hidden,
  onToggleHidden,
  dragging,
  dragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  blockLabel,
  children,
}: {
  id: BlockId;
  editing: boolean;
  hidden: boolean;
  onToggleHidden: (id: BlockId) => void;
  dragging: BlockId | null;
  dragOver: BlockId | null;
  onDragStart: (id: BlockId) => void;
  onDragOver: (e: React.DragEvent, id: BlockId) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, id: BlockId) => void;
  blockLabel: string;
  children: React.ReactNode;
}) {
  if (!editing && hidden) return null;

  return (
    <div
      draggable={editing}
      onDragStart={() => onDragStart(id)}
      onDragOver={(e) => onDragOver(e, id)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, id)}
      className={`transition-all duration-200 ${
        editing ? "relative" : ""
      } ${
        dragging === id ? "opacity-40 scale-[0.98]" : ""
      } ${
        dragOver === id && dragging !== id ? "ring-2 ring-[var(--cc-accent-500)] ring-offset-2 ring-offset-slate-900 rounded-xl" : ""
      } ${
        editing && hidden ? "opacity-30" : ""
      }`}
    >
      {editing && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-800 px-2 py-0.5 shadow-lg">
          <GripVertical size={12} className="text-slate-400 cursor-grab active:cursor-grabbing" />
          <span className="text-[10px] text-slate-400 select-none">{blockLabel}</span>
          <button
            type="button"
            onClick={() => onToggleHidden(id)}
            className="rounded p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
            title={hidden ? "Show" : "Hide"}
          >
            {hidden ? <Eye size={10} /> : <EyeOff size={10} />}
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────

export default function ControlCenterPage() {
  const { language } = useSettings();
  const isRtl = language === "he";

  const [editing, setEditing] = useState(false);
  const [blockOrder, setBlockOrder] = useState<BlockId[]>(loadOrder);
  const [hiddenBlocks, setHiddenBlocks] = useState<Set<BlockId>>(loadHidden);
  const [dragging, setDragging] = useState<BlockId | null>(null);
  const [dragOver, setDragOver] = useState<BlockId | null>(null);

  const handleDragStart = useCallback((id: BlockId) => setDragging(id), []);
  const handleDragOver = useCallback((e: React.DragEvent, id: BlockId) => {
    e.preventDefault();
    setDragOver(id);
  }, []);
  const handleDragEnd = useCallback(() => {
    setDragging(null);
    setDragOver(null);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent, targetId: BlockId) => {
    e.preventDefault();
    if (!dragging || dragging === targetId) { handleDragEnd(); return; }
    setBlockOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(dragging);
      const toIdx = next.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, dragging);
      saveOrder(next);
      return next;
    });
    handleDragEnd();
  }, [dragging, handleDragEnd]);

  const toggleHidden = useCallback((id: BlockId) => {
    setHiddenBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveHidden(next);
      return next;
    });
  }, []);


  const allRoutes = useMemo(() => [...routes, ...standalonePages], []);

  const systemStats = useMemo(() => {
    const activeRoutes = allRoutes.filter((r) => r.status === "active").length;
    const totalComponents = allRoutes.reduce((s, r) => s + r.components.length, 0);
    const totalTables = new Set(allRoutes.flatMap((r) => r.supabaseTables ?? [])).size;
    const clScore = getOverallChecklistScoreFromEntries(changelogEntries);
    const auditScore = getOverallScore();
    return { activeRoutes, totalComponents, totalWidgets: widgets.length, totalContexts: contexts.length, totalTables, checklistPct: clScore.pct, auditScore };
  }, [allRoutes]);

  const recentChanges = useMemo(() => {
    return [...changelogEntries]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  }, []);

  const phaseProgress = useMemo(() => {
    const phases = [1, 2, 3, 4, 5] as const;
    return phases.map((p) => {
      const all = allRoutes.filter((r) => r.phase === p);
      const active = all.filter((r) => r.status === "active");
      return { phase: p, total: all.length, active: active.length, pct: all.length > 0 ? Math.round((active.length / all.length) * 100) : 0 };
    });
  }, [allRoutes]);

  // i18n labels
  const heLabels = {
    recentUpdates: "עדכונים אחרונים",
    roadmapSection: "מפת דרכים",
    roadmapDesc: "ספרינטים, משימות וציר זמן",
    architectureSection: "ארכיטקטורה",
    architectureDesc: "מבנה המערכת וטכנולוגיות",
    devLogSection: "לוג פיתוח",
    devLogDesc: "סקירת קומפוננטות וגרסאות",
    auditSection: "בדיקת מערכת",
    auditDesc: "ציון בריאות ובדיקות",
    pages: "דפים",
    components: "קומפוננטות",
    widgetsLabel: "ווידג'טים",
    contextsLabel: "קונטקסטים",
    tables: "טבלאות",
    audit: "ביקורת",
    checklist: "צ'קליסט",
    phase: "שלב",
    systemHealth: "בריאות מערכת",
    overallProgress: "התקדמות כללית",
    editLayout: "עריכת פריסה",
    doneEditing: "סיום",
    blockStats: "סטטיסטיקות",
    blockProgress: "התקדמות",
    blockRoadmap: "מפת דרכים",
    blockArchitecture: "ארכיטקטורה",
    blockDevlog: "לוג פיתוח",
    blockAudit: "ביקורת",
    blockUpdates: "עדכונים",
  };
  const enLabels = {
    recentUpdates: "Recent Updates",
    roadmapSection: "Roadmap",
    roadmapDesc: "Sprints, tasks & timeline",
    architectureSection: "Architecture",
    architectureDesc: "System structure & tech stack",
    devLogSection: "Dev Log",
    devLogDesc: "Component overview & versions",
    auditSection: "System Audit",
    auditDesc: "Health score & checks",
    pages: "Pages",
    components: "Components",
    widgetsLabel: "Widgets",
    contextsLabel: "Contexts",
    tables: "Tables",
    audit: "Audit",
    checklist: "Checklist",
    phase: "Phase",
    systemHealth: "System Health",
    overallProgress: "Overall Progress",
    editLayout: "Edit Layout",
    doneEditing: "Done",
    blockStats: "Statistics",
    blockProgress: "Progress",
    blockRoadmap: "Roadmap",
    blockArchitecture: "Architecture",
    blockDevlog: "Dev Log",
    blockAudit: "Audit",
    blockUpdates: "Updates",
  };
  const l = language === "he" ? heLabels : enLabels;

  const blockLabels: Record<BlockId, string> = {
    stats: l.blockStats,
    progress: l.blockProgress,
    roadmap: l.blockRoadmap,
    architecture: l.blockArchitecture,
    devlog: l.blockDevlog,
    audit: l.blockAudit,
    updates: l.blockUpdates,
  };

  const statusIcon = (status: string) => {
    if (status === "complete") return <CheckCircle2 size={12} className="text-emerald-400" />;
    if (status === "inProgress") return <Loader2 size={12} className="text-blue-400" />;
    if (status === "stuck" || status === "hold") return <AlertTriangle size={12} className="text-amber-400" />;
    return <Circle size={12} className="text-slate-600" />;
  };

  // ─── Block renderers ─────────────────────────────────────

  const blockProps = (id: BlockId) => ({
    id,
    editing,
    hidden: hiddenBlocks.has(id),
    onToggleHidden: toggleHidden,
    dragging,
    dragOver,
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
    onDrop: handleDrop,
    blockLabel: blockLabels[id],
  });

  const renderBlock = (id: BlockId) => {
    switch (id) {
      case "stats":
        return (
          <DraggableBlock key={id} {...blockProps(id)}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {[
                { label: l.pages, value: systemStats.activeRoutes, color: "#34d399", icon: Layout },
                { label: l.components, value: systemStats.totalComponents, color: "#60a5fa", icon: Boxes },
                { label: l.widgetsLabel, value: systemStats.totalWidgets, color: "#f472b6", icon: Layout },
                { label: l.contextsLabel, value: systemStats.totalContexts, color: "#fb923c", icon: Braces },
                { label: l.tables, value: systemStats.totalTables, color: "#c084fc", icon: Database },
                { label: l.audit, value: `${systemStats.auditScore}%`, color: systemStats.auditScore >= 80 ? "#34d399" : "#fbbf24", icon: Shield },
                { label: l.checklist, value: `${systemStats.checklistPct}%`, color: systemStats.checklistPct >= 80 ? "#34d399" : "#fbbf24", icon: ClipboardList },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
                  <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </DraggableBlock>
        );

      case "progress":
        return (
          <DraggableBlock key={id} {...blockProps(id)}>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="mb-3 text-sm font-medium text-slate-300">{l.overallProgress}</h3>
              <div className="space-y-2">
                {phaseProgress.map((p) => (
                  <div key={p.phase} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-slate-500">{l.phase} {p.phase}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${p.pct}%`,
                          background: p.pct === 100 ? "#34d399" : p.pct > 0 ? "#60a5fa" : "#374151",
                        }}
                      />
                    </div>
                    <span className="w-20 text-[11px] text-slate-500" dir="ltr" style={{ textAlign: isRtl ? "left" : "right" }}>
                      {p.active}/{p.total} ({p.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </DraggableBlock>
        );

      case "roadmap":
        return (
          <DraggableBlock key={id} {...blockProps(id)}>
            <SectionLink href="/dashboard/roadmap" icon={Compass} title={l.roadmapSection} description={l.roadmapDesc} color="bg-blue-500/10 text-blue-400" isRtl={isRtl}>
              <p className="text-xs text-slate-500 py-4 text-center">
                {isRtl ? "לחץ לצפייה במפת הדרכים המלאה" : "Click to view the full roadmap"}
              </p>
            </SectionLink>
          </DraggableBlock>
        );

      case "architecture":
        return (
          <DraggableBlock key={id} {...blockProps(id)}>
            <SectionLink href="/dashboard/architecture" icon={Network} title={l.architectureSection} description={l.architectureDesc} color="bg-purple-500/10 text-purple-400" isRtl={isRtl}>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: l.pages, value: systemStats.activeRoutes, color: "text-emerald-400" },
                  { label: l.components, value: systemStats.totalComponents, color: "text-blue-400" },
                  { label: l.tables, value: systemStats.totalTables, color: "text-purple-400" },
                  { label: l.contextsLabel, value: systemStats.totalContexts, color: "text-orange-400" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2 rounded-lg bg-slate-900/30 px-3 py-2">
                    <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
                    <span className="text-[10px] text-slate-500">{s.label}</span>
                  </div>
                ))}
              </div>
            </SectionLink>
          </DraggableBlock>
        );

      case "devlog":
        return (
          <DraggableBlock key={id} {...blockProps(id)}>
            <SectionLink href="/dashboard/admin" icon={Shield} title={l.devLogSection} description={l.devLogDesc} color="bg-emerald-500/10 text-emerald-400" isRtl={isRtl}>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-400">{l.audit}</span>
                    <span className={`text-sm font-bold ${systemStats.auditScore >= 80 ? "text-emerald-400" : "text-amber-400"}`}>
                      {systemStats.auditScore}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5">
                    <div className="h-full rounded-full" style={{ width: `${systemStats.auditScore}%`, background: systemStats.auditScore >= 80 ? "#34d399" : "#fbbf24" }} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-400">{l.checklist}</span>
                    <span className={`text-sm font-bold ${systemStats.checklistPct >= 80 ? "text-emerald-400" : "text-amber-400"}`}>
                      {systemStats.checklistPct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5">
                    <div className="h-full rounded-full" style={{ width: `${systemStats.checklistPct}%`, background: systemStats.checklistPct >= 80 ? "#34d399" : "#fbbf24" }} />
                  </div>
                </div>
              </div>
            </SectionLink>
          </DraggableBlock>
        );

      case "audit":
        return (
          <DraggableBlock key={id} {...blockProps(id)}>
            <SectionLink href="/dashboard/audit" icon={ClipboardList} title={l.auditSection} description={l.auditDesc} color="bg-amber-500/10 text-amber-400" isRtl={isRtl}>
              <div className="flex items-center justify-center gap-3 py-2">
                <span className={`text-3xl font-bold ${systemStats.auditScore >= 80 ? "text-emerald-400" : systemStats.auditScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                  {systemStats.auditScore}%
                </span>
                <span className="text-xs text-slate-500">{l.systemHealth}</span>
              </div>
            </SectionLink>
          </DraggableBlock>
        );

      case "updates":
        return (
          <DraggableBlock key={id} {...blockProps(id)}>
            <div className="gam-card rounded-xl border border-white/[0.06] bg-slate-800/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-200">
                  <GitCommit size={14} className="inline me-1.5 text-[var(--cc-accent-400)]" />
                  {l.recentUpdates}
                </h3>
                <Link
                  href="/dashboard/admin"
                  className="flex items-center gap-1 text-xs text-[var(--cc-accent-400)] hover:text-[var(--cc-accent-300)] transition-colors"
                >
                  <ArrowRight size={12} className={isRtl ? "rotate-180" : ""} />
                </Link>
              </div>
              <div className="space-y-1">
                {recentChanges.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-slate-700/20">
                    {statusIcon(entry.workflowStatus || "")}
                    <span className="flex-1 min-w-0 truncate text-sm text-slate-300">
                      {isRtl ? entry.featureHe : entry.feature}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-600">{entry.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </DraggableBlock>
        );
    }
  };

  // ─── Separate section cards from full-width blocks ───────

  const sectionCardIds = new Set<BlockId>(["roadmap", "architecture", "devlog", "audit"]);
  const orderedBlocks = blockOrder;

  // Group consecutive section cards into a grid, render others full-width
  const renderGroups: React.ReactNode[] = [];
  let i = 0;
  while (i < orderedBlocks.length) {
    const id = orderedBlocks[i];
    if (sectionCardIds.has(id)) {
      // Collect consecutive section cards
      const group: BlockId[] = [];
      while (i < orderedBlocks.length && sectionCardIds.has(orderedBlocks[i])) {
        group.push(orderedBlocks[i]);
        i++;
      }
      renderGroups.push(
        <div key={`grid-${group[0]}`} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {group.map((gid) => renderBlock(gid))}
        </div>
      );
    } else {
      renderGroups.push(renderBlock(id));
      i++;
    }
  }

  return (
    <div className="flex min-h-full flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader pageKey="control">
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              editing
                ? "border-[var(--cc-accent-500)] bg-[var(--cc-accent-500)]/10 text-[var(--cc-accent-300)]"
                : "border-white/[0.06] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
            }`}
          >
            {editing ? <Check size={13} /> : <Pencil size={13} />}
            {editing ? l.doneEditing : l.editLayout}
          </button>
        </div>
      </PageHeader>

      <div className={`flex flex-1 flex-col gap-6 pt-6 ${editing ? "pb-12" : ""}`}>
        {renderGroups}
      </div>
    </div>
  );
}
