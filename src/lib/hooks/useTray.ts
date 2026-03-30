"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────

export interface TrayItem {
  href: string;
  label: string;
  pinnedAt: number;
}

const STORAGE_KEY = "cc-tab-tray";
const EVENT_NAME = "cc-tray-change";

// ─── Helpers ────────────────────────────────────────────

function load(): TrayItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore localStorage parse errors - use empty array
  }
  return [];
}

function save(items: TrayItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore localStorage save errors - not critical for functionality
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: items }));
}

// ─── Hook ───────────────────────────────────────────────

export function useTray() {
  const [items, setItems] = useState<TrayItem[]>([]);

  // Hydrate from localStorage
  useEffect(() => {
    setItems(load());
  }, []);

  // Cross-component sync
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<TrayItem[]>).detail;
      if (detail) setItems(detail);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const pin = useCallback((href: string, label: string) => {
    const current = load();
    if (current.some((i) => i.href === href)) return;
    const next = [...current, { href, label, pinnedAt: Date.now() }];
    save(next);
    setItems(next);
  }, []);

  const unpin = useCallback((href: string) => {
    const next = load().filter((i) => i.href !== href);
    save(next);
    setItems(next);
  }, []);

  const isPinned = useCallback(
    (href: string) => items.some((i) => i.href === href),
    [items],
  );

  const clear = useCallback(() => {
    save([]);
    setItems([]);
  }, []);

  return { items, pin, unpin, isPinned, clear };
}
