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
  MoreHorizontal,
  ChevronUp,
  GripHorizontal,
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

// ─── Full Nav Sheet (shared by all skins) ───────────────

function FullNavSheet({
  onClose,
  onSidebarToggle,
  onWidgetPanelOpen,
  language,
}: {
  onClose: () => void;
  onSidebarToggle: () => void;
  onWidgetPanelOpen: () => void;
  language: Language;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = getTranslations(language);
  const tabs = t.tabs as Record<string, string>;
  const bb = t.bottomBar as Record<string, string>;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-end justify-center">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
        aria-label={bb.closeMenu}
      />
      <div
        className="relative z-10 w-full max-h-[80vh] overflow-y-auto rounded-t-2xl bg-slate-800 border-t border-slate-700"
        style={{ paddingBottom: "var(--safe-area-bottom, 0px)" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-200">{bb.navigation}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 active:bg-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav groups */}
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            <div className="px-4 pt-3 pb-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                {(t.sidebar as Record<string, string>)[group.labelKey] || group.labelKey}
              </span>
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const label = tabs[item.key] || item.key;
              const isActive = item.href === "/dashboard"
                ? pathname === "/dashboard"
                : (pathname === item.href || pathname.startsWith(item.href + "/"));
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 active:bg-slate-700/50 ${
                    isActive ? "text-[var(--cc-accent-400)]" : "text-slate-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{label}</span>
                </button>
              );
            })}
          </div>
        ))}

        {/* Quick actions */}
        <div className="mx-4 border-t border-slate-700/50 mt-2" />
        <div className="flex gap-2 p-4">
          <button
            type="button"
            onClick={() => { onSidebarToggle(); onClose(); }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-700/50 py-2.5 text-sm text-slate-300 active:bg-slate-600"
          >
            <Menu className="h-4 w-4" />
            {bb.sidebar}
          </button>
          <button
            type="button"
            onClick={() => { onWidgetPanelOpen(); onClose(); }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-700/50 py-2.5 text-sm text-slate-300 active:bg-slate-600"
          >
            <Grid3X3 className="h-4 w-4" />
            {bb.widgetPanel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── SlotPicker Modal ───────────────────────────────────

interface SlotPickerProps {
  slotIndex: 0 | 1 | 2;
  onSelect: (slot: BottomBarSlot | null) => void;
  onClose: () => void;
  language: Language;
}

function SlotPicker({ onSelect, onClose, language }: SlotPickerProps) {
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
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  onWidgetPanelOpen: () => void;
}

export function MobileBottomBar({ sidebarOpen, onSidebarToggle, onWidgetPanelOpen }: MobileBottomBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, skinConfig } = useSettings();
  const t = getTranslations(language);
  const bb = t.bottomBar as Record<string, string>;
  const tabs = t.tabs as Record<string, string>;
  const { slots, editMode, setEditMode, setSlot } = useMobileBottomBar();
  const [pickerIndex, setPickerIndex] = useState<0 | 1 | 2 | null>(null);
  const [fullNavOpen, setFullNavOpen] = useState(false);

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
          onWidgetPanelOpen();
        }
      } else {
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

  const mobileNavSkin = skinConfig.mobileNav;

  // ═══════════════════════════════════════════════════════
  // SKIN: top-hamburger — hamburger icon in top corner
  // ═══════════════════════════════════════════════════════
  if (mobileNavSkin === "top-hamburger") {
    return (
      <>
        {/* Hamburger button — fixed top corner */}
        <button
          type="button"
          onClick={() => setFullNavOpen(true)}
          className="fixed top-3 start-3 z-[61] rounded-lg bg-slate-800/90 border border-slate-700 p-2 text-slate-300 active:bg-slate-700 backdrop-blur-sm"
          aria-label={bb.openMenu}
        >
          <Menu className="h-5 w-5" />
        </button>

        {fullNavOpen && (
          <FullNavSheet
            onClose={() => setFullNavOpen(false)}
            onSidebarToggle={onSidebarToggle}
            onWidgetPanelOpen={onWidgetPanelOpen}
            language={language}
          />
        )}
      </>
    );
  }

  // ═══════════════════════════════════════════════════════
  // SKIN: floating-fab — single draggable FAB
  // ═══════════════════════════════════════════════════════
  if (mobileNavSkin === "floating-fab") {
    return (
      <>
        <FloatingFab onOpen={() => setFullNavOpen(true)} label={bb.menu} />

        {fullNavOpen && (
          <FullNavSheet
            onClose={() => setFullNavOpen(false)}
            onSidebarToggle={onSidebarToggle}
            onWidgetPanelOpen={onWidgetPanelOpen}
            language={language}
          />
        )}
      </>
    );
  }

  // ═══════════════════════════════════════════════════════
  // SKIN: swipe-drawer — edge grab handle + backup button
  // ═══════════════════════════════════════════════════════
  if (mobileNavSkin === "swipe-drawer") {
    return (
      <>
        {/* Edge grab handle — start side */}
        <button
          type="button"
          onClick={onSidebarToggle}
          className="fixed top-1/2 start-0 z-[61] -translate-y-1/2 rounded-e-lg bg-slate-700/60 border border-slate-600 border-s-0 py-6 px-1 text-slate-400 active:bg-slate-600 backdrop-blur-sm"
          aria-label={bb.openMenu}
        >
          <GripHorizontal className="h-3 w-3" />
        </button>

        {/* Backup hamburger in header */}
        <button
          type="button"
          onClick={() => setFullNavOpen(true)}
          className="fixed top-3 start-3 z-[59] rounded-lg bg-slate-800/80 border border-slate-700 p-1.5 text-slate-400 active:bg-slate-700"
          aria-label={bb.openMenu}
        >
          <Menu className="h-4 w-4" />
        </button>

        {fullNavOpen && (
          <FullNavSheet
            onClose={() => setFullNavOpen(false)}
            onSidebarToggle={onSidebarToggle}
            onWidgetPanelOpen={onWidgetPanelOpen}
            language={language}
          />
        )}
      </>
    );
  }

  // ═══════════════════════════════════════════════════════
  // SKIN: tab-drawer — tabs at bottom + "More" for full nav
  // ═══════════════════════════════════════════════════════
  if (mobileNavSkin === "tab-drawer") {
    // Show first 3 slots as tabs + a "More" tab
    return (
      <>
        <div
          className="fixed bottom-0 left-0 right-0 z-[60] border-t border-slate-700 bg-slate-800"
          style={{ paddingBottom: "var(--safe-area-bottom, 0px)" }}
        >
          <div className="flex h-14 items-stretch">
            {/* Customizable slots */}
            {([0, 1, 2] as const).map((i) => (
              <div key={i} className="flex flex-1">
                {renderSlot(i)}
              </div>
            ))}

            {/* More button → full nav */}
            <button
              type="button"
              onClick={() => setFullNavOpen(true)}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-slate-400 active:text-[var(--cc-accent-400)] transition-colors"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[9px] font-medium">{bb.more}</span>
            </button>
          </div>
        </div>

        {fullNavOpen && (
          <FullNavSheet
            onClose={() => setFullNavOpen(false)}
            onSidebarToggle={onSidebarToggle}
            onWidgetPanelOpen={onWidgetPanelOpen}
            language={language}
          />
        )}

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

  // ═══════════════════════════════════════════════════════
  // SKIN: bottom-sheet — pull-up handle at bottom
  // ═══════════════════════════════════════════════════════
  if (mobileNavSkin === "bottom-sheet") {
    return (
      <>
        {/* Persistent grab handle at bottom */}
        <button
          type="button"
          onClick={() => setFullNavOpen(true)}
          className="fixed bottom-0 left-0 right-0 z-[60] flex flex-col items-center border-t border-slate-700 bg-slate-800 pt-1.5 pb-1 active:bg-slate-700"
          style={{ paddingBottom: "calc(var(--safe-area-bottom, 0px) + 4px)" }}
          aria-label={bb.openMenu}
        >
          <ChevronUp className="h-5 w-5 text-slate-400" />
          <span className="text-[9px] text-slate-500">{bb.navigation}</span>
        </button>

        {fullNavOpen && (
          <FullNavSheet
            onClose={() => setFullNavOpen(false)}
            onSidebarToggle={onSidebarToggle}
            onWidgetPanelOpen={onWidgetPanelOpen}
            language={language}
          />
        )}
      </>
    );
  }

  // ═══════════════════════════════════════════════════════
  // SKIN: bottom-bar (DEFAULT) — original 5-slot bar
  // ═══════════════════════════════════════════════════════
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
          {/* Slot 0 (left): Sidebar toggle */}
          <button
            type="button"
            onClick={onSidebarToggle}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
              sidebarOpen
                ? "text-[var(--cc-accent-400)]"
                : "text-slate-400 active:text-[var(--cc-accent-400)]"
            }`}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[9px] font-medium">{bb.sidebar}</span>
          </button>

          {/* Middle 3 customizable slots */}
          {([0, 1, 2] as const).map((i) => (
            <div key={i} className="flex flex-1">
              {renderSlot(i)}
            </div>
          ))}

          {/* Slot 4 (right): Widget panel toggle */}
          <button
            type="button"
            onClick={onWidgetPanelOpen}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-slate-400 active:text-[var(--cc-accent-400)] transition-colors"
          >
            <Grid3X3 className="h-5 w-5" />
            <span className="text-[9px] font-medium">{bb.widgetPanel}</span>
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

// ─── Floating FAB Component ─────────────────────────────

function FloatingFab({ onOpen, label }: { onOpen: () => void; label: string }) {
  const [pos, setPos] = useState({ x: 20, y: -80 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const moved = useRef(false);
  const fabRef = useRef<HTMLButtonElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = fabRef.current?.getBoundingClientRect();
    if (!rect) return;
    offset.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    dragging.current = true;
    moved.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;
    moved.current = true;
    const touch = e.touches[0];
    const newX = touch.clientX - offset.current.x;
    const newY = touch.clientY - offset.current.y - window.innerHeight;
    setPos({ x: newX, y: newY });
  }, []);

  const handleTouchEnd = useCallback(() => {
    dragging.current = false;
    if (!moved.current) {
      onOpen();
    }
  }, [onOpen]);

  return (
    <button
      ref={fabRef}
      type="button"
      onClick={() => { if (!moved.current) onOpen(); }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="fixed z-[61] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--cc-accent-600)] text-white shadow-lg shadow-black/30 active:scale-95 transition-transform"
      style={{
        left: pos.x,
        bottom: Math.abs(pos.y),
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label={label}
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
