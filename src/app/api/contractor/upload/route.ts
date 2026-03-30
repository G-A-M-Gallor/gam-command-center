import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

/**
 * POST /api/contractor/upload
 * Public route — handles file uploads for contractor registration.
 * Uploads to contractor-submissions/submissions/ bucket.
 */
export async function POST(_request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, JPEG, and PNG are allowed." },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 5MB size limit" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const ext = file.name.split(".").pop() || "bin";
    const fileName = `submissions/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("contractor-submissions")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return NextResponse.json(
        { error: "Upload failed" },
        { status: 500 },
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("contractor-submissions")
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      path: data.path,
      url: urlData.publicUrl,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
