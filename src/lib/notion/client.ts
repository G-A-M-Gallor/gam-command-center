// ===================================================
// Notion API Client — Server-side helpers
// ===================================================
// Wraps @notionhq/client for GAM task board queries.
// Requires NOTION_API_KEY and NOTION_TASKS_DB_ID env vars.

import { Client } from "@notionhq/client";
import type {
  PageObjectResponse,
  QueryDataSourceResponse,
} from "@notionhq/client/build/src/api-endpoints";

let _client: Client | null = null;

function getClient(): Client | null {
  if (!process.env.NOTION_API_KEY) return null;
  if (!_client) {
    _client = new Client({ auth: process.env.NOTION_API_KEY });
  }
  return _client;
}

// ─── Types ───────────────────────────────────────────

export interface NotionTask {
  id: string;
  url: string;
  task: string;
  status: string;
  priority: string;
  effort: string;
  layer: string;
  owner: string;
  type: string;
  delivers: string;
}

export interface ProjectStatus {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  inProgress: NotionTask[];
}

// ─── Helpers ─────────────────────────────────────────

function extractPlainText(prop: unknown): string {
  if (!prop || typeof prop !== "object") return "";
  const p = prop as Record<string, unknown>;

  // Title or rich_text
  if (p.type === "title" && Array.isArray(p.title)) {
    return (p.title as Array<{ plain_text?: string }>)[0]?.plain_text ?? "";
  }
  if (p.type === "rich_text" && Array.isArray(p.rich_text)) {
    return (p.rich_text as Array<{ plain_text?: string }>)[0]?.plain_text ?? "";
  }
  // Select
  if (p.type === "select" && p.select && typeof p.select === "object") {
    return (p.select as { name?: string }).name ?? "";
  }
  // Status
  if (p.type === "status" && p.status && typeof p.status === "object") {
    return (p.status as { name?: string }).name ?? "";
  }
  // URL
  if (p.type === "url") return (p.url as string) ?? "";

  return "";
}

function pageToTask(page: PageObjectResponse): NotionTask {
  const props = page.properties;
  return {
    id: page.id,
    url: page.url,
    task: extractPlainText(props["Task"]),
    status: extractPlainText(props["Status"]),
    priority: extractPlainText(props["Priority"]),
    effort: extractPlainText(props["Effort"]),
    layer: extractPlainText(props["Layer"]),
    owner: extractPlainText(props["Owner"]),
    type: extractPlainText(props["Type"]),
    delivers: extractPlainText(props["Delivers"]),
  };
}

// ─── Public API ──────────────────────────────────────

export async function getMyTasks(
  status?: string
): Promise<NotionTask[]> {
  const client = getClient();
  const dbId = process.env.NOTION_TASKS_DB_ID;
  if (!client || !dbId) return [];

  const filter: Record<string, unknown> | undefined = status
    ? {
        property: "Status",
        status: { equals: status },
      }
    : undefined;

  // Notion SDK v3: dataSources.query replaces databases.query
  const response: QueryDataSourceResponse = await client.dataSources.query({
    data_source_id: dbId,
    filter: filter as never,
    page_size: 100,
  });

  return response.results
    .filter(
      (r): r is PageObjectResponse =>
        "object" in r && r.object === "page" && "properties" in r
    )
    .map(pageToTask);
}

export async function getProjectStatus(): Promise<ProjectStatus> {
  const all = await getMyTasks();

  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};

  for (const t of all) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
    if (t.priority) byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
  }

  const inProgress = all.filter((t) => t.status === "In Progress");

  return { total: all.length, byStatus, byPriority, inProgress };
}

export async function getTasksSummaryForPrompt(): Promise<string> {
  const status = await getProjectStatus();
  if (status.total === 0) return "";

  const lines = [
    `Total tasks: ${status.total}`,
    `Status breakdown: ${Object.entries(status.byStatus)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")}`,
  ];

  if (status.inProgress.length > 0) {
    lines.push(
      `\nIn Progress (${status.inProgress.length}):`,
      ...status.inProgress.map(
        (t) => `- [${t.priority}] ${t.task} (${t.effort})`
      )
    );
  }

  return lines.join("\n");
}
