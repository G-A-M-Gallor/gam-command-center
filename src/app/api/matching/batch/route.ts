import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api/auth";
import { matchingBatchSchema } from "@/lib/api/schemas";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { extractMatchProfile } from "@/lib/matching/matchProfiles";
import { computeMatchScores } from "@/lib/matching/scoring";
import type { MatchConfig, MatchScore } from "@/lib/matching/types";
import { DEFAULT_CONFIG, ENTITY_PAIR_CONFIGS } from "@/lib/matching/types";
import type { NoteRecord, EntityType, GlobalField } from "@/lib/entities/types";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, RATE_LIMITS.ai);
  if (rl.limited) return rl.response;

  const { error: authError } = await requireAuth(request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  try {
    const rawBody = await request.json();
    const parsed = matchingBatchSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { source_ids, target_type, limit } = parsed.data;
    const supabase = getServiceClient();

    // Fetch all source notes
    const { data: sourceNotes, error: notesError } = await supabase
      .from("vb_records")
      .select("*")
      .in("id", source_ids)
      .eq("is_deleted", false);

    if (notesError || !sourceNotes || sourceNotes.length === 0) {
      return NextResponse.json(
        { error: "No valid source entities found" },
        { status: 404 }
      );
    }

    // Fetch entity types and global fields
    const [typesRes, fieldsRes] = await Promise.all([
      supabase.from("record_templates").select("*"),
      supabase.from("global_fields").select("*"),
    ]);

    const entityTypes = (typesRes.data ?? []) as EntityType[];
    const globalFields = (fieldsRes.data ?? []) as GlobalField[];

    // Fetch candidate targets
    let targetQuery = supabase
      .from("vb_records")
      .select("*")
      .eq("is_deleted", false)
      .limit(200);

    if (target_type) {
      targetQuery = targetQuery.eq("entity_type", target_type);
    }

    const { data: targets } = await targetQuery;
    const targetNotes = (targets ?? []) as NoteRecord[];

    // Process each source
    const results: Record<string, MatchScore[]> = {};
    const allScoresToCache: MatchScore[] = [];

    for (const sourceNote of sourceNotes as NoteRecord[]) {
      const sourceEntityType = entityTypes.find(
        (et) => et.slug === sourceNote.entity_type
      );
      if (!sourceEntityType) {
        results[sourceNote.id] = [];
        continue;
      }

      const sourceProfile = extractMatchProfile(
        sourceNote,
        sourceEntityType,
        globalFields
      );

      // Filter out the source from targets
      const filteredTargets = targetNotes.filter((t) => t.id !== sourceNote.id);

      const targetProfiles = filteredTargets
        .map((note) => {
          const et = entityTypes.find((t) => t.slug === note.entity_type);
          if (!et) return null;
          return extractMatchProfile(note, et, globalFields);
        })
        .filter(Boolean) as ReturnType<typeof extractMatchProfile>[];

      // Determine field mappings
      const pairKey = target_type
        ? `${sourceEntityType.slug}-${target_type}`
        : "";
      const pairKeyReverse = target_type
        ? `${target_type}-${sourceEntityType.slug}`
        : "";
      const fieldMappings =
        ENTITY_PAIR_CONFIGS[pairKey] || ENTITY_PAIR_CONFIGS[pairKeyReverse] || [];

      const config: MatchConfig = {
        ...DEFAULT_CONFIG,
        fieldMappings,
      };

      const scores = computeMatchScores(sourceProfile, targetProfiles, config, limit);
      results[sourceNote.id] = scores;
      allScoresToCache.push(...scores);
    }

    // Cache all results
    if (allScoresToCache.length > 0) {
      const rows = allScoresToCache.map((s) => ({
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

      // Batch in chunks of 100
      for (let i = 0; i < rows.length; i += 100) {
        const chunk = rows.slice(i, i + 100);
        await supabase
          .from("matching_scores")
          .upsert(chunk, { onConflict: "source_id,target_id" });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
