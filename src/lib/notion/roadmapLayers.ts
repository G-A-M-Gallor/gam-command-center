// ===================================================
// Roadmap Layers — Multi-DB drill-down config & query
// ===================================================
// 6 Notion databases: Goals → Portfolios → Projects → Sprints → Tasks → Sub-tasks
// Each layer has a data source ID, field mappings, and a parent relation field.

import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { getClient, extractPlainText } from "./client";

// ─── Types ───────────────────────────────────────────

export type LayerKey =
  | "goals"
  | "portfolios"
  | "projects"
  | "sprints"
  | "tasks"
  | "subtasks";

export interface LayerConfig {
  dataSourceId: string;
  titleField: string;
  statusField: string;
  /** Relation field that links to the parent layer (null for root) */
  parentRelationField: string | null;
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
    dataSourceId: "5c763111-a2a3-492d-a8cd-8b1ee8520610",
    titleField: "שם Goal",
    statusField: "סטטוס",
    parentRelationField: null,
    color: "#3b82f6",
    label: { en: "Goals", he: "יעדים", ru: "Цели" },
    childLayer: "portfolios",
  },
  portfolios: {
    dataSourceId: "72be2bbc-ba3e-49b5-9ec9-1009df235777",
    titleField: "שם Portfolio",
    statusField: "סטטוס",
    parentRelationField: "Goal",
    color: "#8b5cf6",
    label: { en: "Portfolios", he: "תיקים", ru: "Портфели" },
    childLayer: "projects",
  },
  projects: {
    dataSourceId: "95e23b99-655c-4784-958f-4779f15d5e3c",
    titleField: "שם פרויקט",
    statusField: "סטטוס",
    parentRelationField: "Portfolio",
    color: "#06b6d4",
    label: { en: "Projects", he: "פרויקטים", ru: "Проекты" },
    childLayer: "sprints",
  },
  sprints: {
    dataSourceId: "2529dae7-6133-4e01-ae0a-38760df51f27",
    titleField: "שם ספרינט",
    statusField: "סטטוס",
    parentRelationField: "פרויקט",
    color: "#10b981",
    label: { en: "Sprints", he: "ספרינטים", ru: "Спринты" },
    childLayer: "tasks",
  },
  tasks: {
    dataSourceId: "453d2402-8c33-4a9a-a6b2-c677a109bc05",
    titleField: "Task",
    statusField: "Status",
    parentRelationField: "Sprint (Roadmap)",
    color: "#f59e0b",
    label: { en: "Tasks", he: "משימות", ru: "Задачи" },
    childLayer: "subtasks",
  },
  subtasks: {
    dataSourceId: "3191236e-1458-4cf0-81ef-afee9840460d",
    titleField: "שם",
    statusField: "סטטוס",
    parentRelationField: "Task",
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

// ─── Query ───────────────────────────────────────────

export async function queryLayer(
  layer: LayerKey,
  parentId?: string,
): Promise<RoadmapRecord[]> {
  const client = getClient();
  if (!client) {
    throw new Error("Notion not configured — NOTION_API_KEY missing");
  }

  const config = LAYER_CONFIG[layer];

  const filter =
    parentId && config.parentRelationField
      ? {
          property: config.parentRelationField,
          relation: { contains: parentId },
        }
      : undefined;

  const response = await client.dataSources.query({
    data_source_id: config.dataSourceId,
    filter: filter as never,
    page_size: 100,
  });

  return response.results
    .filter(
      (r): r is PageObjectResponse =>
        "object" in r && r.object === "page" && "properties" in r,
    )
    .map((page) => {
      const props = page.properties;
      const properties: Record<string, string> = {};

      for (const [key, val] of Object.entries(props)) {
        properties[key] = extractPlainText(val);
      }

      return {
        id: page.id,
        url: page.url,
        title: extractPlainText(props[config.titleField]) || "Untitled",
        status: extractPlainText(props[config.statusField]),
        layer,
        properties,
      };
    });
}
