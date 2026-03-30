import type { CellAddress, GridSheet, GridCell } from "./types";

// ─── Column Label Helpers ──────────────────────────────────

/** Convert 0-based index to column label: 0→A, 1→B, …, 25→Z, 26→AA */
export function colIndexToLabel(index: number): string {
  let label = "";
  let n = index;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

/** Convert column label to 0-based index: A→0, B→1, …, Z→25, AA→26 */
export function colLabelToIndex(label: string): number {
  let index = 0;
  for (let i = 0; i < label.length; i++) {
    index = index * 26 + (label.charCodeAt(i) - 64);
  }
  return index - 1;
}

// ─── Cell Address Parsing ───────────────────────────────────

/** Parse "A1" → { col: "A", row: "1" } */
export function parseCellAddress(addr: CellAddress): { col: string; row: string } {
  const match = addr.match(/^([A-Z]+)(\d+)$/);
  if (!match) return { col: "A", row: "1" };
  return { col: match[1], row: match[2] };
}

/** Build cell address from col label and row number */
export function buildCellAddress(col: string, row: string | number): CellAddress {
  return `${col}${row}`;
}

// ─── CSV Export ──────────────────────────────────────────────

export function sheetToCSV(sheet: GridSheet): string {
  const rows: string[][] = [];
  for (const rowId of sheet.rowOrder) {
    const row: string[] = [];
    for (const colId of sheet.colOrder) {
      const addr = buildCellAddress(colId, rowId);
      const cell = sheet.cells[addr];
      if (cell) {
        const val = cell.type === "formula" && cell.computed != null
          ? String(cell.computed)
          : cell.value;
        // Escape CSV: wrap in quotes if contains comma, quote, or newline
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          row.push(`"${val.replace(/"/g, '""')}"`);
        } else {
          row.push(val);
        }
      } else {
        row.push("");
      }
    }
    rows.push(row);
  }
  // Prepend header row with column labels
  rows.unshift(sheet.colOrder.map((c) => c));
  return rows.map((r) => r.join(",")).join("\n");
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Clipboard ─────────────────────────────────────────────

export function copyCellsToClipboard(
  sheet: GridSheet,
  start: CellAddress,
  end: CellAddress
): string {
  const s = parseCellAddress(start);
  const e = parseCellAddress(end);
  const startColIdx = sheet.colOrder.indexOf(s.col);
  const endColIdx = sheet.colOrder.indexOf(e.col);
  const startRowIdx = sheet.rowOrder.indexOf(s.row);
  const endRowIdx = sheet.rowOrder.indexOf(e.row);

  const minCol = Math.min(startColIdx, endColIdx);
  const maxCol = Math.max(startColIdx, endColIdx);
  const minRow = Math.min(startRowIdx, endRowIdx);
  const maxRow = Math.max(startRowIdx, endRowIdx);

  const lines: string[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    const cells: string[] = [];
    for (let c = minCol; c <= maxCol; c++) {
      const addr = buildCellAddress(sheet.colOrder[c], sheet.rowOrder[r]);
      const cell = sheet.cells[addr];
      cells.push(cell ? (cell.computed != null ? String(cell.computed) : cell.value) : "");
    }
    lines.push(cells.join("\_t"));
  }
  return lines.join("\n");
}

// ─── Default Sheet Factory ──────────────────────────────────

export function createDefaultSheet(id: string, name: string, cols = 10, rows = 20): GridSheet {
  const colOrder = Array.from({ length: cols }, (_, i) => colIndexToLabel(i));
  const rowOrder = Array.from({ length: rows }, (_, i) => String(i + 1));
  const colWidths: Record<string, number> = {};
  colOrder.forEach((c) => { colWidths[c] = 120; });
  const rowHeights: Record<string, number> = {};
  rowOrder.forEach((r) => { rowHeights[r] = 32; });

  return {
    id,
    name,
    cells: {},
    colOrder,
    rowOrder,
    colWidths,
    rowHeights,
    frozenCols: 1,
  };
}

/** Get display value for a cell */
export function getCellDisplayValue(cell: GridCell | undefined): string {
  if (!cell) return "";
  if (cell.type === "formula" && cell.computed != null) return String(cell.computed);
  return cell.value;
}
