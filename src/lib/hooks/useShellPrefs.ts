"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────

export interface ShellPrefs {
  sidebarHover: boolean;
  sidebarWidth: number;
  topbarVisible: boolean;
  tabbarVisible: boolean;
  trayVisible: boolean;
  speedDialVisible: boolean;
}

const STORAGE_KEY = "cc-shell-prefs";
const EVENT_NAME = "cc-shell-prefs-change";

const DEFAULTS: ShellPrefs = {
  sidebarHover: false,
  sidebarWidth: 240,
  topbarVisible: true,
  tabbarVisible: false,
  trayVisible: false,
  speedDialVisible: true,
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
  } catch {}
  return { ...DEFAULTS };
}

function save(prefs: ShellPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
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
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
        return next;
      });
    },
    [],
  );

  return [prefs, setPrefs, updatePref];
}
