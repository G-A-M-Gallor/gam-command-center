// ─── Grid / Spreadsheet Types ──────────────────────────────

/** Cell address string, e.g. "A1", "B12" */
export type CellAddress = string;

export type CellType = "text" | "number" | "formula" | "image" | "url";

export interface GridCell {
  value: string;
  type: CellType;
  /** Computed result for formula cells */
  computed?: string | number;
  bold?: boolean;
  italic?: boolean;
  /** Background color (hex) */
  bg?: string;
  /** Text color (hex) */
  fg?: string;
}

export interface GridSheet {
  id: string;
  name: string;
  /** Sparse cell map — only occupied cells stored */
  cells: Record<CellAddress, GridCell>;
  /** Column order for DnD reorder */
  colOrder: string[];
  /** Row order for DnD reorder */
  rowOrder: string[];
  /** Column widths in px */
  colWidths: Record<string, number>;
  /** Number of frozen columns from the start */
  frozenCols: number;
}

export interface SelectionRange {
  start: CellAddress;
  end: CellAddress;
}

export interface GridState {
  sheets: GridSheet[];
  activeSheetId: string;
  /** Currently selected cell */
  activeCell: CellAddress | null;
  /** Selection range (for multi-select) */
  selection: SelectionRange | null;
  /** Cell being edited */
  editingCell: CellAddress | null;
}

export const DEFAULT_COL_WIDTH = 120;
export const DEFAULT_ROW_HEIGHT = 32;
export const DEFAULT_COLS = 10;
export const DEFAULT_ROWS = 20;
