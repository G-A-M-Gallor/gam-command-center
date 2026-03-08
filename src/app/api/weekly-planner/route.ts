import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/weekly-planner — load items + templates
 * PUT /api/weekly-planner — save full items + templates arrays (replace)
 *
 * Uses a simple key-value approach: stores the full JSON blob in a single row
 * per user. This avoids complex migrations while still persisting data.
 * Table: weekly_planner_data (id, user_id, items_json, templates_json, updated_at)
 */

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify user session — return empty when unauthenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ items: [], templates: [], persisted: false });
    }

    const { data, error } = await supabase
      .from("weekly_planner_data")
      .select("items_json, templates_json")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ items: [], templates: [], persisted: false });
    }

    return NextResponse.json({
      items: data.items_json || [],
      templates: data.templates_json || [],
      persisted: true,
    });
  } catch {
    return NextResponse.json({ items: [], templates: [], persisted: false }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    // Verify user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ saved: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items, templates } = body;

    if (!Array.isArray(items) || !Array.isArray(templates)) {
      return NextResponse.json({ saved: false, error: "Invalid data" }, { status: 400 });
    }

    // Upsert: try update first, insert if not found
    const { data: existing } = await supabase
      .from("weekly_planner_data")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("weekly_planner_data")
        .update({
          items_json: items,
          templates_json: templates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("weekly_planner_data").insert({
        items_json: items,
        templates_json: templates,
      });
    }

    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ saved: false }, { status: 500 });
  }
}
