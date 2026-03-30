import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/vcloud/list?type=file|image|video|sound&personal=true&folder=/
 * Returns files filtered by type. Video type also includes vclips.
 */
export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url);
    const fileType = searchParams.get("type");
    const personal = searchParams.get("personal") === "true";
    const folder = searchParams.get("folder") || "/";

    const supabase = createServiceClient();

    // Fetch vcloud_files
    let query = supabase
      .from("vcloud_files")
      .select("id, name, file_type, mime_type, size_mb, storage_url, folder, is_personal, tags, vclip_id, created_at, updated_at")
      .eq("folder", folder)
      .order("created_at", { ascending: false })
      .limit(100);

    if (fileType) {
      query = query.eq("file_type", fileType);
    }
    if (personal) {
      query = query.eq("is_personal", true);
    }

    const { data: files, error } = await query;
    if (error) {
      console.error("[vcloud/list] Error:", error);
      return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
    }

    // For video tab — also include vclips that aren't already linked
    let clips: Record<string, unknown>[] = [];
    if (!fileType || fileType === "video") {
      const { data: vclips } = await supabase
        .from("vclips")
        .select("id, title, duration_seconds, size_mb, storage_url, status, view_count, tags, created_at")
        .eq("status", "ready")
        .order("created_at", { ascending: false })
        .limit(50);

      clips = (vclips || []).map((c) => ({
        id: `vclip:${c.id}`,
        name: c.title || "ללא שם",
        file_type: "video" as const,
        mime_type: "video/mp4",
        size_mb: c.size_mb,
        storage_url: c.storage_url,
        folder: "/",
        is_personal: false,
        tags: c.tags || [],
        vclip_id: c.id,
        source: "vclip",
        duration_seconds: c.duration_seconds,
        view_count: c.view_count,
        created_at: c.created_at,
        updated_at: c.created_at,
      }));
    }

    return NextResponse.json({
      files: [...(files || []), ...clips],
    });
  } catch (err) {
    console.error("[vcloud/list] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
