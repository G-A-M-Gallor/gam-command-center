"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { WidgetSize } from "@/components/command-center/widgets/WidgetRegistry";
import type { FolderDefinition } from "@/components/command-center/widgets/FolderRegistry";

const STORAGE_KEYS = {
  positions: "cc-widget-positions",
  sizes: "cc-widget-sizes",
  hidden: "cc-hidden-widgets",
  hoverDelay: "cc-widget-hover-delay",
  folders: "cc-folders",
} as const;

export type HoverDelay = number | "none";

interface WidgetState {
  widgetPositions: Record<string, number>;
  widgetSizes: Record<string, WidgetSize>;
  hiddenWidgets: string[];
  hoverDelay: HoverDelay;
  folders: FolderDefinition[];
  setWidgetPosition: (id: string, col: number) => void;
  setWidgetPositions: (positions: Record<string, number>) => void;
  setWidgetSize: (id: string, size: WidgetSize) => void;
  toggleWidget: (id: string) => void;
  setHoverDelay: (delay: HoverDelay) => void;
  addFolder: (folder: FolderDefinition) => void;
  updateFolder: (id: string, patch: Partial<FolderDefinition>) => void;
  removeFolder: (id: string) => void;
}

const defaultState: WidgetState = {
  widgetPositions: {},
  widgetSizes: {},
  hiddenWidgets: [],
  hoverDelay: 0.5,
  folders: [],
  setWidgetPosition: () => {},
  setWidgetPositions: () => {},
  setWidgetSize: () => {},
  toggleWidget: () => {},
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

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  const [widgetPositions, setWidgetPositionsState] = useState<
    Record<string, number>
  >({});
  const [widgetSizes, setWidgetSizesState] = useState<
    Record<string, WidgetSize>
  >({});
  const [hiddenWidgets, setHiddenWidgetsState] = useState<string[]>([]);
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
    setHiddenWidgetsState(
      parseJson<string[]>(localStorage.getItem(STORAGE_KEYS.hidden), [])
    );
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
      setWidgetPositionsState(positions);
      localStorage.setItem(STORAGE_KEYS.positions, JSON.stringify(positions));
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

  const toggleWidget = useCallback(
    (id: string) => {
      setHiddenWidgetsState((prev) => {
        const next = prev.includes(id)
          ? prev.filter((w) => w !== id)
          : [...prev, id];
        localStorage.setItem(STORAGE_KEYS.hidden, JSON.stringify(next));
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

  return (
    <WidgetContext.Provider
      value={{
        widgetPositions,
        widgetSizes,
        hiddenWidgets,
        hoverDelay,
        folders,
        setWidgetPosition,
        setWidgetPositions,
        setWidgetSize,
        toggleWidget,
        setHoverDelay,
        addFolder,
        updateFolder,
        removeFolder,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
}
