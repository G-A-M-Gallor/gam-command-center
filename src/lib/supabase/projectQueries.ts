import { _createClient } from './client';
import type { Project } from './schema';

export type { Project };

export async function fetchProjects(): Promise<Project[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'active')
    .order('updated_at', { ascending: false });

  if (error || !data) return [];
  return data as Project[];
}

export async function fetchProjectById(id: string): Promise<Project | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Project;
}
