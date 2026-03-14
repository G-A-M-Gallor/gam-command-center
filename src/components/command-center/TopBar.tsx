"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Grid3X3, Pencil, Store } from "lucide-react";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import {
  widgetRegistry,
  getEffectivePlacement,
} from "./widgets/WidgetRegistry";
import { WidgetSettings } from "./widgets/WidgetSettings";
import { WidgetStore } from "./widgets/WidgetStore";
import { FolderSettings } from "./widgets/FolderSettings";
import { SearchPanel } from "./widgets/SearchWidget";
import { ShortcutsPanel } from "./widgets/ShortcutsWidget";
import { WeeklyPlannerPanel } from "./widgets/WeeklyPlannerWidget";
import { AIPanel, type AIViewMode } from "./widgets/AIWidget";
import { UniversalSidePanel } from "./widgets/UniversalSidePanel";
import { SmartBar } from "./SmartBar";
import { AppStorePanel } from "./AppStorePanel";
import { SettingsFolderPanel } from "./SettingsFolderPanel";
import { useWidgets, BUILTIN_PROFILES } from "@/contexts/WidgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useDashboardMode } from "@/contexts/DashboardModeContext";
import { getTranslations } from "@/lib/i18n";

interface TopBarProps {
  onSidebarOpen?: () => void;
}

export function TopBar({ onSidebarOpen }: TopBarProps) {
  const {
    widgetPlacements,
    activeProfileId,
    profiles,
    widgetPanelModes,
  } = useWidgets();
  const { sidebarPosition, sidebarVisibility, setSidebarVisibility, language } = useSettings();
  const { editMode, setEditMode, guideMode, setGuideMode } = useDashboardMode();
  const router = useRouter();
  const t = getTranslations(language);
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";

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
  const [appStorePanelOpen, setAppStorePanelOpen] = useState(false);
  const [settingsFolderOpen, setSettingsFolderOpen] = useState(false);

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

  // Visible widgets (placement === "toolbar")
  const visibleWidgets = useMemo(() => {
    return widgetRegistry.filter((w) => {
      if (w.status !== "active") return false;
      return getEffectivePlacement(w.id, widgetPlacements, w.isRemovable) === "toolbar";
    });
  }, [widgetPlacements]);

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

  // ─── SmartBar widget click handler ──────────────────────────────────
  const handleSmartBarWidgetClick = useCallback((widgetId: string) => {
    // Determine click behavior based on panel mode
    const widget = widgetRegistry.find((w) => w.id === widgetId);
    if (!widget) return;

    const effectivePanelMode = widgetPanelModes[widgetId] || widget.panelMode;

    if (effectivePanelMode === "side-panel") {
      if (widgetId === "ai-assistant") {
        handleAiOpen();
      } else {
        setSidePanelWidgetId((prev) => (prev === widgetId ? null : widgetId));
      }
    } else if (modalHandlers[widgetId]) {
      modalHandlers[widgetId]();
    } else {
      // Default: dispatch custom event for widget dropdown
      window.dispatchEvent(new CustomEvent(`cc-widget-open-${widgetId}`));
    }
  }, [widgetPanelModes, handleAiOpen, modalHandlers]);

  // ─── Desktop: SmartBar ─────────────────────────────────────────────
  return (
    <>
      <SmartBar
        onWidgetClick={handleSmartBarWidgetClick}
        onEditWidget={setEditingWidgetId}
        onOpenStore={() => setAppStorePanelOpen(true)}
        onOpenSettings={() => setSettingsFolderOpen(true)}
        onSidebarOpen={onSidebarOpen}
        sidebarPosition={sidebarPosition}
        sidebarVisibility={sidebarVisibility}
      />

      {/* Widget settings panel */}
      {editingWidgetId && (
        <WidgetSettings
          widgetId={editingWidgetId}
          onClose={() => setEditingWidgetId(null)}
          onOpenLibrary={() => setAppStorePanelOpen(true)}
        />
      )}

      {/* Folder settings panel */}
      {editingFolderId && (
        <FolderSettings
          folderId={editingFolderId}
          onClose={() => setEditingFolderId(null)}
        />
      )}

      {/* Legacy Widget Store (fallback) */}
      {storeOpen && <WidgetStore onClose={() => setStoreOpen(false)} />}

      {/* AppStore Panel (new split layout) */}
      {appStorePanelOpen && <AppStorePanel onClose={() => setAppStorePanelOpen(false)} />}

      {/* Settings Folder Panel */}
      {settingsFolderOpen && <SettingsFolderPanel onClose={() => setSettingsFolderOpen(false)} />}

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

      {/* Universal Side Panel — for any widget with side-panel mode */}
      {sidePanelWidgetId && (() => {
        const w = widgetRegistry.find((wr) => wr.id === sidePanelWidgetId);
        if (!w) return null;
        return (
          <UniversalSidePanel
            widget={w}
            onClose={() => setSidePanelWidgetId(null)}
            onSwitchToDropdown={() => setSidePanelWidgetId(null)}
          />
        );
      })()}
    </>
  );
}
