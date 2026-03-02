// ─── Weekly Planner Types ────────────────────────────────────

export type ItemSourceType =
  | "manual"
  | "task"
  | "deal_deadline"
  | "calendar"
  | "follow_up"
  | "template";

export type ItemPriority = "urgent" | "important" | "normal";

export type ItemStatus = "pending" | "done" | "moved" | "cancelled";

export type PlannerView = "personal" | "team" | "all";

export interface WeeklyItem {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  timeSlot: string | null; // "HH:MM" or null (all-day / unscheduled)
  durationMinutes: number | null;
  title: string;
  description: string | null;
  sourceType: ItemSourceType;
  sourceRecordId: string | null;
  priority: ItemPriority;
  status: ItemStatus;
  color: string | null; // override color
  sortOrder: number;
  postponeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyTemplate {
  id: string;
  templateName: string;
  isDefault: boolean;
  items: WeeklyTemplateItem[];
  createdAt: string;
}

export interface WeeklyTemplateItem {
  id: string;
  templateId: string;
  dayOfWeek: number; // 0=Sunday … 6=Saturday
  timeSlot: string | null;
  title: string;
  description: string | null;
  priority: ItemPriority;
  color: string | null;
  sortOrder: number;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
}

// ─── Color Config ────────────────────────────────────────────

export interface PriorityColorConfig {
  bg: string;
  border: string;
  dot: string;
}

export const PRIORITY_COLORS: Record<ItemPriority, PriorityColorConfig> = {
  urgent: { bg: "bg-red-950/40", border: "border-red-700/50", dot: "bg-red-500" },
  important: { bg: "bg-amber-950/30", border: "border-amber-700/40", dot: "bg-amber-500" },
  normal: { bg: "bg-slate-800", border: "border-slate-700/50", dot: "bg-emerald-500" },
};

export const SOURCE_COLORS: Record<ItemSourceType, PriorityColorConfig> = {
  manual: { bg: "bg-slate-800", border: "border-slate-700/50", dot: "bg-slate-400" },
  task: { bg: "bg-slate-800", border: "border-slate-700/50", dot: "bg-emerald-500" },
  deal_deadline: { bg: "bg-slate-800", border: "border-slate-700/50", dot: "bg-red-500" },
  calendar: { bg: "bg-blue-950/30", border: "border-blue-700/40", dot: "bg-blue-500" },
  follow_up: { bg: "bg-slate-800", border: "border-slate-700/50", dot: "bg-amber-500" },
  template: { bg: "bg-purple-950/20", border: "border-purple-700/30", dot: "bg-purple-400" },
};

// ─── Source Icons ────────────────────────────────────────────

export const SOURCE_EMOJI: Record<ItemSourceType, string> = {
  manual: "📝",
  task: "✅",
  deal_deadline: "💰",
  calendar: "📅",
  follow_up: "🔄",
  template: "📋",
};

// ─── Load Levels (Team View) ─────────────────────────────────

export type LoadLevel = "free" | "light" | "medium" | "heavy";

export function getLoadLevel(count: number): LoadLevel {
  if (count === 0) return "free";
  if (count <= 3) return "light";
  if (count <= 5) return "medium";
  return "heavy";
}

export const LOAD_COLORS: Record<LoadLevel, string> = {
  free: "bg-slate-700",
  light: "bg-emerald-600",
  medium: "bg-amber-500",
  heavy: "bg-red-500",
};
