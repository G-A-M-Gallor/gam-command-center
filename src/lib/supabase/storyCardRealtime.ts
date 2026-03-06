import { supabase } from "@/lib/supabaseClient";
import type { StoryCard } from "./storyCardQueries";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface RealtimeHandlers {
  onInsert: (card: StoryCard) => void;
  onUpdate: (card: StoryCard) => void;
  onDelete: (id: string) => void;
}

export function subscribeToStoryCards(
  projectId: string,
  handlers: RealtimeHandlers
): RealtimeChannel {
  const channel = supabase
    .channel(`story-cards-${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "story_cards",
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        handlers.onInsert(payload.new as StoryCard);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "story_cards",
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        handlers.onUpdate(payload.new as StoryCard);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "story_cards",
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        handlers.onDelete((payload.old as { id: string }).id);
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribeFromStoryCards(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
