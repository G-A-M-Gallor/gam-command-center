"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragMoveEvent,
} from "@dnd-kit/core";
import { Store, Pencil, Menu, X, Grid3X3, Bookmark, LayoutList, AlignHorizontalJustifyStart, Settings, SlidersHorizontal, Layers } from "lucide-react";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import {
  widgetRegistry,
  getEffectivePlacement,
  type WidgetSize,
} from "./widgets/WidgetRegistry";
import { WidgetWrapper } from "./widgets/WidgetWrapper";
import { WidgetSettings } from "./widgets/WidgetSettings";
import { WidgetStore } from "./widgets/WidgetStore";
import { AppStorePanel } from "./AppStorePanel";
import { SettingsFolderPanel } from "./SettingsFolderPanel";
import { OverflowMenu } from "./OverflowMenu";
import { AppsDrawer } from "./widgets/AppsDrawer";
import { ProfileSwitcher } from "./widgets/ProfileSwitcher";
import { FolderWrapper } from "./widgets/FolderWrapper";
import { FolderSettings } from "./widgets/FolderSettings";
import { SearchPanel } from "./widgets/SearchWidget";
import { ShortcutsPanel } from "./widgets/ShortcutsWidget";
import { WeeklyPlannerPanel } from "./widgets/WeeklyPlannerWidget";
import { AIPanel, type AIViewMode } from "./widgets/AIWidget";
import { UniversalSidePanel, TabbedSidePanel, SIDE_PANEL_OPEN_EVENT } from "./widgets/UniversalSidePanel";
import { useWidgets, BUILTIN_PROFILES } from "@/contexts/WidgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useDashboardMode } from "@/contexts/DashboardModeContext";
import { useAuth } from "@/contexts/AuthContext";
import { getTranslations } from "@/lib/i18n";
import { ShellPrefsPanel } from "./ShellPrefsPanel";

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

interface TopBarProps {
  onSidebarOpen?: () => void;
  /** When true, topbar hides and reveals on hover over top edge */
  topbarHover?: boolean;
  /** Optional top offset in px (for stacking below other fixed elements) */
  topOffset?: number;
}

export function TopBar({ onSidebarOpen, topbarHover = false, topOffset }: TopBarProps) {
  const {
    widgetPositions,
    widgetSizes,
    widgetPlacements,
    folders,
    setWidgetPosition,
    setWidgetPositions,
    activeProfileId,
    profiles,
    addFolder,
    updateFolder,
    displayMode,
    setDisplayMode,
    widgetPanelModes,
    widgetIcons,
  } = useWidgets();
  const { sidebarPosition, sidebarVisibility, setSidebarVisibility, language, brandProfile } = useSettings();
  const { user } = useAuth();
  const pathname = usePathname();
  const { editMode, setEditMode } = useDashboardMode();
  const router = useRouter();
  const t = getTranslations(language);
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";

  // Ref to read widgetPositions inside effects without adding it as a dependency
  // (prevents infinite update loops when effects also call setWidgetPositions)
  const widgetPositionsRef = useRef(widgetPositions);
  widgetPositionsRef.current = widgetPositions;

  const [mounted, setMounted] = useState(false);
  const [topbarHovered, setTopbarHoveredRaw] = useState(false);
  const setTopbarHovered = useCallback((v: boolean) => {
    setTopbarHoveredRaw(v);
    window.dispatchEvent(new CustomEvent("cc-topbar-hover", { detail: v }));
  }, []);
  const [shellPrefsOpen, setShellPrefsOpen] = useState(false);
  const shellPrefsBtnRef = useRef<HTMLButtonElement>(null);
  const [mobileWidgetPanelOpen, setMobileWidgetPanelOpen] = useState(false);
  const [mobileActiveWidgetId, setMobileActiveWidgetId] = useState<string | null>(null);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiViewMode, setAiViewMode] = useState<AIViewMode>("side-panel");
  const [sidePanelWidgetId, setSidePanelWidgetId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Widget lock state
  const [widgetLocks, setWidgetLocks] = useState<Record<string, boolean>>({});

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

  // Load widget locks from localStorage + listen for changes from AppStorePanel
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cc-widget-locks");
      if (raw) setWidgetLocks(JSON.parse(raw));
    } catch { /* ignore */ }

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setWidgetLocks(detail);
    };
    window.addEventListener("cc-widget-locks-change", handler);
    return () => window.removeEventListener("cc-widget-locks-change", handler);
  }, []);

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

  // Refs so event listeners always read the latest values
  const sidebarVisibilityRef = useRef(sidebarVisibility);
  sidebarVisibilityRef.current = sidebarVisibility;
  const editModeRef = useRef(editMode);
  editModeRef.current = editMode;

  // Custom event listeners
  useEffect(() => {
    const handleOpenSearch = () => setSearchOpen(true);
    const handleOpenAI = () => setAiPanelOpen((prev) => !prev);
    const handleOpenShortcuts = () => setShortcutsOpen((prev) => !prev);
    const handleToggleEditMode = () => setEditMode(!editModeRef.current);
    const handleToggleSidebar = () => {
      const cycle = { visible: "float", float: "hidden", hidden: "visible" } as const;
      setSidebarVisibility(cycle[sidebarVisibilityRef.current] || "visible");
    };
    const handleOpenQuickCreate = () => {
      window.dispatchEvent(new CustomEvent("cc-widget-open-quick-create"));
    };
    const handleOpenNotifications = () => {
      window.dispatchEvent(new CustomEvent("cc-widget-open-notifications"));
    };
    const handleFullscreen = () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    };
    const handleNewDocument = () => router.push("/dashboard/editor");
    const handleNewProject = () => {
      window.dispatchEvent(new CustomEvent("cc-widget-open-quick-create"));
    };
    const handleAiModeChat = () => {
      setAiPanelOpen(true);
      window.dispatchEvent(new CustomEvent("cc-ai-set-mode", { detail: "chat" }));
    };
    const handleAiModeAnalyze = () => {
      setAiPanelOpen(true);
      window.dispatchEvent(new CustomEvent("cc-ai-set-mode", { detail: "analyze" }));
    };
    const handleAiModeWrite = () => {
      setAiPanelOpen(true);
      window.dispatchEvent(new CustomEvent("cc-ai-set-mode", { detail: "write" }));
    };
    const handleAiClear = () => {
      setAiPanelOpen(true);
      window.dispatchEvent(new CustomEvent("cc-ai-clear-chat"));
    };
    // Mobile bottom bar triggers widget panel toggle
    const handleWidgetPanelToggle = () => {
      setMobileWidgetPanelOpen((p) => {
        if (p) setMobileActiveWidgetId(null);
        return !p;
      });
    };
    // Side panel open from widget click
    const handleSidePanelOpen = (e: Event) => {
      const widgetId = (e as CustomEvent<string>).detail;
      if (widgetId) setSidePanelWidgetId(widgetId);
    };

    window.addEventListener("cc-open-search", handleOpenSearch);
    window.addEventListener("cc-open-ai", handleOpenAI);
    window.addEventListener("cc-open-shortcuts", handleOpenShortcuts);
    window.addEventListener("cc-toggle-edit-mode", handleToggleEditMode);
    window.addEventListener("cc-toggle-sidebar", handleToggleSidebar);
    window.addEventListener("cc-open-quick-create", handleOpenQuickCreate);
    window.addEventListener("cc-open-notifications", handleOpenNotifications);
    window.addEventListener("cc-fullscreen", handleFullscreen);
    window.addEventListener("cc-new-document", handleNewDocument);
    window.addEventListener("cc-new-project", handleNewProject);
    window.addEventListener("cc-ai-mode-chat", handleAiModeChat);
    window.addEventListener("cc-ai-mode-analyze", handleAiModeAnalyze);
    window.addEventListener("cc-ai-mode-write", handleAiModeWrite);
    window.addEventListener("cc-ai-clear", handleAiClear);
    window.addEventListener("cc-widget-panel-toggle", handleWidgetPanelToggle);
    window.addEventListener(SIDE_PANEL_OPEN_EVENT, handleSidePanelOpen);
    return () => {
      window.removeEventListener("cc-open-search", handleOpenSearch);
      window.removeEventListener("cc-open-ai", handleOpenAI);
      window.removeEventListener("cc-open-shortcuts", handleOpenShortcuts);
      window.removeEventListener("cc-toggle-edit-mode", handleToggleEditMode);
      window.removeEventListener("cc-toggle-sidebar", handleToggleSidebar);
      window.removeEventListener("cc-open-quick-create", handleOpenQuickCreate);
      window.removeEventListener("cc-open-notifications", handleOpenNotifications);
      window.removeEventListener("cc-fullscreen", handleFullscreen);
      window.removeEventListener("cc-new-document", handleNewDocument);
      window.removeEventListener("cc-new-project", handleNewProject);
      window.removeEventListener("cc-ai-mode-chat", handleAiModeChat);
      window.removeEventListener("cc-ai-mode-analyze", handleAiModeAnalyze);
      window.removeEventListener("cc-ai-mode-write", handleAiModeWrite);
      window.removeEventListener("cc-ai-clear", handleAiClear);
      window.removeEventListener("cc-widget-panel-toggle", handleWidgetPanelToggle);
      window.removeEventListener(SIDE_PANEL_OPEN_EVENT, handleSidePanelOpen);
    };
  }, [setEditMode, setSidebarVisibility, router]);

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

  // Handle clicking a widget from the overflow menu
  const handleOverflowClick = useCallback((widgetId: string) => {
    if (widgetId === "ai-assistant") {
      setAiPanelOpen(true);
      return;
    }
    if (modalHandlers[widgetId]) {
      modalHandlers[widgetId]();
      return;
    }
    // Open as side panel for dropdown widgets
    setSidePanelWidgetId((prev) => (prev === widgetId ? null : widgetId));
  }, [modalHandlers]);

  // Quick bookmark handler
  const handleQuickBookmark = useCallback(() => {
    const QUICK_BM_ID = "__quick-bookmarks__";
    const existing = folders.find((f) => f.id === QUICK_BM_ID);
    const name = document.title || pathname;
    const bookmark = {
      type: "bookmark" as const,
      id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: pathname,
      label: { he: name, en: name, ru: name },
      icon: "📌",
      noteId: null,
      createdAt: new Date().toISOString(),
    };

    if (existing) {
      updateFolder(QUICK_BM_ID, {
        items: [...existing.items, bookmark],
      });
    } else {
      addFolder({
        id: QUICK_BM_ID,
        label: { he: "סימניות מהירות", en: "Quick Bookmarks", ru: "Быстрые закладки" },
        icon: "🔖",
        defaultSize: 2,
        gridCols: 1,
        gridRows: 4,
        items: [bookmark],
        pinned: false,
      });
    }

    window.dispatchEvent(
      new CustomEvent("cc-notify", {
        detail: { type: "success", message: t.widgets.bookmarkAdded || "Bookmark added" },
      })
    );
  }, [folders, pathname, addFolder, updateFolder, t]);

  // Display mode cycle
  const handleCycleDisplayMode = useCallback(() => {
    const modes = ["normal", "compact", "icons-only"] as const;
    const idx = modes.indexOf(displayMode);
    setDisplayMode(modes[(idx + 1) % modes.length]);
  }, [displayMode, setDisplayMode]);

  // Toggle widget lock
  const toggleWidgetLock = useCallback((widgetId: string) => {
    setWidgetLocks((prev) => {
      const next = { ...prev, [widgetId]: !prev[widgetId] };
      localStorage.setItem("cc-widget-locks", JSON.stringify(next));
      return next;
    });
  }, []);

  // Display mode dimensions
  const BAR_HEIGHT = displayMode === "compact" ? "h-9" : displayMode === "icons-only" ? "h-8" : "h-12";

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

  // Collect overflow widget IDs (widgets that don't fit in the bar)
  const overflowWidgetIds = useMemo(() => {
    if (totalColumns === 0) return [];
    return visibleWidgets
      .filter((widget) => {
        const col = widgetPositions[widget.id];
        if (col === undefined) return false;
        const wSize = widgetSizes[widget.id] ?? widget.defaultSize;
        return col + wSize > totalColumns;
      })
      .map((w) => w.id);
  }, [visibleWidgets, widgetPositions, widgetSizes, totalColumns]);

  // Auto-pack: removes gaps, preserves relative order
  const handleAutoPack = useCallback(() => {
    const positioned = allTopBarDefs
      .filter((item) => widgetPositions[item.id] !== undefined)
      .sort((a, b) => (widgetPositions[a.id] ?? 0) - (widgetPositions[b.id] ?? 0));

    const packed: Record<string, number> = {};
    let nextCol = 0;

    for (const item of positioned) {
      const size = widgetSizes[item.id] ?? item.defaultSize;
      if (nextCol + size <= totalColumns) {
        packed[item.id] = nextCol;
        nextCol += size;
      }
    }

    setWidgetPositions(packed);
  }, [allTopBarDefs, widgetPositions, widgetSizes, totalColumns, setWidgetPositions]);

  // Auto-initialize positions for widgets and folders that don't have one yet
  useEffect(() => {
    if (!mounted || allTopBarDefs.length === 0 || totalColumns === 0) return;

    const positions = widgetPositionsRef.current;
    const needsInit = allTopBarDefs.some(
      (item) => positions[item.id] === undefined
    );
    if (!needsInit) return;

    // Build occupied ranges from already-positioned items
    const occupied: { start: number; end: number }[] = [];
    for (const item of allTopBarDefs) {
      if (positions[item.id] !== undefined) {
        const size: WidgetSize = widgetSizes[item.id] ?? item.defaultSize;
        occupied.push({ start: positions[item.id], end: positions[item.id] + size });
      }
    }
    occupied.sort((a, b) => a.start - b.start);

    // Find first gap that fits the given size
    const findSlot = (size: number): number | null => {
      let candidate = 0;
      for (const range of occupied) {
        if (candidate + size <= range.start) return candidate;
        candidate = Math.max(candidate, range.end);
      }
      return candidate + size <= totalColumns ? candidate : null;
    };

    const newPositions = { ...positions };
    let changed = false;
    for (const item of allTopBarDefs) {
      if (newPositions[item.id] !== undefined) continue;
      const size: WidgetSize = widgetSizes[item.id] ?? item.defaultSize;
      const slot = findSlot(size);
      if (slot !== null) {
        newPositions[item.id] = slot;
        occupied.push({ start: slot, end: slot + size });
        occupied.sort((a, b) => a.start - b.start);
        changed = true;
      }
    }

    if (changed) {
      setWidgetPositions(newPositions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, allTopBarDefs, totalColumns, widgetSizes, setWidgetPositions]);

  // Clamp items that overflow after window resize — re-layout to avoid overlaps
  useEffect(() => {
    if (!mounted || totalColumns === 0) return;

    const positions = widgetPositionsRef.current;

    // Check if any item overflows
    const hasOverflow = allTopBarDefs.some((item) => {
      const pos = positions[item.id];
      if (pos === undefined) return false;
      const size: WidgetSize = widgetSizes[item.id] ?? item.defaultSize;
      return pos + size > totalColumns;
    });

    if (!hasOverflow) return;

    // Sort items by their current position to preserve relative order
    const positioned = allTopBarDefs
      .filter((item) => positions[item.id] !== undefined)
      .sort((a, b) => (positions[a.id] ?? 0) - (positions[b.id] ?? 0));

    const updated: Record<string, number> = { ...positions };
    let nextCol = 0;

    for (const item of positioned) {
      const size: WidgetSize = widgetSizes[item.id] ?? item.defaultSize;
      // Place at the max of its current position or the next available slot
      const idealCol = Math.max(positions[item.id] ?? 0, nextCol);
      if (idealCol + size <= totalColumns) {
        updated[item.id] = idealCol;
        nextCol = idealCol + size;
      } else if (nextCol + size <= totalColumns) {
        // Compact: place at next available slot
        updated[item.id] = nextCol;
        nextCol += size;
      }
      // else: doesn't fit — keep original position, render will hide it via bounds check
    }

    setWidgetPositions(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalColumns, mounted, allTopBarDefs, widgetSizes, setWidgetPositions]);

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

  // ─── Mobile: widget click inside panel ──────────────────────────────
  const handleMobileWidgetClick = useCallback((widgetId: string) => {
    // Modal/side-panel widgets — close the panel, open their modal
    if (widgetId === "ai-assistant") {
      setMobileWidgetPanelOpen(false);
      setMobileActiveWidgetId(null);
      handleAiOpen();
      return;
    }
    if (modalHandlers[widgetId]) {
      setMobileWidgetPanelOpen(false);
      setMobileActiveWidgetId(null);
      modalHandlers[widgetId]();
      return;
    }
    // Dropdown widgets — toggle inline panel inside the side panel
    setMobileActiveWidgetId((prev) => (prev === widgetId ? null : widgetId));
  }, [handleAiOpen, modalHandlers]);

  // ─── Mobile: shared modals ────────────────────────────────────────
  const mobileModals = (
    <>
      {storeOpen && <WidgetStore onClose={() => setStoreOpen(false)} />}
      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}
      {shortcutsOpen && <ShortcutsPanel onClose={() => setShortcutsOpen(false)} />}
      {plannerOpen && <WeeklyPlannerPanel onClose={() => setPlannerOpen(false)} />}
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

  // ─── Mobile: minimal top bar + full-screen widget panel ─────────────
  if (isMobile) {
    const activeWidget = mobileActiveWidgetId
      ? visibleWidgets.find((w) => w.id === mobileActiveWidgetId)
      : null;
    const ActiveContent = activeWidget?.component;

    // Widget panel is triggered by bottom bar via cc-widget-panel-toggle event
    return (
      <>
        {/* Minimal top bar — no buttons, navigation moved to bottom bar */}
        <div
          data-cc-id="topbar.root"
          className="fixed top-0 z-40 flex h-10 items-center border-b border-slate-700/50 backdrop-blur-sm"
          style={{ left: 0, right: 0, backgroundColor: "color-mix(in srgb, var(--nav-bg) 80%, transparent)" }}
        >
          <div className="flex-1" />
        </div>

        {/* Full-screen Widget Panel Popup */}
        {mobileWidgetPanelOpen && (
          <div
            data-cc-id="topbar.mobile-widget-panel"
            className="fixed inset-0 z-[56] flex flex-col bg-slate-900"
          >
            {/* Panel header */}
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-700 px-4">
              <div className="flex items-center gap-2 min-w-0">
                <Grid3X3 className="h-4 w-4 text-[var(--cc-accent-400)] shrink-0" />
                <h2 className="text-sm font-semibold text-slate-200 shrink-0">
                  {t.widgets.store || "Widgets"}
                </h2>
                {activeProfileId && (() => {
                  const s = t.settings as Record<string, string>;
                  const bp = BUILTIN_PROFILES.find((p) => p.id === activeProfileId);
                  const up = profiles.find((p) => p.id === activeProfileId);
                  const name = bp?.nameKey ? (s[bp.nameKey] || bp.name) : up?.name;
                  return name ? (
                    <span className="truncate rounded-full bg-[var(--cc-accent-600-30)] px-2 py-0.5 text-[10px] font-medium text-[var(--cc-accent-300)]">
                      {name}
                    </span>
                  ) : null;
                })()}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setMobileWidgetPanelOpen(false);
                    setMobileActiveWidgetId(null);
                    setStoreOpen(true);
                  }}
                  className="rounded p-1.5 text-slate-400 active:bg-slate-700"
                  aria-label={t.widgets.editMode}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileWidgetPanelOpen(false);
                    setMobileActiveWidgetId(null);
                  }}
                  className="rounded p-1.5 text-slate-400 active:bg-slate-700"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Widget grid — scrollable, with bottom bar clearance */}
            <div
              className="flex-1 overflow-y-auto"
              style={{ paddingBottom: "calc(3.5rem + var(--safe-area-bottom, 0px))" }}
            >
              <div className="grid grid-cols-3 gap-2 p-3">
                {visibleWidgets.map((widget) => (
                  <button
                    key={widget.id}
                    type="button"
                    onClick={() => handleMobileWidgetClick(widget.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition-colors ${
                      mobileActiveWidgetId === widget.id
                        ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
                        : "text-slate-400 active:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      mobileActiveWidgetId === widget.id
                        ? "bg-[var(--cc-accent-600-30)]"
                        : "bg-slate-800"
                    }`}>
                      <widget.icon className="h-5 w-5" />
                    </div>
                    <span className="max-w-full truncate text-[10px] font-medium">
                      {widget.label[language]}
                    </span>
                  </button>
                ))}

                {/* Widget Store button */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileWidgetPanelOpen(false);
                    setMobileActiveWidgetId(null);
                    setStoreOpen(true);
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-slate-600 p-2.5 text-slate-500 active:bg-slate-800"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/50">
                    <Store className="h-5 w-5" />
                  </div>
                  <span className="max-w-full truncate text-[10px] font-medium">
                    {t.widgets.store}
                  </span>
                </button>
              </div>

              {/* Active widget panel content (inline) */}
              {activeWidget && ActiveContent && (
                <div className="border-t border-slate-700">
                  <div className="flex items-center gap-2 border-b border-slate-700/50 px-4 py-2.5">
                    <activeWidget.icon className="h-4 w-4 text-[var(--cc-accent-400)]" />
                    <span className="text-sm font-semibold text-slate-200">
                      {activeWidget.label[language]}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMobileActiveWidgetId(null)}
                      className="ms-auto text-slate-500 active:text-slate-300"
                      aria-label="Close"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-4">
                    <ActiveContent />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {mobileModals}
      </>
    );
  }

  // ─── Desktop: full widget grid (existing behavior) ─────────────────
  const hoverHidden = topbarHover && !topbarHovered;
  return (
    <>
      {/* Hover trigger zone — invisible 8px strip at the top */}
      {topbarHover && (
        <div
          className="fixed top-0 left-0 right-0 z-[41] h-2"
          onMouseEnter={() => setTopbarHovered(true)}
        />
      )}
      <div
        data-cc-id="topbar.root"
        className={`fixed z-40 flex ${BAR_HEIGHT} items-center border-b border-slate-700 transition-all duration-200 ease-out ${
          hoverHidden ? "opacity-0 -translate-y-full pointer-events-none" : "opacity-100 translate-y-0"
        }`}
        style={{ top: topOffset ?? 0, left: 0, right: 0, backgroundColor: "var(--nav-bg)" }}
        onMouseEnter={topbarHover ? () => setTopbarHovered(true) : undefined}
        onMouseLeave={topbarHover ? () => setTopbarHovered(false) : undefined}
      >
        {/* Hamburger — left side */}
        {sidebarPosition === "left" && sidebarVisibility === "hidden" && onSidebarOpen && (
          <button
            type="button"
            onClick={onSidebarOpen}
            className="flex h-12 w-12 shrink-0 items-center justify-center border-r border-slate-700 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div ref={containerRef} className="relative h-full flex-1">
          {!mounted ? (
            <span className="px-3 text-xs text-slate-500">&nbsp;</span>
          ) : allTopBarDefs.length > 0 ? (
            <DndContext
              id="topbar-dnd"
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

              {/* Gap visualization — edit mode only */}
              {editMode && !activeDragId && (() => {
                const occupied = new Set<number>();
                for (const item of allTopBarDefs) {
                  const col = widgetPositions[item.id];
                  if (col === undefined) continue;
                  const sz = widgetSizes[item.id] ?? item.defaultSize;
                  for (let c = col; c < col + sz && c < totalColumns; c++) {
                    occupied.add(c);
                  }
                }
                return (
                  <div className="pointer-events-none absolute inset-0">
                    {Array.from({ length: totalColumns }).map((_, i) =>
                      !occupied.has(i) ? (
                        <div
                          key={i}
                          className="absolute top-1.5 bottom-1.5 rounded-sm border border-dashed border-slate-600/30 bg-slate-700/10"
                          style={{ left: i * UNIT + 2, width: UNIT - 4 }}
                        />
                      ) : null
                    )}
                  </div>
                );
              })()}

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

              {/* Widgets — hide any that overflow the available columns */}
              {visibleWidgets.map((widget) => {
                const col = widgetPositions[widget.id];
                if (col === undefined) return null;
                const wSize = widgetSizes[widget.id] ?? widget.defaultSize;
                if (col + wSize > totalColumns) return null;

                // Determine custom click behavior based on panel mode override or widget default
                const effectivePanelMode = widgetPanelModes[widget.id] || widget.panelMode;
                let customClick: (() => void) | undefined;
                if (effectivePanelMode === "side-panel") {
                  if (widget.id === "ai-assistant") {
                    customClick = handleAiOpen;
                  } else {
                    customClick = () => setSidePanelWidgetId(
                      (prev) => prev === widget.id ? null : widget.id
                    );
                  }
                } else if (modalHandlers[widget.id]) {
                  customClick = modalHandlers[widget.id];
                }

                return (
                  <WidgetWrapper
                    key={widget.id}
                    widget={widget}
                    column={col}
                    onEditOpen={setEditingWidgetId}
                    aiPanelOffset={aiPanelOffset}
                    onCustomClick={customClick}
                    locked={widgetLocks[widget.id]}
                    onToggleLock={toggleWidgetLock}
                    customIcon={widgetIcons[widget.id]}
                  />
                );
              })}

              {/* Folders — hide any that overflow the available columns */}
              {visibleFolders.map((folder) => {
                const col = widgetPositions[folder.id];
                if (col === undefined) return null;
                const fSize = widgetSizes[folder.id] ?? folder.defaultSize;
                if (col + fSize > totalColumns) return null;
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

        {/* Profile Switcher */}
        <ProfileSwitcher />

        {/* Apps Drawer */}
        <AppsDrawer onOpenWidget={handleOpenFromApps} />

        {/* Quick Bookmark */}
        <button
          type="button"
          onClick={handleQuickBookmark}
          aria-label={t.widgets.quickBookmark || "Bookmark"}
          className="mx-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
          title={t.widgets.quickBookmark || "Bookmark"}
        >
          <Bookmark className="h-4 w-4" />
        </button>

        {/* Edit Mode toggle */}
        <button
          type="button"
          onClick={() => setEditMode(!editMode)}
          aria-label={t.widgets.editMode}
          aria-pressed={editMode}
          className={`mx-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors ${
            editMode
              ? "bg-[var(--cc-accent-600)] text-white"
              : "text-slate-500 hover:bg-slate-700 hover:text-slate-300"
          }`}
          title={t.widgets.editMode}
        >
          <Pencil className="h-4 w-4" />
        </button>

        {/* Auto-Pack (edit mode only) */}
        {editMode && (
          <button
            type="button"
            onClick={handleAutoPack}
            aria-label={t.widgets.autoPack || "Auto-pack"}
            className="mx-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
            title={t.widgets.autoPack || "Auto-pack"}
          >
            <AlignHorizontalJustifyStart className="h-4 w-4" />
          </button>
        )}

        {/* Display Mode cycle */}
        <button
          type="button"
          onClick={handleCycleDisplayMode}
          aria-label={t.widgets.displayMode || "Display Mode"}
          className="mx-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
          title={`${t.widgets.displayMode || "Display Mode"}: ${displayMode}`}
        >
          <LayoutList className="h-4 w-4" />
        </button>

        {/* Overflow Menu — widgets that don't fit */}
        <OverflowMenu widgetIds={overflowWidgetIds} onWidgetClick={handleOverflowClick} />

        {/* Quick Settings */}
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label={t.smartBar?.pinnedSettings || "Settings"}
          className="mx-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
          title={t.smartBar?.pinnedSettings || "Settings"}
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* Shell Preferences */}
        <button
          ref={shellPrefsBtnRef}
          type="button"
          onClick={() => setShellPrefsOpen((v) => !v)}
          aria-label={(t.shellPrefs as Record<string, string>).title}
          className={`mx-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors ${
            shellPrefsOpen
              ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
              : "text-slate-500 hover:bg-slate-700 hover:text-slate-300"
          }`}
          title={(t.shellPrefs as Record<string, string>).title}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        {/* Widget Store button */}
        <button
          type="button"
          onClick={() => setStoreOpen(true)}
          aria-label={t.widgets.store}
          className="mx-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
          title={t.widgets.store}
        >
          <Store className="h-4 w-4" />
        </button>

        {/* Hamburger — right side */}
        {sidebarPosition === "right" && sidebarVisibility === "hidden" && onSidebarOpen && (
          <button
            type="button"
            onClick={onSidebarOpen}
            className="flex h-12 w-12 shrink-0 items-center justify-center border-l border-slate-700 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
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

      {/* Widget Store — AppStorePanel for desktop */}
      {storeOpen && <AppStorePanel onClose={() => setStoreOpen(false)} />}

      {/* Quick Settings Panel */}
      {settingsOpen && <SettingsFolderPanel onClose={() => setSettingsOpen(false)} />}

      {/* Shell Preferences Panel */}
      {shellPrefsOpen && (
        <ShellPrefsPanel
          onClose={() => setShellPrefsOpen(false)}
          anchorRef={shellPrefsBtnRef}
        />
      )}

      {/* Search modal */}
      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}

      {/* Shortcuts modal */}
      {shortcutsOpen && <ShortcutsPanel onClose={() => setShortcutsOpen(false)} />}

      {/* Weekly Planner modal */}
      {plannerOpen && <WeeklyPlannerPanel onClose={() => setPlannerOpen(false)} />}

      {/* AI panel — standalone modes (dropdown, floating) */}
      {aiPanelOpen && aiViewMode !== "side-panel" && (
        <AIPanel
          onClose={() => setAiPanelOpen(false)}
          viewMode={aiViewMode}
          onViewModeChange={(mode) => {
            setAiViewMode(mode);
            localStorage.setItem("cc-ai-view-mode", mode);
          }}
        />
      )}

      {/* Tabbed Side Panel — AI (side-panel mode) + any widget */}
      {(sidePanelWidgetId || (aiPanelOpen && aiViewMode === "side-panel")) && (
        <TabbedSidePanel
          initialWidgetId={sidePanelWidgetId || "ai-assistant"}
          showAiTab
          onClose={() => {
            setSidePanelWidgetId(null);
            if (aiViewMode === "side-panel") setAiPanelOpen(false);
          }}
        />
      )}
    </>
  );
}
