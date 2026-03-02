"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type {
  WeeklyItem,
  WeeklyTemplate,
  WeeklyTemplateItem,
  ItemPriority,
  ItemSourceType,
  ItemStatus,
  PlannerView,
  TeamMember,
} from "@/lib/weeklyPlanner/types";
import {
  getWeekStart,
  toDateString,
  generateId,
  shiftWeek,
} from "@/lib/weeklyPlanner/utils";

// ─── Storage Keys ───────────────────────────────────────────

const ITEMS_KEY = "cc-weekly-items";
const TEMPLATES_KEY = "cc-weekly-templates";

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

// ─── Demo Team Members ──────────────────────────────────────

const DEMO_TEAM: TeamMember[] = [
  { id: "user-gal", name: "גל" },
  { id: "user-hani", name: "חני" },
  { id: "user-yoav", name: "יואב" },
];

const CURRENT_USER_ID = "user-gal";

// ─── Context Interface ─────────────────────────────────────

interface WeeklyPlannerState {
  // Data
  items: WeeklyItem[];
  templates: WeeklyTemplate[];
  team: TeamMember[];
  currentUserId: string;

  // View state
  weekStart: Date;
  view: PlannerView;
  showSaturday: boolean;

  // Navigation
  setWeekStart: (d: Date) => void;
  goToThisWeek: () => void;
  shiftWeekBy: (delta: number) => void;
  setView: (v: PlannerView) => void;
  setShowSaturday: (v: boolean) => void;

  // CRUD
  addItem: (item: {
    date: string;
    title: string;
    timeSlot?: string | null;
    priority?: ItemPriority;
    sourceType?: ItemSourceType;
    description?: string | null;
    userId?: string;
  }) => void;
  updateItem: (id: string, patch: Partial<WeeklyItem>) => void;
  deleteItem: (id: string) => void;
  moveItem: (id: string, newDate: string, newUserId?: string) => void;

  // Actions
  markDone: (id: string) => void;
  moveToTomorrow: (id: string) => void;

  // Templates
  addTemplate: (name: string) => string;
  deleteTemplate: (id: string) => void;
  addTemplateItem: (templateId: string, item: Omit<WeeklyTemplateItem, "id" | "templateId">) => void;
  removeTemplateItem: (templateId: string, itemId: string) => void;
  applyTemplate: (templateId: string, weekStartDate: Date) => void;

  // Helpers
  getItemsForDate: (date: string, userId?: string) => WeeklyItem[];
}

const WeeklyPlannerContext = createContext<WeeklyPlannerState>(null!);

export function useWeeklyPlanner() {
  return useContext(WeeklyPlannerContext);
}

// ─── Provider ───────────────────────────────────────────────

export function WeeklyPlannerProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WeeklyItem[]>([]);
  const [templates, setTemplates] = useState<WeeklyTemplate[]>([]);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [view, setView] = useState<PlannerView>("personal");
  const [showSaturday, setShowSaturday] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage
  useEffect(() => {
    setItems(loadJson<WeeklyItem[]>(ITEMS_KEY, []));
    setTemplates(loadJson<WeeklyTemplate[]>(TEMPLATES_KEY, []));
    setMounted(true);
  }, []);

  // Persist items
  const persistItems = useCallback((next: WeeklyItem[]) => {
    setItems(next);
    saveJson(ITEMS_KEY, next);
  }, []);

  // Persist templates
  const persistTemplates = useCallback((next: WeeklyTemplate[]) => {
    setTemplates(next);
    saveJson(TEMPLATES_KEY, next);
  }, []);

  // ── Navigation ─────────────────────────────────────────

  const goToThisWeek = useCallback(() => {
    setWeekStart(getWeekStart(new Date()));
  }, []);

  const shiftWeekBy = useCallback((delta: number) => {
    setWeekStart((prev) => shiftWeek(prev, delta));
  }, []);

  // ── CRUD ───────────────────────────────────────────────

  const addItem = useCallback(
    (input: {
      date: string;
      title: string;
      timeSlot?: string | null;
      priority?: ItemPriority;
      sourceType?: ItemSourceType;
      description?: string | null;
      userId?: string;
    }) => {
      const now = new Date().toISOString();
      const newItem: WeeklyItem = {
        id: generateId(),
        userId: input.userId || CURRENT_USER_ID,
        date: input.date,
        timeSlot: input.timeSlot ?? null,
        durationMinutes: null,
        title: input.title,
        description: input.description ?? null,
        sourceType: input.sourceType || "manual",
        sourceRecordId: null,
        priority: input.priority || "normal",
        status: "pending",
        color: null,
        sortOrder: items.length,
        postponeCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      persistItems([...items, newItem]);
    },
    [items, persistItems]
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<WeeklyItem>) => {
      const next = items.map((it) =>
        it.id === id ? { ...it, ...patch, updatedAt: new Date().toISOString() } : it
      );
      persistItems(next);
    },
    [items, persistItems]
  );

  const deleteItem = useCallback(
    (id: string) => {
      persistItems(items.filter((it) => it.id !== id));
    },
    [items, persistItems]
  );

  const moveItem = useCallback(
    (id: string, newDate: string, newUserId?: string) => {
      const next = items.map((it) => {
        if (it.id !== id) return it;
        // Deal deadlines are not movable
        if (it.sourceType === "deal_deadline") return it;
        return {
          ...it,
          date: newDate,
          userId: newUserId || it.userId,
          updatedAt: new Date().toISOString(),
        };
      });
      persistItems(next);
    },
    [items, persistItems]
  );

  // ── Actions ────────────────────────────────────────────

  const markDone = useCallback(
    (id: string) => {
      updateItem(id, { status: "done" });
    },
    [updateItem]
  );

  const moveToTomorrow = useCallback(
    (id: string) => {
      const item = items.find((it) => it.id === id);
      if (!item || item.sourceType === "deal_deadline") return;
      const current = new Date(item.date + "T00:00:00");
      current.setDate(current.getDate() + 1);
      const next = items.map((it) =>
        it.id === id
          ? {
              ...it,
              date: toDateString(current),
              postponeCount: it.postponeCount + 1,
              status: "moved" as ItemStatus,
              updatedAt: new Date().toISOString(),
            }
          : it
      );
      persistItems(next);
    },
    [items, persistItems]
  );

  // ── Templates ──────────────────────────────────────────

  const addTemplate = useCallback(
    (name: string): string => {
      const id = generateId();
      const tpl: WeeklyTemplate = {
        id,
        templateName: name,
        isDefault: templates.length === 0,
        items: [],
        createdAt: new Date().toISOString(),
      };
      persistTemplates([...templates, tpl]);
      return id;
    },
    [templates, persistTemplates]
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      persistTemplates(templates.filter((t) => t.id !== id));
    },
    [templates, persistTemplates]
  );

  const addTemplateItem = useCallback(
    (templateId: string, item: Omit<WeeklyTemplateItem, "id" | "templateId">) => {
      const next = templates.map((t) => {
        if (t.id !== templateId) return t;
        return {
          ...t,
          items: [...t.items, { ...item, id: generateId(), templateId }],
        };
      });
      persistTemplates(next);
    },
    [templates, persistTemplates]
  );

  const removeTemplateItem = useCallback(
    (templateId: string, itemId: string) => {
      const next = templates.map((t) => {
        if (t.id !== templateId) return t;
        return { ...t, items: t.items.filter((i) => i.id !== itemId) };
      });
      persistTemplates(next);
    },
    [templates, persistTemplates]
  );

  const applyTemplate = useCallback(
    (templateId: string, weekStartDate: Date) => {
      const tpl = templates.find((t) => t.id === templateId);
      if (!tpl) return;

      const now = new Date().toISOString();
      const newItems: WeeklyItem[] = [];

      for (const ti of tpl.items) {
        const date = new Date(weekStartDate);
        date.setDate(date.getDate() + ti.dayOfWeek);
        const dateStr = toDateString(date);

        // Duplicate detection: skip if title + timeSlot already exist on that date
        const isDuplicate = items.some(
          (existing) =>
            existing.date === dateStr &&
            existing.title === ti.title &&
            existing.timeSlot === ti.timeSlot &&
            existing.userId === CURRENT_USER_ID
        );
        if (isDuplicate) continue;

        newItems.push({
          id: generateId(),
          userId: CURRENT_USER_ID,
          date: dateStr,
          timeSlot: ti.timeSlot,
          durationMinutes: null,
          title: ti.title,
          description: ti.description,
          sourceType: "template",
          sourceRecordId: null,
          priority: ti.priority,
          status: "pending",
          color: ti.color,
          sortOrder: ti.sortOrder,
          postponeCount: 0,
          createdAt: now,
          updatedAt: now,
        });
      }

      if (newItems.length > 0) {
        persistItems([...items, ...newItems]);
      }
    },
    [items, templates, persistItems]
  );

  // ── Helpers ────────────────────────────────────────────

  const getItemsForDate = useCallback(
    (date: string, userId?: string) => {
      return items.filter(
        (it) =>
          it.date === date &&
          (userId ? it.userId === userId : it.userId === CURRENT_USER_ID)
      );
    },
    [items]
  );

  // ── Value ──────────────────────────────────────────────

  const value = useMemo<WeeklyPlannerState>(
    () => ({
      items,
      templates,
      team: DEMO_TEAM,
      currentUserId: CURRENT_USER_ID,
      weekStart,
      view,
      showSaturday,
      setWeekStart,
      goToThisWeek,
      shiftWeekBy,
      setView,
      setShowSaturday,
      addItem,
      updateItem,
      deleteItem,
      moveItem,
      markDone,
      moveToTomorrow,
      addTemplate,
      deleteTemplate,
      addTemplateItem,
      removeTemplateItem,
      applyTemplate,
      getItemsForDate,
    }),
    [
      items,
      templates,
      weekStart,
      view,
      showSaturday,
      addItem,
      updateItem,
      deleteItem,
      moveItem,
      markDone,
      moveToTomorrow,
      addTemplate,
      deleteTemplate,
      addTemplateItem,
      removeTemplateItem,
      applyTemplate,
      getItemsForDate,
    ]
  );

  if (!mounted) return <>{children}</>;

  return (
    <WeeklyPlannerContext.Provider value={value}>
      {children}
    </WeeklyPlannerContext.Provider>
  );
}
