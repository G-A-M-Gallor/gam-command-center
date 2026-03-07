"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  Check,
  ArrowRight,
  Trash2,
  Lock,
  X,
  Settings,
  Users,
  User,
  ChevronDown,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useWeeklyPlanner, WeeklyPlannerProvider } from "@/contexts/WeeklyPlannerContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import type { WeeklyItem, ItemPriority, TeamMember } from "@/lib/weeklyPlanner/types";
import {
  PRIORITY_COLORS,
  SOURCE_EMOJI,
  getLoadLevel,
  LOAD_COLORS,
} from "@/lib/weeklyPlanner/types";
import {
  getWeekDates,
  toDateString,
  isToday,
  isPast,
  getDayName,
  formatShortDate,
  sortItems,
  parseQuickAdd,
  computeWeekStats,
} from "@/lib/weeklyPlanner/utils";
import type { WidgetSize } from "./WidgetRegistry";

// ─── Full-Screen Panel ──────────────────────────────────────

export function WeeklyPlannerPanel({ onClose }: { onClose: () => void }) {
  return (
    <WeeklyPlannerProvider>
      <WeeklyPlannerPanelInner onClose={onClose} />
    </WeeklyPlannerProvider>
  );
}

function WeeklyPlannerPanelInner({ onClose }: { onClose: () => void }) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const wt = t.widgets as Record<string, string>;
  const planner = useWeeklyPlanner();
  const {
    weekStart,
    view,
    showSaturday,
    shiftWeekBy,
    goToThisWeek,
    setView,
    items,
    moveItem,
    currentUserId,
    team,
  } = planner;

  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const weekDates = useMemo(() => {
    const all = getWeekDates(weekStart);
    return showSaturday ? all : all.slice(0, 6);
  }, [weekStart, showSaturday]);

  const weekItems = useMemo(() => {
    const start = toDateString(weekDates[0]);
    const end = toDateString(weekDates[weekDates.length - 1]);
    return items.filter(
      (it) =>
        it.date >= start &&
        it.date <= end &&
        (view === "personal" ? it.userId === currentUserId : true)
    );
  }, [items, weekDates, view, currentUserId]);

  const stats = useMemo(() => computeWeekStats(weekItems), [weekItems]);

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setDragActiveId(e.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      setDragActiveId(null);
      const { active, over } = e;
      if (!over) return;
      const itemId = active.id as string;
      const dropData = over.data.current as { date: string; userId?: string } | undefined;
      if (!dropData) return;
      moveItem(itemId, dropData.date, dropData.userId);
    },
    [moveItem]
  );

  const draggedItem = dragActiveId ? items.find((it) => it.id === dragActiveId) : null;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-label={wt.weeklyPlanner || "Weekly Planner"}>
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
      />

      {/* Full-screen panel */}
      <div
        className="relative z-10 flex h-full w-full max-w-[1400px] flex-col overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl"
        style={{ borderRadius: "var(--cc-radius-lg)" }}
      >
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-5 py-3">
          <div className="flex items-center gap-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-100">
              <span>📅</span>
              {wt.weeklyPlanner || "Weekly Planner"}
            </h2>

            {/* Week nav */}
            <div className="flex items-center gap-1 rounded-lg bg-slate-700/50 p-0.5">
              <button
                type="button"
                onClick={() => shiftWeekBy(-1)}
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-600 hover:text-white"
                aria-label="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goToThisWeek}
                className="rounded px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-600"
              >
                {wt.plannerToday || "Today"}
              </button>
              <button
                type="button"
                onClick={() => shiftWeekBy(1)}
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-600 hover:text-white"
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <span className="text-sm text-slate-500">
              {formatShortDate(weekDates[0])} – {formatShortDate(weekDates[weekDates.length - 1])}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center gap-0.5 rounded-lg bg-slate-700/50 p-0.5">
              {([
                { key: "personal" as const, icon: User, label: wt.plannerPersonal || "Mine" },
                { key: "team" as const, icon: Users, label: wt.plannerTeam || "Team" },
              ]).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    view === key
                      ? "bg-[var(--cc-accent-600)] text-white"
                      : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Templates */}
            <button
              type="button"
              onClick={() => setShowTemplates(!showTemplates)}
              className={`rounded-lg p-2 transition-colors ${
                showTemplates
                  ? "bg-[var(--cc-accent-600)] text-white"
                  : "text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
              aria-label={wt.plannerTemplates || "Templates"}
              title={wt.plannerTemplates || "Templates"}
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ─── Body ───────────────────────────────────────── */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-auto">
            {showTemplates ? (
              <TemplateManager language={language} />
            ) : view === "team" ? (
              <TeamView weekDates={weekDates} language={language} />
            ) : (
              <WeekGrid weekDates={weekDates} language={language} />
            )}
          </div>

          <DragOverlay>
            {draggedItem ? (
              <div className="w-48 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-300 shadow-2xl opacity-90">
                {draggedItem.timeSlot && (
                  <span className="text-slate-500">{draggedItem.timeSlot} · </span>
                )}
                {draggedItem.title}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* ─── Footer ─────────────────────────────────────── */}
        {!showTemplates && (
          <div className="flex items-center gap-4 border-t border-slate-700 bg-slate-800 px-5 py-2.5 text-xs text-slate-500">
            <span>{stats.total} {wt.plannerTasks || "tasks"}</span>
            <span className="text-slate-700">·</span>
            <span className="text-red-400">{stats.urgent} {wt.plannerUrgent || "urgent"}</span>
            <span className="text-slate-700">·</span>
            <span className="text-blue-400">{stats.meetings} {wt.plannerMeetings || "meetings"}</span>
            <span className="text-slate-700">·</span>
            <span className="text-emerald-400">✓ {stats.done} {wt.plannerDone || "done"}</span>
            <span className="flex-1" />
            <kbd className="rounded border border-slate-600 bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500">
              Esc
            </kbd>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Week Grid (Personal / All) ─────────────────────────────

function WeekGrid({
  weekDates,
  language,
}: {
  weekDates: Date[];
  language: "he" | "en" | "ru";
}) {
  return (
    <div
      className="grid h-full"
      style={{ gridTemplateColumns: `repeat(${weekDates.length}, 1fr)` }}
    >
      {weekDates.map((date) => (
        <DayColumn key={toDateString(date)} date={date} language={language} />
      ))}
    </div>
  );
}

// ─── Day Column ─────────────────────────────────────────────

function DayColumn({ date, language }: { date: Date; language: "he" | "en" | "ru" }) {
  const dateStr = toDateString(date);
  const today = isToday(dateStr);
  const past = isPast(dateStr) && !today;
  const planner = useWeeklyPlanner();
  const dayItems = planner.getItemsForDate(dateStr);
  const sorted = sortItems(dayItems);

  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${dateStr}`,
    data: { date: dateStr },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col border-e border-slate-800 last:border-e-0 ${
        isOver ? "bg-[var(--cc-accent-950)]/30" : ""
      } ${past ? "opacity-50" : ""} ${
        today ? "bg-[var(--cc-accent-950)]/10" : ""
      }`}
    >
      {/* Day Header */}
      <div
        className={`sticky top-0 z-10 border-b px-3 py-2.5 text-center ${
          today
            ? "border-[var(--cc-accent-600)]/50 bg-[var(--cc-accent-900)]/20"
            : "border-slate-800 bg-slate-900/80"
        }`}
      >
        <div className={`text-sm font-medium ${today ? "text-[var(--cc-accent-300)]" : "text-slate-300"}`}>
          {getDayName(date.getDay(), language)}
        </div>
        <div className={`text-xs ${today ? "text-[var(--cc-accent-400)]" : "text-slate-500"}`}>
          {formatShortDate(date)}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 space-y-1.5 p-2">
        {sorted.length === 0 && !past ? (
          <div className="flex h-32 items-center justify-center text-xs text-slate-600">
            {language === "he" ? "יום פנוי 🎉" : language === "ru" ? "Свободный день 🎉" : "Free day 🎉"}
          </div>
        ) : (
          sorted.map((item) => (
            <ItemCard key={item.id} item={item} language={language} readOnly={past} />
          ))
        )}
      </div>

      {/* Quick Add */}
      {!past && <QuickAddInput dateStr={dateStr} language={language} />}
    </div>
  );
}

// ─── Item Card ──────────────────────────────────────────────

function ItemCard({
  item,
  language,
  readOnly,
}: {
  item: WeeklyItem;
  language: "he" | "en" | "ru";
  readOnly?: boolean;
}) {
  const { markDone, moveToTomorrow, deleteItem, updateItem, team } = useWeeklyPlanner();
  const [expanded, setExpanded] = useState(false);
  const isDone = item.status === "done";
  const isDeadline = item.sourceType === "deal_deadline";
  const colors = PRIORITY_COLORS[item.priority];
  const assignee = team.find((m) => m.id === item.userId);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    disabled: readOnly || isDeadline,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => setExpanded(!expanded)}
      className={`group rounded-lg border p-2.5 transition-all ${colors.bg} ${colors.border} ${
        isDone ? "opacity-40" : ""
      } ${isDragging ? "opacity-30" : ""} ${
        isDeadline ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      } hover:border-slate-600`}
    >
      {/* Top row: time + priority dot */}
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />
        {item.timeSlot && (
          <span className="text-[11px] font-medium text-slate-500">{item.timeSlot}</span>
        )}
        {isDeadline && <Lock className="h-2.5 w-2.5 text-slate-600" />}
        {item.postponeCount > 0 && (
          <span className="text-[10px] text-amber-500">🔄{item.postponeCount}</span>
        )}
        <span className="flex-1" />
        <span className="text-[9px]">{SOURCE_EMOJI[item.sourceType]}</span>
      </div>

      {/* Title */}
      <div className={`mt-1 text-xs leading-snug text-slate-200 ${isDone ? "line-through text-slate-400" : ""}`}>
        {item.title}
      </div>

      {/* Assignee badge */}
      {assignee && (
        <div className="mt-1.5 flex items-center gap-1">
          <span className="inline-flex h-4 items-center rounded bg-slate-700/60 px-1.5 text-[10px] text-slate-400">
            👤 {assignee.name}
          </span>
        </div>
      )}

      {/* Description preview */}
      {item.description && !expanded && (
        <p className="mt-1 truncate text-[10px] text-slate-500">{item.description}</p>
      )}

      {/* Expanded */}
      {expanded && !readOnly && (
        <div className="mt-2 space-y-2 border-t border-slate-700/40 pt-2">
          {item.description && (
            <p className="text-[11px] text-slate-400">{item.description}</p>
          )}

          {/* Assign to team member */}
          <AssigneeSelector
            currentUserId={item.userId}
            onChange={(uid) => updateItem(item.id, { userId: uid })}
            language={language}
          />

          {/* Priority selector */}
          <PrioritySelector
            current={item.priority}
            onChange={(p) => updateItem(item.id, { priority: p })}
            language={language}
          />

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {!isDone && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); markDone(item.id); }}
                className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-emerald-400 transition-colors hover:bg-emerald-950/30"
              >
                <Check className="h-3 w-3" /> {language === "he" ? "בוצע" : language === "ru" ? "Готово" : "Done"}
              </button>
            )}
            {!isDone && !isDeadline && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); moveToTomorrow(item.id); }}
                className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-amber-400 transition-colors hover:bg-amber-950/30"
              >
                <ArrowRight className="h-3 w-3" /> {language === "he" ? "מחר" : language === "ru" ? "Завтра" : "Tomorrow"}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
              className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-red-400 transition-colors hover:bg-red-950/30"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Assignee Selector ──────────────────────────────────────

function AssigneeSelector({
  currentUserId,
  onChange,
  language,
}: {
  currentUserId: string;
  onChange: (userId: string) => void;
  language: "he" | "en" | "ru";
}) {
  const { team } = useWeeklyPlanner();
  const [open, setOpen] = useState(false);
  const current = team.find((m) => m.id === currentUserId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1.5 rounded bg-slate-700/50 px-2 py-1 text-[10px] text-slate-400 transition-colors hover:bg-slate-700"
      >
        <User className="h-3 w-3" />
        {current?.name || (language === "he" ? "ללא" : language === "ru" ? "Нет" : "None")}
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {open && (
        <div className="absolute top-full z-20 mt-1 w-32 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl">
          {team.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(m.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-[11px] transition-colors hover:bg-slate-700 ${
                m.id === currentUserId ? "text-[var(--cc-accent-300)]" : "text-slate-300"
              }`}
            >
              <span>👤</span>
              {m.name}
              {m.id === currentUserId && <Check className="ms-auto h-3 w-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Priority Selector ──────────────────────────────────────

const PRIORITIES: { key: ItemPriority; he: string; en: string; ru: string; color: string }[] = [
  { key: "urgent", he: "דחוף", en: "Urgent", ru: "Срочно", color: "bg-red-500" },
  { key: "important", he: "חשוב", en: "Important", ru: "Важно", color: "bg-amber-500" },
  { key: "normal", he: "רגיל", en: "Normal", ru: "Обычный", color: "bg-emerald-500" },
];

function PrioritySelector({
  current,
  onChange,
  language,
}: {
  current: ItemPriority;
  onChange: (p: ItemPriority) => void;
  language: "he" | "en" | "ru";
}) {
  return (
    <div className="flex items-center gap-1">
      {PRIORITIES.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(p.key); }}
          className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] transition-colors ${
            current === p.key
              ? "bg-slate-700 text-slate-200"
              : "text-slate-500 hover:text-slate-400"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${p.color}`} />
          {language === "he" ? p.he : language === "ru" ? p.ru : p.en}
        </button>
      ))}
    </div>
  );
}

// ─── Quick Add Input ────────────────────────────────────────

function QuickAddInput({ dateStr, language }: { dateStr: string; language: "he" | "en" | "ru" }) {
  const { addItem, team } = useWeeklyPlanner();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [assignee, setAssignee] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSubmit = useCallback(() => {
    if (!text.trim()) { setOpen(false); return; }
    const parsed = parseQuickAdd(text);
    addItem({
      date: dateStr,
      title: parsed.title,
      timeSlot: parsed.timeSlot,
      userId: assignee,
    });
    setText("");
    setAssignee(undefined);
  }, [text, dateStr, addItem, assignee]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 border-t border-slate-800 bg-slate-900/50 py-2.5 text-xs text-slate-600 transition-colors hover:bg-slate-800 hover:text-slate-400"
      >
        <Plus className="h-3.5 w-3.5" />
        {language === "he" ? "הוסף משימה" : language === "ru" ? "Добавить задачу" : "Add task"}
      </button>
    );
  }

  return (
    <div className="border-t border-slate-800 bg-slate-900/50 p-2 space-y-1.5">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") { setText(""); setOpen(false); }
        }}
        placeholder={language === "he" ? 'כתוב משימה... (למשל "שיחה עם דני 10:00")' : language === "ru" ? 'Напишите задачу... (напр. "Позвонить Дане 10:00")' : 'Write a task... (e.g. "Call Danny 10:00")'}
        className="w-full rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
      />
      <div className="flex items-center gap-2">
        {/* Assignee picker */}
        <select
          value={assignee || ""}
          onChange={(e) => setAssignee(e.target.value || undefined)}
          className="rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-400"
        >
          <option value="">{language === "he" ? "👤 מוקצה לי" : language === "ru" ? "👤 Назначить мне" : "👤 Assign to me"}</option>
          {team.map((m) => (
            <option key={m.id} value={m.id}>👤 {m.name}</option>
          ))}
        </select>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => { setText(""); setOpen(false); }}
          className="rounded px-2 py-1 text-[10px] text-slate-500 hover:text-slate-400"
        >
          {language === "he" ? "ביטול" : language === "ru" ? "Отмена" : "Cancel"}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="rounded-md bg-[var(--cc-accent-600)] px-3 py-1 text-[10px] font-medium text-white transition-colors hover:bg-[var(--cc-accent-500)] disabled:opacity-30"
        >
          {language === "he" ? "הוסף" : language === "ru" ? "Добавить" : "Add"}
        </button>
      </div>
    </div>
  );
}

// ─── Team View ──────────────────────────────────────────────

function TeamView({
  weekDates,
  language,
}: {
  weekDates: Date[];
  language: "he" | "en" | "ru";
}) {
  const { team, items, currentUserId } = useWeeklyPlanner();
  const [expandedCell, setExpandedCell] = useState<string | null>(null);

  return (
    <div className="p-4">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="w-28 border-b border-slate-700 px-3 py-3 text-start text-sm font-medium text-slate-400">
              {language === "he" ? "עובד" : language === "ru" ? "Сотрудник" : "Member"}
            </th>
            {weekDates.map((d) => {
              const ds = toDateString(d);
              const today = isToday(ds);
              return (
                <th
                  key={ds}
                  className={`border-b border-slate-700 px-2 py-3 text-center text-sm font-medium ${
                    today ? "text-[var(--cc-accent-300)]" : "text-slate-400"
                  }`}
                >
                  <div>{getDayName(d.getDay(), language)}</div>
                  <div className="text-[10px] font-normal text-slate-500">{formatShortDate(d)}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {team.map((member) => (
            <tr key={member.id} className="border-b border-slate-800">
              <td className="px-3 py-3">
                <div className="flex items-center gap-2 text-sm text-slate-200">
                  <span>👤</span>
                  <span>{member.name}</span>
                  {member.id === currentUserId && (
                    <span className="text-[10px] text-[var(--cc-accent-400)]">
                      ({language === "he" ? "אני" : language === "ru" ? "я" : "me"})
                    </span>
                  )}
                </div>
              </td>
              {weekDates.map((d) => {
                const ds = toDateString(d);
                const cellItems = items.filter(
                  (it) => it.date === ds && it.userId === member.id
                );
                const count = cellItems.length;
                const load = getLoadLevel(count);
                const cellKey = `${member.id}-${ds}`;
                const isExpanded = expandedCell === cellKey;
                const today = isToday(ds);

                return (
                  <td
                    key={ds}
                    className={`px-2 py-3 ${today ? "bg-[var(--cc-accent-950)]/10" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedCell(isExpanded ? null : cellKey)}
                      className="flex w-full flex-col items-center gap-1.5 rounded-lg p-2 transition-colors hover:bg-slate-800"
                    >
                      {/* Load bar */}
                      <div className="flex h-2 w-full gap-0.5 rounded-full overflow-hidden">
                        {Array.from({ length: 6 }, (_, i) => (
                          <div
                            key={i}
                            className={`flex-1 ${
                              i < count ? LOAD_COLORS[load] : "bg-slate-800"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">
                        {count === 0
                          ? language === "he" ? "פנוי" : language === "ru" ? "свободен" : "free"
                          : count}
                      </span>
                    </button>

                    {isExpanded && cellItems.length > 0 && (
                      <div className="mt-2 space-y-1 rounded-lg border border-slate-700 bg-slate-800 p-2">
                        {sortItems(cellItems).map((it) => (
                          <div
                            key={it.id}
                            className={`flex items-center gap-2 rounded px-2 py-1 text-[11px] ${
                              it.status === "done" ? "text-slate-600 line-through" : "text-slate-300"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_COLORS[it.priority].dot}`} />
                            {it.timeSlot && (
                              <span className="text-slate-500">{it.timeSlot}</span>
                            )}
                            <span className="truncate">{it.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Template Manager ───────────────────────────────────────

function TemplateManager({ language }: { language: "he" | "en" | "ru" }) {
  const {
    templates,
    addTemplate,
    deleteTemplate,
    addTemplateItem,
    removeTemplateItem,
    applyTemplate,
    weekStart,
  } = useWeeklyPlanner();
  const [newName, setNewName] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDay, setNewItemDay] = useState(0);
  const [newItemTime, setNewItemTime] = useState("");

  const handleAddTemplate = useCallback(() => {
    if (!newName.trim()) return;
    addTemplate(newName.trim());
    setNewName("");
  }, [newName, addTemplate]);

  const handleAddItem = useCallback(
    (templateId: string) => {
      if (!newItemTitle.trim()) return;
      addTemplateItem(templateId, {
        dayOfWeek: newItemDay,
        timeSlot: newItemTime || null,
        title: newItemTitle.trim(),
        description: null,
        priority: "normal",
        color: null,
        sortOrder: 0,
      });
      setNewItemTitle("");
      setNewItemTime("");
      setAddingTo(null);
    },
    [newItemTitle, newItemDay, newItemTime, addTemplateItem]
  );

  const dayOptions = Array.from({ length: 7 }, (_, i) => ({
    value: i,
    label: getDayName(i, language),
  }));

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <h3 className="text-sm font-semibold text-slate-200">
        {language === "he" ? "📋 תבניות שבועיות" : language === "ru" ? "📋 Шаблоны на неделю" : "📋 Weekly Templates"}
      </h3>
      <p className="text-xs text-slate-500">
        {language === "he"
          ? "צור תבנית שבועית עם משימות חוזרות. החל על השבוע הנוכחי בלחיצה."
          : language === "ru"
            ? "Создайте шаблон недели с повторяющимися задачами. Применяйте к текущей неделе в один клик."
            : "Create a weekly template with recurring tasks. Apply to the current week in one click."}
      </p>

      {templates.map((tpl) => (
        <div key={tpl.id} className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-200">{tpl.templateName}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => applyTemplate(tpl.id, weekStart)}
                className="rounded-lg bg-[var(--cc-accent-600)] px-3 py-1 text-xs text-white transition-colors hover:bg-[var(--cc-accent-500)]"
              >
                {language === "he" ? "החל על השבוע" : language === "ru" ? "Применить к неделе" : "Apply to week"}
              </button>
              <button
                type="button"
                onClick={() => deleteTemplate(tpl.id)}
                className="rounded p-1 text-slate-600 transition-colors hover:text-red-400"
                aria-label="Delete template"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            {tpl.items.length === 0 ? (
              <p className="text-xs text-slate-600">
                {language === "he" ? "אין פריטים. הוסף פריטים לתבנית." : language === "ru" ? "Нет элементов. Добавьте элементы в шаблон." : "No items. Add items to template."}
              </p>
            ) : (
              tpl.items
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.sortOrder - b.sortOrder)
                .map((ti) => (
                  <div
                    key={ti.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700/30"
                  >
                    <span className="w-16 shrink-0 font-medium text-slate-500">
                      {getDayName(ti.dayOfWeek, language)}
                    </span>
                    <span className="w-12 shrink-0 text-slate-500">
                      {ti.timeSlot || "—"}
                    </span>
                    <span className="flex-1 truncate">{ti.title}</span>
                    <button
                      type="button"
                      onClick={() => removeTemplateItem(tpl.id, ti.id)}
                      className="text-slate-600 hover:text-red-400"
                      aria-label="Remove item"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))
            )}
          </div>

          {addingTo === tpl.id ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={newItemDay}
                onChange={(e) => setNewItemDay(Number(e.target.value))}
                className="rounded-lg bg-slate-700 px-2 py-1.5 text-xs text-slate-300"
              >
                {dayOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={newItemTime}
                onChange={(e) => setNewItemTime(e.target.value)}
                placeholder="HH:MM"
                className="w-16 rounded-lg bg-slate-700 px-2 py-1.5 text-xs text-slate-300 placeholder-slate-600"
              />
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddItem(tpl.id);
                  if (e.key === "Escape") setAddingTo(null);
                }}
                placeholder={language === "he" ? "כותרת..." : language === "ru" ? "Заголовок..." : "Title..."}
                className="flex-1 rounded-lg bg-slate-700 px-2 py-1.5 text-xs text-slate-300 placeholder-slate-600"
                autoFocus
              />
              <button
                type="button"
                onClick={() => handleAddItem(tpl.id)}
                className="rounded-lg bg-[var(--cc-accent-600)] px-3 py-1.5 text-xs text-white"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingTo(tpl.id)}
              className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              <Plus className="h-3 w-3" />
              {language === "he" ? "הוסף פריט לתבנית" : language === "ru" ? "Добавить элемент в шаблон" : "Add item to template"}
            </button>
          )}
        </div>
      ))}

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTemplate()}
          placeholder={language === "he" ? "שם תבנית חדשה..." : language === "ru" ? "Название нового шаблона..." : "New template name..."}
          className="flex-1 rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
        />
        <button
          type="button"
          onClick={handleAddTemplate}
          className="rounded-xl bg-[var(--cc-accent-600)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--cc-accent-500)]"
        >
          {language === "he" ? "צור תבנית" : language === "ru" ? "Создать" : "Create"}
        </button>
      </div>
    </div>
  );
}

// ─── Bar Content ────────────────────────────────────────────

export function WeeklyPlannerBarContent({ size }: { size: WidgetSize }) {
  return (
    <WeeklyPlannerProvider>
      <WeeklyPlannerBarContentInner size={size} />
    </WeeklyPlannerProvider>
  );
}

function WeeklyPlannerBarContentInner({ size }: { size: WidgetSize }) {
  const { items, currentUserId } = useWeeklyPlanner();
  const today = toDateString(new Date());
  const todayCount = items.filter(
    (it) => it.date === today && it.userId === currentUserId && it.status !== "done"
  ).length;

  if (size < 2) return null;

  return (
    <span className="flex items-center gap-1 truncate text-xs text-slate-400">
      <CalendarDays className="h-3 w-3" />
      <span>{todayCount}</span>
    </span>
  );
}
