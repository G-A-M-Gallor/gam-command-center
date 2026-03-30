"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { _X, _ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { NoteRecord } from "@/lib/entities/types";
import type { VNoteSidebarTab, VNoteBlockTab } from "./vNote.types";
import type { LayoutBlock } from "./storyMap.types";

interface Props {
  entity: NoteRecord | null;
  blocks?: LayoutBlock[];
  selectedBlockId?: string | null;
  onClearBlock?: () => void;
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

const ENTITY_TABS: { id: VNoteSidebarTab; label: string; icon: string }[] = [
  { id: "comm-log", label: "לוג תקשורת", icon: "💬" },
  { id: "progress-log", label: "לוג התקדמות", icon: "📊" },
  { id: "instance-link", label: "חיבור למופע", icon: "🔗" },
];

const BLOCK_TABS: { id: VNoteBlockTab; label: string; icon: string }[] = [
  { id: "details", label: "פרטים", icon: "📋" },
  { id: "history", label: "היסטוריה", icon: "🕐" },
  { id: "relations", label: "קשרים", icon: "🔗" },
];

// ── Relative time helper ─────────────────────────────────

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "עכשיו";
  if (diffMin < 60) return `לפני ${diffMin} דקות`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `לפני ${diffHrs} שעות`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `לפני ${diffDays} ימים`;
  return new Date(dateStr).toLocaleDateString("he-IL");
}

// ── Entity Content ──────────────────────────────────────

function EntityContent({ entity, activeTab }: { entity: NoteRecord | null; activeTab: VNoteSidebarTab }) {
  if (!entity) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-12">
        <span className="text-2xl">📋</span>
        <p className="text-xs text-slate-500">בחר מופע כדי לראות לוג</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-slate-600 text-center">{entity.title}</p>
      {activeTab === "comm-log" && (
        <div className="text-center py-8">
          <span className="text-2xl">💬</span>
          <p className="text-xs text-slate-500 mt-2">לוג תקשורת יגיע כשנחבר WATI + Email</p>
        </div>
      )}
      {activeTab === "progress-log" && (
        <div className="text-center py-8">
          <span className="text-2xl">📊</span>
          <p className="text-xs text-slate-500 mt-2">לוג התקדמות יגיע כשנבנה Activity Log</p>
        </div>
      )}
      {activeTab === "instance-link" && (
        <div className="text-center py-8">
          <span className="text-2xl">🔗</span>
          <p className="text-xs text-slate-500 mt-2">חיבור למופע — placeholder</p>
        </div>
      )}
    </div>
  );
}

// ── Block Details Tab ────────────────────────────────────

function BlockDetailsContent({ block }: { block: LayoutBlock }) {
  // Fetch entity data
  const { data: entity } = useQuery({
    queryKey: ["sidebar-block-entity", block.entityId],
    queryFn: async () => {
      if (!block.entityId) return null;
      const { data } = await supabase
        .from("vb_records")
        .select("*")
        .eq("id", block.entityId)
        .single();
      return data as NoteRecord | null;
    },
    enabled: !!block.entityId,
    staleTime: 30_000,
  });

  if (!entity) {
    return (
      <div className="space-y-2 pt-2">
        <DetailRow label="Block ID" value={block.blockId} />
        {block.entityType && <DetailRow label="סוג ישות" value={block.entityType} />}
      </div>
    );
  }

  const meta = entity.meta ?? {};
  const entries = Object.entries(meta).filter(([k]) => !k.startsWith("__")).slice(0, 10);

  return (
    <div className="space-y-2 pt-1">
      <DetailRow label="שם" value={entity.title} />
      <DetailRow label="סטטוס" value={entity.status} />
      {entity.entity_type && <DetailRow label="סוג" value={entity.entity_type} />}
      {entries.map(([key, val]) => (
        <DetailRow key={key} label={key} value={val != null ? String(val) : "—"} />
      ))}
    </div>
  );
}

// ── Block History Tab ────────────────────────────────────

function BlockHistoryContent({ entityId }: { entityId?: string }) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["sidebar-block-history", entityId],
    queryFn: async () => {
      if (!entityId) return [];
      const { data } = await supabase
        .from("audit_log")
        .select("id, action, details, created_at, user_id")
        .eq("record_id", entityId)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as { id: string; action: string; details: string | null; created_at: string; user_id: string | null }[];
    },
    enabled: !!entityId,
    staleTime: 30_000,
  });

  if (isLoading) {
    return <div className="py-8 text-center text-xs text-slate-500 animate-pulse">טוען היסטוריה...</div>;
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-2xl">🕐</span>
        <p className="text-xs text-slate-500 mt-2">אין היסטוריה עדיין</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 pt-1">
      {logs.map((log) => (
        <div key={log.id} className="rounded-md bg-slate-800/50 px-2.5 py-2 space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-300 truncate">{log.action}</span>
            <span className="text-[9px] text-slate-600 shrink-0">{relativeTime(log.created_at)}</span>
          </div>
          {log.details && (
            <p className="text-[10px] text-slate-500 truncate">{log.details}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Block Relations Tab ──────────────────────────────────

function BlockRelationsContent({
  entityId,
  onSelectEntity,
}: {
  entityId?: string;
  onSelectEntity?: (id: string) => void;
}) {
  const { data: relations, isLoading } = useQuery({
    queryKey: ["sidebar-block-relations", entityId],
    queryFn: async () => {
      if (!entityId) return [];
      const { data } = await supabase
        .from("vb_record_relations")
        .select("id, source_id, target_id, relation_type")
        .or(`source_id.eq.${entityId},target_id.eq.${entityId}`);
      return (data ?? []) as { id: string; source_id: string; target_id: string; relation_type: string | null }[];
    },
    enabled: !!entityId,
    staleTime: 30_000,
  });

  // Fetch related entity names
  const relatedIds = (relations ?? []).map((r) =>
    r.source_id === entityId ? r.target_id : r.source_id
  );

  const { data: relatedEntities } = useQuery({
    queryKey: ["sidebar-related-entities", relatedIds.join(",")],
    queryFn: async () => {
      if (relatedIds.length === 0) return [];
      const { data } = await supabase
        .from("vb_records")
        .select("id, title, entity_type")
        .in("id", relatedIds);
      return (data ?? []) as { id: string; title: string; entity_type: string | null }[];
    },
    enabled: relatedIds.length > 0,
    staleTime: 30_000,
  });

  if (isLoading) {
    return <div className="py-8 text-center text-xs text-slate-500 animate-pulse">טוען קשרים...</div>;
  }

  if (!relations || relations.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-2xl">🔗</span>
        <p className="text-xs text-slate-500 mt-2">אין קשרים עדיין</p>
      </div>
    );
  }

  const entityMap = new Map((relatedEntities ?? []).map((e) => [e.id, e]));

  return (
    <div className="space-y-1.5 pt-1">
      {relations.map((rel) => {
        const otherId = rel.source_id === entityId ? rel.target_id : rel.source_id;
        const other = entityMap.get(otherId);
        const typeEmoji = other?.entity_type === "contact" ? "👤"
          : other?.entity_type === "project" ? "📁"
          : other?.entity_type === "deal" ? "💰"
          : other?.entity_type === "client" ? "🏢"
          : "📦";

        return (
          <button
            key={rel.id}
            type="button"
            onClick={() => onSelectEntity?.(otherId)}
            className="w-full flex items-center gap-2 rounded-md bg-slate-800/50 px-2.5 py-2 text-start hover:bg-slate-700/50 transition-colors"
          >
            <span className="text-sm">{typeEmoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-300 truncate">{other?.title ?? otherId.slice(0, 8)}</p>
              {rel.relation_type && (
                <p className="text-[9px] text-slate-600">{rel.relation_type}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Block Content ────────────────────────────────────────

function BlockContent({
  block,
  activeTab,
  onSelectEntity,
}: {
  block: LayoutBlock;
  activeTab: VNoteBlockTab;
  onSelectEntity?: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="text-sm">{block.entityType === "contact" ? "👤" : block.entityType === "deal" ? "💰" : "📦"}</span>
        <div>
          <p className="text-sm font-medium text-slate-200">{block.storyMapConfig?.label ?? block.blockId}</p>
          {block.entityType && (
            <p className="text-[10px] text-slate-500">{block.entityType}</p>
          )}
        </div>
      </div>

      {activeTab === "details" && <BlockDetailsContent block={block} />}
      {activeTab === "history" && <BlockHistoryContent entityId={block.entityId} />}
      {activeTab === "relations" && (
        <BlockRelationsContent entityId={block.entityId} onSelectEntity={onSelectEntity} />
      )}
    </div>
  );
}

// ── Detail Row ───────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 px-1">
      <span className="text-[10px] text-slate-600 shrink-0 w-20">{label}</span>
      <span className="text-[11px] text-slate-400 break-all">{value}</span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────

// Snap points: translateY as fraction of viewport (0 = top, 1 = bottom/hidden)
// peek=75% hidden (25% visible), half=50% hidden (50% visible), full=10% hidden (90% visible)
const SNAP_POINTS = { peek: 0.75, half: 0.50, full: 0.10 };
const SNAP_VALUES: number[] = [SNAP_POINTS.peek, SNAP_POINTS.half, SNAP_POINTS.full];
const DISMISS_THRESHOLD = 0.90;

function findClosestSnap(translateFraction: number, velocity: number): number {
  // velocity > 0 means dragging down, < 0 means dragging up
  // If fast swipe, jump to next snap in swipe direction
  if (Math.abs(velocity) > 0.5) {
    const sorted = velocity > 0
      ? [...SNAP_VALUES].sort((a, b) => b - a) // going down: prefer larger translateY
      : [...SNAP_VALUES].sort((a, b) => a - b); // going up: prefer smaller translateY
    for (const snap of sorted) {
      if (velocity > 0 && snap > translateFraction) return snap;
      if (velocity < 0 && snap < translateFraction) return snap;
    }
  }

  // Otherwise find geometrically closest
  let closest = SNAP_VALUES[0];
  let minDist = Math.abs(translateFraction - SNAP_VALUES[0]);
  for (const snap of SNAP_VALUES) {
    const dist = Math.abs(translateFraction - snap);
    if (dist < minDist) {
      minDist = dist;
      closest = snap;
    }
  }
  return closest;
}

const SHEET_TRANSITION = "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)";

export function VNoteSidebar({ entity, blocks, selectedBlockId, onClearBlock, isOpen, onToggle, isMobile = false }: Props) {
  const _router = useRouter();
  const [entityTab, setEntityTab] = useState<VNoteSidebarTab>("comm-log");
  const [blockTab, setBlockTab] = useState<VNoteBlockTab>("details");
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartTime = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [snapFraction, setSnapFraction] = useState(SNAP_POINTS.half); // default: 50% visible
  const [dragDeltaPx, setDragDeltaPx] = useState(0);

  const selectedBlock = selectedBlockId
    ? blocks?.find((b) => b.blockId === selectedBlockId) ?? null
    : null;

  // Reset block tab when selection changes
  useEffect(() => {
    setBlockTab("details");
  }, [selectedBlockId]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onToggle(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onToggle]);

  // Reset to half snap when opened
  useEffect(() => {
    if (isOpen) setSnapFraction(SNAP_POINTS.half);
  }, [isOpen]);

  // Touch drag for bottom sheet with snap points + velocity
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragStartTime.current = Date.now();
    setDragging(true);
    setDragDeltaPx(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    setDragDeltaPx(delta);
  }, [dragging]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    const vh = window.innerHeight;
    const deltaFraction = dragDeltaPx / vh;
    const currentFraction = snapFraction + deltaFraction;
    const elapsed = (Date.now() - dragStartTime.current) / 1000; // seconds
    const velocity = elapsed > 0 ? deltaFraction / elapsed : 0; // fraction/sec, positive = down

    // If dragged past dismiss threshold, close
    if (currentFraction > DISMISS_THRESHOLD) {
      onToggle();
      setDragDeltaPx(0);
      return;
    }

    const snap = findClosestSnap(currentFraction, velocity);
    setSnapFraction(snap);
    setDragDeltaPx(0);
  }, [snapFraction, dragDeltaPx, onToggle]);


  // Block header with close + navigate buttons
  const blockHeader = selectedBlock && (
    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50 bg-blue-500/5">
      <span className="text-[11px] font-medium text-blue-300 truncate">
        {selectedBlock.storyMapConfig?.label ?? "Block"}
      </span>
      <div className="flex items-center gap-1">
        {selectedBlock.entityId && (
          <button
            type="button"
            onClick={() => router.push(`/dashboard/vnote/${selectedBlock.entityId}`)}
            className="rounded p-0.5 text-slate-500 hover:text-blue-300 hover:bg-slate-700/50 transition-colors"
            title="פתח vNote"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onClearBlock?.()}
          className="rounded p-0.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  const tabButtons = selectedBlock ? (
    <div className="flex border-b border-slate-700">
      {BLOCK_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setBlockTab(tab.id)}
          className={`flex-1 px-2 py-3 text-[11px] font-medium transition-colors ${
            blockTab === tab.id
              ? "text-blue-300 border-b-2 border-blue-500"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <span className="block text-sm mb-0.5">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  ) : (
    <div className="flex border-b border-slate-700">
      {ENTITY_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setEntityTab(tab.id)}
          className={`flex-1 px-2 py-3 text-[11px] font-medium transition-colors ${
            entityTab === tab.id
              ? "text-purple-300 border-b-2 border-purple-500"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <span className="block text-sm mb-0.5">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );

  const content = selectedBlock ? (
    <BlockContent block={selectedBlock} activeTab={blockTab} />
  ) : (
    <EntityContent entity={entity} activeTab={entityTab} />
  );

  // ── Mobile: Bottom Sheet ──────────────────────────────
  if (isMobile) {
    return (
      <>
        {isOpen && (
          <button
            type="button"
            onClick={onToggle}
            className="fixed inset-0 z-40 bg-black/40"
            aria-label="סגור"
          />
        )}
        <div
          ref={sheetRef}
          className="fixed inset-x-0 top-0 z-50 rounded-t-2xl bg-slate-900 border-t border-slate-700 flex flex-col"
          style={{
            height: "100vh",
            transform: isOpen
              ? `translateY(${snapFraction * 100}%)${dragging ? ` translateY(${dragDeltaPx}px)` : ""}`
              : "translateY(100%)",
            transition: dragging ? "none" : SHEET_TRANSITION,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag handle + snap indicators */}
          <div className="flex flex-col items-center pt-2 pb-1 shrink-0">
            <div className="h-1 w-10 rounded-full bg-slate-600" />
            <div className="flex items-center gap-2 mt-1.5">
              {SNAP_VALUES.map((snap) => (
                <button
                  key={snap}
                  type="button"
                  onClick={() => setSnapFraction(snap)}
                  className={`rounded-full transition-all duration-200 ${
                    snapFraction === snap
                      ? "w-5 h-1 bg-purple-400"
                      : "w-2.5 h-0.5 bg-slate-700 hover:bg-slate-500"
                  }`}
                  aria-label={`${Math.round((1 - snap) * 100)}% visible`}
                />
              ))}
            </div>
          </div>
          {blockHeader}
          {tabButtons}
          <div className="flex-1 overflow-auto p-3">
            {content}
          </div>
        </div>
      </>
    );
  }

  // ── Desktop/Tablet: Side panel ────────────────────────
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="fixed top-1/2 -translate-y-1/2 right-0 z-30 rounded-s-lg bg-slate-800 border border-e-0 border-slate-700 px-1.5 py-3 text-slate-400 hover:text-purple-300 hover:bg-slate-700 transition-colors max-md:hidden"
        style={{ writingMode: "vertical-rl" }}
        title={isOpen ? "סגור sidebar" : "פתח sidebar"}
      >
        <span className="text-[10px] tracking-wider">
          {isOpen ? "✕" : "☰"}
        </span>
      </button>

      <div
        className={`
          fixed top-0 right-0 z-20 h-full bg-slate-900 border-s border-slate-700
          transition-transform duration-300 ease-in-out max-md:hidden
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
        style={{ width: 280 }}
      >
        <div className="flex flex-col h-full">
          {blockHeader}
          {tabButtons}
          <div className="flex-1 overflow-auto p-3">
            {content}
          </div>
        </div>
      </div>
    </>
  );
}
