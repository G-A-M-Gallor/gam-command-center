// ===================================================
// Matching Engine — Profile Extraction
// ===================================================
// Extracts a MatchProfile from a NoteRecord, converting raw entity
// meta fields into structured MatchFieldValue objects.

import type { NoteRecord, EntityType, GlobalField } from "@/lib/entities/types";
import type { MatchProfile, MatchFieldValue } from "./types";

// ─── Main Extraction ───────────────────────────────────

/**
 * Extracts a MatchProfile from a note record based on its entity type.
 * Combines entity meta fields into semantic text and structured match fields.
 */
export function extractMatchProfile(
  note: NoteRecord,
  entityType: EntityType,
  fields: GlobalField[]
): MatchProfile {
  const meta = note.meta || {};
  const slug = entityType.slug;

  // Build a field lookup for the entity type's field_refs
  const fieldMap = new Map<string, GlobalField>();
  for (const ref of entityType.field_refs) {
    const gf = fields.find((f) => f.meta_key === ref || f.id === ref);
    if (gf) fieldMap.set(gf.meta_key, gf);
  }

  // Extract structured fields
  const matchFields: Record<string, MatchFieldValue> = {};

  for (const [metaKey, gf] of fieldMap) {
    const raw = meta[metaKey];
    if (raw === undefined || raw === null || raw === "") continue;

    const extracted = extractFieldValue(gf, raw);
    if (extracted) {
      matchFields[metaKey] = extracted;
    }
  }

  // Apply entity-type-specific extraction strategies
  applyTypeSpecificExtraction(slug, meta, matchFields);

  // Build semantic text from title + all string-like meta values
  const semanticParts: string[] = [note.title];
  if (meta.description) semanticParts.push(String(meta.description));
  if (meta.notes) semanticParts.push(String(meta.notes));
  if (meta.summary) semanticParts.push(String(meta.summary));

  // Add all string/multi-select values to semantic text
  for (const [key, val] of Object.entries(matchFields)) {
    if (val.type === "string" && val.value) {
      semanticParts.push(`${key}: ${val.value}`);
    } else if (val.type === "strings" && val.value.length > 0) {
      semanticParts.push(`${key}: ${val.value.join(", ")}`);
    }
  }

  return {
    id: note.id,
    entityType: slug,
    title: note.title,
    semanticText: semanticParts.filter(Boolean).join(". "),
    fields: matchFields,
    lastModified: note.last_edited_at || note.created_at,
  };
}

// ─── Field Value Extraction ────────────────────────────

function extractFieldValue(
  gf: GlobalField,
  raw: unknown
): MatchFieldValue | null {
  switch (gf.field_type) {
    case "text":
    case "email":
    case "phone":
    case "url":
    case "rich_text":
      return typeof raw === "string" ? { type: "string", value: raw } : null;

    case "number":
    case "currency":
    case "rating":
      return typeof raw === "number"
        ? { type: "number", value: raw }
        : typeof raw === "string" && !isNaN(parseFloat(raw))
          ? { type: "number", value: parseFloat(raw) }
          : null;

    case "select":
      return typeof raw === "string" ? { type: "string", value: raw } : null;

    case "multi-select":
      return Array.isArray(raw)
        ? { type: "strings", value: raw.filter((v): v is string => typeof v === "string") }
        : typeof raw === "string"
          ? { type: "strings", value: raw.split(",").map((s) => s.trim()).filter(Boolean) }
          : null;

    case "date":
    case "datetime":
      return typeof raw === "string" ? { type: "string", value: raw } : null;

    case "checkbox":
      return { type: "boolean", value: Boolean(raw) };

    default:
      // For composite or unknown types, try string extraction
      return typeof raw === "string" ? { type: "string", value: raw } : null;
  }
}

// ─── Entity-Type-Specific Strategies ───────────────────

/**
 * Adds computed match fields specific to certain entity types.
 * These handle domain-specific logic like budget ranges, skill aggregation, etc.
 */
function applyTypeSpecificExtraction(
  slug: string,
  meta: Record<string, unknown>,
  fields: Record<string, MatchFieldValue>
): void {
  switch (slug) {
    case "lead":
      extractLeadFields(meta, fields);
      break;
    case "contractor":
      extractContractorFields(meta, fields);
      break;
    case "worker":
    case "talent":
      extractWorkerFields(meta, fields);
      break;
    case "project":
      extractProjectFields(meta, fields);
      break;
  }
}

function extractLeadFields(
  meta: Record<string, unknown>,
  fields: Record<string, MatchFieldValue>
): void {
  // Budget as range
  if (meta.budget_min !== undefined && meta.budget_max !== undefined) {
    fields.budget = {
      type: "range",
      min: Number(meta.budget_min) || 0,
      max: Number(meta.budget_max) || Number(meta.budget_min) || 0,
    };
  } else if (meta.budget !== undefined) {
    const b = Number(meta.budget) || 0;
    fields.budget = { type: "range", min: b * 0.8, max: b * 1.2 };
  }

  // Timeline as date range
  if (meta.start_date && meta.end_date) {
    fields.timeline = {
      type: "dateRange",
      start: String(meta.start_date),
      end: String(meta.end_date),
    };
  }

  // Aggregate skills from various sources
  const skills = collectMultiSelect(meta, [
    "required_skills",
    "skills",
    "services_needed",
  ]);
  if (skills.length > 0) {
    fields.required_skills = { type: "strings", value: skills };
  }

  // Service area
  const areas = collectMultiSelect(meta, ["service_area", "area", "location", "region"]);
  if (areas.length > 0) {
    fields.service_area = { type: "strings", value: areas };
  }
}

function extractContractorFields(
  meta: Record<string, unknown>,
  fields: Record<string, MatchFieldValue>
): void {
  // Classification categories
  const cats = collectMultiSelect(meta, [
    "classification_category",
    "categories",
    "specializations",
  ]);
  if (cats.length > 0) {
    fields.classification_category = { type: "strings", value: cats };
  }

  // Service area
  const areas = collectMultiSelect(meta, ["service_area", "area", "regions"]);
  if (areas.length > 0) {
    fields.service_area = { type: "strings", value: areas };
  }

  // Capacity (number of workers or project size)
  if (meta.capacity !== undefined) {
    fields.capacity = { type: "number", value: Number(meta.capacity) || 0 };
  }

  // License expiry as date range (valid from now to expiry)
  if (meta.license_expiry_date) {
    fields.license_expiry = {
      type: "dateRange",
      start: new Date().toISOString(),
      end: String(meta.license_expiry_date),
    };
  }
}

function extractWorkerFields(
  meta: Record<string, unknown>,
  fields: Record<string, MatchFieldValue>
): void {
  // Skills
  const skills = collectMultiSelect(meta, ["skills", "certifications", "trades"]);
  if (skills.length > 0) {
    fields.skills = { type: "strings", value: skills };
  }

  // Experience
  if (meta.experience_years !== undefined) {
    fields.experience_years = {
      type: "number",
      value: Number(meta.experience_years) || 0,
    };
  }

  // Location
  const locations = collectMultiSelect(meta, ["location", "preferred_areas", "city"]);
  if (locations.length > 0) {
    fields.location = { type: "strings", value: locations };
  }

  // Availability
  if (meta.available_from && meta.available_to) {
    fields.availability = {
      type: "dateRange",
      start: String(meta.available_from),
      end: String(meta.available_to),
    };
  }
}

function extractProjectFields(
  meta: Record<string, unknown>,
  fields: Record<string, MatchFieldValue>
): void {
  // Requirements/skills needed
  const reqs = collectMultiSelect(meta, [
    "required_skills",
    "requirements",
    "required_classifications",
  ]);
  if (reqs.length > 0) {
    fields.required_skills = { type: "strings", value: reqs };
    fields.required_classifications = { type: "strings", value: reqs };
  }

  // Budget
  if (meta.budget_min !== undefined && meta.budget_max !== undefined) {
    fields.budget = {
      type: "range",
      min: Number(meta.budget_min) || 0,
      max: Number(meta.budget_max) || 0,
    };
  } else if (meta.budget !== undefined) {
    const b = Number(meta.budget) || 0;
    fields.budget = { type: "range", min: b * 0.8, max: b * 1.2 };
  }

  // Timeline
  if (meta.start_date && meta.end_date) {
    fields.timeline = {
      type: "dateRange",
      start: String(meta.start_date),
      end: String(meta.end_date),
    };
  }

  // Location
  const locations = collectMultiSelect(meta, ["location", "area", "site_location"]);
  if (locations.length > 0) {
    fields.location = { type: "strings", value: locations };
  }

  // Project size
  if (meta.project_size !== undefined) {
    fields.project_size = { type: "number", value: Number(meta.project_size) || 0 };
  }

  // Min experience
  if (meta.min_experience !== undefined) {
    fields.min_experience = { type: "number", value: Number(meta.min_experience) || 0 };
  }
}

// ─── Helpers ───────────────────────────────────────────

/** Collect multi-select values from multiple possible meta keys */
function collectMultiSelect(
  meta: Record<string, unknown>,
  keys: string[]
): string[] {
  const result: Set<string> = new Set();
  for (const key of keys) {
    const raw = meta[key];
    if (Array.isArray(raw)) {
      for (const v of raw) {
        if (typeof v === "string" && v.trim()) result.add(v.trim());
      }
    } else if (typeof raw === "string" && raw.trim()) {
      for (const part of raw.split(",")) {
        if (part.trim()) result.add(part.trim());
      }
    }
  }
  return [...result];
}
