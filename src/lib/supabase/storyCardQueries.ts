import { supabase } from '@/lib/supabaseClient';
import { fetchNoteInfoBatch } from './entityQueries';

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

export interface StoryCardEntityLink {
  id: string;
  story_card_id: string;
  entity_note_id: string;
  created_at: string;
}

export interface EnrichedEntityLink extends StoryCardEntityLink {
  entity_title: string;
  entity_type: string | null;
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

// ─── Entity Links — Batch fetch for all cards in a project ───
export async function fetchEntityLinksForCards(
  cardIds: string[]
): Promise<Record<string, EnrichedEntityLink[]>> {
  if (cardIds.length === 0) return {};
  try {
    const { data, error } = await supabase
      .from('story_card_entity_links')
      .select('*')
      .in('story_card_id', cardIds);

    if (error || !data || data.length === 0) return {};

    const noteIds = [...new Set(data.map((l: StoryCardEntityLink) => l.entity_note_id))];
    const noteInfo = await fetchNoteInfoBatch(noteIds);

    const map: Record<string, EnrichedEntityLink[]> = {};
    for (const link of data as StoryCardEntityLink[]) {
      const info = noteInfo[link.entity_note_id];
      const enriched: EnrichedEntityLink = {
        ...link,
        entity_title: info?.title ?? '?',
        entity_type: info?.entity_type ?? null,
      };
      if (!map[link.story_card_id]) map[link.story_card_id] = [];
      map[link.story_card_id].push(enriched);
    }
    return map;
  } catch {
    return {};
  }
}

// ─── Entity Links — Link an entity to a card ────────────────
export async function linkEntityToCard(
  storyCardId: string,
  entityNoteId: string
): Promise<StoryCardEntityLink | null> {
  try {
    const { data, error } = await supabase
      .from('story_card_entity_links')
      .insert({ story_card_id: storyCardId, entity_note_id: entityNoteId })
      .select()
      .single();
    if (error || !data) return null;
    return data as StoryCardEntityLink;
  } catch {
    return null;
  }
}

// ─── Entity Links — Unlink an entity from a card ────────────
export async function unlinkEntityFromCard(linkId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('story_card_entity_links')
      .delete()
      .eq('id', linkId);
    return !error;
  } catch {
    return false;
  }
}

// ─── Entity Links — Reverse lookup: cards for an entity ─────
export async function fetchStoryCardsForEntity(
  entityNoteId: string
): Promise<{ storyCardId: string; cardText: string; projectId: string; projectName: string }[]> {
  try {
    const { data, error } = await supabase
      .from('story_card_entity_links')
      .select('story_card_id')
      .eq('entity_note_id', entityNoteId);

    if (error || !data || data.length === 0) return [];

    const cardIds = data.map((l: { story_card_id: string }) => l.story_card_id);
    const { data: cards, error: cardsErr } = await supabase
      .from('story_cards')
      .select('id, text, project_id')
      .in('id', cardIds);

    if (cardsErr || !cards) return [];

    const projectIds = [...new Set(cards.map((c: { project_id: string }) => c.project_id))];
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .in('id', projectIds);

    const projMap: Record<string, string> = {};
    for (const p of (projects ?? []) as { id: string; name: string }[]) {
      projMap[p.id] = p.name;
    }

    return (cards as { id: string; text: string; project_id: string }[]).map((c) => ({
      storyCardId: c.id,
      cardText: c.text,
      projectId: c.project_id,
      projectName: projMap[c.project_id] ?? '?',
    }));
  } catch {
    return [];
  }
}
