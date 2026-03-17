import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/vclip/[id]
 * Returns clip metadata for the player page.
 * Public endpoint — respects RLS public_read policy.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { data: clip, error } = await supabase
      .from("vclips")
      .select("id, title, duration_seconds, size_mb, storage_url, content_type, status, is_private, expires_at, watermark_text, view_count, created_at")
      .eq("id", id)
      .eq("status", "ready")
      .single();

    if (error || !clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // Check expiry
    if (clip.expires_at && new Date(clip.expires_at) < new Date()) {
      return NextResponse.json({ error: "Clip has expired" }, { status: 410 });
    }

    return NextResponse.json(clip);
  } catch (err) {
    console.error("[vclip/get] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
