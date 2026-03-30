// ===================================================
// Canvas Grid — Type Definitions & Constants
// ===================================================

import type { FieldTypeId } from '@/components/command-center/fields/fieldTypes';

// ─── Constants ───────────────────────────────────────
export const DEFAULT_COLUMNS = 12;
export const DEFAULT_CELL_SIZE = 80;
export const MIN_CELL_SIZE = 40;
export const MAX_CELL_SIZE = 160;
export const MIN_ROWS = 8;

export const DEFAULT_EDITOR_ZONE = {
  col: 0,
  row: 0,
  col_span: 12,
  row_span: 50,
};

// ─── Grid Position ───────────────────────────────────
export interface GridPosition {
  col: number;
  row: number;
}

export interface GridRect extends GridPosition {
  col_span: number;
  row_span: number;
}

// ─── Canvas Layout (per document) ────────────────────
export type EditorDirection = 'rtl' | 'ltr';

export interface CanvasLayout {
  document_id: string;
  grid_columns: number;
  grid_rows: number;
  cell_size: number;
  editor_zone: GridRect;
  show_grid: boolean;
  snap_to_grid: boolean;
  zoom: number;
  direction: EditorDirection;
  updated_at?: string;
}

// ─── Field Placement ─────────────────────────────────
export interface FieldPlacement {
  id: string;
  document_id: string;
  field_definition_id: string;

  // Grid position
  grid_col: number;
  grid_row: number;
  col_span: number;
  row_span: number;

  // Zone
  zone: 'canvas' | 'editor';

  // Rich metadata
  placed_by: string | null;
  placed_at: string;
  last_moved_at: string | null;
  last_moved_by: string | null;
  sort_order: number;

  // Per-placement display overrides
  display_config: Record<string, unknown>;

  is_deleted: boolean;
  created_at: string;
  updated_at: string;

  // Denormalized from field_definitions (populated on read)
  field_type?: FieldTypeId;
  label?: string;
  config?: Record<string, unknown>;
}

// ─── Canvas State (for context) ──────────────────────
export interface CanvasState {
  layout: CanvasLayout;
  placements: FieldPlacement[];
  selectedPlacementId: string | null;
  isDragging: boolean;
  dragOverCell: GridPosition | null;
}

// ─── Default Layout Factory ──────────────────────────
export function createDefaultLayout(documentId: string): CanvasLayout {
  return {
    document_id: documentId,
    grid_columns: DEFAULT_COLUMNS,
    grid_rows: MIN_ROWS,
    cell_size: DEFAULT_CELL_SIZE,
    editor_zone: { ...DEFAULT_EDITOR_ZONE },
    show_grid: true,
    snap_to_grid: true,
    zoom: 1.0,
    direction: 'rtl' as EditorDirection,
  };
}
