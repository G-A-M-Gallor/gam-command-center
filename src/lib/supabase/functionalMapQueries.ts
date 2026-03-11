import { createClient } from './client';

// ─── Sub-types ─────────────────────────────────────────

export interface FuncMapItem {
  id: string;
  text: string;
  text_he: string;
  done: boolean;
}

export interface FuncMapKpi {
  id: string;
  label: string;
  label_he: string;
  value: number;
  target: number;
  unit: string;
}

export interface FuncMapLink {
  id: string;
  label: string;
  url: string;
}

// ─── Cell ──────────────────────────────────────────────

export interface FunctionalMapCell {
  id: string;
  level: 'strategy' | 'management' | 'operations';
  func: 'sales' | 'delivery' | 'finance' | 'hr' | 'technology';
  owner: string;
  tools: string[];
  status: 'active' | 'partial' | 'planned';
  description: string;
  description_he: string;
  items: FuncMapItem[];
  notes: string;
  notes_he: string;
  kpis: FuncMapKpi[];
  links: FuncMapLink[];
  updated_at: string;
}

// ─── Queries ───────────────────────────────────────────

export async function getFunctionalMapCells(): Promise<FunctionalMapCell[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('functional_map_cells')
    .select('*')
    .order('id');

  if (error) throw error;
  return (data ?? []) as FunctionalMapCell[];
}

export async function updateFunctionalMapCell(
  id: string,
  updates: Partial<Pick<FunctionalMapCell,
    'owner' | 'tools' | 'status' | 'description' | 'description_he' |
    'items' | 'notes' | 'notes_he' | 'kpis' | 'links'
  >>
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('functional_map_cells')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as FunctionalMapCell;
}
