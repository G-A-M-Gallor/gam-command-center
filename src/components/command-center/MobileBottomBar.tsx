"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Grid3X3,
  Menu,
  X,
  Circle,
  Pencil,
} from "lucide-react";
import { NAV_GROUPS, type NavItem } from "./Sidebar";
import { widgetRegistry } from "./widgets/WidgetRegistry";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { useMobileBottomBar, type BottomBarSlot } from "@/lib/hooks/useMobileBottomBar";
import type { Language } from "@/contexts/SettingsContext";

// ─── Helpers ────────────────────────────────────────────

/** Find a NavItem by its key across all groups */
function findNavItem(key: string): NavItem | undefined {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => i.key === key);
    if (item) return item;
  }
  return undefined;
}

/** Find a widget definition by id */
function findWidget(id: string) {
  return widgetRegistry.find((w) => w.id === id && w.status === "active");
}

// ─── SlotPicker Modal ───────────────────────────────────

interface SlotPickerProps {
  slotIndex: 0 | 1 | 2;
  onSelect: (slot: BottomBarSlot | null) => void;
  onClose: () => void;
  language: Language;
}

function SlotPicker({ slotIndex, onSelect, onClose, language }: SlotPickerProps) {
  const t = getTranslations(language);
  const bb = t.bottomBar as Record<string, string>;
  const tabs = t.tabs as Record<string, string>;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-end justify-center">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
        aria-label={t.common.close}
      />
      {/* Sheet */}
      <div
        className="relative z-10 w-full max-h-[70vh] overflow-y-auto rounded-t-2xl bg-slate-800 border-t border-slate-700"
        style={{ paddingBottom: "var(--safe-area-bottom, 0px)" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-200">{bb.pickSlot}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 active:bg-slate-700"
            aria-label={t.common.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Clear option */}
        <button
          type="button"
          onClick={() => { onSelect(null); onClose(); }}
          className="flex w-full items-center gap-3 px-4 py-3 text-red-400 active:bg-slate-700/50"
        >
          <X className="h-4 w-4" />
          <span className="text-sm">{bb.clearSlot}</span>
        </button>

        <div className="mx-4 border-t border-slate-700/50" />

        {/* Pages section */}
        <div className="px-4 pt-3 pb-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            {bb.pages}
          </span>
        </div>
        {NAV_GROUPS.flatMap((group) => group.items).map((item) => {
          const Icon = item.icon;
          const label = tabs[item.key] || item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                onSelect({ type: "page", id: item.key });
                onClose();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-slate-300 active:bg-slate-700/50"
            >
              <Icon className="h-4 w-4 text-slate-400" />
              <span className="text-sm">{label}</span>
            </button>
          );
        })}

        <div className="mx-4 border-t border-slate-700/50" />

        {/* Widgets section */}
        <div className="px-4 pt-3 pb-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            {bb.widgets}
          </span>
        </div>
        {widgetRegistry
          .filter((w) => w.status === "active")
          .map((widget) => {
            const Icon = widget.icon;
            return (
              <button
                key={widget.id}
                type="button"
                onClick={() => {
                  onSelect({ type: "widget", id: widget.id });
                  onClose();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-slate-300 active:bg-slate-700/50"
              >
                <Icon className="h-4 w-4 text-slate-400" />
                <span className="text-sm">{widget.label[language]}</span>
              </button>
            );
          })}
      </div>
    </div>,
    document.body
  );
}

// ─── MobileBottomBar ────────────────────────────────────

interface MobileBottomBarProps {
  onSidebarOpen: () => void;
  onWidgetPanelOpen: () => void;
}

export function MobileBottomBar({ onSidebarOpen, onWidgetPanelOpen }: MobileBottomBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useSettings();
  const t = getTranslations(language);
  const bb = t.bottomBar as Record<string, string>;
  const tabs = t.tabs as Record<string, string>;
  const { slots, editMode, setEditMode, setSlot } = useMobileBottomBar();
  const [pickerIndex, setPickerIndex] = useState<0 | 1 | 2 | null>(null);

  // Long-press detection
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleLongPressStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setEditMode(true);
    }, 3000);
  }, [setEditMode]);
  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  // ── Slot click handler ─────────────────────────────────
  const handleSlotClick = useCallback((index: 0 | 1 | 2) => {
    if (editMode) {
      setPickerIndex(index);
      return;
    }
    const slot = slots[index];
    if (!slot) return;

    if (slot.type === "page") {
      const navItem = findNavItem(slot.id);
      if (navItem) router.push(navItem.href);
    } else {
      // Widget — dispatch event to open widget panel with this widget
      const widget = findWidget(slot.id);
      if (!widget) return;
      if (widget.panelMode === "modal" || widget.panelMode === "side-panel") {
        // Trigger specific widget modal
        if (slot.id === "search") window.dispatchEvent(new Event("cc-open-search"));
        else if (slot.id === "ai-assistant") window.dispatchEvent(new Event("cc-open-ai"));
        else if (slot.id === "keyboard-shortcuts") window.dispatchEvent(new Event("cc-open-shortcuts"));
        else if (slot.id === "weekly-planner") {
          // Open widget panel and activate this widget
          onWidgetPanelOpen();
        }
      } else {
        // Open widget panel with this widget selected
        onWidgetPanelOpen();
      }
    }
  }, [editMode, slots, router, onWidgetPanelOpen]);

  // ── Render a middle slot ───────────────────────────────
  const renderSlot = (index: 0 | 1 | 2) => {
    const slot = slots[index];
    if (!slot) {
      return (
        <button
          type="button"
          onClick={() => editMode && setPickerIndex(index)}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 ${
            editMode ? "text-slate-500 active:bg-slate-700/50" : "text-slate-600"
          }`}
        >
          <Circle className="h-5 w-5" strokeDasharray="4 2" />
          <span className="text-[9px]">{bb.emptySlot}</span>
        </button>
      );
    }

    if (slot.type === "page") {
      const navItem = findNavItem(slot.id);
      if (!navItem) return null;
      const Icon = navItem.icon;
      const label = tabs[slot.id] || slot.id;
      const isActive = navItem.href === "/dashboard"
        ? pathname === "/dashboard"
        : (pathname === navItem.href || pathname.startsWith(navItem.href + "/"));

      return (
        <button
          type="button"
          onClick={() => handleSlotClick(index)}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
            isActive
              ? "text-[var(--cc-accent-400)]"
              : "text-slate-400 active:text-slate-200"
          }`}
        >
          <Icon className="h-5 w-5" />
          <span className="text-[9px] font-medium truncate max-w-[60px]">{label}</span>
        </button>
      );
    }

    // Widget slot
    const widget = findWidget(slot.id);
    if (!widget) return null;
    const Icon = widget.icon;
    return (
      <button
        type="button"
        onClick={() => handleSlotClick(index)}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-slate-400 active:text-slate-200 transition-colors"
      >
        <Icon className="h-5 w-5" />
        <span className="text-[9px] font-medium truncate max-w-[60px]">{widget.label[language]}</span>
      </button>
    );
  };

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] border-t border-slate-700 bg-slate-800"
        style={{ paddingBottom: "var(--safe-area-bottom, 0px)" }}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onTouchCancel={handleLongPressEnd}
      >
        {/* Edit mode indicator */}
        {editMode && (
          <div className="flex items-center justify-between border-b border-slate-700/50 bg-[var(--cc-accent-600-20)] px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              <Pencil className="h-3 w-3 text-[var(--cc-accent-400)]" />
              <span className="text-[11px] font-medium text-[var(--cc-accent-300)]">{bb.editMode}</span>
            </div>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="rounded-full bg-[var(--cc-accent-600)] px-3 py-0.5 text-[11px] font-medium text-white active:opacity-80"
            >
              {bb.done}
            </button>
          </div>
        )}

        {/* 5-slot bar */}
        <div className="flex h-14 items-stretch">
          {/* Slot 0: Widget panel toggle */}
          <button
            type="button"
            onClick={onWidgetPanelOpen}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-slate-400 active:text-[var(--cc-accent-400)] transition-colors"
          >
            <Grid3X3 className="h-5 w-5" />
            <span className="text-[9px] font-medium">{bb.widgetPanel}</span>
          </button>

          {/* Middle 3 customizable slots */}
          {([0, 1, 2] as const).map((i) => (
            <div key={i} className="flex flex-1">
              {renderSlot(i)}
            </div>
          ))}

          {/* Slot 4: Sidebar toggle */}
          <button
            type="button"
            onClick={onSidebarOpen}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-slate-400 active:text-[var(--cc-accent-400)] transition-colors"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[9px] font-medium">{bb.sidebar}</span>
          </button>
        </div>
      </div>

      {/* SlotPicker modal */}
      {pickerIndex !== null && (
        <SlotPicker
          slotIndex={pickerIndex}
          language={language}
          onSelect={(slot) => setSlot(pickerIndex, slot)}
          onClose={() => setPickerIndex(null)}
        />
      )}
    </>
  );
}
