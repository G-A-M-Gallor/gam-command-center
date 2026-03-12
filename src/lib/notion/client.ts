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

export function getClient(): Client | null {
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

export function extractPlainText(prop: unknown): string {
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

// ─── Create Task ────────────────────────────────────

export interface CreateNotionTaskInput {
  title: string;
  type?: string;       // Feature, Bug, Tech Debt, etc.
  priority?: string;   // P0, P1, P2, P3
  effort?: string;     // XS, S, M, L, XL
  layer?: string;      // L0-L5
  owner?: string;
  notes?: string;
  acceptanceCriteria?: string;
}

export async function createNotionTask(input: CreateNotionTaskInput): Promise<{ id: string; url: string } | null> {
  const client = getClient();
  const dbId = process.env.NOTION_TASKS_DB_ID;
  if (!client || !dbId) return null;

  const properties: Record<string, unknown> = {
    Task: { title: [{ text: { content: input.title } }] },
    Status: { status: { name: "Backlog" } },
  };

  if (input.type) properties.Type = { select: { name: input.type } };
  if (input.priority) properties.Priority = { select: { name: input.priority } };
  if (input.effort) properties.Effort = { select: { name: input.effort } };
  if (input.layer) properties.Layer = { select: { name: input.layer } };
  if (input.owner) properties.Owner = { rich_text: [{ text: { content: input.owner } }] };
  if (input.notes) properties.Notes = { rich_text: [{ text: { content: input.notes } }] };
  if (input.acceptanceCriteria) properties["Acceptance Criteria"] = { rich_text: [{ text: { content: input.acceptanceCriteria } }] };

  const page = await client.pages.create({
    parent: { database_id: dbId },
    properties: properties as Parameters<typeof client.pages.create>[0]["properties"],
  });

  return { id: page.id, url: (page as unknown as { url?: string }).url || `https://notion.so/${page.id.replace(/-/g, '')}` };
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
