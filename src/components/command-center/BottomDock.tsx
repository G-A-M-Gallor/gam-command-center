"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { Plus, X, Minus, Search, Pin, PinOff, Settings } from "lucide-react";
import { NAV_GROUPS, type NavItem } from "./Sidebar";
import { widgetRegistry } from "./widgets/WidgetRegistry";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { useBottomDock, type DockItem } from "@/lib/hooks/useBottomDock";
import { useShellPrefs } from "@/lib/hooks/useShellPrefs";

// ─── Constants ──────────────────────────────────────────

const ICON_SIZE = 44;
const ICON_RADIUS = 12;
const ICON_INNER = 21;

// Distinct color gradients for dock icons (macOS-like vibrant app colors)
const ICON_COLORS: Record<string, [string, string]> = {
  // Pages
  dashboard: ["#6366f1", "#818cf8"],
  "ai-hub": ["#8b5cf6", "#a78bfa"],
  editor: ["#f59e0b", "#fbbf24"],
  entities: ["#3b82f6", "#60a5fa"],
  settings: ["#64748b", "#94a3b8"],
  "story-map": ["#10b981", "#34d399"],
  "functional-map": ["#06b6d4", "#22d3ee"],
  layers: ["#f43f5e", "#fb7185"],
  "design-system": ["#ec4899", "#f472b6"],
  architecture: ["#0ea5e9", "#38bdf8"],
  plan: ["#14b8a6", "#2dd4bf"],
  wiki: ["#f97316", "#fb923c"],
  admin: ["#ef4444", "#f87171"],
  slides: ["#a855f7", "#c084fc"],
  grid: ["#22c55e", "#4ade80"],
  comms: ["#06b6d4", "#22d3ee"],
  feeds: ["#f97316", "#fb923c"],
  automations: ["#eab308", "#facc15"],
  roadmap: ["#8b5cf6", "#a78bfa"],
  documents: ["#3b82f6", "#60a5fa"],
  "icon-library": ["#ec4899", "#f472b6"],
  vclip: ["#ef4444", "#f87171"],
  vcloud: ["#0ea5e9", "#38bdf8"],
  vault: ["#64748b", "#94a3b8"],
  vector: ["#10b981", "#34d399"],
  "weekly-planner": ["#f59e0b", "#fbbf24"],
  "app-launcher": ["#6366f1", "#818cf8"],
  skills: ["#a855f7", "#c084fc"],
  // Widgets
  search: ["#3b82f6", "#60a5fa"],
  "ai-assistant": ["#8b5cf6", "#a78bfa"],
  timer: ["#ef4444", "#f87171"],
  favorites: ["#f59e0b", "#fbbf24"],
  notifications: ["#f43f5e", "#fb7185"],
  "quick-create": ["#10b981", "#34d399"],
  "keyboard-shortcuts": ["#64748b", "#94a3b8"],
  "weekly-planner-widget": ["#06b6d4", "#22d3ee"],
};

const DEFAULT_GRADIENT: [string, string] = ["#475569", "#64748b"];

function getIconGradient(id: string): [string, string] {
  return ICON_COLORS[id] || DEFAULT_GRADIENT;
}

// ─── Icon resolution from nav groups ────────────────────

function findNavItem(key: string): NavItem | undefined {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.key === key) return item;
      if ("type" in item && item.type === "folder" && item.children) {
        const child = item.children.find((c) => c.key === key);
        if (child) return child;
      }
    }
  }
  return undefined;
}

function findWidget(id: string) {
  return widgetRegistry.find((w) => w.id === id);
}

// ─── Dock Icon Component ────────────────────────────────

function DockIcon({
  item,
  index,
  language,
  isActive,
  editMode,
  onRemove,
  onClick,
  onHover,
  onLeave,
  scale,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  item: DockItem;
  index: number;
  language: "he" | "en" | "ru";
  isActive: boolean;
  editMode: boolean;
  onRemove: (i: number) => void;
  onClick: () => void;
  onHover: (i: number) => void;
  onLeave: () => void;
  scale: number;
  isDragging?: boolean;
  onDragStart?: (index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDrop?: (index: number) => void;
}) {
  const t = getTranslations(language);
  const tabs = t.tabs as Record<string, string>;

  let Icon: React.ElementType | null = null;
  let label = item.id;

  if (item.type === "page") {
    const nav = findNavItem(item.id);
    if (nav) {
      Icon = nav.icon;
      label = tabs[item.id] || item.id;
    }
  } else if (item.type === "widget") {
    const w = findWidget(item.id);
    if (w) {
      Icon = w.icon;
      label = w.label[language];
    }
  }

  if (!Icon) return null;

  const [from, to] = getIconGradient(item.id);
  const size = ICON_SIZE * scale;
  const iconSize = ICON_INNER * scale;
  const radius = ICON_RADIUS * scale;

  // Fixed-size outer container — hover zone stays constant regardless of magnification
  return (
    <div
      className={`relative flex items-end justify-center ${editMode ? "cursor-grab active:cursor-grabbing" : ""} ${isDragging ? "opacity-30 scale-75" : ""}`}
      data-dock-index={index}
      style={{
        width: ICON_SIZE + 2,
        height: ICON_SIZE + 16,
        transition: isDragging ? "opacity 0.15s, transform 0.15s" : undefined,
      }}
      draggable={editMode}
      onDragStart={editMode ? () => onDragStart?.(index) : undefined}
      onDragOver={editMode ? (e) => { e.preventDefault(); onDragOver?.(e, index); } : undefined}
      onDrop={editMode ? () => onDrop?.(index) : undefined}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={onLeave}
    >
      {/* Inner — icon grows physically (original macOS effect) but container stays fixed */}
      <div
        className="relative flex flex-col items-center"
        style={{
          marginBottom: 2,
          transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Remove badge in edit mode */}
        {editMode && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            className="absolute -top-1 -left-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-400 transition-colors border border-red-400/50"
            style={{ animation: "wiggle 0.4s ease-in-out infinite" }}
          >
            <Minus size={9} strokeWidth={3} />
          </button>
        )}

        {/* Tooltip — refined style */}
        {!editMode && scale > 1.15 && (
          <span
            className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium text-slate-200 shadow-lg"
            style={{
              background: "rgba(15, 23, 42, 0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.06)",
              zIndex: 60,
              animation: "dock-tooltip-in 0.15s ease-out",
              letterSpacing: "0.01em",
            }}
          >
            {label}
          </span>
        )}

        {/* Icon button — physical size changes per icon (original effect) */}
        <button
          type="button"
          onClick={onClick}
          className="relative flex items-center justify-center cursor-pointer"
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            background: `linear-gradient(145deg, ${from}, ${to})`,
            transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
            boxShadow: isActive
              ? `0 4px 14px ${from}50, 0 1px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)`
              : `0 3px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
          }}
        >
          {/* Gloss/shine overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              borderRadius: radius,
              background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 50%)",
            }}
          />
          <Icon
            style={{ width: iconSize, height: iconSize, transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            className="relative z-10 text-white drop-shadow-md"
          />
        </button>

        {/* Active indicator dot */}
        {isActive && (
          <div
            className="mt-0.5 h-[4px] w-[4px] rounded-full"
            style={{ background: from, boxShadow: `0 0 5px ${from}80` }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Add Item Picker ────────────────────────────────────

function DockAddPicker({
  onSelect,
  onClose,
  language,
  existingItems,
}: {
  onSelect: (item: DockItem) => void;
  onClose: () => void;
  language: "he" | "en" | "ru";
  existingItems: DockItem[];
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const t = getTranslations(language);
  const tabs = t.tabs as Record<string, string>;

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const lowerQ = query.toLowerCase();

  const pages = useMemo(() => {
    const items: { key: string; icon: React.ElementType; label: string }[] = [];
    for (const group of NAV_GROUPS) {
      for (const entry of group.items) {
        if ("type" in entry && entry.type === "folder") {
          items.push({ key: entry.key, icon: entry.icon, label: tabs[entry.key] ?? entry.key });
          for (const child of entry.children) {
            items.push({ key: child.key, icon: child.icon, label: tabs[child.key] ?? child.key });
          }
        } else {
          items.push({ key: entry.key, icon: entry.icon, label: tabs[entry.key] ?? entry.key });
        }
      }
    }
    return items.filter((p) => {
      if (existingItems.some((e) => e.type === "page" && e.id === p.key)) return false;
      if (lowerQ && !p.label.toLowerCase().includes(lowerQ) && !p.key.toLowerCase().includes(lowerQ)) return false;
      return true;
    });
  }, [tabs, existingItems, lowerQ]);

  const widgets = useMemo(() => {
    return widgetRegistry
      .filter((w) => w.status === "active")
      .filter((w) => !existingItems.some((e) => e.type === "widget" && e.id === w.id))
      .filter((w) => {
        if (!lowerQ) return true;
        return w.label[language].toLowerCase().includes(lowerQ) || w.id.toLowerCase().includes(lowerQ);
      });
  }, [existingItems, lowerQ, language]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-label="Close" />
      <div
        className="relative z-10 mx-auto w-full max-w-xl max-h-[65vh] overflow-hidden rounded-t-3xl border-t border-white/10"
        style={{
          background: "rgba(15, 23, 42, 0.92)",
          backdropFilter: "blur(24px) saturate(1.8)",
          animation: "dock-picker-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 border-b border-white/8 mx-4 pb-3 mb-1">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/8 px-3 py-2.5">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={language === "he" ? "חפש אפליקציה..." : "Search apps..."}
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
            />
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[50vh] px-4 pb-6">
          {/* Pages */}
          {pages.length > 0 && (
            <>
              <div className="py-2 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                {language === "he" ? "עמודים" : "Pages"}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {pages.map((p) => {
                  const Icon = p.icon;
                  const [from, to] = getIconGradient(p.key);
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => { onSelect({ type: "page", id: p.key }); onClose(); }}
                      className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-white/8 cursor-pointer"
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center"
                        style={{
                          borderRadius: 12,
                          background: `linear-gradient(145deg, ${from}, ${to})`,
                          boxShadow: `0 3px 10px ${from}40`,
                        }}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-[11px] text-slate-300 text-center truncate w-full leading-tight">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Widgets */}
          {widgets.length > 0 && (
            <>
              <div className="py-2 mt-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                {language === "he" ? "ווידג׳טים" : "Widgets"}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {widgets.map((w) => {
                  const Icon = w.icon;
                  const [from, to] = getIconGradient(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => { onSelect({ type: "widget", id: w.id }); onClose(); }}
                      className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-white/8 cursor-pointer"
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center"
                        style={{
                          borderRadius: 12,
                          background: `linear-gradient(145deg, ${from}, ${to})`,
                          boxShadow: `0 3px 10px ${from}40`,
                        }}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-[11px] text-slate-300 text-center truncate w-full leading-tight">{w.label[language]}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {pages.length === 0 && widgets.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              {language === "he" ? "לא נמצאו תוצאות" : "No results found"}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Main Bottom Dock ───────────────────────────────────

interface BottomDockProps {
  autoHide?: boolean;
  /** Left offset of the content area (sidebar + dock strip) */
  contentLeft?: string;
  /** Right offset of the content area (right sidebar strip) */
  contentRight?: string;
}

export function BottomDock({ autoHide = false, contentLeft = "0px", contentRight = "0px" }: BottomDockProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useSettings();
  const dock = useBottomDock();
  const [, , updatePref] = useShellPrefs();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [triggerVisible, setTriggerVisible] = useState(!autoHide);
  const [closing, setClosing] = useState(false);
  const [pinned, setPinned] = useState(false);

  // Hydrate pinned from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cc-shell-prefs");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.dockPinned) setPinned(true);
      }
    } catch {}
  }, []);

  // Auto-hide: debounced trigger with hysteresis to prevent flickering
  useEffect(() => {
    if (!autoHide || pinned) { setTriggerVisible(true); return; }
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let isInZone = false;

    const handleMouseMove = (e: MouseEvent) => {
      const nearBottom = e.clientY > window.innerHeight - 50;

      if (nearBottom && !isInZone) {
        isInZone = true;
        if (timeout) clearTimeout(timeout);
        setTriggerVisible(true);
      } else if (!nearBottom && isInZone) {
        isInZone = false;
        if (!dock.isOpen) {
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => setTriggerVisible(false), 300);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (timeout) clearTimeout(timeout);
    };
  }, [autoHide, dock.isOpen, pinned]);

  // Keep trigger visible while dock is open
  useEffect(() => {
    if (dock.isOpen || pinned) setTriggerVisible(true);
  }, [dock.isOpen, pinned]);

  // Close with genie-out animation
  const handleClose = useCallback(() => {
    if (pinned) return;
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      dock.close();
    }, 350);
  }, [dock, pinned]);

  // Close on Escape
  useEffect(() => {
    if (!dock.isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showPicker) setShowPicker(false);
        else if (!pinned) handleClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dock.isOpen, showPicker, pinned, handleClose]);

  // Toggle pin
  const togglePin = useCallback(() => {
    const next = !pinned;
    setPinned(next);
    updatePref("dockPinned", next);
  }, [pinned, updatePref]);

  // Magnification scale (macOS-like smooth parabolic)
  const getScale = useCallback(
    (index: number) => {
      if (hoveredIndex === null) return 1;
      const distance = Math.abs(index - hoveredIndex);
      if (distance === 0) return 1.3;
      if (distance === 1) return 1.12;
      if (distance === 2) return 1.04;
      return 1;
    },
    [hoveredIndex],
  );

  // Handle item click
  const handleItemClick = useCallback(
    (item: DockItem) => {
      if (dock.editMode) return;

      if (item.type === "page") {
        const nav = findNavItem(item.id);
        if (nav) router.push(nav.href);
        if (!pinned) handleClose();
      } else if (item.type === "widget") {
        const eventMap: Record<string, string> = {
          search: "cc-open-search",
          "ai-assistant": "cc-open-ai",
          "quick-create": "cc-open-quick-create",
          "keyboard-shortcuts": "cc-open-shortcuts",
          notifications: "cc-open-notifications",
        };
        const eventName = eventMap[item.id] || `cc-open-widget-${item.id}`;
        window.dispatchEvent(new CustomEvent(eventName));
        if (!pinned) handleClose();
      }
    },
    [dock, router, pinned, handleClose],
  );

  // Check if a page is active
  const isPageActive = useCallback(
    (key: string) => {
      const nav = findNavItem(key);
      if (!nav) return false;
      if (nav.href === "/dashboard") return pathname === "/dashboard";
      return pathname === nav.href || pathname.startsWith(nav.href + "/");
    },
    [pathname],
  );

  // Listen for external "add to dock" events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<DockItem>).detail;
      if (detail) dock.addItem(detail);
    };
    window.addEventListener("cc-dock-add", handler);
    return () => window.removeEventListener("cc-dock-add", handler);
  }, [dock]);

  // Show trigger rising from below (not visible when dock is open)
  const showTrigger = triggerVisible && !dock.isOpen;

  return (
    <>
      {/* ── Trigger button — centered in content area ── */}
      <div
        className="fixed bottom-0 z-[51] flex justify-center"
        style={{
          left: contentLeft,
          right: contentRight,
          opacity: showTrigger ? 1 : 0,
          pointerEvents: showTrigger ? "auto" : "none",
          transform: `translateY(${showTrigger ? "0" : "100%"})`,
          transition: "opacity 0.3s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <button
          type="button"
          onClick={dock.toggle}
          className="relative flex items-center justify-center transition-all duration-200 focus:outline-none select-none cursor-pointer"
          style={{
            width: 80,
            height: 28,
            borderRadius: "40px 40px 0 0",
            backgroundColor: "rgb(30 41 59)",
            border: "1px solid",
            borderBottom: "none",
            borderColor: "rgba(51 65 85 / 0.6)",
            boxShadow: "0 0 8px var(--cc-accent-500-15), 0 -2px 6px rgba(0,0,0,0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 0 14px var(--cc-accent-500-30), 0 -3px 10px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "";
            e.currentTarget.style.boxShadow = "0 0 8px var(--cc-accent-500-15), 0 -2px 6px rgba(0,0,0,0.3)";
          }}
          aria-label="Toggle dock"
        >
          <Plus
            size={18}
            style={{ color: "rgb(148 163 184)" }}
          />
        </button>
      </div>

      {/* ── The Dock bar ── */}
      {(dock.isOpen || closing) && (
        <>
          {/* Click-away backdrop — only closes when unpinned */}
          {!pinned && (
            <button
              type="button"
              onClick={handleClose}
              className="fixed inset-0 z-[49]"
              aria-label="Close dock"
            />
          )}

          <div
            ref={dockRef}
            className="fixed bottom-[10px] z-[50] flex justify-center pointer-events-none"
            style={{
              left: contentLeft,
              right: contentRight,
            }}
          >
          <div
            className="flex items-end gap-2"
            style={{
              pointerEvents: "auto",
              animation: closing
                ? "dock-genie-out 0.35s cubic-bezier(0.55, 0.085, 0.68, 0.53) both"
                : "dock-genie-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both",
              transformOrigin: "bottom center",
            }}
          >
            {/* Pin button — outside dock bar, to the left */}
            <div className="flex items-center pb-1">
              <button
                type="button"
                onClick={togglePin}
                className={`flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
                  pinned
                    ? "bg-[var(--cc-accent-500)] text-white shadow-lg"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/10"
                }`}
                style={{
                  width: 28,
                  height: 28,
                  background: pinned ? undefined : "rgba(15, 23, 42, 0.78)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                title={pinned ? "Unpin dock" : "Pin dock"}
              >
                {pinned ? <Pin size={12} /> : <PinOff size={12} />}
              </button>
            </div>

            <div
              className="flex items-end rounded-[18px] border border-white/[0.12]"
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              style={{
                padding: "6px 10px 8px",
                gap: "4px",
                background: "rgba(15, 23, 42, 0.78)",
                backdropFilter: "blur(40px) saturate(2)",
                WebkitBackdropFilter: "blur(40px) saturate(2)",
                boxShadow: [
                  "0 8px 32px rgba(0,0,0,0.5)",
                  "0 2px 10px rgba(0,0,0,0.3)",
                  "inset 0 1px 0 rgba(255,255,255,0.08)",
                  "inset 0 -1px 0 rgba(0,0,0,0.2)",
                ].join(", "),
              }}
            >

              {/* Dock items */}
              {dock.items.map((item, i) => {
                const dockKey = `${item.type}-${item.id}`;
                const showDropLine = dragOverIndex === i && dragIndex !== null && dragIndex !== i;
                return (
                  <div key={dockKey} className="relative flex items-end">
                    {showDropLine && (
                      <div
                        className="absolute -left-[4px] top-1 bottom-1 w-[3px] rounded-full z-30"
                        style={{ background: "var(--cc-accent-500)", boxShadow: "0 0 8px var(--cc-accent-500-50)" }}
                      />
                    )}
                    <DockIcon
                      item={item}
                      index={i}
                      language={language}
                      isActive={item.type === "page" && isPageActive(item.id)}
                      editMode={dock.editMode}
                      onRemove={dock.removeItem}
                      onClick={() => handleItemClick(item)}
                      onHover={setHoveredIndex}
                      onLeave={() => setHoveredIndex(null)}
                      scale={getScale(i)}
                      isDragging={dragIndex === i}
                      onDragStart={(idx) => { setDragIndex(idx); setDragOverIndex(null); }}
                      onDragOver={(_e, idx) => { if (dragIndex !== null && dragIndex !== idx) setDragOverIndex(idx); }}
                      onDrop={(idx) => {
                        if (dragIndex !== null && dragIndex !== idx) {
                          dock.reorder(dragIndex, idx);
                        }
                        setDragIndex(null);
                        setDragOverIndex(null);
                      }}
                    />
                  </div>
                );
              })}

              {/* Separator line */}
              <div
                className="mx-1 self-center"
                style={{
                  width: 1,
                  height: ICON_SIZE * 0.65,
                  background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.15), transparent)",
                }}
              />

              {/* Add button */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  className="flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105"
                  style={{
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    borderRadius: ICON_RADIUS,
                    border: "1.5px dashed rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <Plus size={18} className="text-slate-400" />
                </button>
              </div>

              {/* Edit mode toggle */}
              {dock.items.length > 0 && (
                <div className="flex flex-col items-center justify-center">
                  <button
                    type="button"
                    onClick={() => dock.setEditMode(!dock.editMode)}
                    className={`flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
                      dock.editMode ? "bg-[var(--cc-accent-500)] text-white shadow-lg" : "text-slate-500 hover:text-slate-300 hover:bg-white/8"
                    }`}
                    style={{ width: 28, height: 28, borderRadius: 8 }}
                  >
                    {dock.editMode ? (
                      <span className="text-xs font-bold">✓</span>
                    ) : (
                      <span className="text-sm leading-none tracking-wider">···</span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Settings area — outside dock bar, to the right */}
            <div className="flex items-center pb-1">
              <button
                type="button"
                onClick={() => {
                  router.push("/dashboard/settings");
                  if (!pinned) handleClose();
                }}
                className="flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer text-slate-500 hover:text-slate-300 hover:bg-white/10"
                style={{
                  width: 28,
                  height: 28,
                  background: "rgba(15, 23, 42, 0.78)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                title={language === "he" ? "הגדרות" : "Settings"}
              >
                <Settings size={12} />
              </button>
            </div>
          </div>
          </div>
        </>
      )}

      {/* Add item picker */}
      {showPicker && (
        <DockAddPicker
          onSelect={dock.addItem}
          onClose={() => setShowPicker(false)}
          language={language}
          existingItems={dock.items}
        />
      )}

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes dock-genie-in {
          0% {
            opacity: 0;
            transform: scaleX(0.2) scaleY(0.05) translateY(30px);
          }
          40% {
            opacity: 1;
            transform: scaleX(1.02) scaleY(0.85) translateY(-4px);
          }
          70% {
            transform: scaleX(0.98) scaleY(1.02) translateY(1px);
          }
          100% {
            opacity: 1;
            transform: scaleX(1) scaleY(1) translateY(0);
          }
        }

        @keyframes dock-genie-out {
          0% {
            opacity: 1;
            transform: scaleX(1) scaleY(1) translateY(0);
          }
          30% {
            opacity: 1;
            transform: scaleX(0.95) scaleY(1.05) translateY(-2px);
          }
          100% {
            opacity: 0;
            transform: scaleX(0.15) scaleY(0.05) translateY(40px);
          }
        }

        @keyframes dock-tooltip-in {
          from { opacity: 0; transform: translateX(-50%) translateY(4px) scale(0.95); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        @keyframes dock-picker-up {
          0% { opacity: 0; transform: translateY(100%); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }
      `}</style>
    </>
  );
}
