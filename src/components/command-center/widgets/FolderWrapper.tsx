"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Pin, Pencil, X, FolderOpen } from "lucide-react";
import type { FolderDefinition } from "./FolderRegistry";
import type { WidgetSize } from "./WidgetRegistry";
import { FolderItemCell } from "./FolderItemCell";
import { useWidgets } from "@/contexts/WidgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";

const UNIT = 48;
const MARGIN = 8;
const SIDEBAR_FULL = 240;
const SIDEBAR_STRIP = 48;
const DEFAULT_PANEL_W = 320;
const DEFAULT_PANEL_H = 280;

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
): { top: number; left: number; maxWidth: number; maxHeight: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const zoneLeft = sidebar.left + MARGIN;
  const zoneRight = vw - sidebar.right - MARGIN;
  const zoneBottom = vh - MARGIN;
  const zoneTop = MARGIN;
  const zoneWidth = zoneRight - zoneLeft;

  const clampedW = Math.min(panelW, zoneWidth);
  const clampedH = Math.min(panelH, zoneBottom - zoneTop);

  let left = btnRect.left;
  if (left + clampedW > zoneRight) left = btnRect.right - clampedW;
  if (left + clampedW > zoneRight) left = zoneRight - clampedW;
  if (left < zoneLeft) left = zoneLeft;

  let top = btnRect.bottom + 4;
  if (top + clampedH > zoneBottom) top = btnRect.top - clampedH - 4;
  if (top + clampedH > zoneBottom) top = zoneBottom - clampedH;
  if (top < zoneTop) top = zoneTop;

  return { top, left, maxWidth: zoneWidth, maxHeight: zoneBottom - top };
}

interface FolderWrapperProps {
  folder: FolderDefinition;
  column: number;
  onEditOpen: (folderId: string) => void;
  aiPanelOffset?: { left: number; right: number };
}

export function FolderWrapper({
  folder,
  column,
  onEditOpen,
  aiPanelOffset,
}: FolderWrapperProps) {
  const { widgetSizes, hoverDelay, updateFolder } = useWidgets();
  const { language, sidebarPosition, sidebarVisibility } = useSettings();
  const t = getTranslations(language);
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";

  const size: WidgetSize = widgetSizes[folder.id] ?? folder.defaultSize;
  const barWidth = size * UNIT;

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const [panelMaxW, setPanelMaxW] = useState(9999);
  const [panelMaxH, setPanelMaxH] = useState(9999);

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const mouseInPanel = useRef(false);
  const mouseInWrapper = useRef(false);

  // In-folder drag reorder
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: folder.id });

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
    if (isDragging && panelOpen) setPanelOpen(false);
  }, [isDragging, panelOpen]);

  // Calculate panel position
  useEffect(() => {
    if (!panelOpen || !wrapperRef.current) {
      setPanelPos(null);
      return;
    }
    const rect = wrapperRef.current.getBoundingClientRect();
    const sidebar = getSidebarOffset(sidebarVisibility, sidebarPosition);
    const totalOffset = {
      left: sidebar.left + (aiPanelOffset?.left ?? 0),
      right: sidebar.right + (aiPanelOffset?.right ?? 0),
    };
    const result = calcPosition(rect, DEFAULT_PANEL_W, DEFAULT_PANEL_H, totalOffset);
    setPanelPos({ top: result.top, left: result.left });
    setPanelMaxW(result.maxWidth);
    setPanelMaxH(result.maxHeight);
  }, [panelOpen, sidebarPosition, sidebarVisibility, aiPanelOffset]);

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
    if (folder.pinned) return;
    clearLeaveTimer();
    leaveTimer.current = setTimeout(() => {
      if (!mouseInPanel.current && !mouseInWrapper.current) {
        setPanelOpen(false);
      }
    }, 120);
  }, [folder.pinned, clearLeaveTimer]);

  const handleWrapperEnter = useCallback(() => {
    mouseInWrapper.current = true;
    clearLeaveTimer();
    if (hoverDelay === "none" || isMobile) return;
    clearTimer();
    hoverTimer.current = setTimeout(() => {
      setPanelOpen(true);
    }, (typeof hoverDelay === "number" ? hoverDelay : 0.5) * 1000);
  }, [hoverDelay, clearTimer, clearLeaveTimer, isMobile]);

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
    setPanelOpen((prev) => !prev);
  }, [clearTimer]);

  const togglePin = useCallback(() => {
    updateFolder(folder.id, { pinned: !folder.pinned });
  }, [folder.id, folder.pinned, updateFolder]);

  // In-folder drag reorder handlers
  const handleItemDragStart = useCallback((i: number) => {
    dragItem.current = i;
  }, []);

  const handleItemDragEnter = useCallback((i: number) => {
    dragOver.current = i;
  }, []);

  const handleItemDragEnd = useCallback(() => {
    if (dragItem.current === null || dragOver.current === null) return;
    if (dragItem.current === dragOver.current) {
      dragItem.current = null;
      dragOver.current = null;
      return;
    }
    const updated = [...folder.items];
    const [removed] = updated.splice(dragItem.current, 1);
    updated.splice(dragOver.current, 0, removed);
    updateFolder(folder.id, { items: updated });
    dragItem.current = null;
    dragOver.current = null;
  }, [folder.id, folder.items, updateFolder]);

  const handleRemoveItem = useCallback(
    (itemId: string) => {
      updateFolder(folder.id, {
        items: folder.items.filter((i) => i.id !== itemId),
      });
    },
    [folder.id, folder.items, updateFolder]
  );

  useEffect(() => {
    return () => {
      clearTimer();
      clearLeaveTimer();
    };
  }, [clearTimer, clearLeaveTimer]);

  const label = folder.label[language];
  const ft = (t as unknown as Record<string, Record<string, string>>).folders;

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
        <span className="shrink-0 text-base leading-none">{folder.icon}</span>
        {size >= 2 && (
          <span className="truncate text-xs">{label}</span>
        )}
      </button>

      {/* Mobile fullscreen panel */}
      {panelOpen && isMobile && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-base">{folder.icon}</span>
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
            <FolderGrid
              folder={folder}
              language={language}
              ft={ft}
              onDragStart={handleItemDragStart}
              onDragEnter={handleItemDragEnter}
              onDragEnd={handleItemDragEnd}
              onRemove={handleRemoveItem}
            />
          </div>
        </div>
      )}

      {/* Desktop dropdown panel */}
      {panelOpen && !isMobile && panelPos && (
        <div
          ref={panelRef}
          className="fixed z-[60] border border-slate-700 bg-slate-800 shadow-xl"
          style={{
            top: panelPos.top,
            left: panelPos.left,
            width: Math.min(DEFAULT_PANEL_W, panelMaxW),
            minWidth: Math.min(240, panelMaxW),
            maxWidth: panelMaxW,
            maxHeight: panelMaxH,
            resize: "both",
            overflow: "auto",
            borderRadius: "var(--cc-radius-lg)",
          }}
          onMouseEnter={handlePanelEnter}
          onMouseLeave={handlePanelLeave}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base">{folder.icon}</span>
              <h3 className="text-sm font-semibold text-slate-100">{label}</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); togglePin(); }}
                className="rounded p-1 transition-colors hover:bg-slate-700"
                title={folder.pinned ? ft?.unpin : ft?.pin}
              >
                <Pin
                  className={`h-3.5 w-3.5 ${
                    folder.pinned
                      ? "fill-[var(--cc-accent-400)] text-[var(--cc-accent-400)]"
                      : "text-slate-500"
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPanelOpen(false);
                  onEditOpen(folder.id);
                }}
                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
                title={ft?.editFolder}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPanelOpen(false); }}
                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Panel body */}
          <div className="p-3">
            <FolderGrid
              folder={folder}
              language={language}
              ft={ft}
              onDragStart={handleItemDragStart}
              onDragEnter={handleItemDragEnter}
              onDragEnd={handleItemDragEnd}
              onRemove={handleRemoveItem}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Folder Grid ────────────────────────────────────────────

function FolderGrid({
  folder,
  language,
  ft,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onRemove,
}: {
  folder: FolderDefinition;
  language: "he" | "en";
  ft: Record<string, string>;
  onDragStart: (i: number) => void;
  onDragEnter: (i: number) => void;
  onDragEnd: () => void;
  onRemove: (itemId: string) => void;
}) {
  if (folder.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-500">
        <FolderOpen className="mb-2 h-6 w-6" />
        <span className="text-xs">{ft?.noItems}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${folder.gridCols}, 1fr)`,
        gap: "6px",
      }}
    >
      {folder.items.map((item, index) => (
        <FolderItemCell
          key={item.id}
          item={item}
          dragIndex={index}
          onDragStart={onDragStart}
          onDragEnter={onDragEnter}
          onDragEnd={onDragEnd}
          onRemove={onRemove}
          editMode
        />
      ))}
    </div>
  );
}
