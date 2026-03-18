"use client";

// ===================================================
// App Launcher — Main Hook
// ===================================================

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { LauncherItem, LauncherLayout, LauncherState, GridPosition, LaunchMode, LauncherFolder } from "./types";
import { GRID_COLS, GRID_ROWS, SLOTS_PER_PAGE } from "./constants";
import { buildCatalog } from "./buildCatalog";
import { loadLayout, saveLayout, generateDefaultLayout, computeTotalPages } from "./layoutStorage";

export function useAppLauncher() {
  const catalogRef = useRef<LauncherItem[]>([]);
  if (catalogRef.current.length === 0) {
    catalogRef.current = buildCatalog();
  }
  const catalog = catalogRef.current;

  const [layout, setLayoutState] = useState<LauncherLayout>(() => {
    const stored = loadLayout();
    if (stored) return stored;
    return generateDefaultLayout(catalog);
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);

  // Persist layout changes
  const setLayout = useCallback((updater: LauncherLayout | ((prev: LauncherLayout) => LauncherLayout)) => {
    setLayoutState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveLayout(next);
      return next;
    });
  }, []);

  const totalPages = useMemo(() => computeTotalPages(layout.positions), [layout.positions]);

  // Ensure currentPage is valid
  useEffect(() => {
    if (currentPage >= totalPages) setCurrentPage(Math.max(0, totalPages - 1));
  }, [currentPage, totalPages]);

  // Filtered catalog (search)
  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return catalog;
    const q = searchQuery.toLowerCase();
    return catalog.filter((item) => {
      const labels = [item.label.he, item.label.en, item.label.ru].join(" ").toLowerCase();
      const descs = item.description
        ? [item.description.he, item.description.en, item.description.ru].join(" ").toLowerCase()
        : "";
      return labels.includes(q) || descs.includes(q) || item.id.toLowerCase().includes(q);
    });
  }, [catalog, searchQuery]);

  // Items for ALL pages (for scroll-snap rendering)
  const allPagesItems = useMemo(() => {
    const pages: (LauncherItem | LauncherFolder | null)[][][] = [];

    for (let p = 0; p < totalPages; p++) {
      const grid: (LauncherItem | LauncherFolder | null)[][] = Array.from(
        { length: GRID_ROWS },
        () => Array.from({ length: GRID_COLS }, () => null)
      );

      for (const [itemId, pos] of Object.entries(layout.positions)) {
        if (pos.page !== p) continue;
        if (layout.hiddenItems.includes(itemId)) continue;

        const folder = layout.folders.find((f) => f.id === itemId);
        if (folder) {
          if (pos.row < GRID_ROWS && pos.col < GRID_COLS) {
            grid[pos.row][pos.col] = folder;
          }
          continue;
        }

        const isInFolder = layout.folders.some((f) => f.itemIds.includes(itemId));
        if (isInFolder) continue;

        const item = catalog.find((c) => c.id === itemId);
        if (item && pos.row < GRID_ROWS && pos.col < GRID_COLS) {
          grid[pos.row][pos.col] = item;
        }
      }

      pages.push(grid);
    }

    return pages;
  }, [catalog, layout, totalPages]);

  // Move item to a new position
  const moveItem = useCallback(
    (itemId: string, to: GridPosition) => {
      setLayout((prev) => {
        const positions = { ...prev.positions };
        // Check if target cell is occupied
        const occupant = Object.entries(positions).find(
          ([, pos]) => pos.page === to.page && pos.row === to.row && pos.col === to.col
        );

        if (occupant && occupant[0] !== itemId) {
          // Swap positions
          const fromPos = positions[itemId];
          positions[occupant[0]] = fromPos;
        }

        positions[itemId] = to;
        return { ...prev, positions };
      });
    },
    [setLayout]
  );

  // Create folder from two items
  const createFolder = useCallback(
    (itemId1: string, itemId2: string) => {
      const pos = layout.positions[itemId2];
      if (!pos) return;

      const folderId = `folder:${Date.now()}`;
      setLayout((prev) => {
        const positions = { ...prev.positions };
        // Remove item positions (they go inside the folder)
        delete positions[itemId1];
        delete positions[itemId2];
        // Place folder at item2's position
        positions[folderId] = pos;

        const newFolder: LauncherFolder = {
          id: folderId,
          label: { he: "תיקיה חדשה", en: "New Folder", ru: "Новая папка" },
          color: "#8b5cf6",
          itemIds: [itemId1, itemId2],
        };

        return {
          ...prev,
          positions,
          folders: [...prev.folders, newFolder],
        };
      });
    },
    [layout.positions, setLayout]
  );

  // Set launch mode for an item
  const setLaunchMode = useCallback(
    (itemId: string, mode: LaunchMode) => {
      setLayout((prev) => ({
        ...prev,
        launchModes: { ...prev.launchModes, [itemId]: mode },
      }));
    },
    [setLayout]
  );

  // Get effective launch mode
  const getLaunchMode = useCallback(
    (itemId: string): LaunchMode => {
      if (layout.launchModes[itemId]) return layout.launchModes[itemId];
      const item = catalog.find((c) => c.id === itemId);
      return item?.defaultLaunchMode || "full-page";
    },
    [layout.launchModes, catalog]
  );

  // Toggle item visibility
  const toggleHidden = useCallback(
    (itemId: string) => {
      setLayout((prev) => {
        const hidden = prev.hiddenItems.includes(itemId)
          ? prev.hiddenItems.filter((id) => id !== itemId)
          : [...prev.hiddenItems, itemId];
        return { ...prev, hiddenItems: hidden };
      });
    },
    [setLayout]
  );

  // Navigate pages
  const nextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 0));
  }, []);

  // Selected item object
  const selectedItem = useMemo(
    () => (selectedItemId ? catalog.find((c) => c.id === selectedItemId) || null : null),
    [catalog, selectedItemId]
  );

  return {
    catalog,
    filteredCatalog,
    layout,
    allPagesItems,
    currentPage,
    totalPages,
    searchQuery,
    setSearchQuery,
    selectedItemId,
    setSelectedItemId,
    selectedItem,
    dragActiveId,
    setDragActiveId,
    expandedFolderId,
    setExpandedFolderId,
    moveItem,
    createFolder,
    setLaunchMode,
    getLaunchMode,
    toggleHidden,
    nextPage,
    prevPage,
    setCurrentPage,
  };
}
