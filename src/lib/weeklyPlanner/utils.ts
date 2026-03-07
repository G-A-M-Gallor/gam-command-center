import type { WeeklyItem } from "./types";

// ─── Date Helpers ───────────────────────────────────────────

/** Get Sunday of the week containing `date`. */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Sunday = 0
  return d;
}

/** Return array of 7 dates (Sun–Sat) from a week-start. */
export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Format date as YYYY-MM-DD. */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD → Date (local). */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Check if two dates are same calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Check if a date string is today. */
export function isToday(dateStr: string): boolean {
  return isSameDay(parseDate(dateStr), new Date());
}

/** Check if a date string is in the past (before today). */
export function isPast(dateStr: string): boolean {
  const d = parseDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

// ─── Day Names ──────────────────────────────────────────────

const HE_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const EN_DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const RU_DAYS = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
const RU_DAYS_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export function getDayName(dayIndex: number, language: "he" | "en" | "ru"): string {
  return language === "he" ? HE_DAYS[dayIndex] : language === "ru" ? RU_DAYS[dayIndex] : EN_DAYS[dayIndex];
}

export function getDayNameShort(dayIndex: number, language: "he" | "en" | "ru"): string {
  return language === "he" ? HE_DAYS[dayIndex] : language === "ru" ? RU_DAYS_SHORT[dayIndex] : EN_DAYS_SHORT[dayIndex];
}

/** Format date as "DD/MM" */
export function formatShortDate(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

// ─── Week Navigation ────────────────────────────────────────

export function shiftWeek(weekStart: Date, delta: number): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 7 * delta);
  return d;
}

// ─── Sort Items ─────────────────────────────────────────────

/** Sort by time slot (null = end), then sortOrder. */
export function sortItems(items: WeeklyItem[]): WeeklyItem[] {
  return [...items].sort((a, b) => {
    // Time-slotted items first
    if (a.timeSlot && !b.timeSlot) return -1;
    if (!a.timeSlot && b.timeSlot) return 1;
    if (a.timeSlot && b.timeSlot) {
      const cmp = a.timeSlot.localeCompare(b.timeSlot);
      if (cmp !== 0) return cmp;
    }
    return a.sortOrder - b.sortOrder;
  });
}

// ─── Quick Add Parser ───────────────────────────────────────

interface ParsedQuickAdd {
  title: string;
  timeSlot: string | null;
}

const TIME_REGEX = /\b(\d{1,2}):(\d{2})\b/;
const HE_TIME_REGEX = /ב[- ]?(\d{1,2}):?(\d{2})?\b/;

export function parseQuickAdd(text: string): ParsedQuickAdd {
  let timeSlot: string | null = null;
  let title = text.trim();

  // Try HH:MM format
  const timeMatch = text.match(TIME_REGEX);
  if (timeMatch) {
    const h = parseInt(timeMatch[1], 10);
    const m = parseInt(timeMatch[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      timeSlot = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      title = title.replace(TIME_REGEX, "").trim();
    }
  }

  // Try Hebrew "ב-10" or "ב-10:00"
  if (!timeSlot) {
    const heMatch = text.match(HE_TIME_REGEX);
    if (heMatch) {
      const h = parseInt(heMatch[1], 10);
      const m = heMatch[2] ? parseInt(heMatch[2], 10) : 0;
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        timeSlot = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        title = title.replace(HE_TIME_REGEX, "").trim();
      }
    }
  }

  // Clean up trailing/leading dashes and spaces
  title = title.replace(/^[-–—\s]+|[-–—\s]+$/g, "").trim();

  return { title: title || text.trim(), timeSlot };
}

// ─── Stats ──────────────────────────────────────────────────

export interface WeekStats {
  total: number;
  urgent: number;
  meetings: number;
  done: number;
}

export function computeWeekStats(items: WeeklyItem[]): WeekStats {
  return {
    total: items.length,
    urgent: items.filter((i) => i.priority === "urgent").length,
    meetings: items.filter((i) => i.sourceType === "calendar").length,
    done: items.filter((i) => i.status === "done").length,
  };
}

// ─── ID Generator ───────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
