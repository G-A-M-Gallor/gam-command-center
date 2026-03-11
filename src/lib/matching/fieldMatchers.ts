// ===================================================
// Matching Engine — Field Matchers
// ===================================================
// Pure functions that compare two field values and return a 0-1 score.
// Each function handles one FieldMatchType from types.ts.

import type { MatchFieldValue } from "./types";

// ─── Overlap Score (Jaccard Index) ─────────────────────

/**
 * Computes overlap between two string arrays using Jaccard index.
 * Returns |intersection| / |union|.
 * Works for multi-select, tags, skills, areas, etc.
 */
export function overlapScore(a: MatchFieldValue, b: MatchFieldValue): number {
  const arrA = extractStrings(a);
  const arrB = extractStrings(b);

  if (arrA.length === 0 && arrB.length === 0) return 0;
  if (arrA.length === 0 || arrB.length === 0) return 0;

  const setA = new Set(arrA.map((s) => s.toLowerCase().trim()));
  const setB = new Set(arrB.map((s) => s.toLowerCase().trim()));

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

// ─── Range Overlap Score ───────────────────────────────

/**
 * Computes overlap between two numeric ranges.
 * Returns the ratio of overlap to the smaller range's span.
 * Tolerance expands both ranges before comparison.
 */
export function rangeOverlapScore(
  a: MatchFieldValue,
  b: MatchFieldValue,
  tolerance: number = 0
): number {
  const rangeA = extractRange(a);
  const rangeB = extractRange(b);

  if (!rangeA || !rangeB) return 0;

  const aMin = rangeA.min - tolerance;
  const aMax = rangeA.max + tolerance;
  const bMin = rangeB.min - tolerance;
  const bMax = rangeB.max + tolerance;

  const overlapStart = Math.max(aMin, bMin);
  const overlapEnd = Math.min(aMax, bMax);
  const overlap = Math.max(0, overlapEnd - overlapStart);

  if (overlap === 0) return 0;

  // Normalize by the smaller range
  const spanA = aMax - aMin;
  const spanB = bMax - bMin;
  const minSpan = Math.min(spanA, spanB);

  return minSpan === 0 ? (overlap > 0 ? 1 : 0) : Math.min(1, overlap / minSpan);
}

// ─── Date Range Overlap Score ──────────────────────────

/**
 * Computes overlap between two date ranges.
 * Returns the ratio of overlapping days to the shorter range.
 */
export function dateRangeOverlapScore(
  a: MatchFieldValue,
  b: MatchFieldValue
): number {
  const drA = extractDateRange(a);
  const drB = extractDateRange(b);

  if (!drA || !drB) return 0;

  const overlapStart = Math.max(drA.start, drB.start);
  const overlapEnd = Math.min(drA.end, drB.end);
  const overlapMs = Math.max(0, overlapEnd - overlapStart);

  if (overlapMs === 0) return 0;

  const spanA = drA.end - drA.start;
  const spanB = drB.end - drB.start;
  const minSpan = Math.min(spanA, spanB);

  return minSpan === 0 ? (overlapMs > 0 ? 1 : 0) : Math.min(1, overlapMs / minSpan);
}

// ─── Exact Match Score ─────────────────────────────────

/**
 * Returns 1 if both values are equal (case-insensitive for strings), 0 otherwise.
 */
export function exactMatchScore(a: MatchFieldValue, b: MatchFieldValue): number {
  const strA = extractString(a);
  const strB = extractString(b);

  if (strA !== null && strB !== null) {
    return strA.toLowerCase().trim() === strB.toLowerCase().trim() ? 1 : 0;
  }

  if (a.type === "number" && b.type === "number") {
    return a.value === b.value ? 1 : 0;
  }

  if (a.type === "boolean" && b.type === "boolean") {
    return a.value === b.value ? 1 : 0;
  }

  return 0;
}

// ─── Proximity Score ───────────────────────────────────

/**
 * Computes closeness between two numeric values.
 * Returns 1 when identical, declining linearly to 0 at maxDistance.
 */
export function proximityScore(
  a: MatchFieldValue,
  b: MatchFieldValue,
  maxDistance: number = 100
): number {
  const numA = extractNumber(a);
  const numB = extractNumber(b);

  if (numA === null || numB === null) return 0;
  if (maxDistance <= 0) return numA === numB ? 1 : 0;

  const distance = Math.abs(numA - numB);
  return Math.max(0, 1 - distance / maxDistance);
}

// ─── Helper: Extract typed values ──────────────────────

function extractStrings(v: MatchFieldValue): string[] {
  if (v.type === "strings") return v.value;
  if (v.type === "string") return v.value ? [v.value] : [];
  return [];
}

function extractString(v: MatchFieldValue): string | null {
  if (v.type === "string") return v.value;
  if (v.type === "strings" && v.value.length === 1) return v.value[0];
  if (v.type === "number") return String(v.value);
  return null;
}

function extractNumber(v: MatchFieldValue): number | null {
  if (v.type === "number") return v.value;
  if (v.type === "range") return (v.min + v.max) / 2;
  if (v.type === "string") {
    const n = parseFloat(v.value);
    return isNaN(n) ? null : n;
  }
  return null;
}

function extractRange(
  v: MatchFieldValue
): { min: number; max: number } | null {
  if (v.type === "range") return { min: v.min, max: v.max };
  if (v.type === "number") return { min: v.value, max: v.value };
  return null;
}

function extractDateRange(
  v: MatchFieldValue
): { start: number; end: number } | null {
  if (v.type === "dateRange") {
    const start = new Date(v.start).getTime();
    const end = new Date(v.end).getTime();
    if (isNaN(start) || isNaN(end)) return null;
    return { start, end };
  }
  return null;
}
