import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { roadmapLayersSchema } from "@/lib/api/schemas";
import {
  queryLayer,
  LAYER_CONFIG,
  type LayerKey,
} from "@/lib/notion/roadmapLayers";

// GET /api/roadmap/layers?layer=goals&parentId=xxx
export async function GET(request: Request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(request.url);
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

  if (!LAYER_CONFIG[layer as LayerKey]) {
    return NextResponse.json({ error: "Unknown layer" }, { status: 400 });
  }

  try {
    const items = await queryLayer(layer as LayerKey, parentId);
    return NextResponse.json(
      { items, layer, parentId: parentId ?? null },
      {
        headers: {
          "Cache-Control": "private, s-maxage=120",
        },
      },
    );
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Failed to fetch Notion data";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
