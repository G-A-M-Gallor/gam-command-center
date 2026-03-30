// ===================================================
// Import Engine — File Parser (CSV + Excel)
// ===================================================

import * as ExcelJS from 'exceljs';
import type { ParseResult, ParsedColumn, DetectedFieldType } from './types';
import { detectColumnType } from './mapper';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 5000;
const SAMPLE_SIZE = 10;

// ─── CSV Parser ──────────────────────────────────────

/**
 * Parse a CSV buffer into rows of string arrays.
 * Handles quoted fields and embedded commas/newlines.
 */
export function parseCSV(buffer: Buffer, fileName: string): ParseResult {
  const text = buffer.toString('utf-8');
  const rows = parseCSVText(text);

  if (rows.length === 0) {
    throw new Error('File is empty or contains no parseable data');
  }

  const header = rows[0];
  const dataRows = rows.slice(1, MAX_ROWS + 1);

  const columns = buildColumns(header, dataRows);

  return {
    columns,
    rows: dataRows,
    totalRows: dataRows.length,
    fileName,
    fileSize: buffer.length,
  };
}

/** Simple CSV text parser that handles quoted fields */
function parseCSVText(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        row.push(current.trim());
        current = '';
        if (row.some(cell => cell !== '')) {
          rows.push(row);
        }
        row = [];
        if (ch === '\r') i++; // skip \n after \r
      } else {
        current += ch;
      }
    }
  }

  // Handle last row if file doesn't end with newline
  if (current !== '' || row.length > 0) {
    row.push(current.trim());
    if (row.some(cell => cell !== '')) {
      rows.push(row);
    }
  }

  return rows;
}

// ─── Excel Parser ────────────────────────────────────

/**
 * Parse an Excel buffer (XLSX/XLS) into rows of string arrays.
 * Only reads the first sheet.
 */
export async function parseXLSX(buffer: Buffer, fileName: string): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const firstWorksheet = workbook.worksheets[0];
  if (!firstWorksheet) {
    throw new Error('Excel file contains no sheets');
  }

  const rawRows: string[][] = [];
  firstWorksheet.eachRow((row, rowNumber) => {
    const rowValues: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      rowValues.push(cell.text || '');
    });
    rawRows.push(rowValues);
  });

  if (rawRows.length === 0) {
    throw new Error('Sheet is empty or contains no data');
  }

  // Ensure all cells are strings
  const rows = rawRows.map(row =>
    row.map(cell => (cell != null ? String(cell).trim() : ''))
  );

  const header = rows[0];
  const dataRows = rows.slice(1, MAX_ROWS + 1);

  const columns = buildColumns(header, dataRows);

  return {
    columns,
    rows: dataRows,
    totalRows: dataRows.length,
    fileName,
    fileSize: buffer.length,
  };
}

// ─── Unified Parser ──────────────────────────────────

/**
 * Auto-detect file type and parse.
 * Supports .csv, .xlsx, .xls
 */
export async function parseFile(buffer: Buffer, fileName: string, mimeType: string): Promise<ParseResult> {
  // Validate file size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File exceeds maximum size of 5MB (got ${(buffer.length / 1024 / 1024).toFixed(1)}MB)`);
  }

  const ext = fileName.toLowerCase().split('.').pop();
  const isExcel =
    ext === 'xlsx' || ext === 'xls' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel';

  if (isExcel) {
    return await parseXLSX(buffer, fileName);
  }

  const isCSV =
    ext === 'csv' ||
    mimeType === 'text/csv' ||
    mimeType === 'application/csv';

  if (isCSV) {
    return parseCSV(buffer, fileName);
  }

  throw new Error(`Unsupported file type: ${ext || mimeType}. Supported formats: CSV, XLSX, XLS`);
}

// ─── Helpers ─────────────────────────────────────────

/**
 * Build ParsedColumn array from header and data rows.
 * Samples the first N non-empty values per column for type detection.
 */
function buildColumns(header: string[], dataRows: string[][]): ParsedColumn[] {
  return header.map((h, index) => {
    const sampleValues: string[] = [];
    for (let r = 0; r < Math.min(dataRows.length, SAMPLE_SIZE); r++) {
      const val = dataRows[r]?.[index];
      if (val && val.trim() !== '') {
        sampleValues.push(val.trim());
      }
    }

    const detectedType: DetectedFieldType = sampleValues.length > 0
      ? detectColumnType(sampleValues)
      : 'text';

    return {
      index,
      header: h || `Column ${index + 1}`,
      sampleValues,
      detectedType,
    };
  });
}
