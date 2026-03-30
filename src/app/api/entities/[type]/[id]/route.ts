import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { entityUpdateSchema } from "@/lib/api/schemas";

/**
 * Single entity CRUD API — /api/entities/[type]/[id]
 *
 * GET    — fetch a single entity
 * PATCH  — update a single entity (merge meta)
 * DELETE — soft-delete a single entity
 */

interface RouteContext {
  params: Promise<{ type: string; id: string }>;
}

// UUID v4 regex for param validation
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── GET /api/entities/[type]/[id] ──────────────────────────

export async function GET(_request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, id } = await context.params;

    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { error: "Invalid entity id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("vb_records")
      .select("*")
      .eq("id", id)
      .eq("entity_type", type)
      .eq("is_deleted", false)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Entity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/entities/[type]/[id] ────────────────────────

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, id } = await context.params;

    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { error: "Invalid entity id" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = entityUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { title, meta, status } = parsed.data;

    // Fetch existing record to merge meta
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

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/entities/[type]/[id] ───────────────────────

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, id } = await context.params;

    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { error: "Invalid entity id" },
        { status: 400 }
      );
    }

    // Soft delete
    const { error, count } = await supabase
      .from("vb_records")
      .update({
        is_deleted: true,
        last_edited_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("entity_type", type)
      .eq("is_deleted", false);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (count === 0) {
      return NextResponse.json(
        { error: "Entity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
