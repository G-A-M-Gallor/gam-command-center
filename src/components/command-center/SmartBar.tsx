"use client";

import { useRef, useCallback, useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Settings, Store, Menu } from "lucide-react";
import { useSmartBar } from "@/hooks/useSmartBar";
import { useWidgets } from "@/contexts/WidgetContext";
import { useDashboardMode } from "@/contexts/DashboardModeContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { BarSlot } from "./BarSlot";
import { OverflowMenu } from "./OverflowMenu";
import { ProfileSwitcher } from "./widgets/ProfileSwitcher";

const UNIT = 48;

interface SmartBarProps {
  onWidgetClick: (widgetId: string) => void;
  onEditWidget: (widgetId: string) => void;
  onOpenStore: () => void;
  onOpenSettings: () => void;
  onSidebarOpen?: () => void;
  sidebarPosition: string;
  sidebarVisibility: string;
}

export function SmartBar({
  onWidgetClick,
  onEditWidget,
  onOpenStore,
  onOpenSettings,
  onSidebarOpen,
  sidebarPosition,
  sidebarVisibility,
}: SmartBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { displayMode } = useWidgets();
  const { editMode } = useDashboardMode();
  const { language } = useSettings();
  const t = getTranslations(language);

  const {
    visibleSlots,
    overflowSlots,
    reorderWidget,
    toggleLock,
    isLocked,
  } = useSmartBar(containerRef);

  // Display mode dimensions
  const BAR_HEIGHT = displayMode === "compact" ? "h-9" : displayMode === "icons-only" ? "h-8" : "h-12";

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback((_event: DragStartEvent) => {
    // Could add visual feedback here
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const widgetId = String(event.active.id);
      const colDelta = Math.round(event.delta.x / UNIT);

      if (colDelta === 0) return;

      // Find current column
      let currentCol = 0;
      for (const slot of visibleSlots) {
        if (slot.widgetId === widgetId) break;
        currentCol += slot.size;
      }

      const newCol = Math.max(0, currentCol + colDelta);
      reorderWidget(widgetId, newCol);
    },
    [visibleSlots, reorderWidget]
  );

  // Compute column positions for visible slots
  const slotColumns = useMemo(() => {
    const cols: Record<string, number> = {};
    let col = 0;
    for (const slot of visibleSlots) {
      cols[slot.widgetId] = col;
      col += slot.size;
    }
    return cols;
  }, [visibleSlots]);

  return (
    <div
      data-cc-id="topbar.root"
      className={`fixed top-0 z-40 flex ${BAR_HEIGHT} items-center border-b border-slate-700`}
      style={{ left: 0, right: 0, backgroundColor: "var(--nav-bg)" }}
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

      {/* Pinned Left — Settings */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="flex h-full w-12 shrink-0 items-center justify-center border-r border-slate-700/50 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200"
        title={t.smartBar?.pinnedSettings || "Settings"}
      >
        <Settings className="h-4 w-4" />
      </button>

      {/* Dynamic Slots Container */}
      <div ref={containerRef} className="relative h-full flex-1 min-w-0">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {visibleSlots.map((slot) => (
            <BarSlot
              key={slot.widgetId}
              widgetId={slot.widgetId}
              size={slot.size}
              locked={slot.locked}
              column={slotColumns[slot.widgetId] ?? 0}
              editMode={editMode}
              onToggleLock={toggleLock}
              onWidgetClick={onWidgetClick}
              onEditWidget={onEditWidget}
              displayMode={displayMode}
            />
          ))}
        </DndContext>

        {/* Empty state */}
        {visibleSlots.length === 0 && (
          <span className="absolute inset-0 flex items-center px-3 text-xs text-slate-500">
            {t.widgets?.noWidgets || "No widgets"}
          </span>
        )}
      </div>

      {/* Overflow Menu */}
      <OverflowMenu slots={overflowSlots} onWidgetClick={onWidgetClick} />

      {/* Pinned Right — Store + Profile */}
      <button
        type="button"
        onClick={onOpenStore}
        className="flex h-full w-10 shrink-0 items-center justify-center text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
        title={t.widgets?.store || "Widget Store"}
      >
        <Store className="h-4 w-4" />
      </button>

      <ProfileSwitcher />

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
  );
}
