import { createClient } from './client';

export interface FunctionalMapCell {
  id: string;
  level: 'strategy' | 'management' | 'operations';
  func: 'sales' | 'delivery' | 'finance' | 'hr' | 'technology';
  owner: string;
  tools: string[];
  status: 'active' | 'partial' | 'planned';
  description: string;
  description_he: string;
  updated_at: string;
}

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
  updates: Partial<Pick<FunctionalMapCell, 'owner' | 'tools' | 'status' | 'description' | 'description_he'>>
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('functional_map_cells')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as FunctionalMapCell;
}
