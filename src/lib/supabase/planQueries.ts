import { _createClient } from './client';

export interface PlanPhase {
  phase: number;
  status: 'complete' | 'in-progress' | 'planned';
  notes: string;
  notes_he: string;
  updated_at: string;
}

export async function getPlanPhases(): Promise<PlanPhase[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('plan_phases')
    .select('*')
    .order('phase');

  if (error) throw error;
  return (data ?? []) as PlanPhase[];
}

export async function updatePlanPhase(
  phase: number,
  updates: Partial<Pick<PlanPhase, 'status' | 'notes' | 'notes_he'>>
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('plan_phases')
    .update(updates)
    .eq('phase', phase)
    .select()
    .single();

  if (error) throw error;
  return data as PlanPhase;
}
