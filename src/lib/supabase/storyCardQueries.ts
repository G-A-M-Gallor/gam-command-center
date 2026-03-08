import { supabase } from '@/lib/supabaseClient';

// ─── Types ────────────────────────────────────────────
export interface SubStory {
  id: string;
  text: string;
  done: boolean;
}

export interface StoryCard {
  id: string;
  project_id: string;
  col: number;
  row: number;
  text: string;
  type: 'epic' | 'feature' | 'story';
  color: string | null;
  subs: SubStory[];
  sort_order: number;
  notes: string;
  diagram: string;
  estimation: string | null;
  note_id: string | null;
  created_at: string;
}

// ─── Fetch all cards for a project ────────────────────
export async function fetchStoryCards(projectId: string): Promise<StoryCard[]> {
  try {
    const { data, error } = await supabase
      .from('story_cards')
      .select('*')
      .eq('project_id', projectId)
      .order('col', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error || !data) return [];
    return data as StoryCard[];
  } catch {
    return [];
  }
}

// ─── Create a card ────────────────────────────────────
export async function createStoryCard(
  card: Omit<StoryCard, 'id' | 'created_at' | 'notes' | 'diagram' | 'estimation' | 'note_id'> & { notes?: string; diagram?: string; estimation?: string | null; note_id?: string | null }
): Promise<StoryCard | null> {
  try {
    const { data, error } = await supabase
      .from('story_cards')
      .insert(card)
      .select()
      .single();

    if (error || !data) return null;
    return data as StoryCard;
  } catch {
    return null;
  }
}

// ─── Update a card ────────────────────────────────────
export async function updateStoryCard(
  id: string,
  updates: Partial<Pick<StoryCard, 'text' | 'col' | 'row' | 'color' | 'subs' | 'sort_order' | 'notes' | 'diagram' | 'estimation' | 'note_id'>>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('story_cards')
      .update(updates)
      .eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ─── Delete a card ────────────────────────────────────
export async function deleteStoryCard(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('story_cards')
      .delete()
      .eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ─── Delete all cards in a column ─────────────────────
export async function deleteColumn(projectId: string, col: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('story_cards')
      .delete()
      .eq('project_id', projectId)
      .eq('col', col);
    return !error;
  } catch {
    return false;
  }
}

// ─── Batch update positions after drag ────────────────
export async function batchUpdatePositions(
  updates: { id: string; col: number; sort_order: number }[]
): Promise<boolean> {
  try {
    // Atomic batch update via RPC — single query instead of N
    const { error } = await supabase.rpc('batch_update_card_positions', {
      updates,
    });

    if (!error) return true;

    // Fallback: individual updates if RPC not available
    const results = await Promise.all(
      updates.map(({ id, col, sort_order }) =>
        supabase
          .from('story_cards')
          .update({ col, sort_order })
          .eq('id', id)
      )
    );
    return results.every((r) => !r.error);
  } catch {
    return false;
  }
}
