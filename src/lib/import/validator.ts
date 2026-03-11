// ===================================================
// Import Engine — Row Validator
// ===================================================

import type { GlobalField } from '@/lib/entities/types';
import type { ColumnMapping, ValidationError, ImportRow } from './types';

// ─── Validation Patterns ─────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\+]?[\d\s\-\(\)]{7,20}$/;
const URL_RE = /^https?:\/\/.+/i;

// ─── Per-Row Validation ──────────────────────────────

/**
 * Validate a single row against the field definitions and mappings.
 * Returns an array of validation errors (empty = valid).
 */
export function validateRow(
  row: Record<string, string>,
  mappings: ColumnMapping[],
  fields: GlobalField[],
): ValidationError[] {
  const errors: ValidationError[] = [];
  const fieldMap = new Map(fields.map(f => [f.meta_key, f]));

  for (const mapping of mappings) {
    const field = fieldMap.get(mapping.targetField);
    if (!field) continue;

    const value = row[mapping.targetField];
    const trimmed = (value ?? '').trim();

    // Required check
    if (field.validation?.required && !trimmed) {
      errors.push({
        row: 0, // will be set by caller
        column: mapping.targetField,
        message: `Required field "${field.label.en || mapping.targetField}" is empty`,
        value: value ?? '',
      });
      continue;
    }

    // Skip validation if empty and not required
    if (!trimmed) continue;

    // Type-specific validation
    switch (field.field_type) {
      case 'email':
        if (!EMAIL_RE.test(trimmed)) {
          errors.push({
            row: 0,
            column: mapping.targetField,
            message: `Invalid email format: "${trimmed}"`,
            value: trimmed,
          });
        }
        break;

      case 'phone':
        if (!PHONE_RE.test(trimmed)) {
          errors.push({
            row: 0,
            column: mapping.targetField,
            message: `Invalid phone format: "${trimmed}"`,
            value: trimmed,
          });
        }
        break;

      case 'url':
        if (!URL_RE.test(trimmed)) {
          errors.push({
            row: 0,
            column: mapping.targetField,
            message: `Invalid URL format: "${trimmed}"`,
            value: trimmed,
          });
        }
        break;

      case 'number':
      case 'currency':
      case 'rating': {
        const cleaned = trimmed.replace(/[,\s]/g, '');
        if (isNaN(Number(cleaned))) {
          errors.push({
            row: 0,
            column: mapping.targetField,
            message: `Expected a number but got: "${trimmed}"`,
            value: trimmed,
          });
        } else {
          // Min/max validation
          const num = Number(cleaned);
          if (field.validation?.min != null && num < field.validation.min) {
            errors.push({
              row: 0,
              column: mapping.targetField,
              message: `Value ${num} is below minimum ${field.validation.min}`,
              value: trimmed,
            });
          }
          if (field.validation?.max != null && num > field.validation.max) {
            errors.push({
              row: 0,
              column: mapping.targetField,
              message: `Value ${num} exceeds maximum ${field.validation.max}`,
              value: trimmed,
            });
          }
        }
        break;
      }

      case 'date':
      case 'datetime': {
        const d = new Date(trimmed);
        if (isNaN(d.getTime())) {
          errors.push({
            row: 0,
            column: mapping.targetField,
            message: `Invalid date format: "${trimmed}"`,
            value: trimmed,
          });
        }
        break;
      }

      case 'select': {
        if (field.options.length > 0) {
          const validValues = field.options.map(o => o.value.toLowerCase());
          if (!validValues.includes(trimmed.toLowerCase())) {
            errors.push({
              row: 0,
              column: mapping.targetField,
              message: `Value "${trimmed}" is not a valid option. Valid: ${field.options.map(o => o.value).join(', ')}`,
              value: trimmed,
            });
          }
        }
        break;
      }

      case 'checkbox': {
        const boolValues = ['true', 'false', 'yes', 'no', '1', '0', 'כן', 'לא', 'да', 'нет'];
        if (!boolValues.includes(trimmed.toLowerCase())) {
          errors.push({
            row: 0,
            column: mapping.targetField,
            message: `Expected a boolean value but got: "${trimmed}"`,
            value: trimmed,
          });
        }
        break;
      }

      default:
        // Text fields — check max length if set
        if (field.validation?.max && trimmed.length > field.validation.max) {
          errors.push({
            row: 0,
            column: mapping.targetField,
            message: `Text exceeds maximum length of ${field.validation.max} characters`,
            value: trimmed,
          });
        }
        break;
    }
  }

  return errors;
}

// ─── Batch Validation ────────────────────────────────

/**
 * Validate all rows and separate into valid/invalid.
 * Returns error rate for threshold checking.
 */
export function validateImport(rows: ImportRow[]): {
  valid: ImportRow[];
  invalid: ImportRow[];
  errorRate: number;
} {
  const valid: ImportRow[] = [];
  const invalid: ImportRow[] = [];

  for (const row of rows) {
    if (row.valid && row.errors.length === 0) {
      valid.push(row);
    } else {
      invalid.push(row);
    }
  }

  const total = rows.length;
  const errorRate = total > 0 ? invalid.length / total : 0;

  return { valid, invalid, errorRate };
}

// ─── Build Import Rows ───────────────────────────────

/**
 * Convert raw string rows into ImportRow objects with validation.
 */
export function buildImportRows(
  rawRows: string[][],
  mappings: ColumnMapping[],
  fields: GlobalField[],
): ImportRow[] {
  return rawRows.map((row, rowIndex) => {
    // Map source columns to target fields
    const data: Record<string, string> = {};
    for (const mapping of mappings) {
      const value = row[mapping.sourceIndex] ?? '';
      data[mapping.targetField] = value.trim();
    }

    // Validate
    const errors = validateRow(data, mappings, fields);
    // Set row index on each error
    for (const err of errors) {
      err.row = rowIndex;
    }

    return {
      rowIndex,
      data,
      errors,
      valid: errors.length === 0,
    };
  });
}
