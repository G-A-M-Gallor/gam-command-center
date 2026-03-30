import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * GET /api/audit — paginated audit log from both audit_log and document_audit_log
 * Query params: page, limit, action, actor_id, actor_type, from, to, search, source, table_name
 */
export async function GET(_request: Request) {
  const { error: authError } = await requireAuth(_request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  const url = new URL(_request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);
  const action = url.searchParams.get("action");
  const actorId = url.searchParams.get("actor_id");
  const actorType = url.searchParams.get("actor_type");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const search = url.searchParams.get("search");
  const source = url.searchParams.get("source");
  const tableName = url.searchParams.get("table_name");

  const offset = (page - 1) * limit;
  const supabase = createServiceClient();

  if (source === "document") {
    return fetchDocumentAudit(supabase, { offset, limit, action, actorId, actorType, from, to, search });
  }

  if (source === "system") {
    return fetchSystemAudit(supabase, { offset, limit, action, tableName, from, to, search });
  }

  const [sysResult, docResult] = await Promise.all([
    fetchSystemAuditData(supabase, { offset: 0, limit: 500, action, tableName, from, to, search }),
    fetchDocumentAuditData(supabase, { offset: 0, limit: 500, action: action, actorId, actorType, from, to, search }),
  ]);

  const combined = [
    ...sysResult.map((r: Record<string, unknown>) => ({ ...r, _source: "system" as const })),
    ...docResult.map((r: Record<string, unknown>) => ({
      id: r.id,
      table_name: "document",
      record_id: r.submission_id,
      action: r.action,
      old_data: null,
      new_data: r.details,
      changed_by: r.actor_id,
      changed_at: r.created_at,
      actor_type: r.actor_type,
      _source: "document" as const,
    })),
  ];

  combined.sort((a, b) => {
    const aDate = 'changed_at' in a ? a.changed_at : null;
    const bDate = 'changed_at' in b ? b.changed_at : null;
    if (!aDate || !bDate) return 0;
    return new Date(bDate as string).getTime() - new Date(aDate as string).getTime();
  });

  const total = combined.length;
  const paged = combined.slice(offset, offset + limit);

  return NextResponse.json({ entries: paged, total, page, limit });
}

interface QueryParams {
  offset: number;
  limit: number;
  action: string | null;
  tableName?: string | null;
  actorId?: string | null;
  actorType?: string | null;
  from: string | null;
  to: string | null;
  search: string | null;
}
async function fetchSystemAuditData(supabase: SupabaseClient, params: QueryParams) {
  let query = supabase
    .from("audit_log")
    .select("*")
    .order("changed_at", { ascending: false })
    .range(0, params.limit - 1);

  if (params.action) query = query.eq("action", params.action);
  if (params.tableName) query = query.eq("table_name", params.tableName);
  if (params.from) query = query.gte("changed_at", params.from);
  if (params.to) query = query.lte("changed_at", params.to);

  const { data } = await query;
  return data || [];
}
async function fetchDocumentAuditData(supabase: SupabaseClient, params: QueryParams) {
  let query = supabase
    .from("document_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .range(0, params.limit - 1);

  if (params.action) query = query.eq("action", params.action);
  if (params.actorId) query = query.eq("actor_id", params.actorId);
  if (params.actorType) query = query.eq("actor_type", params.actorType);
  if (params.from) query = query.gte("created_at", params.from);
  if (params.to) query = query.lte("created_at", params.to);

  const { data } = await query;
  return data || [];
}
async function fetchSystemAudit(supabase: SupabaseClient, params: QueryParams) {
  let query = supabase
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("changed_at", { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);

  if (params.action) query = query.eq("action", params.action);
  if (params.tableName) query = query.eq("table_name", params.tableName);
  if (params.from) query = query.gte("changed_at", params.from);
  if (params.to) query = query.lte("changed_at", params.to);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entries = (data || []).map((r: Record<string, unknown>) => ({ ...r, _source: "system" }));
  return NextResponse.json({ entries, total: count, page: Math.floor(params.offset / params.limit) + 1, limit: params.limit });
}
async function fetchDocumentAudit(supabase: SupabaseClient, params: QueryParams) {
  let query = supabase
    .from("document_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);

  if (params.action) query = query.eq("action", params.action);
  if (params.actorId) query = query.eq("actor_id", params.actorId);
  if (params.actorType) query = query.eq("actor_type", params.actorType);
  if (params.from) query = query.gte("created_at", params.from);
  if (params.to) query = query.lte("created_at", params.to);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entries = (data || []).map((r: Record<string, unknown>) => ({
    id: r.id,
    table_name: "document",
    record_id: r.submission_id,
    action: r.action,
    old_data: null,
    new_data: r.details,
    changed_by: r.actor_id,
    changed_at: r.created_at,
    actor_type: r.actor_type,
    _source: "document",
  }));

  return NextResponse.json({ entries, total: count, page: Math.floor(params.offset / params.limit) + 1, limit: params.limit });
}
