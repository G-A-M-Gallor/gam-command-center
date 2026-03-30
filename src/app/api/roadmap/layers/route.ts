import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { roadmapLayersSchema } from "@/lib/api/schemas";
import { createServiceClient } from "@/lib/supabase/server";
import {
  LAYER_CONFIG,
  type LayerKey,
  type RoadmapRecord,
} from "@/lib/notion/roadmapLayers";

// GET /api/roadmap/layers?layer=goals&parentId=xxx
export async function GET(_request: Request) {
  const { error } = await requireAuth(_request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(_request.url);
  const parsed = roadmapLayersSchema.safeParse({
    layer: searchParams.get("layer") ?? undefined,
    parentId: searchParams.get("parentId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid parameters" },
      { status: 400 },
    );
  }

  const { layer, parentId } = parsed.data;
  const config = LAYER_CONFIG[layer as LayerKey];

  if (!config) {
    return NextResponse.json({ error: "Unknown layer" }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    let query = supabase.from(config.table).select("*");

    if (parentId && config.parentFkColumn) {
      query = query.eq(config.parentFkColumn, parentId);
    }

    const { data, error: dbError } = await query.order("name");

    if (dbError) throw new Error(dbError.message);

    const items: RoadmapRecord[] = (data ?? []).map((row: Record<string, unknown>) => {
      const properties: Record<string, string> = {};
      for (const [key, val] of Object.entries(row)) {
        if (val != null && key !== "id") properties[key] = String(val);
      }
      return {
        id: String(row.notion_url ?? row.id),
        url: (row.notion_url as string) ?? "",
        title: (row.name as string) ?? "Untitled",
        status: (row.status as string) ?? "",
        layer: layer as LayerKey,
        properties,
      };
    });

    return NextResponse.json(
      { items, layer, parentId: parentId ?? null },
      { _headers: { "Cache-Control": "private, s-maxage=120" } },
    );
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Failed to fetch roadmap data";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
