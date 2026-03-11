// ===================================================
// Matching Engine — Core Scoring Algorithm
// ===================================================
// Computes match scores between entity pairs using three axes:
// 1. Semantic: embedding cosine similarity (from Voyage AI)
// 2. Field: structured field comparison (Jaccard, range overlap, etc.)
// 3. Recency: time-based freshness bonus

import type { MatchProfile, MatchConfig, MatchScore, FieldMapping, FieldMatchType, MatchFieldValue } from "./types";
import { DEFAULT_WEIGHTS } from "./types";
import {
  overlapScore,
  rangeOverlapScore,
  dateRangeOverlapScore,
  exactMatchScore,
  proximityScore,
} from "./fieldMatchers";

// ─── Main Scoring Function ─────────────────────────────

/**
 * Compute the match score between a source and target profile.
 * Returns a MatchScore with individual axis scores and a weighted total.
 */
export function computeMatchScore(
  source: MatchProfile,
  target: MatchProfile,
  config: MatchConfig
): MatchScore {
  const weights = config.weights || DEFAULT_WEIGHTS;

  // 1. Semantic score (embedding similarity)
  const semanticScore = computeSemanticScore(source, target);

  // 2. Field-based score
  const { score: fieldScore, breakdown: fieldBreakdown } = computeFieldScore(
    source,
    target,
    config.fieldMappings
  );

  // 3. Recency score
  const recencyScore = computeRecencyScore(target.lastModified);

  // Weighted total
  const totalScore =
    weights.semantic * semanticScore +
    weights.field * fieldScore +
    weights.recency * recencyScore;

  return {
    sourceId: source.id,
    targetId: target.id,
    sourceType: source.entityType,
    targetType: target.entityType,
    semanticScore: round(semanticScore),
    fieldScore: round(fieldScore),
    recencyScore: round(recencyScore),
    totalScore: round(totalScore),
    fieldBreakdown,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Score multiple targets against a single source.
 * Returns scores sorted by totalScore descending.
 */
export function computeMatchScores(
  source: MatchProfile,
  targets: MatchProfile[],
  config: MatchConfig,
  limit?: number
): MatchScore[] {
  const scores = targets.map((target) =>
    computeMatchScore(source, target, config)
  );

  scores.sort((a, b) => b.totalScore - a.totalScore);

  return limit ? scores.slice(0, limit) : scores;
}

// ─── Semantic Scoring ──────────────────────────────────

/**
 * Computes cosine similarity between two profiles' embeddings.
 * Falls back to simple text overlap if embeddings aren't available.
 */
function computeSemanticScore(
  source: MatchProfile,
  target: MatchProfile
): number {
  // If both have embeddings, use cosine similarity
  if (source.embedding && target.embedding) {
    return cosineSimilarity(source.embedding, target.embedding);
  }

  // Fallback: simple token overlap (normalized)
  return textOverlapScore(source.semanticText, target.semanticText);
}

/** Cosine similarity between two vectors */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : Math.max(0, dotProduct / denom);
}

/** Simple text overlap as fallback when embeddings aren't available */
function textOverlapScore(textA: string, textB: string): number {
  const wordsA = new Set(
    textA
      .toLowerCase()
      .split(/[\s,;.]+/)
      .filter((w) => w.length > 2)
  );
  const wordsB = new Set(
    textB
      .toLowerCase()
      .split(/[\s,;.]+/)
      .filter((w) => w.length > 2)
  );

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }

  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

// ─── Field-Based Scoring ───────────────────────────────

/**
 * Computes an aggregate field score from configured field mappings.
 * Each mapping compares one source field to one target field.
 * Returns weighted average + per-field breakdown.
 */
function computeFieldScore(
  source: MatchProfile,
  target: MatchProfile,
  mappings: FieldMapping[]
): { score: number; breakdown: Record<string, number> } {
  if (mappings.length === 0) {
    // No explicit mappings: try matching same-named fields
    return computeAutoFieldScore(source, target);
  }

  const breakdown: Record<string, number> = {};
  let totalWeight = 0;
  let weightedSum = 0;

  for (const mapping of mappings) {
    const sourceVal = source.fields[mapping.sourceKey];
    const targetVal = target.fields[mapping.targetKey];

    if (!sourceVal || !targetVal) {
      // If either field is missing, give partial credit of 0
      breakdown[`${mapping.sourceKey}->${mapping.targetKey}`] = 0;
      continue;
    }

    const fieldScore = matchField(sourceVal, targetVal, mapping.matchType, mapping);
    const key = `${mapping.sourceKey}->${mapping.targetKey}`;
    breakdown[key] = round(fieldScore);
    weightedSum += fieldScore * mapping.weight;
    totalWeight += mapping.weight;
  }

  const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
  return { score: round(score), breakdown };
}

/**
 * Auto-match: compare fields with the same key name.
 * Used when no explicit field mappings are configured.
 */
function computeAutoFieldScore(
  source: MatchProfile,
  target: MatchProfile
): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};
  const sourceKeys = Object.keys(source.fields);
  const targetKeys = new Set(Object.keys(target.fields));

  let matchCount = 0;
  let scoreSum = 0;

  for (const key of sourceKeys) {
    if (!targetKeys.has(key)) continue;

    const sourceVal = source.fields[key];
    const targetVal = target.fields[key];
    const matchType = inferMatchType(sourceVal, targetVal);
    const s = matchField(sourceVal, targetVal, matchType);
    breakdown[key] = round(s);
    scoreSum += s;
    matchCount++;
  }

  const score = matchCount > 0 ? scoreSum / matchCount : 0;
  return { score: round(score), breakdown };
}

/** Infer the best match type from field value types */
function inferMatchType(
  a: MatchFieldValue,
  b: MatchFieldValue
): FieldMatchType {
  if (a.type === "strings" || b.type === "strings") return "overlap";
  if (a.type === "range" || b.type === "range") return "rangeOverlap";
  if (a.type === "dateRange" || b.type === "dateRange") return "dateRange";
  if (a.type === "number" || b.type === "number") return "proximity";
  return "exact";
}

/** Dispatch to the correct field matcher */
function matchField(
  a: MatchFieldValue,
  b: MatchFieldValue,
  matchType: FieldMatchType,
  mapping?: FieldMapping
): number {
  switch (matchType) {
    case "overlap":
      return overlapScore(a, b);
    case "rangeOverlap":
      return rangeOverlapScore(a, b, mapping?.tolerance);
    case "dateRange":
      return dateRangeOverlapScore(a, b);
    case "exact":
      return exactMatchScore(a, b);
    case "proximity":
      return proximityScore(a, b, mapping?.maxDistance);
    default:
      return 0;
  }
}

// ─── Recency Scoring ───────────────────────────────────

/**
 * Scores based on how recently the target entity was modified.
 * Returns 1 for today, decays exponentially over 30 days.
 */
function computeRecencyScore(lastModified: string): number {
  const now = Date.now();
  const modified = new Date(lastModified).getTime();

  if (isNaN(modified)) return 0.5; // Unknown date gets a neutral score

  const daysSinceModified = (now - modified) / (1000 * 60 * 60 * 24);

  if (daysSinceModified < 0) return 1; // Future dates (just created)
  if (daysSinceModified <= 1) return 1;
  if (daysSinceModified >= 90) return 0.1;

  // Exponential decay: half-life of ~14 days
  return Math.max(0.1, Math.exp(-0.05 * daysSinceModified));
}

// ─── Utility ───────────────────────────────────────────

function round(n: number, decimals: number = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}
