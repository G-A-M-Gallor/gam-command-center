import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

/**
 * POST /api/vclip/[id]/view
 * Tracks a view event. Called by the player page.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { viewer_token, watch_duration_seconds, watch_percentage } = body;

    const supabase = createServiceClient();

    const token = viewer_token || randomUUID();
    const ua = request.headers.get("_user-agent") || "";
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    // Detect device type from UA
    let device_type = "desktop";
    if (/mobile|android|iphone/i.test(ua)) device_type = "mobile";
    else if (/tablet|ipad/i.test(ua)) device_type = "tablet";

    // Insert view record
    await supabase.from("vclip_views").insert({
      clip_id: id,
      viewer_token: token,
      viewer_ip: ip,
      viewer_ua: ua.slice(0, 500),
      device_type,
      watch_duration_seconds: watch_duration_seconds || 0,
      watch_percentage: watch_percentage || 0,
    });

    // Increment view count + unique viewers
    const { count: uniqueCount } = await supabase
      .from("vclip_views")
      .select("viewer_token", { count: "exact", head: true })
      .eq("clip_id", id);

    await supabase
      .from("vclips")
      .update({
        view_count: (await supabase.from("vclip_views").select("id", { count: "exact", head: true }).eq("clip_id", id)).count || 0,
        unique_viewers: uniqueCount || 0,
      })
      .eq("id", id);

    return NextResponse.json({ ok: true, viewer_token: token });
  } catch (err) {
    console.error("[vclip/view] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
