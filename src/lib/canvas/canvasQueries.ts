// ===================================================
// Canvas — Supabase CRUD for placements + layouts
// ===================================================

import { supabase } from '@/lib/supabaseClient';
import {
  type CanvasLayout,
  type FieldPlacement,
  createDefaultLayout,
} from './types';

// ─── Canvas Layout ───────────────────────────────────

export async function fetchCanvasLayout(
  documentId: string
): Promise<CanvasLayout> {
  try {
    const { data, error } = await supabase
      .from('canvas_layouts')
      .select('*')
      .eq('document_id', documentId)
      .single();

    if (error || !data) {
      return createDefaultLayout(documentId);
    }

    return {
      document_id: data.document_id,
      grid_columns: data.grid_columns,
      grid_rows: data.grid_rows,
      cell_size: data.cell_size,
      editor_zone: data.editor_zone,
      show_grid: data.show_grid,
      snap_to_grid: data.snap_to_grid,
      zoom: data.zoom,
      updated_at: data.updated_at,
    };
  } catch {
    return createDefaultLayout(documentId);
  }
}

export async function saveCanvasLayout(
  layout: CanvasLayout
): Promise<void> {
  try {
    await supabase
      .from('canvas_layouts')
      .upsert(
        {
          document_id: layout.document_id,
          grid_columns: layout.grid_columns,
          grid_rows: layout.grid_rows,
          cell_size: layout.cell_size,
          editor_zone: layout.editor_zone,
          show_grid: layout.show_grid,
          snap_to_grid: layout.snap_to_grid,
          zoom: layout.zoom,
        },
        { onConflict: 'document_id' }
      );
  } catch {
    // Table may not exist yet — silently skip
  }
}

// ─── Field Placements ────────────────────────────────

export async function fetchFieldPlacements(
  documentId: string
): Promise<FieldPlacement[]> {
  try {
    const { data, error } = await supabase
      .from('field_placements')
      .select(`
        *,
        field_definitions:field_definition_id (
          field_type,
          label,
          config
        )
      `)
      .eq('document_id', documentId)
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true });

    if (error || !data) {
      // Table may not exist yet
      return [];
    }

    return data.map((row: Record<string, unknown>) => {
      const def = row.field_definitions as Record<string, unknown> | null;
      return {
        ...row,
        field_type: def?.field_type,
        label: def?.label,
        config: def?.config,
        field_definitions: undefined,
      } as unknown as FieldPlacement;
    });
  } catch {
    return [];
  }
}

export async function createFieldPlacement(
  placement: Omit<FieldPlacement, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'field_type' | 'label' | 'config'>
): Promise<FieldPlacement | null> {
  const { data, error } = await supabase
    .from('field_placements')
    .insert({
      document_id: placement.document_id,
      field_definition_id: placement.field_definition_id,
      grid_col: placement.grid_col,
      grid_row: placement.grid_row,
      col_span: placement.col_span,
      row_span: placement.row_span,
      zone: placement.zone,
      placed_by: placement.placed_by,
      placed_at: placement.placed_at || new Date().toISOString(),
      sort_order: placement.sort_order,
      display_config: placement.display_config || {},
    })
    .select()
    .single();

  if (error || !data) {
    // Table may not exist yet — return a local-only placement
    return {
      id: crypto.randomUUID(),
      ...placement,
      is_deleted: false,
      created_at: new Date().toISOString(),
    } as unknown as FieldPlacement;
  }

  return data as unknown as FieldPlacement;
}

export async function updateFieldPlacement(
  id: string,
  patch: Partial<Pick<FieldPlacement, 'grid_col' | 'grid_row' | 'col_span' | 'row_span' | 'sort_order' | 'display_config' | 'last_moved_at' | 'last_moved_by'>>
): Promise<void> {
  try {
    await supabase
      .from('field_placements')
      .update(patch)
      .eq('id', id);
  } catch {
    // Table may not exist yet
  }
}

export async function deleteFieldPlacement(id: string): Promise<void> {
  try {
    await supabase
      .from('field_placements')
      .update({ is_deleted: true })
      .eq('id', id);
  } catch {
    // Table may not exist yet
  }
}
