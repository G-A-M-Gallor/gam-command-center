import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api/auth";
import { matchingScoreSchema } from "@/lib/api/schemas";
import { extractMatchProfile } from "@/lib/matching/matchProfiles";
import { computeMatchScores } from "@/lib/matching/scoring";
import type { MatchConfig, MatchScore, ENTITY_PAIR_CONFIGS } from "@/lib/matching/types";
import { DEFAULT_CONFIG } from "@/lib/matching/types";
import type { NoteRecord, EntityType, GlobalField } from "@/lib/entities/types";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuth(request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  try {
    const rawBody = await request.json();
    const parsed = matchingScoreSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { source_id, target_type, limit, force_refresh } = parsed.data;
    const supabase = getServiceClient();

    // Check cache first (unless force_refresh)
    if (!force_refresh) {
      const cutoff = new Date(
        Date.now() - DEFAULT_CONFIG.maxCacheAgeHours * 60 * 60 * 1000
      ).toISOString();

      let cacheQuery = supabase
        .from("matching_scores")
        .select("*")
        .eq("source_id", source_id)
        .gte("computed_at", cutoff)
        .order("total_score", { ascending: false })
        .limit(limit);

      if (target_type) {
        cacheQuery = cacheQuery.eq("target_type", target_type);
      }

      const { data: cached } = await cacheQuery;
      if (cached && cached.length > 0) {
        return NextResponse.json({ scores: cached, cached: true });
      }
    }

    // Fetch source note
    const { data: sourceNote, error: noteError } = await supabase
      .from("vb_records")
      .select("*")
      .eq("id", source_id)
      .eq("is_deleted", false)
      .single();

    if (noteError || !sourceNote) {
      return NextResponse.json(
        { error: "Source entity not found" },
        { status: 404 }
      );
    }

    // Fetch entity types and global fields
    const [typesRes, fieldsRes] = await Promise.all([
      supabase.from("entity_types").select("*"),
      supabase.from("global_fields").select("*"),
    ]);

    const entityTypes = (typesRes.data ?? []) as EntityType[];
    const globalFields = (fieldsRes.data ?? []) as GlobalField[];

    const sourceEntityType = entityTypes.find(
      (et) => et.slug === sourceNote.entity_type
    );
    if (!sourceEntityType) {
      return NextResponse.json(
        { error: "Source entity type not found" },
        { status: 404 }
      );
    }

    // Extract source profile
    const sourceProfile = extractMatchProfile(
      sourceNote as NoteRecord,
      sourceEntityType,
      globalFields
    );

    // Fetch candidate targets
    let targetQuery = supabase
      .from("vb_records")
      .select("*")
      .eq("is_deleted", false)
      .neq("id", source_id)
      .limit(200);

    if (target_type) {
      targetQuery = targetQuery.eq("entity_type", target_type);
    }

    const { data: targets } = await targetQuery;
    if (!targets || targets.length === 0) {
      return NextResponse.json({ scores: [], cached: false });
    }

    // Extract target profiles
    const targetProfiles = (targets as NoteRecord[])
      .map((note) => {
        const et = entityTypes.find((t) => t.slug === note.entity_type);
        if (!et) return null;
        return extractMatchProfile(note, et, globalFields);
      })
      .filter(Boolean) as ReturnType<typeof extractMatchProfile>[];

    // Determine field mappings from entity pair configs
    const pairKey = target_type
      ? `${sourceEntityType.slug}-${target_type}`
      : "";
    const pairKeyReverse = target_type
      ? `${target_type}-${sourceEntityType.slug}`
      : "";

    // Dynamic import of ENTITY_PAIR_CONFIGS
    const { ENTITY_PAIR_CONFIGS: configs } = await import("@/lib/matching/types");
    const fieldMappings =
      configs[pairKey] || configs[pairKeyReverse] || [];

    const config: MatchConfig = {
      ...DEFAULT_CONFIG,
      fieldMappings,
    };

    // Score all targets
    const scores = computeMatchScores(sourceProfile, targetProfiles, config, limit);

    // Cache results
    if (scores.length > 0) {
      const rows = scores.map((s: MatchScore) => ({
        source_id: s.sourceId,
        target_id: s.targetId,
        source_type: s.sourceType,
        target_type: s.targetType,
        semantic_score: s.semanticScore,
        field_score: s.fieldScore,
        recency_score: s.recencyScore,
        total_score: s.totalScore,
        field_breakdown: s.fieldBreakdown,
        computed_at: s.computedAt,
      }));

      await supabase
        .from("matching_scores")
        .upsert(rows, { onConflict: "source_id,target_id" });
    }

    return NextResponse.json({ scores, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
