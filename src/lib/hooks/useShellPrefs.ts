"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────

export interface ShellPrefs {
  sidebarHover: boolean;
  sidebarPinned: boolean;
  sidebarWidth: number;
  topbarVisible: boolean;
  tabbarVisible: boolean;
  trayVisible: boolean;
  speedDialVisible: boolean;
  bottomDockAutoHide: boolean;
  dockPinned: boolean;
}

const STORAGE_KEY = "cc-shell-prefs";
const EVENT_NAME = "cc-shell-prefs-change";

const DEFAULTS: ShellPrefs = {
  sidebarHover: true,
  sidebarPinned: false,
  sidebarWidth: 240,
  topbarVisible: true,
  tabbarVisible: false,
  trayVisible: false,
  speedDialVisible: true,
  bottomDockAutoHide: true,
  dockPinned: false,
};

export const SIDEBAR_MIN_WIDTH = 180;
export const SIDEBAR_MAX_WIDTH = 400;

// ─── Helpers ────────────────────────────────────────────

function load(): ShellPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    }
  } catch {
    // Ignore errors
  }
  return { ...DEFAULTS };
}

function save(prefs: ShellPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore errors
  }
}

// ─── Hook ───────────────────────────────────────────────

export function useShellPrefs(): [
  ShellPrefs,
  (prefs: ShellPrefs) => void,
  <K extends keyof ShellPrefs>(key: K, value: ShellPrefs[K]) => void,
] {
  const [prefs, setPrefsState] = useState<ShellPrefs>(DEFAULTS);

  // Hydrate from localStorage
  useEffect(() => {
    setPrefsState(load());
  }, []);

  // Listen for cross-component sync
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ShellPrefs>).detail;
      if (detail) setPrefsState(detail);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const setPrefs = useCallback((next: ShellPrefs) => {
    setPrefsState(next);
    save(next);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
  }, []);

  const updatePref = useCallback(
    <K extends keyof ShellPrefs>(key: K, value: ShellPrefs[K]) => {
      setPrefsState((prev) => {
        const next = { ...prev, [key]: value };
        save(next);
        // Dispatch outside the updater to avoid setState-during-render
        queueMicrotask(() => {
          window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
        });
        return next;
      });
    },
    [],
  );

  return [prefs, setPrefs, updatePref];
}
