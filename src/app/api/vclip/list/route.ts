import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/vclip/list
 * Returns all clips for the library page.
 */
export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data: clips, error } = await supabase
      .from("vclips")
      .select("id, title, duration_seconds, size_mb, storage_url, status, view_count, unique_viewers, tags, created_at")
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[vclip/list] Error:", error);
      return NextResponse.json({ error: "Failed to fetch clips" }, { status: 500 });
    }

    return NextResponse.json({ clips: clips || [] });
  } catch (err) {
    console.error("[vclip/list] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
