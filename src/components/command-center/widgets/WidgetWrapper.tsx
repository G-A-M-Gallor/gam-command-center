"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, X, Lock, Unlock, PanelLeft, PanelTop, EyeOff, Star } from "lucide-react";
import { createPortal } from "react-dom";
import type { WidgetDefinition, WidgetSize } from "./WidgetRegistry";
import { useWidgets } from "@/contexts/WidgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import { IconDisplay } from "@/components/ui/IconPicker";
import { SIDE_PANEL_OPEN_EVENT } from "./UniversalSidePanel";

const UNIT = 48;
const MARGIN = 8;
const TOP_BAR_H = 52; // TopBar height (48px) + gap (4px)
const SIDEBAR_FULL = 240;
const SIDEBAR_STRIP = 48;

const PANEL_PRESETS = {
  S: { width: 280, height: 260 },
  M: { width: 400, height: 400 },
  L: { width: 560, height: 520 },
} as const;
type PanelPreset = keyof typeof PANEL_PRESETS;

interface PanelPos {
  top: number;
  left: number;
}

function getSidebarOffset(
  visibility: string,
  position: string
): { left: number; right: number } {
  const w =
    visibility === "visible"
      ? SIDEBAR_FULL
      : visibility === "float"
        ? SIDEBAR_STRIP
        : 0;
  return {
    left: position === "left" ? w : 0,
    right: position === "right" ? w : 0,
  };
}

interface CalcResult {
  pos: PanelPos;
  /** Max width the panel can use without exceeding the available zone */
  maxWidth: number;
  /** Max height the panel can use without exceeding the available zone */
  maxHeight: number;
}

function calcPosition(
  btnRect: DOMRect,
  panelW: number,
  panelH: number,
  sidebar: { left: number; right: number }
): CalcResult {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const zoneLeft = sidebar.left + MARGIN;
  const zoneRight = vw - sidebar.right - MARGIN;
  const zoneBottom = vh - MARGIN;
  const zoneTop = TOP_BAR_H;
  const zoneWidth = zoneRight - zoneLeft;
  const zoneHeight = zoneBottom - zoneTop;

  // Clamp panel dimensions to available zone
  const clampedW = Math.min(panelW, zoneWidth);
  const clampedH = Math.min(panelH, zoneHeight);

  let left = btnRect.left;
  if (left + clampedW > zoneRight) {
    left = btnRect.right - clampedW;
  }
  if (left + clampedW > zoneRight) left = zoneRight - clampedW;
  if (left < zoneLeft) left = zoneLeft;

  let top = btnRect.bottom + 4;
  if (top + clampedH > zoneBottom) {
    top = btnRect.top - clampedH - 4;
  }
  if (top + clampedH > zoneBottom) top = zoneBottom - clampedH;
  if (top < zoneTop) top = zoneTop;

  return {
    pos: { top, left },
    maxWidth: zoneWidth,
    maxHeight: zoneBottom - top,
  };
}

// ─── Per-widget error boundary ──────────────────────────────
class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; widgetId: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[WidgetErrorBoundary] Widget "${this.props.widgetId}" crashed:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
          <p className="text-xs text-red-400">Widget error</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="rounded px-2 py-1 text-[10px] text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface WidgetWrapperProps {
  widget: WidgetDefinition;
  column: number;
  onEditOpen: (widgetId: string) => void;
  onCustomClick?: () => void;
  /** Extra offset from the AI panel (side-panel mode) */
  aiPanelOffset?: { left: number; right: number };
  /** Whether this widget is locked in place */
  locked?: boolean;
  /** Callback to toggle lock state */
  onToggleLock?: (widgetId: string) => void;
  /** Custom icon value (emoji / "lucide:X" / "img:url") */
  customIcon?: string;
}

export function WidgetWrapper({
  widget,
  column,
  onEditOpen,
  onCustomClick,
  aiPanelOffset,
  locked,
  onToggleLock,
  customIcon,
}: WidgetWrapperProps) {
  const { widgetSizes, hoverDelay, widgetLabels, displayMode } = useWidgets();
  const { language, sidebarPosition, sidebarVisibility } = useSettings();
  const t = getTranslations(language);
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";

  const size: WidgetSize = widgetSizes[widget.id] ?? widget.defaultSize;
  const unitSize = displayMode === "compact" ? 36 : displayMode === "icons-only" ? 32 : UNIT;
  const barWidth = size * unitSize;
  const showLabel = displayMode === "normal" ? size >= 2
    : displayMode === "compact" ? size >= 3
    : false;
  const barHeight = displayMode === "compact" ? "h-9" : displayMode === "icons-only" ? "h-8" : "h-12";
  const iconSize = displayMode === "icons-only" ? "h-3.5 w-3.5" : "h-4 w-4";

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<PanelPos | null>(null);
  const [panelMaxW, setPanelMaxW] = useState(9999);
  const [panelMaxH, setPanelMaxH] = useState(9999);
  const [panelPreset, setPanelPreset] = useState<PanelPreset>("M");

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const mouseInPanel = useRef(false);
  const mouseInWrapper = useRef(false);

  const [wCtxMenu, setWCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const wCtxRef = useRef<HTMLDivElement>(null);
  const { setWidgetPlacement } = useWidgets();

  // Close widget context menu on outside click
  useEffect(() => {
    if (!wCtxMenu) return;
    const handler = (e: MouseEvent) => {
      if (wCtxRef.current && !wCtxRef.current.contains(e.target as Node)) setWCtxMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [wCtxMenu]);

  const savedPresetKey = `cc-widget-panel-preset-${widget.id}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: widget.id, disabled: !!locked });

  const style = {
    position: "absolute" as const,
    top: 0,
    left: column * unitSize,
    width: barWidth,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 50 : 1,
    transition: isDragging ? undefined : "left 200ms ease",
  };

  // Close panel while dragging
  useEffect(() => {
    if (isDragging && panelOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
      setPanelOpen(false);
    }
  }, [isDragging, panelOpen]);

  // Listen for programmatic open events (e.g. from keyboard shortcuts)
  useEffect(() => {
    const eventName = `cc-widget-open-${widget.id}`;
    const handler = () => setPanelOpen(true);
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [widget.id]);

  // Load saved panel preset on mount
  useEffect(() => {
    const saved = localStorage.getItem(savedPresetKey);
    if (saved && saved in PANEL_PRESETS) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
      setPanelPreset(saved as PanelPreset);
    }
  }, [savedPresetKey]);

  // Calculate panel position when it opens or sidebar changes
  useEffect(() => {
    if (!panelOpen || !wrapperRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
      setPanelPos(null);
      return;
    }
    const rect = wrapperRef.current.getBoundingClientRect();
    const sidebar = getSidebarOffset(sidebarVisibility, sidebarPosition);
    // Merge AI panel offset so dropdowns don't go behind the chat panel
    const totalOffset = {
      left: sidebar.left + (aiPanelOffset?.left ?? 0),
      right: sidebar.right + (aiPanelOffset?.right ?? 0),
    };
    const { width: pw, height: ph } = PANEL_PRESETS[panelPreset];
    const result = calcPosition(rect, pw, ph, totalOffset);
    setPanelPos(result.pos);
    setPanelMaxW(result.maxWidth);
    setPanelMaxH(result.maxHeight);
  }, [panelOpen, sidebarPosition, sidebarVisibility, panelPreset, aiPanelOffset]);

  const clearTimer = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }, []);

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }, []);

  const tryClose = useCallback(() => {
    clearLeaveTimer();
    leaveTimer.current = setTimeout(() => {
      if (!mouseInPanel.current && !mouseInWrapper.current) {
        setPanelOpen(false);
      }
    }, 120);
  }, [clearLeaveTimer]);

  const isCustomPanel =
    widget.panelMode === "modal" || widget.panelMode === "side-panel";

  const handleWrapperEnter = useCallback(() => {
    mouseInWrapper.current = true;
    clearLeaveTimer();
    if (isCustomPanel || hoverDelay === "none" || isMobile) return;
    clearTimer();
    hoverTimer.current = setTimeout(() => {
      setPanelOpen(true);
    }, hoverDelay * 1000);
  }, [hoverDelay, clearTimer, clearLeaveTimer, isCustomPanel, isMobile]);

  const handleWrapperLeave = useCallback(() => {
    mouseInWrapper.current = false;
    clearTimer();
    tryClose();
  }, [clearTimer, tryClose]);

  const handlePanelEnter = useCallback(() => {
    mouseInPanel.current = true;
    clearLeaveTimer();
  }, [clearLeaveTimer]);

  const handlePanelLeave = useCallback(() => {
    mouseInPanel.current = false;
    tryClose();
  }, [tryClose]);

  const handleClick = useCallback(() => {
    clearTimer();
    if (onCustomClick) {
      onCustomClick();
      return;
    }
    // Click → open in tabbed side panel (not dropdown)
    // Modal widgets (search, shortcuts, planner) still use their own modal
    if (!isCustomPanel) {
      window.dispatchEvent(new CustomEvent(SIDE_PANEL_OPEN_EVENT, { detail: widget.id }));
      return;
    }
    setPanelOpen((prev) => !prev);
  }, [clearTimer, onCustomClick, isCustomPanel, widget.id]);

  const handlePresetChange = useCallback((preset: PanelPreset) => {
    setPanelPreset(preset);
    localStorage.setItem(savedPresetKey, preset);
  }, [savedPresetKey]);

  useEffect(() => {
    return () => {
      clearTimer();
      clearLeaveTimer();
    };
  }, [clearTimer, clearLeaveTimer]);

  const customLabel = widgetLabels[widget.id]?.[language];
  const label = customLabel || widget.label[language];
  const description = widget.description[language];
  const WidgetContent = widget.component;
  const BarContent = widget.renderBar;

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        wrapperRef.current = node;
      }}
      style={style}
      className={`group flex ${barHeight} items-center`}
      onMouseEnter={handleWrapperEnter}
      onMouseLeave={handleWrapperLeave}
      {...attributes}
      {...listeners}
    >
      {/* Bar content */}
      <button
        type="button"
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          setWCtxMenu({ x: e.clientX, y: e.clientY });
        }}
        className={`flex h-full w-full items-center gap-2 px-3 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200 ${
          panelOpen ? "bg-slate-700/50 text-slate-200" : ""
        } ${locked ? "ring-1 ring-inset ring-amber-500/20" : ""}`}
        title={label}
      >
        <span className="relative shrink-0">
          {customIcon ? (
            <IconDisplay value={customIcon} size={displayMode === "icons-only" ? 14 : 16} />
          ) : (
            <widget.icon className={iconSize} />
          )}
          {BarContent && !showLabel && <BarContent size={size} />}
        </span>
        {BarContent && showLabel && <BarContent size={size} />}
        {!BarContent && showLabel && (
          <span className="truncate text-xs">{label}</span>
        )}
      </button>

      {/* Lock toggle — visible on hover or when locked */}
      {onToggleLock && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock(widget.id);
          }}
          className={`absolute -top-0.5 -right-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full text-[9px] transition-all ${
            locked
              ? "bg-amber-600/90 text-white"
              : "bg-slate-700 text-slate-400 opacity-0 group-hover:opacity-100"
          }`}
          title={locked ? (t.smartBar?.unlockWidget || "Unlock") : (t.smartBar?.lockWidget || "Lock")}
        >
          {locked ? <Lock size={9} /> : <Unlock size={9} />}
        </button>
      )}

      {/* Mobile fullscreen panel */}
      {panelOpen && isMobile && (
        <div className="gam-card fixed inset-0 z-[60] flex flex-col bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <widget.icon className="h-4 w-4 text-[var(--cc-accent-400)]" />
              <h3 className="text-sm font-semibold text-slate-100">{label}</h3>
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <WidgetErrorBoundary widgetId={widget.id}>
              {WidgetContent && <WidgetContent />}
            </WidgetErrorBoundary>
          </div>
        </div>
      )}

      {/* Desktop dropdown panel */}
      {panelOpen && !isMobile && panelPos && (
        <div
          ref={panelRef}
          className="gam-card fixed z-[60] flex flex-col border border-slate-700 bg-slate-800 shadow-xl"
          style={{
            top: panelPos.top,
            left: panelPos.left,
            width: Math.min(PANEL_PRESETS[panelPreset].width, panelMaxW),
            height: Math.min(PANEL_PRESETS[panelPreset].height, panelMaxH),
            maxWidth: panelMaxW,
            maxHeight: panelMaxH,
            overflow: "hidden",
            borderRadius: "var(--cc-radius-lg)",
            transition: "width 200ms ease, height 200ms ease",
          }}
          onMouseEnter={handlePanelEnter}
          onMouseLeave={handlePanelLeave}
        >
          {/* Panel header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-700 px-4 py-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-100">{label}</h3>
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {description}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {/* Size presets */}
              <div className="flex items-center gap-0.5 rounded-md bg-slate-900/60 p-0.5">
                {(["S", "M", "L"] as PanelPreset[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePresetChange(p);
                    }}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                      panelPreset === p
                        ? "bg-[var(--cc-accent-600)] text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPanelOpen(false);
                  onEditOpen(widget.id);
                }}
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
                aria-label={t.widgets.editMode}
                title={t.widgets.editMode}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {/* Panel content — scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            <WidgetErrorBoundary widgetId={widget.id}>
              {WidgetContent && <WidgetContent />}
            </WidgetErrorBoundary>
          </div>
        </div>
      )}
      {/* Widget context menu */}
      {wCtxMenu && createPortal(
        <div
          ref={wCtxRef}
          className="fixed z-[65] rounded-xl border border-slate-700/80 overflow-hidden py-1"
          style={{
            backgroundColor: "var(--nav-bg)",
            left: wCtxMenu.x,
            top: wCtxMenu.y,
            minWidth: 190,
            boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/30">
            <widget.icon className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[12px] font-medium text-slate-200 truncate">{label}</span>
          </div>

          {/* Move to dock */}
          <div className="py-1 border-b border-slate-700/20">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("cc-move-to-dock", { detail: widget.id }));
                setWCtxMenu(null);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              <PanelLeft className="h-3.5 w-3.5 text-slate-500" />
              {language === "he" ? "העבר לסרגל צדדי" : "Move to side dock"}
            </button>
          </div>

          {/* Settings / disable */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => { onEditOpen(widget.id); setWCtxMenu(null); }}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5 text-slate-500" />
              {language === "he" ? "הגדרות ווידג׳ט" : "Widget settings"}
            </button>
            {widget.isRemovable !== false && (
              <button
                type="button"
                onClick={() => { setWidgetPlacement(widget.id, "disabled"); setWCtxMenu(null); }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[11px] text-red-400/80 hover:bg-red-500/[0.06] transition-colors cursor-pointer"
              >
                <EyeOff className="h-3.5 w-3.5" />
                {language === "he" ? "הסתר ווידג׳ט" : "Hide widget"}
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
