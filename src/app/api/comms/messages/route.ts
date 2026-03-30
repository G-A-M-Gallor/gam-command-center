import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * GET /api/comms/messages?entity_id=...&channel=...&cursor=...&limit=50
 * Fetch communication messages for an entity, with cursor pagination.
 */
export async function GET(request: NextRequest) {
  const { error: authError } = await requireAuth(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  try {
    const url = request.nextUrl;
    const entityId = url.searchParams.get("entity_id");
    const entityPhone = url.searchParams.get("entity_phone");
    const channel = url.searchParams.get("channel");
    const cursor = url.searchParams.get("cursor"); // ISO timestamp
    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);

    if (!entityId && !entityPhone) {
      return NextResponse.json({ error: "entity_id or entity_phone is required" }, { status: 400 });
    }

    const supabase = getServiceClient();

    let query = supabase
      .from("comm_messages")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (entityId) query = query.eq("entity_id", entityId);
    if (entityPhone) query = query.eq("entity_phone", entityPhone);
    if (channel && channel !== "all") query = query.eq("channel", channel);
    if (cursor) query = query.lt("created_at", cursor);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const nextCursor = data && data.length === limit
      ? data[data.length - 1].created_at
      : null;

    return NextResponse.json({
      messages: data ?? [],
      total: count ?? 0,
      nextCursor,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
