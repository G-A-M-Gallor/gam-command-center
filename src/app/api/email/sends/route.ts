import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const tenant_id = url.searchParams.get("tenant_id");
  const entity_id = url.searchParams.get("entity_id");
  const status = url.searchParams.get("status");
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

  let query = supabase
    .from("email_sends")
    .select("*, email_templates(name, category)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (tenant_id) query = query.eq("tenant_id", tenant_id);
  if (entity_id) query = query.eq("entity_id", entity_id);
  if (status) query = query.eq("status", status);
  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Failed to fetch sends" }, { status: 500 });
  }

  const sends = data || [];
  const nextCursor = sends.length === limit ? sends[sends.length - 1]?.created_at : undefined;

  return NextResponse.json({ sends, nextCursor });
}
