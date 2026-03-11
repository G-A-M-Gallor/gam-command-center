// ===================================================
// Import Engine — Core TypeScript Types
// ===================================================

/** Detected field type from column analysis */
export type DetectedFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'date'
  | 'number'
  | 'url'
  | 'boolean';

/** A parsed column from a CSV/Excel file */
export interface ParsedColumn {
  /** Zero-based column index */
  index: number;
  /** Column header text */
  header: string;
  /** First N sample values (non-empty) */
  sampleValues: string[];
  /** Auto-detected type based on sample values */
  detectedType: DetectedFieldType;
}

/** Mapping from a source column to a target entity field */
export interface ColumnMapping {
  /** Source column index */
  sourceIndex: number;
  /** Source column header */
  sourceHeader: string;
  /** Target field meta_key in the entity */
  targetField: string;
  /** Confidence score: 1.0 = exact, 0.9 = alias, 0.7 = fuzzy, 0.5 = type */
  confidence: number;
  /** Whether this mapping was auto-detected */
  autoDetected: boolean;
}

/** A single validation error for a specific cell */
export interface ValidationError {
  /** Row index (0-based, relative to data rows) */
  row: number;
  /** Column header or target field name */
  column: string;
  /** Human-readable error message */
  message: string;
  /** The value that failed validation */
  value: string;
}

/** A single row being imported with its validation state */
export interface ImportRow {
  /** Row index in the original file (0-based, excluding header) */
  rowIndex: number;
  /** Mapped data: meta_key -> value */
  data: Record<string, unknown>;
  /** Validation errors for this row */
  errors: ValidationError[];
  /** Whether this row passes all validation */
  valid: boolean;
}

/** Result of a completed import operation */
export interface ImportResult {
  /** Total rows in the file */
  totalRows: number;
  /** Successfully imported rows */
  importedRows: number;
  /** Rows that failed to import */
  failedRows: number;
  /** All errors encountered */
  errors: ValidationError[];
  /** ID of the import_logs record */
  importLogId: string;
}

/** Configuration for an import operation */
export interface ImportConfig {
  /** Target entity type slug */
  entityType: string;
  /** Column-to-field mappings */
  mappings: ColumnMapping[];
  /** Whether the first row is a header (skip it) */
  skipHeader: boolean;
  /** Maximum rows to import (capped at 5000) */
  maxRows: number;
  /** If true, validate only without inserting */
  dryRun: boolean;
}

/** Result from parsing a file */
export interface ParseResult {
  /** Detected columns with types */
  columns: ParsedColumn[];
  /** All data rows (string arrays) */
  rows: string[][];
  /** Total number of data rows (excluding header) */
  totalRows: number;
  /** Original file name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
}

/** Import log status */
export type ImportLogStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** Import log record matching the Supabase table */
export interface ImportLog {
  id: string;
  file_name: string;
  file_size_bytes: number;
  entity_type: string;
  total_rows: number;
  imported_rows: number;
  failed_rows: number;
  column_mapping: Record<string, unknown>;
  errors: ValidationError[];
  status: ImportLogStatus;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
}
