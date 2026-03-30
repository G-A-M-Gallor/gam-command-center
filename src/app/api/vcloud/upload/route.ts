import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { put } from "@vercel/blob";

const FILE_TYPE_MAP: Record<string, string> = {
  "image/": "image",
  "video/": "video",
  "audio/": "sound",
};

function detectFileType(mimeType: string): string {
  for (const [prefix, type] of Object.entries(FILE_TYPE_MAP)) {
    if (mimeType.startsWith(prefix)) return type;
  }
  return "file";
}

/**
 * POST /api/vcloud/upload
 * Upload a file to Vercel Blob + create Supabase record.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "/";
    const isPersonal = formData.get("personal") === "true";

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const mimeType = file.type || "application/octet-stream";
    const fileType = detectFileType(mimeType);
    const sizeMb = +(file.size / (1024 * 1024)).toFixed(2);
    const filename = file.name || `file-${Date.now()}`;

    // Upload to Vercel Blob
    const blob = await put(`vcloud/${fileType}/${Date.now()}-${filename}`, file, {
      access: "public",
      contentType: mimeType,
    });

    // Create record in Supabase
    const supabase = createServiceClient();
    const { data: record, error } = await supabase
      .from("vcloud_files")
      .insert({
        name: filename,
        file_type: fileType,
        mime_type: mimeType,
        size_mb: sizeMb,
        storage_url: blob.url,
        storage_key: blob.pathname,
        folder,
        is_personal: isPersonal,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[vcloud/upload] Supabase error:", error);
      return NextResponse.json({ error: "Failed to create file record" }, { status: 500 });
    }

    return NextResponse.json({
      id: record.id,
      url: blob.url,
      file_type: fileType,
    });
  } catch (err) {
    console.error("[vcloud/upload] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
