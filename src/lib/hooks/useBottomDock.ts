"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface DockItem {
  type: "page" | "widget" | "action";
  id: string;
}

const STORAGE_KEY = "cc-bottom-dock";

const DEFAULT_ITEMS: DockItem[] = [
  { type: "page", id: "dashboard" },
  { type: "page", id: "ai-hub" },
  { type: "page", id: "editor" },
  { type: "page", id: "entities" },
  { type: "page", id: "settings" },
  { type: "widget", id: "search" },
  { type: "widget", id: "timer" },
  { type: "widget", id: "favorites" },
];

function loadItems(): DockItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* defaults */ }
  return DEFAULT_ITEMS;
}

function saveItems(items: DockItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useBottomDock() {
  const [items, setItems] = useState<DockItem[]>(DEFAULT_ITEMS);
  const [isOpen, setIsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setItems(loadItems());
    }
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) setEditMode(false);
      return !prev;
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditMode(false);
  }, []);

  const addItem = useCallback((item: DockItem) => {
    setItems((prev) => {
      if (prev.some((p) => p.type === item.type && p.id === item.id)) return prev;
      const next = [...prev, item];
      saveItems(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      saveItems(next);
      return next;
    });
  }, []);

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      saveItems(next);
      return next;
    });
  }, []);

  return {
    items,
    isOpen,
    editMode,
    _setEditMode,
    toggle,
    close,
    addItem,
    removeItem,
    reorder,
  };
}
