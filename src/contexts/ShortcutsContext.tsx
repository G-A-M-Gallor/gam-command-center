"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import {
  SYSTEM_SHORTCUTS,
  RESERVED_COMBOS,
  type ShortcutDefinition,
  type UserShortcutOverride,
  type ShortcutScope,
} from "@/lib/shortcuts/shortcutRegistry";
import {
  parseCombo,
  matchesEvent,
  detectConflict,
  type ConflictResult,
} from "@/lib/shortcuts/shortcutEngine";

// ─── Storage ────────────────────────────────────────────────

const OVERRIDES_KEY = "cc-shortcut-overrides";

function loadOverrides(): UserShortcutOverride[] {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOverrides(overrides: UserShortcutOverride[]) {
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    /* ignore */
  }
}

// ─── Resolved Shortcut (system + user state merged) ─────────

export interface ResolvedShortcut {
  id: string;
  keyCombo: string;
  actionSlug: string;
  category: ShortcutDefinition["category"];
  displayName: { he: string; en: string; ru: string };
  isSystem: boolean;
  isCustom: boolean;
  isActive: boolean;
  isReserved: boolean;
  scope: ShortcutScope;
  sortOrder: number;
}

// ─── Context Interface ──────────────────────────────────────

interface ShortcutsState {
  shortcuts: ResolvedShortcut[];
  currentScope: ShortcutScope;
  setCurrentScope: (scope: ShortcutScope) => void;
  toggleShortcut: (id: string) => void;
  addCustomShortcut: (sc: {
    keyCombo: string;
    actionSlug: string;
    category: ShortcutDefinition["category"];
    displayName: { he: string; en: string; ru: string };
  }) => void;
  deleteCustomShortcut: (id: string) => void;
  checkConflict: (keyCombo: string, excludeId?: string) => ConflictResult;
  resetToDefaults: () => void;
}

const defaultState: ShortcutsState = {
  shortcuts: [],
  currentScope: "global",
  setCurrentScope: () => {},
  toggleShortcut: () => {},
  addCustomShortcut: () => {},
  deleteCustomShortcut: () => {},
  checkConflict: () => ({ hasConflict: false, conflictWith: null }),
  resetToDefaults: () => {},
};

const ShortcutsContext = createContext<ShortcutsState>(defaultState);

export function useShortcuts() {
  return useContext(ShortcutsContext);
}

// ─── Provider ───────────────────────────────────────────────

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<UserShortcutOverride[]>([]);
  const [currentScope, setCurrentScope] = useState<ShortcutScope>("global");
  const [mounted, setMounted] = useState(false);

  // Load overrides on mount
  useEffect(() => {
    setOverrides(loadOverrides());
    setMounted(true);
  }, []);

  // Persist overrides
  const updateOverrides = useCallback((next: UserShortcutOverride[]) => {
    setOverrides(next);
    saveOverrides(next);
  }, []);

  // Merge system + user overrides into resolved list
  const shortcuts: ResolvedShortcut[] = useMemo(() => {
    // Normalize reserved combos for quick lookup
    const normalizeCombo = (c: string) =>
      c.split("+").map((p) => p.trim().toLowerCase()).sort().join("+");
    const reservedSet = new Set(RESERVED_COMBOS.map(normalizeCombo));
    const isReservedCombo = (combo: string) => reservedSet.has(normalizeCombo(combo));

    const resolved: ResolvedShortcut[] = SYSTEM_SHORTCUTS.map((sc) => {
      const override = overrides.find((o) => o.shortcutId === sc.id);
      const combo = override?.keyCombo || sc.keyCombo;
      return {
        id: sc.id,
        keyCombo: combo,
        actionSlug: sc.actionSlug,
        category: sc.category,
        displayName: sc.displayName,
        isSystem: true,
        isCustom: false,
        isActive: override ? override.isActive : true,
        isReserved: isReservedCombo(combo),
        scope: sc.scope,
        sortOrder: sc.sortOrder,
      };
    });

    // Add custom shortcuts
    for (const uo of overrides) {
      if (!uo.isCustom) continue;
      resolved.push({
        id: uo.shortcutId || `custom-${uo.actionSlug}`,
        keyCombo: uo.keyCombo,
        actionSlug: uo.actionSlug,
        category: uo.category,
        displayName: uo.displayName,
        isSystem: false,
        isCustom: true,
        isActive: uo.isActive,
        isReserved: isReservedCombo(uo.keyCombo),
        scope: "global",
        sortOrder: 99,
      });
    }

    return resolved;
  }, [overrides]);

  // Keep a ref for the keydown handler
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;
  const scopeRef = useRef(currentScope);
  scopeRef.current = currentScope;

  // ── Action Dispatch Map ─────────────────────────────────

  const routerRef = useRef(router);
  routerRef.current = router;

  const executeAction = useCallback((actionSlug: string) => {
    const r = routerRef.current;
    const NAV: Record<string, string> = {
      nav_layers: "/dashboard/layers",
      nav_editor: "/dashboard/editor",
      nav_story_map: "/dashboard/story-map",
      nav_functional_map: "/dashboard/functional-map",
      nav_ai_hub: "/dashboard/ai-hub",
      nav_design_system: "/dashboard/design-system",
      nav_formily: "/dashboard/formily",
      nav_architecture: "/dashboard/architecture",
      nav_plan: "/dashboard/plan",
      nav_home: "/dashboard",
    };

    if (NAV[actionSlug]) {
      r.push(NAV[actionSlug]);
      return;
    }

    const EVENTS: Record<string, string> = {
      search_open: "cc-open-search",
      shortcuts_open: "cc-open-shortcuts",
      ai_toggle: "cc-open-ai",
      quick_create: "cc-open-quick-create",
      toggle_sidebar: "cc-toggle-sidebar",
      toggle_edit_mode: "cc-toggle-edit-mode",
      open_wati: "cc-open-wati",
      open_notifications: "cc-open-notifications",
      filter_toggle: "cc-filter-toggle",
      filter_by_status: "cc-filter-status",
      filter_by_layer: "cc-filter-layer",
      filter_clear: "cc-filter-clear",
      ai_chat_mode: "cc-ai-mode-chat",
      ai_analyze_mode: "cc-ai-mode-analyze",
      ai_write_mode: "cc-ai-mode-write",
      ai_clear_chat: "cc-ai-clear",
      view_grid: "cc-view-grid",
      view_list: "cc-view-list",
      view_board: "cc-view-board",
      fullscreen: "cc-fullscreen",
      new_document: "cc-new-document",
      new_project: "cc-new-project",
      card_next: "cc-card-next",
      card_prev: "cc-card-prev",
      card_open: "cc-card-open",
      card_expand: "cc-card-expand",
      card_archive: "cc-card-archive",
    };

    const eventName = EVENTS[actionSlug];
    if (eventName) {
      window.dispatchEvent(new CustomEvent(eventName));
    }
  }, []);

  // ── Global Keydown Handler ──────────────────────────────

  useEffect(() => {
    if (!mounted) return;

    // Pre-parse reserved combos once
    const reservedParsed = RESERVED_COMBOS.map((c) => parseCombo(c));

    function handleKeyDown(e: KeyboardEvent) {
      // Never intercept OS-reserved combos
      for (const rp of reservedParsed) {
        if (matchesEvent(e, rp)) return;
      }

      // Don't intercept when typing in inputs (unless it has a modifier)
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Allow single-key shortcuts (J, K, etc.) only outside inputs
      // Modifier shortcuts (Cmd+K) work everywhere
      const hasModifier = e.metaKey || e.ctrlKey || e.altKey;

      const active = shortcutsRef.current.filter((sc) => {
        if (!sc.isActive) return false;
        if (sc.scope !== "global" && sc.scope !== scopeRef.current) return false;
        return true;
      });

      for (const sc of active) {
        const parsed = parseCombo(sc.keyCombo);
        const needsModifier = parsed.meta || parsed.alt;

        // Skip single-key shortcuts when in input
        if (isInput && !needsModifier) continue;

        if (matchesEvent(e, parsed)) {
          e.preventDefault();
          e.stopPropagation();
          executeAction(sc.actionSlug);
          return;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [mounted, executeAction]);

  // ── Context Actions ─────────────────────────────────────

  const toggleShortcut = useCallback(
    (id: string) => {
      const existing = overrides.find(
        (o) => o.shortcutId === id || (o.isCustom && o.actionSlug === id)
      );

      if (existing) {
        const next = overrides.map((o) =>
          o === existing ? { ...o, isActive: !o.isActive } : o
        );
        updateOverrides(next);
      } else {
        // System shortcut with no override yet — create one to disable
        const system = SYSTEM_SHORTCUTS.find((s) => s.id === id);
        if (!system) return;
        const next: UserShortcutOverride[] = [
          ...overrides,
          {
            shortcutId: id,
            keyCombo: system.keyCombo,
            actionSlug: system.actionSlug,
            category: system.category,
            displayName: system.displayName,
            isActive: false,
            isCustom: false,
          },
        ];
        updateOverrides(next);
      }
    },
    [overrides, updateOverrides]
  );

  const addCustomShortcut = useCallback(
    (sc: {
      keyCombo: string;
      actionSlug: string;
      category: ShortcutDefinition["category"];
      displayName: { he: string; en: string; ru: string };
    }) => {
      const next: UserShortcutOverride[] = [
        ...overrides,
        {
          shortcutId: `custom-${Date.now()}`,
          keyCombo: sc.keyCombo,
          actionSlug: sc.actionSlug,
          category: sc.category,
          displayName: sc.displayName,
          isActive: true,
          isCustom: true,
        },
      ];
      updateOverrides(next);
    },
    [overrides, updateOverrides]
  );

  const deleteCustomShortcut = useCallback(
    (id: string) => {
      const next = overrides.filter(
        (o) => !(o.isCustom && (o.shortcutId === id || o.actionSlug === id))
      );
      updateOverrides(next);
    },
    [overrides, updateOverrides]
  );

  const checkConflict = useCallback(
    (keyCombo: string, excludeId?: string) => {
      return detectConflict(keyCombo, SYSTEM_SHORTCUTS, overrides, excludeId);
    },
    [overrides]
  );

  const resetToDefaults = useCallback(() => {
    updateOverrides([]);
  }, [updateOverrides]);

  const value: ShortcutsState = useMemo(
    () => ({
      shortcuts,
      currentScope,
      setCurrentScope,
      toggleShortcut,
      addCustomShortcut,
      deleteCustomShortcut,
      checkConflict,
      resetToDefaults,
    }),
    [
      shortcuts,
      currentScope,
      toggleShortcut,
      addCustomShortcut,
      deleteCustomShortcut,
      checkConflict,
      resetToDefaults,
    ]
  );

  return (
    <ShortcutsContext.Provider value={value}>
      {children}
    </ShortcutsContext.Provider>
  );
}
