"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragMoveEvent,
} from "@dnd-kit/core";
import { Store, Pencil, HelpCircle } from "lucide-react";
import {
  widgetRegistry,
  getEffectivePlacement,
  type WidgetSize,
} from "./widgets/WidgetRegistry";
import { WidgetWrapper } from "./widgets/WidgetWrapper";
import { WidgetSettings } from "./widgets/WidgetSettings";
import { WidgetStore } from "./widgets/WidgetStore";
import { AppsDrawer } from "./widgets/AppsDrawer";
import { FolderWrapper } from "./widgets/FolderWrapper";
import { FolderSettings } from "./widgets/FolderSettings";
import { SearchPanel } from "./widgets/SearchWidget";
import { ShortcutsPanel } from "./widgets/ShortcutsWidget";
import { WeeklyPlannerPanel } from "./widgets/WeeklyPlannerWidget";
import { AIPanel, type AIViewMode } from "./widgets/AIWidget";
import { useWidgets } from "@/contexts/WidgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useDashboardMode } from "@/contexts/DashboardModeContext";
import { getTranslations } from "@/lib/i18n";

const SIDEBAR_WIDTH = 240;
const STRIP_WIDTH = 48;
const UNIT = 48;

/** Check if placing a widget at col with size overlaps any other visible widget */
function isOverlapping(
  col: number,
  size: number,
  excludeId: string,
  positions: Record<string, number>,
  sizes: Record<string, WidgetSize>,
  widgets: { id: string; defaultSize: WidgetSize }[],
  totalColumns: number
): boolean {
  if (col < 0 || col + size > totalColumns) return true;

  const newStart = col;
  const newEnd = col + size;

  for (const w of widgets) {
    if (w.id === excludeId) continue;
    const wCol = positions[w.id];
    if (wCol === undefined) continue;
    const wSize = sizes[w.id] ?? w.defaultSize;
    const wEnd = wCol + wSize;
    if (newStart < wEnd && newEnd > wCol) return true;
  }

  return false;
}

export function TopBar() {
  const {
    widgetPositions,
    widgetSizes,
    widgetPlacements,
    folders,
    setWidgetPosition,
    setWidgetPositions,
  } = useWidgets();
  const { sidebarPosition, sidebarVisibility, language } = useSettings();
  const { editMode, setEditMode, guideMode, setGuideMode } = useDashboardMode();
  const t = getTranslations(language);

  const [mounted, setMounted] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiViewMode, setAiViewMode] = useState<AIViewMode>("side-panel");

  // AI panel offset for widget dropdown positioning
  const aiPanelOffset = useMemo(() => {
    if (!aiPanelOpen || aiViewMode !== "side-panel")
      return { left: 0, right: 0 };
    const panelOnLeft = sidebarPosition === "right";
    let width = 400;
    try {
      const saved = localStorage.getItem("cc-ai-panel-width");
      if (saved) {
        const w = parseInt(saved, 10);
        if (w >= 300 && w <= 700) width = w;
      }
    } catch {
      /* ignore */
    }
    return {
      left: panelOnLeft ? width : 0,
      right: panelOnLeft ? 0 : width,
    };
  }, [aiPanelOpen, aiViewMode, sidebarPosition]);

  // Drag state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [tentativeCol, setTentativeCol] = useState<number | null>(null);

  // Grid columns
  const [totalColumns, setTotalColumns] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Track container width → total columns via ResizeObserver
  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setTotalColumns(Math.floor(entry.contentRect.width / UNIT));
      }
    });
    observer.observe(el);
    setTotalColumns(Math.floor(el.clientWidth / UNIT));
    return () => observer.disconnect();
  }, [mounted]);

  // Load saved AI view mode
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cc-ai-view-mode");
      if (
        saved === "side-panel" ||
        saved === "dropdown" ||
        saved === "floating"
      ) {
        setAiViewMode(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Custom event listeners
  useEffect(() => {
    const handleOpenSearch = () => setSearchOpen(true);
    const handleOpenAI = () => setAiPanelOpen((prev) => !prev);
    const handleOpenShortcuts = () => setShortcutsOpen((prev) => !prev);
    const handleToggleEditMode = () => setEditMode(!editMode);
    const handleToggleSidebar = () => {
      window.dispatchEvent(new CustomEvent("cc-cycle-sidebar-visibility"));
    };
    window.addEventListener("cc-open-search", handleOpenSearch);
    window.addEventListener("cc-open-ai", handleOpenAI);
    window.addEventListener("cc-open-shortcuts", handleOpenShortcuts);
    window.addEventListener("cc-toggle-edit-mode", handleToggleEditMode);
    window.addEventListener("cc-toggle-sidebar", handleToggleSidebar);
    return () => {
      window.removeEventListener("cc-open-search", handleOpenSearch);
      window.removeEventListener("cc-open-ai", handleOpenAI);
      window.removeEventListener("cc-open-shortcuts", handleOpenShortcuts);
      window.removeEventListener("cc-toggle-edit-mode", handleToggleEditMode);
      window.removeEventListener("cc-toggle-sidebar", handleToggleSidebar);
    };
  }, [editMode, setEditMode]);

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleShortcutsOpen = useCallback(() => {
    setShortcutsOpen(true);
  }, []);

  const handlePlannerOpen = useCallback(() => {
    setPlannerOpen(true);
  }, []);

  const handleAiOpen = useCallback(() => {
    setAiPanelOpen((prev) => !prev);
  }, []);

  // Per-widget modal handlers
  const modalHandlers: Record<string, () => void> = useMemo(() => ({
    "search": handleSearchOpen,
    "keyboard-shortcuts": handleShortcutsOpen,
    "weekly-planner": handlePlannerOpen,
  }), [handleSearchOpen, handleShortcutsOpen, handlePlannerOpen]);

  // Handle opening a widget from the Apps Drawer
  const handleOpenFromApps = useCallback((widgetId: string) => {
    if (widgetId === "ai-assistant") {
      setAiPanelOpen(true);
      return;
    }
    if (modalHandlers[widgetId]) {
      modalHandlers[widgetId]();
    }
  }, [modalHandlers]);

  // Sidebar offset
  const sidebarOffset =
    sidebarVisibility === "visible"
      ? SIDEBAR_WIDTH
      : sidebarVisibility === "float"
        ? STRIP_WIDTH
        : 0;

  const positionStyle = {
    [sidebarPosition === "right" ? "right" : "left"]: sidebarOffset,
    [sidebarPosition === "right" ? "left" : "right"]: 0,
  };

  // Visible widgets (placement === "toolbar")
  const visibleWidgets = useMemo(() => {
    return widgetRegistry.filter((w) => {
      if (w.status !== "active") return false;
      return getEffectivePlacement(w.id, widgetPlacements, w.isRemovable) === "toolbar";
    });
  }, [widgetPlacements]);

  // Visible folders (placement === "toolbar" or default)
  const visibleFolders = useMemo(() => {
    return folders.filter((f) => {
      const p = widgetPlacements[f.id] ?? "toolbar";
      return p === "toolbar";
    });
  }, [folders, widgetPlacements]);

  // Combined list of all top bar items for position/overlap calculations
  const allTopBarDefs = useMemo(() => {
    const items: { id: string; defaultSize: WidgetSize }[] = [
      ...visibleWidgets.map((w) => ({ id: w.id, defaultSize: w.defaultSize })),
      ...visibleFolders.map((f) => ({ id: f.id, defaultSize: f.defaultSize })),
    ];
    return items;
  }, [visibleWidgets, visibleFolders]);

  // Auto-initialize positions for widgets and folders that don't have one yet
  useEffect(() => {
    if (!mounted || allTopBarDefs.length === 0 || totalColumns === 0) return;

    const needsInit = allTopBarDefs.some(
      (item) => widgetPositions[item.id] === undefined
    );
    if (!needsInit) return;

    const newPositions = { ...widgetPositions };
    let nextCol = 0;

    // Find the end of already-positioned items
    for (const item of allTopBarDefs) {
      if (newPositions[item.id] !== undefined) {
        const size: WidgetSize = widgetSizes[item.id] ?? item.defaultSize;
        const end = newPositions[item.id] + size;
        if (end > nextCol) nextCol = end;
      }
    }

    // Place unpositioned items in the first available slot
    let changed = false;
    for (const item of allTopBarDefs) {
      if (newPositions[item.id] !== undefined) continue;
      const size: WidgetSize = widgetSizes[item.id] ?? item.defaultSize;
      if (nextCol + size <= totalColumns) {
        newPositions[item.id] = nextCol;
        nextCol += size;
        changed = true;
      }
    }

    if (changed) {
      setWidgetPositions(newPositions);
    }
  }, [
    mounted,
    allTopBarDefs,
    totalColumns,
    widgetPositions,
    widgetSizes,
    setWidgetPositions,
  ]);

  // Clamp items that overflow after window resize
  useEffect(() => {
    if (!mounted || totalColumns === 0) return;

    let needsUpdate = false;
    const updated = { ...widgetPositions };

    for (const item of allTopBarDefs) {
      const pos = updated[item.id];
      if (pos === undefined) continue;
      const size: WidgetSize = widgetSizes[item.id] ?? item.defaultSize;
      if (pos + size > totalColumns) {
        updated[item.id] = Math.max(0, totalColumns - size);
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      setWidgetPositions(updated);
    }
  }, [totalColumns, mounted, allTopBarDefs, widgetPositions, widgetSizes, setWidgetPositions]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const widgetId = String(event.active.id);
      const currentCol = widgetPositions[widgetId];
      if (currentCol === undefined) return;

      const colDelta = Math.round(event.delta.x / UNIT);
      const newCol = Math.max(0, currentCol + colDelta);
      setTentativeCol(newCol);
    },
    [widgetPositions]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const itemId = String(event.active.id);
      const currentCol = widgetPositions[itemId];

      setActiveDragId(null);
      setTentativeCol(null);

      if (currentCol === undefined) return;

      const colDelta = Math.round(event.delta.x / UNIT);
      const newCol = currentCol + colDelta;

      const def = allTopBarDefs.find((d) => d.id === itemId);
      if (!def) return;
      const size: WidgetSize = widgetSizes[itemId] ?? def.defaultSize;

      // Validate bounds + no overlap
      if (
        newCol < 0 ||
        newCol + size > totalColumns ||
        isOverlapping(
          newCol,
          size,
          itemId,
          widgetPositions,
          widgetSizes,
          allTopBarDefs,
          totalColumns
        )
      ) {
        return; // Invalid — item snaps back
      }

      setWidgetPosition(itemId, newCol);
    },
    [
      widgetPositions,
      widgetSizes,
      allTopBarDefs,
      totalColumns,
      setWidgetPosition,
    ]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
    setTentativeCol(null);
  }, []);

  // Compute drop-target validity for visual feedback
  const dropTargetValid = useMemo(() => {
    if (!activeDragId || tentativeCol === null) return false;
    const def = allTopBarDefs.find((d) => d.id === activeDragId);
    if (!def) return false;
    const size: WidgetSize = widgetSizes[activeDragId] ?? def.defaultSize;
    return !isOverlapping(
      tentativeCol,
      size,
      activeDragId,
      widgetPositions,
      widgetSizes,
      allTopBarDefs,
      totalColumns
    );
  }, [
    activeDragId,
    tentativeCol,
    widgetPositions,
    widgetSizes,
    allTopBarDefs,
    totalColumns,
  ]);

  // Size of the item being dragged (for the highlight)
  const draggedSize = useMemo(() => {
    if (!activeDragId) return 0;
    const def = allTopBarDefs.find((d) => d.id === activeDragId);
    if (!def) return 0;
    return widgetSizes[activeDragId] ?? def.defaultSize;
  }, [activeDragId, widgetSizes, allTopBarDefs]);

  return (
    <>
      <div
        data-cc-id="topbar.root"
        className="fixed top-0 z-40 flex h-12 items-center border-b border-slate-700 bg-slate-800"
        style={positionStyle}
      >
        <div ref={containerRef} className="relative h-full flex-1">
          {!mounted ? (
            <span className="px-3 text-xs text-slate-500">&nbsp;</span>
          ) : allTopBarDefs.length > 0 ? (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              {/* Grid guides — visible during drag */}
              {activeDragId && (
                <div className="pointer-events-none absolute inset-0">
                  {Array.from({ length: totalColumns }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-1 bottom-1 border border-slate-700/40 rounded-sm"
                      style={{ left: i * UNIT, width: UNIT }}
                    />
                  ))}
                </div>
              )}

              {/* Drop target highlight */}
              {activeDragId && tentativeCol !== null && (
                <div
                  className={`pointer-events-none absolute top-1 bottom-1 rounded transition-all ${
                    dropTargetValid
                      ? "border border-[var(--cc-accent-500-50)] bg-[var(--cc-accent-500-15)]"
                      : "border border-red-500/40 bg-red-500/10"
                  }`}
                  style={{
                    left: tentativeCol * UNIT,
                    width: draggedSize * UNIT,
                  }}
                />
              )}

              {/* Widgets */}
              {visibleWidgets.map((widget) => {
                const col = widgetPositions[widget.id];
                if (col === undefined) return null;
                return (
                  <WidgetWrapper
                    key={widget.id}
                    widget={widget}
                    column={col}
                    onEditOpen={setEditingWidgetId}
                    aiPanelOffset={aiPanelOffset}
                    onCustomClick={
                      widget.panelMode === "side-panel"
                        ? handleAiOpen
                        : modalHandlers[widget.id]
                    }
                  />
                );
              })}

              {/* Folders */}
              {visibleFolders.map((folder) => {
                const col = widgetPositions[folder.id];
                if (col === undefined) return null;
                return (
                  <FolderWrapper
                    key={folder.id}
                    folder={folder}
                    column={col}
                    onEditOpen={setEditingFolderId}
                    aiPanelOffset={aiPanelOffset}
                  />
                );
              })}
            </DndContext>
          ) : (
            <span className="absolute inset-0 flex items-center px-3 text-xs text-slate-500">
              {t.widgets.noWidgets}
            </span>
          )}
        </div>

        {/* Apps Drawer */}
        <AppsDrawer onOpenWidget={handleOpenFromApps} />

        {/* Edit Mode toggle */}
        <button
          type="button"
          onClick={() => setEditMode(!editMode)}
          className={`mx-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors ${
            editMode
              ? "bg-[var(--cc-accent-600)] text-white"
              : "text-slate-500 hover:bg-slate-700 hover:text-slate-300"
          }`}
          title={t.widgets.editMode}
        >
          <Pencil className="h-4 w-4" />
        </button>

        {/* Guide Mode toggle */}
        <button
          type="button"
          onClick={() => setGuideMode(!guideMode)}
          className={`mx-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors ${
            guideMode
              ? "bg-[var(--cc-accent-600)] text-white"
              : "text-slate-500 hover:bg-slate-700 hover:text-slate-300"
          }`}
          title={t.widgets.guideMode || "Guide"}
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        {/* Widget Store button */}
        <button
          type="button"
          onClick={() => setStoreOpen(true)}
          className="mx-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
          title={t.widgets.store}
        >
          <Store className="h-4 w-4" />
        </button>
      </div>

      {/* Widget settings panel */}
      {editingWidgetId && (
        <WidgetSettings
          widgetId={editingWidgetId}
          onClose={() => setEditingWidgetId(null)}
          onOpenLibrary={() => setStoreOpen(true)}
        />
      )}

      {/* Folder settings panel */}
      {editingFolderId && (
        <FolderSettings
          folderId={editingFolderId}
          onClose={() => setEditingFolderId(null)}
        />
      )}

      {/* Widget Store */}
      {storeOpen && <WidgetStore onClose={() => setStoreOpen(false)} />}

      {/* Search modal */}
      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}

      {/* Shortcuts modal */}
      {shortcutsOpen && <ShortcutsPanel onClose={() => setShortcutsOpen(false)} />}

      {/* Weekly Planner modal */}
      {plannerOpen && <WeeklyPlannerPanel onClose={() => setPlannerOpen(false)} />}

      {/* AI panel */}
      {aiPanelOpen && (
        <AIPanel
          onClose={() => setAiPanelOpen(false)}
          viewMode={aiViewMode}
          onViewModeChange={(mode) => {
            setAiViewMode(mode);
            localStorage.setItem("cc-ai-view-mode", mode);
          }}
        />
      )}
    </>
  );
}
