// ===================================================
// GAM Command Center — PM Types
// TypeScript interfaces for all 6 pm_* tables + Risk + PMContext
// ===================================================

// ─── Database Row Types ─────────────────────────────

export interface PmGoal {
  id: string;
  notion_id: string;
  title: string | null;
  status: string | null;
  priority: string | null;
  kpi_target: string | null;
  kpi_current: number | null;
  kpi_unit: string | null;
  target_date: string | null;
  notes: string | null;
  synced_at: string | null;
  deleted_at: string | null;
}

export interface PmApp {
  id: string;
  notion_id: string;
  title: string | null;
  status: string | null;
  description: string | null;
  owner_team: string | null;
  url: string | null;
  goal_notion_id: string | null;
  notes: string | null;
  deleted_at: string | null;
}

export interface PmPortfolio {
  id: string;
  notion_id: string;
  title: string | null;
  status: string | null;
  category: string | null;
  progress: number | null;
  app_notion_id: string | null;
  goal_notion_id: string | null;
  target_date: string | null;
  deleted_at: string | null;
}

export interface PmProject {
  id: string;
  notion_id: string;
  title: string;
  status: string | null;
  phase: string | null;
  priority: string | null;
  progress: number | null;
  portfolio_notion_id: string | null;
  start_date: string | null;
  target_date: string | null;
  deleted_at: string | null;
}

export interface PmSprint {
  id: string;
  notion_id: string;
  title: string;
  status: string | null;
  sprint_number: number | null;
  goal: string | null;
  tasks_total: number | null;
  tasks_done: number | null;
  velocity: number | null;
  project_notion_id: string | null;
  start_date: string | null;
  end_date: string | null;
  retrospective: string | null;
  deleted_at: string | null;
  // Joined data
  pm_projects?: Pick<PmProject, "title" | "portfolio_notion_id"> | null;
}

export interface PmTask {
  id: string;
  notion_id: string;
  title: string;
  status: string | null;
  priority: string | null;
  worker: string | null;
  owner_team: string | null;
  kpi_impact: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  due_date: string | null;
  blocked_by: string | null;
  definition_of_done: string | null;
  notes: string | null;
  sprint_notion_id: string | null;
  deleted_at: string | null;
}

export interface PmTeamMember {
  id: string;
  name: string | null;
  role: string | null;
  type: string | null;
  email: string | null;
  active: boolean | null;
}

// ─── Computed Types ─────────────────────────────────

export type RiskLevel = "high" | "medium" | "info";

export interface Risk {
  level: RiskLevel;
  title: string;
  description: string;
  relatedIds?: string[];
}

export interface TaskFilters {
  status?: string[];
  worker?: string;
  sprintId?: string;
  priority?: string;
  appNotionId?: string;
}

export interface PMContext {
  activeSprints: PmSprint[];
  openTasks: PmTask[];
  blockedTasks: PmTask[];
  urgentTasks: PmTask[];
  risks: Risk[];
}

// ─── Constants ──────────────────────────────────────

export const TASK_STATUSES = [
  "טרם התחיל",
  "בהתקדמות",
  "בבדיקה",
  "הושלם",
  "חסום",
] as const;

// Status constants for type-safe access
export const TASK_STATUS = {
  NOT_STARTED: "טרם התחיל",
  IN_PROGRESS: "בהתקדמות",
  IN_REVIEW: "בבדיקה",
  COMPLETED: "הושלם",
  BLOCKED: "חסום",
} as const;

export const PRIORITIES = ["קריטי", "גבוה", "רגיל", "נמוך"] as const;

export const PRIORITY_ORDER: Record<string, number> = {
  קריטי: 0,
  גבוה: 1,
  רגיל: 2,
  נמוך: 3,
};

export const WORKERS = ["גל", "Claude", "חני", "עידו"] as const;

export const SPRINT_STATUSES = [
  "טרם התחיל",
  "פעיל",
  "הושלם",
  "מושהה",
] as const;

export const SPRINT_STATUS = {
  NOT_STARTED: "טרם התחיל",
  ACTIVE: "פעיל",
  COMPLETED: "הושלם",
  PAUSED: "מושהה",
} as const;

export const QUICK_CAPTURE_TYPES = ["משימה", "פרויקט", "רעיון"] as const;
export type QuickCaptureType = (typeof QUICK_CAPTURE_TYPES)[number];
