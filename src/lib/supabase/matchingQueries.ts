// ===================================================
// Matching Engine — Supabase Queries
// ===================================================
// CRUD for matching_scores table using browser client.

import { supabase } from "@/lib/supabaseClient";
import type { MatchScore, MatchScoreRow } from "@/lib/matching/types";

// ─── Fetch Cached Scores ───────────────────────────────

/**
 * Get cached match scores for a source entity.
 * Optionally filter by target type and max age.
 */
export async function fetchCachedScores(
  sourceId: string,
  targetType?: string,
  maxAgeHours: number = 24
): Promise<MatchScoreRow[]> {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("matching_scores")
    .select("*")
    .eq("source_id", sourceId)
    .gte("computed_at", cutoff)
    .order("total_score", { ascending: false });

  if (targetType) {
    query = query.eq("target_type", targetType);
  }

  const { data, error } = await query;
  if (error) {
    console.error("fetchCachedScores:", error.message);
    return [];
  }
  return (data ?? []) as MatchScoreRow[];
}

// ─── Upsert Single Score ───────────────────────────────

/**
 * Insert or update a single match score.
 */
export async function upsertMatchScore(score: MatchScore): Promise<boolean> {
  const row = toRow(score);

  const { error } = await supabase
    .from("matching_scores")
    .upsert(row, { onConflict: "source_id,target_id" });

  if (error) {
    console.error("upsertMatchScore:", error.message);
    return false;
  }
  return true;
}

// ─── Upsert Batch ──────────────────────────────────────

/**
 * Insert or update multiple match scores in a single batch.
 */
export async function upsertMatchScores(scores: MatchScore[]): Promise<boolean> {
  if (scores.length === 0) return true;

  const rows = scores.map(toRow);

  const { error } = await supabase
    .from("matching_scores")
    .upsert(rows, { onConflict: "source_id,target_id" });

  if (error) {
    console.error("upsertMatchScores:", error.message);
    return false;
  }
  return true;
}

// ─── Delete Stale Caches ───────────────────────────────

/**
 * Remove cached scores older than the specified number of hours.
 */
export async function deleteStaleCaches(
  maxAgeHours: number = 48
): Promise<number> {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("matching_scores")
    .delete()
    .lt("computed_at", cutoff)
    .select("id");

  if (error) {
    console.error("deleteStaleCaches:", error.message);
    return 0;
  }
  return data?.length ?? 0;
}

// ─── Fetch Top Matches ─────────────────────────────────

/**
 * Get the top N matches for a source entity, optionally filtered by target type.
 */
export async function fetchTopMatches(
  sourceId: string,
  targetType?: string,
  limit: number = 10
): Promise<MatchScoreRow[]> {
  let query = supabase
    .from("matching_scores")
    .select("*")
    .eq("source_id", sourceId)
    .order("total_score", { ascending: false })
    .limit(limit);

  if (targetType) {
    query = query.eq("target_type", targetType);
  }

  const { data, error } = await query;
  if (error) {
    console.error("fetchTopMatches:", error.message);
    return [];
  }
  return (data ?? []) as MatchScoreRow[];
}

// ─── Helpers ───────────────────────────────────────────

function toRow(score: MatchScore): Omit<MatchScoreRow, "id"> {
  return {
    source_id: score.sourceId,
    target_id: score.targetId,
    source_type: score.sourceType,
    target_type: score.targetType,
    semantic_score: score.semanticScore,
    field_score: score.fieldScore,
    recency_score: score.recencyScore,
    total_score: score.totalScore,
    field_breakdown: score.fieldBreakdown,
    computed_at: score.computedAt,
  };
}

/** Convert a DB row back to a MatchScore */
export function fromRow(row: MatchScoreRow): MatchScore {
  return {
    sourceId: row.source_id,
    targetId: row.target_id,
    sourceType: row.source_type,
    targetType: row.target_type,
    semanticScore: row.semantic_score,
    fieldScore: row.field_score,
    recencyScore: row.recency_score,
    totalScore: row.total_score,
    fieldBreakdown: row.field_breakdown || {},
    computedAt: row.computed_at,
  };
}
