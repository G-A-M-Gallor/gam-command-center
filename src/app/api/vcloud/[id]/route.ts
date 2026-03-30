import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { del } from "@vercel/blob";

/**
 * DELETE /api/vcloud/[id]
 * Deletes a file from Blob storage and Supabase.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { data: file } = await supabase
      .from("vcloud_files")
      .select("storage_url")
      .eq("id", id)
      .single();

    if (file?.storage_url) {
      try {
        await del(file.storage_url);
      } catch (_error) {
        // Ignore storage deletion errors
      }
    }

    await supabase.from("vcloud_files").delete().eq("id", id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[vcloud/delete] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
