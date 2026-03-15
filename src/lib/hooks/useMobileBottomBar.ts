"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────

export interface BottomBarSlot {
  type: "page" | "widget";
  id: string; // sidebar nav key (e.g. "dashboard") or widget id (e.g. "ai-assistant")
}

export type MiddleSlots = [BottomBarSlot | null, BottomBarSlot | null, BottomBarSlot | null];

// ─── Constants ──────────────────────────────────────────

const STORAGE_KEY = "cc-mobile-bottom-bar";

const DEFAULT_SLOTS: MiddleSlots = [
  { type: "page", id: "dashboard" },
  { type: "page", id: "aiHub" },
  { type: "page", id: "settings" },
];

// ─── Persistence ────────────────────────────────────────

function loadSlots(): MiddleSlots {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 3) {
        return parsed as MiddleSlots;
      }
    }
  } catch {}
  return [...DEFAULT_SLOTS];
}

function saveSlots(slots: MiddleSlots) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  } catch {}
}

// ─── Hook ───────────────────────────────────────────────

export function useMobileBottomBar() {
  const [slots, setSlotsState] = useState<MiddleSlots>([...DEFAULT_SLOTS]);
  const [editMode, setEditMode] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
    setSlotsState(loadSlots());
  }, []);

  // Listen for edit mode trigger from Settings page
  useEffect(() => {
    const handleEditEvent = () => setEditMode(true);
    window.addEventListener("cc-bottom-bar-edit", handleEditEvent);
    return () => window.removeEventListener("cc-bottom-bar-edit", handleEditEvent);
  }, []);

  const setSlot = useCallback((index: 0 | 1 | 2, slot: BottomBarSlot | null) => {
    setSlotsState((prev) => {
      const next = [...prev] as MiddleSlots;
      next[index] = slot;
      saveSlots(next);
      window.dispatchEvent(new Event("cc-bottom-bar-change"));
      return next;
    });
  }, []);

  const toggleEditMode = useCallback(() => {
    setEditMode((prev) => !prev);
  }, []);

  return { slots, editMode, setEditMode, setSlot, toggleEditMode };
}
