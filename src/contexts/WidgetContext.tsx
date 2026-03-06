"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { WidgetSize } from "@/components/command-center/widgets/WidgetRegistry";
import type { WidgetPlacement } from "@/components/command-center/widgets/WidgetRegistry";
import type { FolderDefinition } from "@/components/command-center/widgets/FolderRegistry";

const STORAGE_KEYS = {
  positions: "cc-widget-positions",
  sizes: "cc-widget-sizes",
  placements: "cc-widget-placements",
  hoverDelay: "cc-widget-hover-delay",
  folders: "cc-folders",
} as const;

/** Legacy key — read once for migration, then removed */
const LEGACY_HIDDEN_KEY = "cc-hidden-widgets";

export type HoverDelay = number | "none";

interface WidgetState {
  widgetPositions: Record<string, number>;
  widgetSizes: Record<string, WidgetSize>;
  widgetPlacements: Record<string, WidgetPlacement>;
  hoverDelay: HoverDelay;
  folders: FolderDefinition[];
  setWidgetPosition: (id: string, col: number) => void;
  setWidgetPositions: (positions: Record<string, number>) => void;
  setWidgetSize: (id: string, size: WidgetSize) => void;
  setWidgetPlacement: (id: string, placement: WidgetPlacement) => void;
  setHoverDelay: (delay: HoverDelay) => void;
  addFolder: (folder: FolderDefinition) => void;
  updateFolder: (id: string, patch: Partial<FolderDefinition>) => void;
  removeFolder: (id: string) => void;
}

const defaultState: WidgetState = {
  widgetPositions: {},
  widgetSizes: {},
  widgetPlacements: {},
  hoverDelay: 0.5,
  folders: [],
  setWidgetPosition: () => {},
  setWidgetPositions: () => {},
  setWidgetSize: () => {},
  setWidgetPlacement: () => {},
  setHoverDelay: () => {},
  addFolder: () => {},
  updateFolder: () => {},
  removeFolder: () => {},
};

const WidgetContext = createContext<WidgetState>(defaultState);

export function useWidgets() {
  const ctx = useContext(WidgetContext);
  if (!ctx) throw new Error("useWidgets must be used within WidgetProvider");
  return ctx;
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function parseHoverDelay(raw: string | null): HoverDelay {
  if (!raw) return 0.5;
  if (raw === "none") return "none";
  const n = parseFloat(raw);
  if (!isNaN(n) && n >= 0.1 && n <= 3) return n;
  return 0.5;
}

/**
 * Migrate from legacy `cc-hidden-widgets` (string[]) to `cc-widget-placements` (Record).
 * Items in the old hidden array → "disabled". Everything else defaults to "toolbar".
 */
function migratePlacements(): Record<string, WidgetPlacement> {
  const newRaw = localStorage.getItem(STORAGE_KEYS.placements);
  if (newRaw) return parseJson<Record<string, WidgetPlacement>>(newRaw, {});

  const legacyRaw = localStorage.getItem(LEGACY_HIDDEN_KEY);
  if (legacyRaw) {
    const hidden = parseJson<string[]>(legacyRaw, []);
    const placements: Record<string, WidgetPlacement> = {};
    for (const id of hidden) {
      placements[id] = "disabled";
    }
    localStorage.setItem(STORAGE_KEYS.placements, JSON.stringify(placements));
    localStorage.removeItem(LEGACY_HIDDEN_KEY);
    return placements;
  }

  return {};
}

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  const [widgetPositions, setWidgetPositionsState] = useState<
    Record<string, number>
  >({});
  const [widgetSizes, setWidgetSizesState] = useState<
    Record<string, WidgetSize>
  >({});
  const [widgetPlacements, setWidgetPlacementsState] = useState<
    Record<string, WidgetPlacement>
  >({});
  const [hoverDelay, setHoverDelayState] = useState<HoverDelay>(0.5);
  const [folders, setFoldersState] = useState<FolderDefinition[]>([]);

  useEffect(() => {
    setWidgetPositionsState(
      parseJson<Record<string, number>>(
        localStorage.getItem(STORAGE_KEYS.positions),
        {}
      )
    );
    setWidgetSizesState(
      parseJson<Record<string, WidgetSize>>(
        localStorage.getItem(STORAGE_KEYS.sizes),
        {}
      )
    );
    setWidgetPlacementsState(migratePlacements());
    setHoverDelayState(
      parseHoverDelay(localStorage.getItem(STORAGE_KEYS.hoverDelay))
    );
    setFoldersState(
      parseJson<FolderDefinition[]>(
        localStorage.getItem(STORAGE_KEYS.folders),
        []
      )
    );
  }, []);

  const setWidgetPosition = useCallback(
    (id: string, col: number) => {
      setWidgetPositionsState((prev) => {
        const next = { ...prev, [id]: col };
        localStorage.setItem(STORAGE_KEYS.positions, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const setWidgetPositions = useCallback(
    (positions: Record<string, number>) => {
      setWidgetPositionsState((prev) => {
        const keys = Object.keys(positions);
        if (
          keys.length === Object.keys(prev).length &&
          keys.every((k) => prev[k] === positions[k])
        ) {
          return prev;
        }
        localStorage.setItem(STORAGE_KEYS.positions, JSON.stringify(positions));
        return positions;
      });
    },
    []
  );

  const setWidgetSize = useCallback(
    (id: string, size: WidgetSize) => {
      setWidgetSizesState((prev) => {
        const next = { ...prev, [id]: size };
        localStorage.setItem(STORAGE_KEYS.sizes, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const setWidgetPlacement = useCallback(
    (id: string, placement: WidgetPlacement) => {
      setWidgetPlacementsState((prev) => {
        const next = { ...prev, [id]: placement };
        localStorage.setItem(STORAGE_KEYS.placements, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const setHoverDelay = useCallback((delay: HoverDelay) => {
    setHoverDelayState(delay);
    localStorage.setItem(
      STORAGE_KEYS.hoverDelay,
      delay === "none" ? "none" : String(delay)
    );
  }, []);

  const addFolder = useCallback((folder: FolderDefinition) => {
    setFoldersState((prev) => {
      const next = [...prev, folder];
      localStorage.setItem(STORAGE_KEYS.folders, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateFolder = useCallback(
    (id: string, patch: Partial<FolderDefinition>) => {
      setFoldersState((prev) => {
        const next = prev.map((f) => (f.id === id ? { ...f, ...patch } : f));
        localStorage.setItem(STORAGE_KEYS.folders, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const removeFolder = useCallback((id: string) => {
    setFoldersState((prev) => {
      const next = prev.filter((f) => f.id !== id);
      localStorage.setItem(STORAGE_KEYS.folders, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<WidgetState>(
    () => ({
      widgetPositions,
      widgetSizes,
      widgetPlacements,
      hoverDelay,
      folders,
      setWidgetPosition,
      setWidgetPositions,
      setWidgetSize,
      setWidgetPlacement,
      setHoverDelay,
      addFolder,
      updateFolder,
      removeFolder,
    }),
    [
      widgetPositions,
      widgetSizes,
      widgetPlacements,
      hoverDelay,
      folders,
      setWidgetPosition,
      setWidgetPositions,
      setWidgetSize,
      setWidgetPlacement,
      setHoverDelay,
      addFolder,
      updateFolder,
      removeFolder,
    ]
  );

  return (
    <WidgetContext.Provider value={value}>
      {children}
    </WidgetContext.Provider>
  );
}
