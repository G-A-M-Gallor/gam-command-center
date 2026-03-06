import { supabase } from "@/lib/supabaseClient";

/**
 * Context providers for AI — fetch real page data to inject into AI prompts.
 * Each function returns a concise text summary (max ~500 chars).
 */

export async function getLayersContext(): Promise<string> {
  const { data } = await supabase
    .from("projects")
    .select("name, status, health_score, layer, source")
    .eq("status", "active")
    .order("health_score", { ascending: true })
    .limit(20);

  if (!data || data.length === 0) return "No active projects found.";

  const lines = data.map(
    (p) => `- ${p.name} (${p.layer || "N/A"}): health=${p.health_score}`
  );
  return `Active projects (${data.length}):\n${lines.join("\n")}`;
}

export async function getEditorContext(documentId?: string): Promise<string> {
  if (!documentId) return "No document currently open.";

  const { data } = await supabase
    .from("vb_records")
    .select("title, content, status")
    .eq("id", documentId)
    .single();

  if (!data) return "Document not found.";

  const plainText = extractPlainText(data.content);
  const preview = plainText.slice(0, 400);
  return `Current document: "${data.title}"\nContent preview:\n${preview}`;
}

export async function getStoryMapContext(projectId?: string): Promise<string> {
  const query = supabase
    .from("story_cards")
    .select("text, type, col")
    .order("col")
    .order("sort_order")
    .limit(30);

  if (projectId) query.eq("project_id", projectId);

  const { data } = await query;

  if (!data || data.length === 0) return "Story map is empty.";

  const lines = data.map((c) => `  [${c.type}] ${c.text}`);
  return `Story cards (${data.length}):\n${lines.join("\n")}`;
}

export async function getFunctionalMapContext(): Promise<string> {
  const { data } = await supabase
    .from("functional_map_cells")
    .select("level, func, owner, status, description")
    .limit(15);

  if (!data || data.length === 0) return "Functional map is empty.";

  const lines = data.map(
    (c) => `  ${c.level}/${c.func}: ${c.owner} (${c.status})`
  );
  return `Functional map (${data.length} cells):\n${lines.join("\n")}`;
}

/** Extract plain text from Tiptap JSON content */
function extractPlainText(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  const node = content as {
    type?: string;
    text?: string;
    content?: unknown[];
  };
  if (node.text) return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map(extractPlainText).join(" ");
  }
  return "";
}
