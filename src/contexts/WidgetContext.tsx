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
  profiles: "cc-widget-profiles",
  activeProfile: "cc-widget-active-profile",
  labels: "cc-widget-labels",
  icons: "cc-widget-icons",
  displayMode: "cc-topbar-display-mode",
  panelModes: "cc-widget-panel-modes",
} as const;

/** Legacy key — read once for migration, then removed */
const LEGACY_HIDDEN_KEY = "cc-hidden-widgets";

export type HoverDelay = number | "none";
export type TopBarDisplayMode = "normal" | "compact" | "icons-only";
export type WidgetPanelMode = "dropdown" | "side-panel" | "popup";
export type I18nLabel = { he?: string; en?: string; ru?: string };

// ─── Profile System ──────────────────────────────────────────

export interface WidgetBarProfileSnapshot {
  positions: Record<string, number>;
  sizes: Record<string, WidgetSize>;
  placements: Record<string, WidgetPlacement>;
  hoverDelay: HoverDelay;
  folders: FolderDefinition[];
  labels?: Record<string, I18nLabel>;
}

export interface WidgetBarProfile {
  id: string;
  name: string;
  /** i18n key for built-in profiles (e.g. "profileDefault") */
  nameKey?: string;
  builtIn: boolean;
  createdAt: string;
  snapshot: WidgetBarProfileSnapshot;
}

/** Built-in read-only profiles */
export const BUILTIN_PROFILES: WidgetBarProfile[] = [
  {
    id: "__default__",
    name: "Default",
    nameKey: "profileDefault",
    builtIn: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    snapshot: {
      positions: {},
      sizes: {},
      placements: {},
      hoverDelay: 0.5,
      folders: [],
    },
  },
  {
    id: "__minimal__",
    name: "Minimal",
    nameKey: "profileMinimal",
    builtIn: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    snapshot: {
      positions: {},
      sizes: {},
      placements: {
        "quick-create": "disabled",
        favorites: "disabled",
        today: "apps",
        timer: "disabled",
        clipboard: "disabled",
        "keyboard-shortcuts": "apps",
        "weekly-planner": "apps",
        kpi: "apps",
        shortcuts: "disabled",
        wati: "disabled",
        team: "disabled",
      },
      hoverDelay: "none",
      folders: [],
    },
  },
];

// ─── Context Interface ───────────────────────────────────────

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
  // Profile system
  profiles: WidgetBarProfile[];
  activeProfileId: string | null;
  saveProfile: (name: string) => void;
  loadProfile: (id: string) => void;
  deleteProfile: (id: string) => void;
  renameProfile: (id: string, newName: string) => void;
  updateProfileSnapshot: (id: string) => void;
  // Custom labels
  widgetLabels: Record<string, I18nLabel>;
  setWidgetLabel: (id: string, labels: I18nLabel) => void;
  clearWidgetLabel: (id: string) => void;
  // Custom icons
  widgetIcons: Record<string, string>;
  setWidgetIcon: (id: string, iconValue: string) => void;
  clearWidgetIcon: (id: string) => void;
  // Display mode
  displayMode: TopBarDisplayMode;
  setDisplayMode: (mode: TopBarDisplayMode) => void;
  // Panel modes
  widgetPanelModes: Record<string, WidgetPanelMode>;
  setWidgetPanelMode: (id: string, mode: WidgetPanelMode) => void;
}

const defaultState: WidgetState = {
  widgetPositions: {},
  widgetSizes: {},
  widgetPlacements: {},
  hoverDelay: 0.5,
  folders: [],
  setWidgetPosition: () => { /* no-op */ },
  setWidgetPositions: () => { /* no-op */ },
  setWidgetSize: () => { /* no-op */ },
  setWidgetPlacement: () => { /* no-op */ },
  setHoverDelay: () => { /* no-op */ },
  addFolder: () => { /* no-op */ },
  updateFolder: () => { /* no-op */ },
  removeFolder: () => { /* no-op */ },
  profiles: [],
  activeProfileId: null,
  saveProfile: () => { /* no-op */ },
  loadProfile: () => { /* no-op */ },
  deleteProfile: () => { /* no-op */ },
  renameProfile: () => { /* no-op */ },
  updateProfileSnapshot: () => { /* no-op */ },
  widgetLabels: {},
  setWidgetLabel: () => { /* no-op */ },
  clearWidgetLabel: () => { /* no-op */ },
  widgetIcons: {},
  setWidgetIcon: () => { /* no-op */ },
  clearWidgetIcon: () => { /* no-op */ },
  displayMode: "normal",
  setDisplayMode: () => { /* no-op */ },
  widgetPanelModes: {},
  setWidgetPanelMode: () => { /* no-op */ },
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
  const [profiles, setProfilesState] = useState<WidgetBarProfile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [widgetLabels, setWidgetLabelsState] = useState<Record<string, I18nLabel>>({});
  const [displayMode, setDisplayModeState] = useState<TopBarDisplayMode>("normal");
  const [widgetPanelModes, setWidgetPanelModesState] = useState<Record<string, WidgetPanelMode>>({});
  const [widgetIcons, setWidgetIconsState] = useState<Record<string, string>>({});

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
    setProfilesState(
      parseJson<WidgetBarProfile[]>(
        localStorage.getItem(STORAGE_KEYS.profiles),
        []
      )
    );
    setActiveProfileIdState(
      localStorage.getItem(STORAGE_KEYS.activeProfile) || null
    );
    setWidgetLabelsState(
      parseJson<Record<string, I18nLabel>>(
        localStorage.getItem(STORAGE_KEYS.labels),
        {}
      )
    );
    const savedMode = localStorage.getItem(STORAGE_KEYS.displayMode);
    if (savedMode === "normal" || savedMode === "_compact" || savedMode === "icons-only") {
      setDisplayModeState(savedMode);
    }
    setWidgetPanelModesState(
      parseJson<Record<string, WidgetPanelMode>>(
        localStorage.getItem(STORAGE_KEYS.panelModes),
        {}
      )
    );
    setWidgetIconsState(
      parseJson<Record<string, string>>(
        localStorage.getItem(STORAGE_KEYS.icons),
        {}
      )
    );
  }, []);

  // ─── Existing widget setters ───────────────────────────────

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

  // ─── Custom labels ─────────────────────────────────────────

  const setWidgetLabel = useCallback((id: string, labels: I18nLabel) => {
    setWidgetLabelsState((prev) => {
      const next = { ...prev, [id]: labels };
      localStorage.setItem(STORAGE_KEYS.labels, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearWidgetLabel = useCallback((id: string) => {
    setWidgetLabelsState((prev) => {
      const next = { ...prev };
      delete next[id];
      localStorage.setItem(STORAGE_KEYS.labels, JSON.stringify(next));
      return next;
    });
  }, []);

  // ─── Custom icons ─────────────────────────────────────────

  const setWidgetIcon = useCallback((id: string, iconValue: string) => {
    setWidgetIconsState((prev) => {
      const next = { ...prev, [id]: iconValue };
      localStorage.setItem(STORAGE_KEYS.icons, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearWidgetIcon = useCallback((id: string) => {
    setWidgetIconsState((prev) => {
      const next = { ...prev };
      delete next[id];
      localStorage.setItem(STORAGE_KEYS.icons, JSON.stringify(next));
      return next;
    });
  }, []);

  // ─── Display mode ─────────────────────────────────────────

  const setDisplayMode = useCallback((mode: TopBarDisplayMode) => {
    setDisplayModeState(mode);
    localStorage.setItem(STORAGE_KEYS.displayMode, mode);
  }, []);

  // ─── Panel modes ──────────────────────────────────────────

  const setWidgetPanelMode = useCallback((id: string, mode: WidgetPanelMode) => {
    setWidgetPanelModesState((prev) => {
      const next = { ...prev, [id]: mode };
      localStorage.setItem(STORAGE_KEYS.panelModes, JSON.stringify(next));
      return next;
    });
  }, []);

  // ─── Profile methods ───────────────────────────────────────

  /** Helper: persist profiles array to localStorage */
  const persistProfiles = useCallback((arr: WidgetBarProfile[]) => {
    localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(arr));
  }, []);

  const persistActiveId = useCallback((id: string | null) => {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.activeProfile, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.activeProfile);
    }
  }, []);

  /** Apply a snapshot to all widget state fields */
  const applySnapshot = useCallback((snap: WidgetBarProfileSnapshot) => {
    const s = JSON.parse(JSON.stringify(snap)) as WidgetBarProfileSnapshot;
    setWidgetPositionsState(s.positions);
    localStorage.setItem(STORAGE_KEYS.positions, JSON.stringify(s.positions));
    setWidgetSizesState(s.sizes);
    localStorage.setItem(STORAGE_KEYS.sizes, JSON.stringify(s.sizes));
    setWidgetPlacementsState(s.placements);
    localStorage.setItem(STORAGE_KEYS.placements, JSON.stringify(s.placements));
    setHoverDelayState(s.hoverDelay);
    localStorage.setItem(
      STORAGE_KEYS.hoverDelay,
      s.hoverDelay === "none" ? "none" : String(s.hoverDelay)
    );
    setFoldersState(s.folders);
    localStorage.setItem(STORAGE_KEYS.folders, JSON.stringify(s.folders));
    // Labels (backwards-compatible — older snapshots may not have labels)
    const labels = s.labels || {};
    setWidgetLabelsState(labels);
    localStorage.setItem(STORAGE_KEYS.labels, JSON.stringify(labels));
  }, []);

  /** Capture current state as a snapshot */
  const captureSnapshot = useCallback((): WidgetBarProfileSnapshot => ({
    positions: { ...widgetPositions },
    sizes: { ...widgetSizes },
    placements: { ...widgetPlacements },
    hoverDelay,
    folders: JSON.parse(JSON.stringify(folders)),
    labels: { ...widgetLabels },
  }), [widgetPositions, widgetSizes, widgetPlacements, hoverDelay, folders, widgetLabels]);

  const saveProfile = useCallback(
    (name: string) => {
      const _profile: WidgetBarProfile = {
        id: crypto.randomUUID(),
        name,
        builtIn: false,
        createdAt: new Date().toISOString(),
        snapshot: captureSnapshot(),
      };
      setProfilesState((prev) => {
        const next = [...prev, profile];
        persistProfiles(next);
        return next;
      });
      setActiveProfileIdState(_profile.id);
      persistActiveId(_profile.id);
      window.dispatchEvent(new CustomEvent("cc-notify", {
        detail: { type: "success" },
      }));
    },
    [captureSnapshot, persistProfiles, persistActiveId]
  );

  const loadProfile = useCallback(
    (id: string) => {
      const all = [...BUILTIN_PROFILES, ...profiles];
      const _profile = all.find((p) => p.id === id);
      if (!_profile) return;
      applySnapshot(_profile.snapshot);
      setActiveProfileIdState(id);
      persistActiveId(id);
      window.dispatchEvent(new Event("cc-_profile-change"));
    },
    [profiles, applySnapshot, persistActiveId]
  );

  const deleteProfile = useCallback(
    (id: string) => {
      setProfilesState((prev) => {
        const target = prev.find((p) => p.id === id);
        if (!target || target.builtIn) return prev;
        const next = prev.filter((p) => p.id !== id);
        persistProfiles(next);
        return next;
      });
      setActiveProfileIdState((prev) => {
        if (prev === id) {
          persistActiveId(null);
          return null;
        }
        return prev;
      });
    },
    [persistProfiles, persistActiveId]
  );

  const renameProfile = useCallback(
    (id: string, newName: string) => {
      setProfilesState((prev) => {
        const next = prev.map((p) =>
          p.id === id && !p.builtIn ? { ...p, name: newName } : p
        );
        persistProfiles(next);
        return next;
      });
    },
    [persistProfiles]
  );

  const updateProfileSnapshot = useCallback(
    (id: string) => {
      setProfilesState((prev) => {
        const next = prev.map((p) =>
          p.id === id && !p.builtIn
            ? { ...p, snapshot: captureSnapshot() }
            : p
        );
        persistProfiles(next);
        return next;
      });
    },
    [captureSnapshot, persistProfiles]
  );

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
      profiles,
      activeProfileId,
      saveProfile,
      loadProfile,
      deleteProfile,
      renameProfile,
      updateProfileSnapshot,
      widgetLabels,
      setWidgetLabel,
      clearWidgetLabel,
      widgetIcons,
      setWidgetIcon,
      clearWidgetIcon,
      displayMode,
      setDisplayMode,
      widgetPanelModes,
      setWidgetPanelMode,
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
      profiles,
      activeProfileId,
      saveProfile,
      loadProfile,
      deleteProfile,
      renameProfile,
      updateProfileSnapshot,
      widgetLabels,
      setWidgetLabel,
      clearWidgetLabel,
      widgetIcons,
      setWidgetIcon,
      clearWidgetIcon,
      displayMode,
      setDisplayMode,
      widgetPanelModes,
      setWidgetPanelMode,
    ]
  );

  return (
    <WidgetContext.Provider value={value}>
      {children}
    </WidgetContext.Provider>
  );
}
