// ===================================================
// App Launcher — Layout Persistence (localStorage)
// ===================================================

import type { LauncherLayout, LauncherItem, GridPosition } from "./types";
import { STORAGE_KEY, LAYOUT_VERSION, GRID_COLS, GRID_ROWS, SLOTS_PER_PAGE, CATEGORY_ORDER } from "./constants";

/** Generate default layout: items sorted by category, placed sequentially */
export function generateDefaultLayout(catalog: LauncherItem[]): LauncherLayout {
  const sorted = [...catalog]
    .filter((item) => item.status === "active")
    .sort((a, b) => {
      const catDiff = (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99);
      if (catDiff !== 0) return catDiff;
      return a.id.localeCompare(b.id);
    });

  const positions: Record<string, GridPosition> = {};
  sorted.forEach((item, idx) => {
    const page = Math.floor(idx / SLOTS_PER_PAGE);
    const slot = idx % SLOTS_PER_PAGE;
    positions[item.id] = {
      page,
      row: Math.floor(slot / GRID_COLS),
      col: slot % GRID_COLS,
    };
  });

  return {
    version: LAYOUT_VERSION,
    gridCols: GRID_COLS,
    gridRows: GRID_ROWS,
    positions,
    folders: [],
    launchModes: {},
    hiddenItems: [],
  };
}

/** Load layout from localStorage */
export function loadLayout(): LauncherLayout | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LauncherLayout;
    if (parsed.version !== LAYOUT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Save layout to localStorage */
export function saveLayout(layout: LauncherLayout): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // localStorage full — silent fail
  }
}

/** Compute total pages needed */
export function computeTotalPages(positions: Record<string, GridPosition>): number {
  let maxPage = 0;
  for (const pos of Object.values(positions)) {
    if (pos.page > maxPage) maxPage = pos.page;
  }
  return maxPage + 1;
}
