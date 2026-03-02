"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { usePathname } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────

export interface ElementStyle {
  backgroundColor?: string;
  color?: string;
  textHighlight?: string;
  borderColor?: string;
  fontFamily?: string;
  fontSize?: string;
  letterSpacing?: string;
  lineHeight?: string;
  textContent?: string;
}

export type OverrideMap = Record<string, ElementStyle>;

export interface TextHistoryEntry {
  text: string;
  timestamp: number;
}

export type TextHistoryMap = Record<string, TextHistoryEntry[]>;

interface StyleOverrideState {
  overrides: OverrideMap;
  personalOverrides: OverrideMap;
  viewMode: "system" | "custom";
  textHistory: TextHistoryMap;
  setElementStyle: (ccId: string, style: Partial<ElementStyle>) => void;
  resetElement: (ccId: string) => void;
  resetAll: () => void;
  setViewMode: (mode: "system" | "custom") => void;
  clearTextHistory: (ccId: string) => void;
}

const STORAGE_KEYS = {
  personal: "cc-style-overrides-personal",
  viewMode: "cc-style-view-mode",
  textHistory: "cc-text-history",
} as const;

const defaultState: StyleOverrideState = {
  overrides: {},
  personalOverrides: {},
  viewMode: "custom",
  textHistory: {},
  setElementStyle: () => {},
  resetElement: () => {},
  resetAll: () => {},
  setViewMode: () => {},
  clearTextHistory: () => {},
};

const StyleOverrideContext = createContext<StyleOverrideState>(defaultState);

export function useStyleOverrides() {
  return useContext(StyleOverrideContext);
}

// ─── CSS property mapping ────────────────────────────────────

const CSS_PROP_MAP: Record<string, string> = {
  backgroundColor: "background-color",
  color: "color",
  textHighlight: "box-shadow",
  borderColor: "border-color",
  fontFamily: "font-family",
  fontSize: "font-size",
  letterSpacing: "letter-spacing",
  lineHeight: "line-height",
};

function styleToCssValue(prop: string, value: string): string {
  if (prop === "textHighlight") {
    return `inset 0 -0.5em 0 ${value}`;
  }
  return value;
}

// ─── OverrideStylesheet ──────────────────────────────────────

function OverrideStylesheet({ overrides, viewMode }: { overrides: OverrideMap; viewMode: string }) {
  const css = useMemo(() => {
    if (viewMode === "system") return "";

    return Object.entries(overrides)
      .map(([ccId, style]) => {
        const declarations: string[] = [];
        for (const [prop, value] of Object.entries(style)) {
          if (!value || prop === "textContent") continue;
          const cssProp = CSS_PROP_MAP[prop];
          if (!cssProp) continue;
          declarations.push(`${cssProp}: ${styleToCssValue(prop, value)} !important`);
        }
        if (declarations.length === 0) return "";
        return `[data-cc-id="${ccId}"] { ${declarations.join("; ")}; }`;
      })
      .filter(Boolean)
      .join("\n");
  }, [overrides, viewMode]);

  if (!css) return null;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

// ─── Provider ────────────────────────────────────────────────

export function StyleOverrideProvider({ children }: { children: React.ReactNode }) {
  const [personalOverrides, setPersonalOverrides] = useState<OverrideMap>({});
  const [viewMode, setViewModeState] = useState<"system" | "custom">("custom");
  const [textHistory, setTextHistory] = useState<TextHistoryMap>({});
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Refs for synchronous access in callbacks
  const overridesRef = useRef<OverrideMap>({});
  const textHistoryRef = useRef<TextHistoryMap>({});
  overridesRef.current = personalOverrides;
  textHistoryRef.current = textHistory;

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.personal);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPersonalOverrides(parsed);
        overridesRef.current = parsed;
      }
    } catch { /* ignore */ }

    try {
      const rawHistory = localStorage.getItem(STORAGE_KEYS.textHistory);
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory);
        setTextHistory(parsed);
        textHistoryRef.current = parsed;
      }
    } catch { /* ignore */ }

    const mode = localStorage.getItem(STORAGE_KEYS.viewMode);
    if (mode === "system" || mode === "custom") setViewModeState(mode);

    setMounted(true);
  }, []);

  // Merged overrides (global base + personal on top)
  const overrides = useMemo(() => {
    if (viewMode === "system") return {};
    return { ...personalOverrides };
  }, [viewMode, personalOverrides]);

  // Text content overrides via DOM mutation
  useEffect(() => {
    if (!mounted || viewMode === "system") return;

    for (const [ccId, style] of Object.entries(overrides)) {
      if (!style.textContent) continue;
      const elements = document.querySelectorAll(`[data-cc-id="${ccId}"][data-cc-text="true"]`);
      elements.forEach((el) => {
        if (el.children.length === 0) {
          el.textContent = style.textContent!;
        }
      });
    }
  }, [overrides, viewMode, mounted, pathname]);

  // Helper: persist text history
  const persistHistory = useCallback((next: TextHistoryMap) => {
    textHistoryRef.current = next;
    setTextHistory(next);
    localStorage.setItem(STORAGE_KEYS.textHistory, JSON.stringify(next));
  }, []);

  const setElementStyle = useCallback((ccId: string, style: Partial<ElementStyle>) => {
    // Log text history before updating textContent
    if (style.textContent) {
      const currentOverrides = overridesRef.current;
      const currentHistory = textHistoryRef.current;
      const entries = currentHistory[ccId] || [];
      const oldText = currentOverrides[ccId]?.textContent;

      if (oldText && oldText !== style.textContent) {
        // Log the previous override text
        persistHistory({
          ...currentHistory,
          [ccId]: [...entries, { text: oldText, timestamp: Date.now() }],
        });
      } else if (!oldText) {
        // First edit — capture original DOM text as first history entry
        const el = document.querySelector(`[data-cc-id="${ccId}"][data-cc-text="true"]`);
        const originalText = el?.textContent?.trim();
        if (originalText && originalText !== style.textContent) {
          persistHistory({
            ...currentHistory,
            [ccId]: [...entries, { text: originalText, timestamp: Date.now() }],
          });
        }
      }
    }

    setPersonalOverrides((prev) => {
      const cleaned: Partial<ElementStyle> = {};
      for (const [k, v] of Object.entries(style)) {
        if (v !== undefined && v !== "") {
          (cleaned as Record<string, string>)[k] = v;
        }
      }
      const next = { ...prev, [ccId]: { ...prev[ccId], ...cleaned } };
      overridesRef.current = next;
      localStorage.setItem(STORAGE_KEYS.personal, JSON.stringify(next));
      return next;
    });
  }, [persistHistory]);

  const resetElement = useCallback((ccId: string) => {
    setPersonalOverrides((prev) => {
      const next = { ...prev };
      delete next[ccId];
      overridesRef.current = next;
      localStorage.setItem(STORAGE_KEYS.personal, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setPersonalOverrides({});
    overridesRef.current = {};
    localStorage.setItem(STORAGE_KEYS.personal, "{}");
  }, []);

  const setViewMode = useCallback((mode: "system" | "custom") => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEYS.viewMode, mode);
  }, []);

  const clearTextHistory = useCallback((ccId: string) => {
    const current = textHistoryRef.current;
    const next = { ...current };
    delete next[ccId];
    persistHistory(next);
  }, [persistHistory]);

  return (
    <StyleOverrideContext.Provider
      value={{
        overrides,
        personalOverrides,
        viewMode,
        textHistory,
        setElementStyle,
        resetElement,
        resetAll,
        setViewMode,
        clearTextHistory,
      }}
    >
      <OverrideStylesheet overrides={overrides} viewMode={viewMode} />
      {children}
    </StyleOverrideContext.Provider>
  );
}
