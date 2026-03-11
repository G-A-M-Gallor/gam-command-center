// ===================================================
// Import Engine — Column Auto-Mapper
// ===================================================
// Maps parsed columns to GlobalFields using:
// 1. Exact header match on meta_key
// 2. Alias match
// 3. Fuzzy match on label (he/en/ru)
// 4. Type match as fallback

import type { GlobalField } from '@/lib/entities/types';
import type { ParsedColumn, ColumnMapping, DetectedFieldType } from './types';

// ─── Type Detection ──────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\+]?[\d\s\-\(\)]{7,20}$/;
const URL_RE = /^https?:\/\/.+/i;
const BOOLEAN_VALUES = new Set(['true', 'false', 'yes', 'no', 'כן', 'לא', '1', '0', 'да', 'нет']);
const DATE_PATTERNS = [
  /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/,                    // 2024-01-15
  /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/,                   // 15/01/2024 or 15-01-24
  /^\d{1,2}\s+\w+\s+\d{4}$/,                           // 15 January 2024
  /^\w+\s+\d{1,2},?\s+\d{4}$/,                         // January 15, 2024
];

/**
 * Detect the most likely type from an array of sample values.
 */
export function detectColumnType(values: string[]): DetectedFieldType {
  if (values.length === 0) return 'text';

  const nonEmpty = values.filter(v => v.trim() !== '');
  if (nonEmpty.length === 0) return 'text';

  // Check each type — use majority vote (>= 70% match)
  const threshold = Math.max(1, Math.floor(nonEmpty.length * 0.7));

  // Email
  if (nonEmpty.filter(v => EMAIL_RE.test(v)).length >= threshold) return 'email';

  // URL
  if (nonEmpty.filter(v => URL_RE.test(v)).length >= threshold) return 'url';

  // Boolean
  if (nonEmpty.filter(v => BOOLEAN_VALUES.has(v.toLowerCase())).length >= threshold) return 'boolean';

  // Phone (check before number since phones can look numeric)
  if (nonEmpty.filter(v => PHONE_RE.test(v) && !isPlainNumber(v)).length >= threshold) return 'phone';

  // Date
  if (nonEmpty.filter(v => isDateLike(v)).length >= threshold) return 'date';

  // Number
  if (nonEmpty.filter(v => isPlainNumber(v)).length >= threshold) return 'number';

  return 'text';
}

function isPlainNumber(v: string): boolean {
  const cleaned = v.replace(/[,\s]/g, '');
  return /^-?\d+(\.\d+)?$/.test(cleaned);
}

function isDateLike(v: string): boolean {
  // Try native parse first
  const d = new Date(v);
  if (!isNaN(d.getTime()) && v.length > 4) return true;
  // Try regex patterns
  return DATE_PATTERNS.some(p => p.test(v.trim()));
}

// ─── Column Auto-Mapping ─────────────────────────────

/**
 * Auto-map parsed columns to GlobalFields.
 * Matching strategy (highest confidence first):
 * 1. Exact meta_key match (confidence = 1.0)
 * 2. Alias match (confidence = 0.9)
 * 3. Fuzzy label match (confidence = 0.7)
 * 4. Type-based match (confidence = 0.5)
 */
export function autoMapColumns(
  columns: ParsedColumn[],
  fields: GlobalField[],
): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const usedFields = new Set<string>();

  for (const col of columns) {
    const headerLower = col.header.toLowerCase().trim();
    let bestMatch: { field: GlobalField; confidence: number } | null = null;

    // Strategy 1: Exact meta_key match
    for (const field of fields) {
      if (usedFields.has(field.meta_key)) continue;
      if (field.meta_key.toLowerCase() === headerLower) {
        bestMatch = { field, confidence: 1.0 };
        break;
      }
    }

    // Strategy 2: Alias match
    if (!bestMatch) {
      for (const field of fields) {
        if (usedFields.has(field.meta_key)) continue;
        const aliases = field.aliases.map(a => a.toLowerCase());
        if (aliases.includes(headerLower)) {
          bestMatch = { field, confidence: 0.9 };
          break;
        }
      }
    }

    // Strategy 3: Fuzzy label match (check all i18n labels)
    if (!bestMatch) {
      for (const field of fields) {
        if (usedFields.has(field.meta_key)) continue;
        const labels = [
          field.label.he?.toLowerCase(),
          field.label.en?.toLowerCase(),
          field.label.ru?.toLowerCase(),
          field.client_display_name?.he?.toLowerCase(),
          field.client_display_name?.en?.toLowerCase(),
          field.client_display_name?.ru?.toLowerCase(),
        ].filter(Boolean);

        // Exact label match
        if (labels.includes(headerLower)) {
          bestMatch = { field, confidence: 0.8 };
          break;
        }

        // Contains match
        const fuzzyMatch = labels.some(l =>
          l && (l.includes(headerLower) || headerLower.includes(l)) && headerLower.length > 2
        );
        if (fuzzyMatch && (!bestMatch || bestMatch.confidence < 0.7)) {
          bestMatch = { field, confidence: 0.7 };
        }
      }
    }

    // Strategy 4: Type-based match (weakest)
    if (!bestMatch) {
      const typeMap: Record<DetectedFieldType, string[]> = {
        email: ['email'],
        phone: ['phone'],
        date: ['date', 'datetime'],
        number: ['number', 'currency', 'rating'],
        url: ['url'],
        boolean: ['checkbox'],
        text: [], // don't auto-map text — too generic
      };

      const matchingFieldTypes = typeMap[col.detectedType] ?? [];
      if (matchingFieldTypes.length > 0) {
        for (const field of fields) {
          if (usedFields.has(field.meta_key)) continue;
          if (matchingFieldTypes.includes(field.field_type)) {
            bestMatch = { field, confidence: 0.5 };
            break;
          }
        }
      }
    }

    if (bestMatch) {
      usedFields.add(bestMatch.field.meta_key);
      mappings.push({
        sourceIndex: col.index,
        sourceHeader: col.header,
        targetField: bestMatch.field.meta_key,
        confidence: bestMatch.confidence,
        autoDetected: true,
      });
    }
  }

  return mappings;
}
