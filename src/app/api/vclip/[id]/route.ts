import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { del } from "@vercel/blob";

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

/**
 * DELETE /api/vclip/[id]
 * Deletes a clip from Blob storage and Supabase.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    // Get clip to find storage URL
    const { data: clip } = await supabase
      .from("vclips")
      .select("storage_url")
      .eq("id", id)
      .single();

    // Delete from Blob storage
    if (clip?.storage_url) {
      try {
        await del(clip.storage_url);
      } catch (_error) {
        // Ignore storage deletion errors
      }
    }

    // Delete from Supabase (views cascade)
    await supabase.from("vclips").delete().eq("id", id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[vclip/delete] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
