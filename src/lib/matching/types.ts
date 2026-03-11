// ===================================================
// Matching Engine — Core Types
// ===================================================
// Types for the AI-powered entity matching system.
// Scores compatibility between workers, jobs, contractors, projects, leads, etc.

// ─── Field Match Types ─────────────────────────────────

/** How two fields should be compared */
export type FieldMatchType =
  | "overlap"        // multi-select / tag intersection (Jaccard)
  | "rangeOverlap"   // numeric range overlap (e.g. budget ranges)
  | "dateRange"      // date range overlap (e.g. availability windows)
  | "exact"          // exact string/enum match
  | "proximity";     // numeric closeness (e.g. location distance, experience years)

// ─── Field Mapping ─────────────────────────────────────

/** Maps a source field to a target field with a match strategy */
export interface FieldMapping {
  sourceKey: string;
  targetKey: string;
  matchType: FieldMatchType;
  weight: number;            // 0-1, how important this field pairing is
  /** For rangeOverlap: tolerance in absolute units */
  tolerance?: number;
  /** For proximity: max distance for score=0 */
  maxDistance?: number;
}

// ─── Match Weights ─────────────────────────────────────

/** Weight distribution across the three scoring axes */
export interface MatchWeights {
  semantic: number;   // 0-1, weight for embedding similarity
  field: number;      // 0-1, weight for structured field matching
  recency: number;    // 0-1, weight for time-based freshness
}

export const DEFAULT_WEIGHTS: MatchWeights = {
  semantic: 0.4,
  field: 0.4,
  recency: 0.2,
};

// ─── Match Config ──────────────────────────────────────

/** Configuration for a matching operation */
export interface MatchConfig {
  weights: MatchWeights;
  fieldMappings: FieldMapping[];
  /** Maximum age in hours for cached scores to be considered fresh */
  maxCacheAgeHours: number;
  /** Entity types considered for matching */
  sourceTypes?: string[];
  targetTypes?: string[];
}

export const DEFAULT_CONFIG: MatchConfig = {
  weights: DEFAULT_WEIGHTS,
  fieldMappings: [],
  maxCacheAgeHours: 24,
};

// ─── Match Profile ─────────────────────────────────────

/** Extracted profile from an entity for matching purposes */
export interface MatchProfile {
  id: string;
  entityType: string;
  title: string;
  /** Concatenated text for embedding-based semantic matching */
  semanticText: string;
  /** Structured key-value pairs for field-based matching */
  fields: Record<string, MatchFieldValue>;
  /** ISO timestamp of last modification */
  lastModified: string;
  /** Optional pre-computed embedding vector */
  embedding?: number[];
}

/** A typed field value used in matching */
export type MatchFieldValue =
  | { type: "string"; value: string }
  | { type: "number"; value: number }
  | { type: "strings"; value: string[] }
  | { type: "range"; min: number; max: number }
  | { type: "dateRange"; start: string; end: string }
  | { type: "boolean"; value: boolean };

// ─── Match Score ───────────────────────────────────────

/** The result of scoring one source-target pair */
export interface MatchScore {
  sourceId: string;
  targetId: string;
  sourceType: string;
  targetType: string;
  /** 0-1 score from embedding cosine similarity */
  semanticScore: number;
  /** 0-1 score from structured field comparison */
  fieldScore: number;
  /** 0-1 score from time-based recency */
  recencyScore: number;
  /** Weighted combination of all three scores */
  totalScore: number;
  /** Per-field breakdown for transparency */
  fieldBreakdown: Record<string, number>;
  /** When this score was computed */
  computedAt: string;
}

// ─── Match Score DB Row ────────────────────────────────

/** Row shape as stored in Supabase matching_scores table */
export interface MatchScoreRow {
  id: string;
  source_id: string;
  target_id: string;
  source_type: string;
  target_type: string;
  semantic_score: number;
  field_score: number;
  recency_score: number;
  total_score: number;
  field_breakdown: Record<string, number>;
  computed_at: string;
}

// ─── Entity-Specific Configs ───────────────────────────

/** Pre-built field mappings for common entity type pairings */
export const ENTITY_PAIR_CONFIGS: Record<string, FieldMapping[]> = {
  "lead-project": [
    { sourceKey: "budget", targetKey: "budget", matchType: "rangeOverlap", weight: 0.3, tolerance: 50000 },
    { sourceKey: "service_area", targetKey: "location", matchType: "overlap", weight: 0.25 },
    { sourceKey: "required_skills", targetKey: "classification_category", matchType: "overlap", weight: 0.25 },
    { sourceKey: "timeline", targetKey: "timeline", matchType: "dateRange", weight: 0.2 },
  ],
  "worker-project": [
    { sourceKey: "skills", targetKey: "required_skills", matchType: "overlap", weight: 0.35 },
    { sourceKey: "experience_years", targetKey: "min_experience", matchType: "proximity", weight: 0.2, maxDistance: 10 },
    { sourceKey: "location", targetKey: "location", matchType: "overlap", weight: 0.2 },
    { sourceKey: "availability", targetKey: "timeline", matchType: "dateRange", weight: 0.25 },
  ],
  "contractor-project": [
    { sourceKey: "classification_category", targetKey: "required_classifications", matchType: "overlap", weight: 0.3 },
    { sourceKey: "service_area", targetKey: "location", matchType: "overlap", weight: 0.25 },
    { sourceKey: "capacity", targetKey: "project_size", matchType: "proximity", weight: 0.2, maxDistance: 100 },
    { sourceKey: "license_expiry", targetKey: "timeline", matchType: "dateRange", weight: 0.25 },
  ],
};
