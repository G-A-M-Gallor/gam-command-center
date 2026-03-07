import { createClient } from "@/lib/supabase/client";
import type { DocRecord, DocTemplate, DocVersion, DocShare } from "./schema";

// Re-export types so existing consumers can keep importing from here
export type { DocRecord, DocTemplate, DocVersion, DocShare };

// ─── Document CRUD ──────────────────────────────────────────

export async function fetchDocuments(limit = 50): Promise<DocRecord[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("vb_records")
    .select("*")
    .eq("record_type", "document")
    .eq("is_deleted", false)
    .order("last_edited_at", { ascending: false })
    .limit(limit);
  return (data as DocRecord[]) || [];
}

export async function fetchDocument(id: string): Promise<DocRecord | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("vb_records")
    .select("*")
    .eq("id", id)
    .single();
  return (data as DocRecord) || null;
}

export async function createDocument(title: string): Promise<DocRecord | null> {
  const supabase = createClient();

  // Get authenticated user — refuse to create with a fake ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    console.error("createDocument: no authenticated user — cannot create document without a real user ID");
    return null;
  }

  // Try to get workspace context from an existing record
  const { data: existing } = await supabase
    .from("vb_records")
    .select("workspace_id, entity_id")
    .eq("record_type", "document")
    .limit(1)
    .maybeSingle();

  if (!existing?.workspace_id || !existing?.entity_id) {
    console.error("createDocument: no existing records found to derive workspace_id/entity_id — cannot create document without workspace context");
    return null;
  }

  const { data, error } = await supabase
    .from("vb_records")
    .insert({
      workspace_id: existing.workspace_id,
      entity_id: existing.entity_id,
      created_by: user.id,
      title,
      content: { type: "doc", content: [{ type: "paragraph" }] },
      record_type: "document",
      source: "manual",
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    console.error("createDocument error:", JSON.stringify(error, null, 2), "code:", error.code, "message:", error.message, "details:", error.details, "hint:", error.hint);
    return null;
  }
  return data as DocRecord;
}

export async function updateDocument(
  id: string,
  updates: Partial<Pick<DocRecord, "title" | "content" | "status">>
): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vb_records")
    .update(updates)
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("updateDocument error:", error.message, error.code);
    return false;
  }
  if (!data || data.length === 0) {
    console.error("updateDocument: 0 rows updated — RLS may be blocking. id:", id);
    return false;
  }

  if (updates.content || updates.title) {
    // Fire-and-forget: trigger background embedding generation
    fetch("/api/embeddings/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: id }),
    }).catch(() => {});
  }

  return true;
}

export async function deleteDocument(id: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vb_records")
    .update({ is_deleted: true })
    .eq("id", id)
    .select("id");
  if (error || !data || data.length === 0) return false;
  return true;
}

export async function duplicateDocument(sourceId: string): Promise<DocRecord | null> {
  const supabase = createClient();

  const source = await fetchDocument(sourceId);
  if (!source) return null;

  // Use current user as owner of the duplicate
  const { data: { user } } = await supabase.auth.getUser();
  const createdBy = user?.id || source.created_by;

  // Create duplicate record
  const { data: newDoc, error } = await supabase
    .from("vb_records")
    .insert({
      workspace_id: source.workspace_id,
      entity_id: source.entity_id,
      created_by: createdBy,
      title: `${source.title} (עותק)`,
      content: source.content,
      record_type: "document",
      source: "manual",
      status: "active",
    })
    .select("*")
    .single();

  if (error || !newDoc) return null;

  // Copy canvas layout
  const { data: layout } = await supabase
    .from("canvas_layouts")
    .select("*")
    .eq("document_id", sourceId)
    .single();

  if (layout) {
    await supabase.from("canvas_layouts").insert({
      ...layout,
      document_id: newDoc.id,
    });
  }

  // Copy field placements
  const { data: placements } = await supabase
    .from("field_placements")
    .select("*")
    .eq("document_id", sourceId)
    .eq("is_deleted", false);

  if (placements && placements.length > 0) {
    await supabase.from("field_placements").insert(
      placements.map((p: Record<string, unknown>) => ({
        ...p,
        id: undefined, // let DB generate new IDs
        document_id: newDoc.id,
        placed_at: new Date().toISOString(),
      }))
    );
  }

  return newDoc as DocRecord;
}

// ─── Template CRUD ──────────────────────────────────────────

export async function fetchTemplates(): Promise<DocTemplate[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("doc_templates")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as DocTemplate[]) || [];
}

export async function createTemplate(template: {
  name: string;
  name_he?: string;
  icon?: string;
  description?: string;
  description_he?: string;
  category?: string;
  content: unknown;
  canvas_layout?: unknown;
  field_placements?: unknown[];
}): Promise<DocTemplate | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("doc_templates")
    .insert({
      name: template.name,
      name_he: template.name_he || null,
      icon: template.icon || "📄",
      description: template.description || null,
      description_he: template.description_he || null,
      category: template.category || "general",
      content: template.content,
      canvas_layout: template.canvas_layout || null,
      field_placements: template.field_placements || [],
    })
    .select("*")
    .single();
  if (error) return null;
  return data as DocTemplate;
}

export async function updateTemplate(
  id: string,
  updates: Partial<Pick<DocTemplate, "name" | "name_he" | "icon" | "description" | "description_he" | "category">>
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("doc_templates")
    .update(updates)
    .eq("id", id);
  return !error;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("doc_templates")
    .delete()
    .eq("id", id);
  return !error;
}

// ─── Version CRUD ───────────────────────────────────────────

export async function saveVersion(documentId: string, title: string, content: unknown): Promise<boolean> {
  const supabase = createClient();

  try {
    // Atomic version save via RPC — prevents race condition
    const { error } = await supabase.rpc("save_document_version", {
      p_doc_id: documentId,
      p_title: title,
      p_content: content,
    });

    if (!error) return true;
  } catch {
    // Fallback if RPC not available
  }

  // Fallback: manual version numbering
  const { data: latest } = await supabase
    .from("doc_versions")
    .select("version_number")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latest?.version_number || 0) + 1;

  const { error } = await supabase
    .from("doc_versions")
    .insert({
      document_id: documentId,
      title,
      content,
      version_number: nextVersion,
    });

  return !error;
}

export async function fetchVersions(documentId: string): Promise<DocVersion[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("doc_versions")
    .select("*")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false });
  return (data as DocVersion[]) || [];
}

export async function restoreVersion(documentId: string, versionId: string): Promise<boolean> {
  const supabase = createClient();

  const { data: version } = await supabase
    .from("doc_versions")
    .select("title, content")
    .eq("id", versionId)
    .single();

  if (!version) return false;

  return updateDocument(documentId, {
    title: version.title,
    content: version.content,
  });
}

// ─── Share CRUD ─────────────────────────────────────────────

export async function createShareLink(documentId: string, expiresInDays?: number): Promise<DocShare | null> {
  const supabase = createClient();

  // Check if active share exists
  const { data: existing } = await supabase
    .from("doc_shares")
    .select("*")
    .eq("document_id", documentId)
    .eq("is_active", true)
    .single();

  if (existing) return existing as DocShare;

  const { data: { user } } = await supabase.auth.getUser();

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from("doc_shares")
    .insert({
      document_id: documentId,
      created_by: user?.id || null,
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error) return null;
  return data as DocShare;
}

export async function revokeShareLink(shareId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("doc_shares")
    .update({ is_active: false })
    .eq("id", shareId);
  return !error;
}

export async function fetchActiveShareDocIds(): Promise<Set<string>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("doc_shares")
    .select("document_id")
    .eq("is_active", true);
  return new Set((data || []).map((d: { document_id: string }) => d.document_id));
}

export async function fetchSharedDocument(token: string): Promise<DocRecord | null> {
  const supabase = createClient();
  const { data: share } = await supabase
    .from("doc_shares")
    .select("document_id, is_active")
    .eq("share_token", token)
    .eq("is_active", true)
    .single();

  if (!share) return null;

  return fetchDocument(share.document_id);
}
