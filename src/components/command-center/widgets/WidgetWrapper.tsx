"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, RotateCcw, X } from "lucide-react";
import type { WidgetDefinition, WidgetSize } from "./WidgetRegistry";
import { useWidgets } from "@/contexts/WidgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";

const UNIT = 48;
const MARGIN = 8;
const SIDEBAR_FULL = 240;
const SIDEBAR_STRIP = 48;
const DEFAULT_PANEL_W = 280;
const DEFAULT_PANEL_H = 300;
const MIN_PANEL_W = 240;
const MIN_PANEL_H = 150;

interface PanelPos {
  top: number;
  left: number;
}

interface PanelSize {
  width: number;
  height: number;
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
  const zoneTop = MARGIN;
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
}

export function WidgetWrapper({
  widget,
  column,
  onEditOpen,
  onCustomClick,
  aiPanelOffset,
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
  const [panelSize, setPanelSize] = useState<PanelSize | null>(null);

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const mouseInPanel = useRef(false);
  const mouseInWrapper = useRef(false);

  const savedSizeKey = `cc-widget-panel-size-${widget.id}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: widget.id });

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

  // Load saved panel size on mount
  useEffect(() => {
    const raw = localStorage.getItem(savedSizeKey);
    if (raw) {
      try {
        setPanelSize(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, [savedSizeKey]);

  // Calculate panel position when it opens or sidebar changes
  useEffect(() => {
    if (!panelOpen || !wrapperRef.current) {
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
    const pw = panelSize?.width ?? DEFAULT_PANEL_W;
    const ph = panelSize?.height ?? DEFAULT_PANEL_H;
    const result = calcPosition(rect, pw, ph, totalOffset);
    setPanelPos(result.pos);
    setPanelMaxW(result.maxWidth);
    setPanelMaxH(result.maxHeight);
  }, [panelOpen, sidebarPosition, sidebarVisibility, panelSize, aiPanelOffset]);

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
    setPanelOpen((prev) => !prev);
  }, [clearTimer, onCustomClick]);

  const handleResizeEnd = useCallback(() => {
    if (!panelRef.current) return;
    const { offsetWidth, offsetHeight } = panelRef.current;
    const newSize = { width: offsetWidth, height: offsetHeight };
    setPanelSize(newSize);
    localStorage.setItem(savedSizeKey, JSON.stringify(newSize));
  }, [savedSizeKey]);

  const handleResetSize = useCallback(() => {
    localStorage.removeItem(savedSizeKey);
    setPanelSize(null);
  }, [savedSizeKey]);

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
      className={`flex ${barHeight} items-center`}
      onMouseEnter={handleWrapperEnter}
      onMouseLeave={handleWrapperLeave}
      {...attributes}
      {...listeners}
    >
      {/* Bar content */}
      <button
        type="button"
        onClick={handleClick}
        className={`flex h-full w-full items-center gap-2 px-3 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200 ${
          panelOpen ? "bg-slate-700/50 text-slate-200" : ""
        }`}
        title={label}
      >
        <span className="relative shrink-0">
          <widget.icon className={iconSize} />
          {BarContent && !showLabel && <BarContent size={size} />}
        </span>
        {BarContent && showLabel && <BarContent size={size} />}
        {!BarContent && showLabel && (
          <span className="truncate text-xs">{label}</span>
        )}
      </button>

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
            width: Math.min(panelSize?.width ?? DEFAULT_PANEL_W, panelMaxW),
            minWidth: Math.min(MIN_PANEL_W, panelMaxW),
            minHeight: MIN_PANEL_H,
            maxWidth: panelMaxW,
            maxHeight: Math.min(panelMaxH, window.innerHeight - panelPos.top - MARGIN),
            resize: "both",
            overflow: "hidden",
            borderRadius: "var(--cc-radius-lg)",
          }}
          onMouseEnter={handlePanelEnter}
          onMouseLeave={handlePanelLeave}
          onMouseUp={handleResizeEnd}
        >
          {/* Panel header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-700 px-4 py-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-100">{label}</h3>
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {description}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {panelSize && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetSize();
                  }}
                  className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
                  aria-label={t.widgets.resetSize}
                  title={t.widgets.resetSize}
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              )}
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
    </div>
  );
}
