import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  entityCreateSchema,
  entityUpdateSchema,
  entityDeleteSchema,
} from "@/lib/api/schemas";
import { logActivityServer, logMetaChanges } from "@/lib/supabase/activityLogger";

/**
 * Entity CRUD API — /api/entities/[type]
 *
 * GET    — list entities with pagination, search, sort, filters
 * POST   — create a new entity
 * PATCH  — update an entity (merge meta)
 * DELETE — soft-delete one or many entities
 */

interface RouteContext {
  params: Promise<{ type: string }>;
}

// ─── GET /api/entities/[type] ────────────────────────────────

export async function GET(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await context.params;
    const { searchParams } = new URL(request.url);

    const page = Math.max(0, parseInt(searchParams.get("page") || "0", 10));
    const pageSize = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10))
    );
    const search = searchParams.get("search")?.trim() || "";
    const sortField = searchParams.get("sort_field") || "created_at";
    const sortDir = searchParams.get("sort_dir") === "asc" ? true : false;
    const status = searchParams.get("status") || "active";
    const filtersRaw = searchParams.get("filters") || "";

    // Base query
    let query = supabase
      .from("vb_records")
      .select("*", { count: "exact" })
      .eq("entity_type", type)
      .eq("is_deleted", false);

    // Status filter
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Search
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    // ViewFilter[] from JSON param
    if (filtersRaw) {
      try {
        const filters = JSON.parse(filtersRaw) as Array<{
          field: string;
          operator: string;
          value: string;
        }>;

        for (const f of filters) {
          if (!f.field || !f.operator || f.value === undefined) continue;

          // Meta field filters use the -> JSON operator
          const column = f.field.startsWith("meta.")
            ? `meta->>${f.field.slice(5)}`
            : f.field;

          switch (f.operator) {
            case "eq":
              query = query.eq(column, f.value);
              break;
            case "neq":
              query = query.neq(column, f.value);
              break;
            case "ilike":
            case "contains":
              query = query.ilike(column, `%${f.value}%`);
              break;
            case "gt":
              query = query.gt(column, f.value);
              break;
            case "lt":
              query = query.lt(column, f.value);
              break;
            case "gte":
              query = query.gte(column, f.value);
              break;
            case "lte":
              query = query.lte(column, f.value);
              break;
            case "is_null":
              query = query.is(column, null);
              break;
            case "not_null":
              query = query.not(column, "is", null);
              break;
          }
        }
      } catch {
        // Invalid JSON in filters param — ignore silently
      }
    }

    // Sorting — meta fields use JSON path
    if (sortField.startsWith("meta.")) {
      const metaKey = sortField.slice(5);
      query = query.order(`meta->>${metaKey}` as string, {
        ascending: sortDir,
      });
    } else {
      query = query.order(sortField, { ascending: sortDir });
    }

    // Pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      page,
      pageSize,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST /api/entities/[type] ───────────────────────────────

export async function POST(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await context.params;
    const body = await request.json();
    const parsed = entityCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { title, meta } = parsed.data;

    const { data, error } = await supabase
      .from("vb_records")
      .insert({
        title,
        meta,
        entity_type: type,
        record_type: type,
        status: "active",
        source: "api",
        is_deleted: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Fire-and-forget activity log
    if (data?.id) {
      logActivityServer(data.id, 'created', { actorId: user.id }).catch(() => { /* no-op */ });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/entities/[type] ──────────────────────────────

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await context.params;
    const body = await request.json();
    const parsed = entityUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { id, title, meta, status } = parsed.data;

    if (!id) {
      return NextResponse.json(
        { error: "id is required for PATCH on collection endpoint" },
        { status: 400 }
      );
    }

    // Verify record exists and belongs to this entity type
    const { data: existing, error: fetchError } = await supabase
      .from("vb_records")
      .select("*")
      .eq("id", id)
      .eq("entity_type", type)
      .eq("is_deleted", false)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Entity not found" },
        { status: 404 }
      );
    }

    // Build update payload
    const updates: Record<string, unknown> = {
      last_edited_at: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title;
    if (status !== undefined) updates.status = status;

    // Merge meta — don't replace
    if (meta !== undefined) {
      const currentMeta =
        typeof existing.meta === "object" && existing.meta !== null
          ? (existing.meta as Record<string, unknown>)
          : {};
      updates.meta = { ...currentMeta, ...meta };
    }

    const { data, error } = await supabase
      .from("vb_records")
      .update(updates)
      .eq("id", id)
      .eq("entity_type", type)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Fire-and-forget activity logging
    const logPromises: Promise<unknown>[] = [];

    if (title !== undefined && title !== existing.title) {
      logPromises.push(logActivityServer(id, 'field_change', {
        actorId: user.id, fieldKey: 'title',
        oldValue: existing.title, newValue: title,
      }));
    }
    if (status !== undefined && status !== existing.status) {
      logPromises.push(logActivityServer(id, 'status_change', {
        actorId: user.id, fieldKey: 'status',
        oldValue: existing.status, newValue: status,
      }));
    }
    if (meta !== undefined) {
      const oldMeta = typeof existing.meta === 'object' && existing.meta !== null
        ? (existing.meta as Record<string, unknown>) : {};
      logPromises.push(logMetaChanges(id, oldMeta, meta, user.id));
    }
    Promise.all(logPromises).catch(() => { /* no-op */ });

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/entities/[type] ─────────────────────────────

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await context.params;
    const body = await request.json();
    const parsed = entityDeleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    // Normalize to array of ids
    const ids = "ids" in parsed.data ? parsed.data.ids : [parsed.data.id];

    // Soft delete — set is_deleted = true
    const { data, error } = await supabase
      .from("vb_records")
      .update({
        is_deleted: true,
        last_edited_at: new Date().toISOString(),
      })
      .eq("entity_type", type)
      .in("id", ids)
      .eq("is_deleted", false)
      .select("id");

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Fire-and-forget activity logging for each deleted entity
    if (data && data.length > 0) {
      Promise.all(
        data.map((d: { id: string }) =>
          logActivityServer(d.id, 'deleted', { actorId: user.id })
        )
      ).catch(() => { /* no-op */ });
    }

    return NextResponse.json({
      success: true,
      deleted: data?.length || 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
