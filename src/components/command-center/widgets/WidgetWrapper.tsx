"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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

function calcPosition(
  btnRect: DOMRect,
  panelW: number,
  panelH: number,
  sidebar: { left: number; right: number }
): PanelPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const zoneLeft = sidebar.left + MARGIN;
  const zoneRight = vw - sidebar.right - MARGIN;
  const zoneBottom = vh - MARGIN;
  const zoneTop = MARGIN;

  let left = btnRect.left;
  if (left + panelW > zoneRight) {
    left = btnRect.right - panelW;
  }
  if (left + panelW > zoneRight) left = zoneRight - panelW;
  if (left < zoneLeft) left = zoneLeft;

  let top = btnRect.bottom + 4;
  if (top + panelH > zoneBottom) {
    top = btnRect.top - panelH - 4;
  }
  if (top + panelH > zoneBottom) top = zoneBottom - panelH;
  if (top < zoneTop) top = zoneTop;

  return { top, left };
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
  const { widgetSizes, hoverDelay } = useWidgets();
  const { language, sidebarPosition, sidebarVisibility } = useSettings();
  const t = getTranslations(language);
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";

  const size: WidgetSize = widgetSizes[widget.id] ?? widget.defaultSize;
  const barWidth = size * UNIT;

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<PanelPos | null>(null);
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
    left: column * UNIT,
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
    setPanelPos(calcPosition(rect, pw, ph, totalOffset));
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

  const label = widget.label[language];
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
      className="flex h-12 items-center"
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
          <widget.icon className="h-4 w-4" />
          {BarContent && size < 2 && <BarContent size={size} />}
        </span>
        {BarContent && size >= 2 && <BarContent size={size} />}
        {!BarContent && size >= 2 && (
          <span className="truncate text-xs">{label}</span>
        )}
      </button>

      {/* Mobile fullscreen panel */}
      {panelOpen && isMobile && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <widget.icon className="h-4 w-4 text-[var(--cc-accent-400)]" />
              <h3 className="text-sm font-semibold text-slate-100">{label}</h3>
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {WidgetContent && <WidgetContent />}
          </div>
        </div>
      )}

      {/* Desktop dropdown panel */}
      {panelOpen && !isMobile && panelPos && (
        <div
          ref={panelRef}
          className="fixed z-[60] flex flex-col border border-slate-700 bg-slate-800 shadow-xl"
          style={{
            top: panelPos.top,
            left: panelPos.left,
            width: panelSize?.width ?? DEFAULT_PANEL_W,
            minWidth: MIN_PANEL_W,
            minHeight: MIN_PANEL_H,
            maxHeight: `calc(100vh - ${panelPos.top + MARGIN}px)`,
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
                title={t.widgets.editMode}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {/* Panel content — scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {WidgetContent && <WidgetContent />}
          </div>
        </div>
      )}
    </div>
  );
}
