"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────

export type SplitSide = "left" | "right";

export interface SplitState {
  left: string | null;   // href docked to left pane
  right: string | null;  // href docked to right pane
}

const STORAGE_KEY = "cc-split-screen";
const EVENT_NAME = "cc-split-change";

const EMPTY: SplitState = { left: null, right: null };

// ─── Helpers ────────────────────────────────────────────

function load(): SplitState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...EMPTY, ...parsed };
    }
  } catch {}
  return { ...EMPTY };
}

function save(state: SplitState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: state }));
}

// ─── Hook ───────────────────────────────────────────────

export function useSplitScreen() {
  const [state, setState] = useState<SplitState>(EMPTY);

  // Hydrate
  useEffect(() => {
    setState(load());
  }, []);

  // Cross-component sync
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<SplitState>).detail;
      if (detail) setState(detail);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  /** Dock a page to a side. If already docked on that side, undock it. */
  const dock = useCallback((href: string, side: SplitSide) => {
    const current = load();
    // Toggle off if same href already on this side
    if (current[side] === href) {
      const next = { ...current, [side]: null };
      save(next);
      setState(next);
      return;
    }
    const next = { ...current, [side]: href };
    save(next);
    setState(next);
  }, []);

  /** Undock a specific side */
  const undock = useCallback((side: SplitSide) => {
    const current = load();
    const next = { ...current, [side]: null };
    save(next);
    setState(next);
  }, []);

  /** Clear both sides */
  const clearSplit = useCallback(() => {
    save(EMPTY);
    setState(EMPTY);
  }, []);

  /** Check which side (if any) a href is docked to */
  const getSide = useCallback(
    (href: string): SplitSide | null => {
      if (state.left === href) return "left";
      if (state.right === href) return "right";
      return null;
    },
    [state],
  );

  const isActive = state.left !== null || state.right !== null;
  const isFull = state.left !== null && state.right !== null;

  return { state, dock, undock, clearSplit, getSide, isActive, isFull };
}
