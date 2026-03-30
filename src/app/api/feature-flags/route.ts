import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Feature Flags API — /api/feature-flags
 *
 * GET  ?app=vCanvas  — list flags for an app
 * PUT                — toggle a flag { app_name, feature_name, enabled }
 */

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const app = searchParams.get("app");

    let query = supabase
      .from("feature_flags")
      .select("*")
      .order("feature_name");

    if (app) query = query.eq("app_name", app);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ flags: data });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { app_name, feature_name, enabled } = body;

    if (!app_name || !feature_name || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Missing app_name, feature_name, or enabled" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("feature_flags")
      .upsert(
        { app_name, feature_name, enabled },
        { onConflict: "app_name,feature_name" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ flag: data });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
