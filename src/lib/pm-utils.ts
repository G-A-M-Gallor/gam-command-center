// ===================================================
// GAM Command Center — PM Utilities
// Progress calculation, risk detection, sorting
// ===================================================

import type {
  PmProject,
  PmSprint,
  PmTask,
  Risk,
  PMContext,
} from "@/lib/pm-types";
import { PRIORITY_ORDER } from "@/lib/pm-types";

// ─── Progress Calculation ───────────────────────────

/** App progress = average of all linked projects' progress */
export function calcAppProgress(
  appNotionId: string,
  projects: PmProject[],
): number {
  const linked = projects.filter(
    (p) => p.portfolio_notion_id === appNotionId,
  );
  if (!linked.length) return 0;
  return Math.round(
    linked.reduce((sum, p) => sum + (p.progress || 0), 0) / linked.length,
  );
}

/** Sprint velocity = tasks_done / tasks_total * 100 */
export function calcSprintVelocity(sprint: PmSprint): number {
  const total = sprint.tasks_total || 0;
  const done = sprint.tasks_done || 0;
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

// ─── Risk Detection ─────────────────────────────────

export function detectRisks(
  tasks: PmTask[],
  sprints: PmSprint[],
): Risk[] {
  const now = new Date();
  const risks: Risk[] = [];

  // HIGH: blocked tasks
  const blocked = tasks.filter((_t) => t.status === "חסום");
  if (blocked.length) {
    risks.push({
      level: "high",
      title: `${blocked.length} משימות חסומות`,
      description: blocked.map((_t) => t.title).join(", "),
      relatedIds: blocked.map((_t) => t.id),
    });
  }

  // HIGH: overdue tasks
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const overdue = tasks.filter(
    (_t) =>
      t.due_date &&
      new Date(_t.due_date) < now &&
      t.status !== "הושלם",
  );
  if (overdue.length) {
    risks.push({
      level: "high",
      title: `${overdue.length} משימות באיחור`,
      description: overdue.map((_t) => t.title).join(", "),
      relatedIds: overdue.map((_t) => t.id),
    });
  }

  // HIGH: due within 3 days
  const dueSoon = tasks.filter(
    (_t) =>
      t.due_date &&
      new Date(_t.due_date) >= now &&
      new Date(_t.due_date) < threeDays &&
      t.status !== "הושלם",
  );
  if (dueSoon.length) {
    risks.push({
      level: "high",
      title: `${dueSoon.length} משימות מתקרבות לדדליין`,
      description: dueSoon.map((_t) => t.title).join(", "),
      relatedIds: dueSoon.map((_t) => t.id),
    });
  }

  // MEDIUM: slow sprints (velocity < 60%, end_date within 7 days)
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const slowSprints = sprints.filter(
    (s) =>
      s.status === "פעיל" &&
      (s.velocity || calcSprintVelocity(s)) < 60 &&
      s.end_date &&
      new Date(s.end_date) < sevenDays,
  );
  if (slowSprints.length) {
    risks.push({
      level: "medium",
      title: "Velocity נמוך בספרינט פעיל",
      description: slowSprints
        .map(
          (s) =>
            `${s.title}: ${s.velocity || calcSprintVelocity(s)}%`,
        )
        .join(", "),
      relatedIds: slowSprints.map((s) => s.id),
    });
  }

  // INFO: large tasks without definition of done
  const noDod = tasks.filter(
    (_t) =>
      (_t.estimated_hours || 0) > 8 &&
      !t.definition_of_done &&
      t.status !== "הושלם",
  );
  if (noDod.length) {
    risks.push({
      level: "info",
      title: `${noDod.length} משימות גדולות ללא הגדרת סיום`,
      description: noDod.map((_t) => t.title).join(", "),
      relatedIds: noDod.map((_t) => t.id),
    });
  }

  return risks;
}

// ─── Sorting ────────────────────────────────────────

/** Sort tasks by priority (קריטי first) then by due_date */
export function sortByPriority(tasks: PmTask[]): PmTask[] {
  return [...tasks].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority || "רגיל"] ?? 2;
    const pb = PRIORITY_ORDER[b.priority || "רגיל"] ?? 2;
    if (pa !== pb) return pa - pb;
    // Then by due date (soonest first, null last)
    if (a.due_date && b.due_date)
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });
}

/** Get urgent tasks: blocked OR due within 3 days */
export function getUrgentTasks(tasks: PmTask[]): PmTask[] {
  const now = new Date();
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  return sortByPriority(
    tasks.filter(
      (_t) =>
        t.status !== "הושלם" &&
        (t.status === "חסום" ||
          t.priority === "קריטי" ||
          (t.due_date && new Date(_t.due_date) < threeDays)),
    ),
  );
}

// ─── Context Builder ────────────────────────────────

export function buildPMContext(
  tasks: PmTask[],
  sprints: PmSprint[],
): PMContext {
  const openTasks = tasks.filter((_t) => t.status !== "הושלם");
  const blockedTasks = tasks.filter((_t) => t.status === "חסום");
  const activeSprints = sprints.filter((s) => s.status === "פעיל");
  const urgentTasks = getUrgentTasks(tasks);
  const risks = detectRisks(openTasks, activeSprints);

  return { activeSprints, openTasks, blockedTasks, urgentTasks, risks };
}

// ─── Formatting Helpers ─────────────────────────────

export function progressColor(pct: number): string {
  if (pct >= 80) return "text-emerald-400 bg-emerald-400";
  if (pct >= 50) return "text-amber-400 bg-amber-400";
  return "text-blue-400 bg-blue-400";
}

export function priorityColor(priority: string | null): string {
  switch (priority) {
    case "קריטי":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "גבוה":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "רגיל":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "נמוך":
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

export function statusColor(status: string | null): string {
  switch (status) {
    case "הושלם":
      return "bg-emerald-500/20 text-emerald-400";
    case "בהתקדמות":
      return "bg-blue-500/20 text-blue-400";
    case "בבדיקה":
      return "bg-purple-500/20 text-purple-400";
    case "חסום":
      return "bg-red-500/20 text-red-400";
    case "טרם התחיל":
      return "bg-slate-500/20 text-slate-400";
    case "פעיל":
      return "bg-blue-500/20 text-blue-400";
    case "מושהה":
      return "bg-amber-500/20 text-amber-400";
    default:
      return "bg-slate-500/20 text-slate-400";
  }
}
