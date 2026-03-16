// ===================================================
// Roadmap Layers — Config, types & Supabase queries
// ===================================================
// 6 layers: Goals → Portfolios → Projects → Sprints → Tasks → Sub-tasks
// Data lives in Supabase mirror tables, synced from Notion via Edge Function.

// ─── Types ───────────────────────────────────────────

export type LayerKey =
  | "goals"
  | "portfolios"
  | "projects"
  | "sprints"
  | "tasks"
  | "subtasks";

export interface LayerConfig {
  table: string;
  parentFkColumn: string | null;
  color: string;
  label: { en: string; he: string; ru: string };
  childLayer: LayerKey | null;
}

export interface RoadmapRecord {
  id: string;
  url: string;
  title: string;
  status: string;
  layer: LayerKey;
  properties: Record<string, string>;
}

// ─── Layer Config ────────────────────────────────────

export const LAYER_CONFIG: Record<LayerKey, LayerConfig> = {
  goals: {
    table: "goals",
    parentFkColumn: null,
    color: "#3b82f6",
    label: { en: "Goals", he: "יעדים", ru: "Цели" },
    childLayer: "portfolios",
  },
  portfolios: {
    table: "portfolios",
    parentFkColumn: "goal_url",
    color: "#8b5cf6",
    label: { en: "Portfolios", he: "תיקים", ru: "Портфели" },
    childLayer: "projects",
  },
  projects: {
    table: "roadmap_projects",
    parentFkColumn: "portfolio_url",
    color: "#06b6d4",
    label: { en: "Projects", he: "פרויקטים", ru: "Проекты" },
    childLayer: "sprints",
  },
  sprints: {
    table: "sprints",
    parentFkColumn: "project_url",
    color: "#10b981",
    label: { en: "Sprints", he: "ספרינטים", ru: "Спринты" },
    childLayer: "tasks",
  },
  tasks: {
    table: "tasks",
    parentFkColumn: "sprint_url",
    color: "#f59e0b",
    label: { en: "Tasks", he: "משימות", ru: "Задачи" },
    childLayer: "subtasks",
  },
  subtasks: {
    table: "sub_tasks",
    parentFkColumn: "task_url",
    color: "#94a3b8",
    label: { en: "Sub-tasks", he: "תתי-משימות", ru: "Подзадачи" },
    childLayer: null,
  },
};

export const LAYER_ORDER: LayerKey[] = [
  "goals",
  "portfolios",
  "projects",
  "sprints",
  "tasks",
  "subtasks",
];
