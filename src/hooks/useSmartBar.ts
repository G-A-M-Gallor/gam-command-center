"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  widgetRegistry,
  getEffectivePlacement,
  type WidgetSize,
} from "@/components/command-center/widgets/WidgetRegistry";
import { useWidgets } from "@/contexts/WidgetContext";

// ─── Types ─────────────────────────────────────────

export interface SmartBarSlot {
  widgetId: string;
  size: WidgetSize;
  locked: boolean;
}

export interface SmartBarState {
  /** Widgets that fit in the visible bar (sorted by position) */
  visibleSlots: SmartBarSlot[];
  /** Widgets that don't fit — shown in overflow menu */
  overflowSlots: SmartBarSlot[];
  /** Number of available dynamic slot columns */
  availableColumns: number;
  /** Total bar width in px */
  barWidth: number;
  /** Lock/unlock a widget */
  toggleLock: (widgetId: string) => void;
  /** Check if a widget is locked */
  isLocked: (widgetId: string) => boolean;
  /** Push-reorder: move widget to new position, shifting others */
  reorderWidget: (widgetId: string, newCol: number) => void;
}

// ─── Constants ─────────────────────────────────────

const UNIT = 48;
const GAP = 0;
const SLOT_WIDTH = UNIT + GAP;
const PINNED_LEFT_WIDTH = UNIT; // Settings button
const PINNED_RIGHT_WIDTH = UNIT * 2 + 8; // Store + Profile + gap
const MORE_BUTTON_WIDTH = UNIT;

const LOCK_STORAGE_KEY = "cc-smartbar-locks";

// ─── Helpers ───────────────────────────────────────

function loadLocks(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LOCK_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveLocks(locks: Record<string, boolean>) {
  localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(locks));
}

// ─── Hook ──────────────────────────────────────────

export function useSmartBar(containerRef: React.RefObject<HTMLDivElement | null>): SmartBarState {
  const {
    widgetPositions,
    widgetSizes,
    widgetPlacements,
    setWidgetPosition,
    setWidgetPositions,
    folders,
  } = useWidgets();

  const [barWidth, setBarWidth] = useState(0);
  const [locks, setLocks] = useState<Record<string, boolean>>({});

  // Load locks from localStorage
  useEffect(() => {
    setLocks(loadLocks());
  }, []);

  // ResizeObserver on container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setBarWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setBarWidth(el.clientWidth);
    return () => observer.disconnect();
  }, [containerRef]);

  // Available columns for dynamic slots
  const availableColumns = useMemo(() => {
    if (barWidth === 0) return 0;
    const dynamicWidth = barWidth - PINNED_LEFT_WIDTH - PINNED_RIGHT_WIDTH - MORE_BUTTON_WIDTH;
    return Math.max(0, Math.floor(dynamicWidth / SLOT_WIDTH));
  }, [barWidth]);

  // Get toolbar widgets sorted by position
  const toolbarWidgets = useMemo(() => {
    return widgetRegistry
      .filter((w) => {
        if (w.status !== "active") return false;
        // Settings and search are system widgets — always in toolbar
        return getEffectivePlacement(w.id, widgetPlacements, w.isRemovable) === "toolbar";
      })
      .map((w) => ({
        widgetId: w.id,
        size: widgetSizes[w.id] ?? w.defaultSize,
        position: widgetPositions[w.id] ?? 999,
        locked: locks[w.id] ?? false,
      }))
      .sort((a, b) => a.position - b.position);
  }, [widgetPlacements, widgetSizes, widgetPositions, locks]);

  // Split into visible vs overflow based on available columns
  const { visibleSlots, overflowSlots } = useMemo(() => {
    const visible: SmartBarSlot[] = [];
    const overflow: SmartBarSlot[] = [];
    let usedColumns = 0;

    for (const w of toolbarWidgets) {
      if (usedColumns + w.size <= availableColumns) {
        visible.push({ widgetId: w.widgetId, size: w.size, locked: w.locked });
        usedColumns += w.size;
      } else {
        overflow.push({ widgetId: w.widgetId, size: w.size, locked: w.locked });
      }
    }

    return { visibleSlots: visible, overflowSlots: overflow };
  }, [toolbarWidgets, availableColumns]);

  // Toggle lock
  const toggleLock = useCallback((widgetId: string) => {
    setLocks((prev) => {
      const next = { ...prev, [widgetId]: !prev[widgetId] };
      saveLocks(next);
      return next;
    });
  }, []);

  const isLocked = useCallback(
    (widgetId: string) => locks[widgetId] ?? false,
    [locks]
  );

  // Push-reorder: move widget to newCol, pushing others aside
  const reorderWidget = useCallback(
    (widgetId: string, newCol: number) => {
      if (locks[widgetId]) return; // Locked widgets don't move

      const sorted = [...toolbarWidgets].sort((a, b) => a.position - b.position);
      const movingIdx = sorted.findIndex((w) => w.widgetId === widgetId);
      if (movingIdx === -1) return;

      // Remove the moving widget and reinsert at new position
      const moving = sorted.splice(movingIdx, 1)[0];

      // Find insertion index based on newCol
      let insertIdx = sorted.length;
      let colAccum = 0;
      for (let i = 0; i < sorted.length; i++) {
        if (colAccum >= newCol) {
          insertIdx = i;
          break;
        }
        colAccum += sorted[i].size;
      }

      sorted.splice(insertIdx, 0, moving);

      // Recalculate positions sequentially (push physics)
      const newPositions: Record<string, number> = { ...widgetPositions };
      let nextCol = 0;
      for (const w of sorted) {
        newPositions[w.widgetId] = nextCol;
        nextCol += w.size;
      }

      setWidgetPositions(newPositions);
    },
    [toolbarWidgets, widgetPositions, setWidgetPositions, locks]
  );

  return {
    visibleSlots,
    overflowSlots,
    availableColumns,
    barWidth,
    toggleLock,
    isLocked,
    reorderWidget,
  };
}
