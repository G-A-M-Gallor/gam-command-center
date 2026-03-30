import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { put } from "@vercel/blob";

/**
 * POST /api/vclip/upload
 * Receives the video blob directly, uploads to Vercel Blob,
 * creates Supabase record, returns watch URL.
 *
 * Uses server-side upload (extension sends the blob here).
 */
export async function POST(_request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const durationStr = formData.get("duration_seconds") as string | null;

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const duration_seconds = durationStr ? parseInt(durationStr, 10) : 0;
    const size_mb = +(file.size / (1024 * 1024)).toFixed(2);
    const filename = file.name || `vclip-${Date.now()}.mp4`;

    // Upload to Vercel Blob
    const blob = await put(`vclip/${Date.now()}-${filename}`, file, {
      access: "public",
      contentType: file.type || "video/mp4",
    });

    // Create clip record in Supabase
    const supabase = createServiceClient();

    const { data: clip, error } = await supabase
      .from("vclips")
      .insert({
        title: filename.replace(/\.\w+$/, ""),
        storage_key: blob.pathname,
        storage_url: blob.url,
        content_type: file.type || "video/mp4",
        size_mb,
        duration_seconds,
        status: "ready",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[vclip/upload] Supabase error:", error);
      return NextResponse.json({ error: "Failed to create clip record" }, { status: 500 });
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const watch_url = `${protocol}://${host}/watch/${clip.id}`;

    return NextResponse.json({
      clip_id: clip.id,
      watch_url,
      storage_url: blob.url,
    });
  } catch (err) {
    console.error("[vclip/upload] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Vercel Blob needs larger body limit for video files
export const config = {
  api: {
    bodyParser: false,
  },
};
