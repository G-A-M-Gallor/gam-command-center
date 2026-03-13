// ===================================================
// Communication — Realtime Subscriptions
// ===================================================
// Subscribe/unsubscribe to comm_messages for live updates.
// Follows storyCardRealtime.ts pattern.

import { supabase } from "@/lib/supabaseClient";
import type { CommMessage } from "@/lib/wati/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface CommRealtimeHandlers {
  onInsert: (msg: CommMessage) => void;
  onUpdate: (msg: CommMessage) => void;
}

/**
 * Subscribe to comm_messages for a specific entity_phone.
 * Only subscribes when the panel is open — call unsubscribe when closed.
 */
export function subscribeToCommMessages(
  entityPhone: string,
  handlers: CommRealtimeHandlers,
): RealtimeChannel {
  const channel = supabase
    .channel(`comm-messages-${entityPhone}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "comm_messages",
        filter: `entity_phone=eq.${entityPhone}`,
      },
      (payload) => {
        handlers.onInsert(payload.new as CommMessage);
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "comm_messages",
        filter: `entity_phone=eq.${entityPhone}`,
      },
      (payload) => {
        handlers.onUpdate(payload.new as CommMessage);
      },
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to comm_messages by entity_id.
 */
export function subscribeToCommMessagesByEntity(
  entityId: string,
  handlers: CommRealtimeHandlers,
): RealtimeChannel {
  const channel = supabase
    .channel(`comm-messages-entity-${entityId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "comm_messages",
        filter: `entity_id=eq.${entityId}`,
      },
      (payload) => {
        handlers.onInsert(payload.new as CommMessage);
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "comm_messages",
        filter: `entity_id=eq.${entityId}`,
      },
      (payload) => {
        handlers.onUpdate(payload.new as CommMessage);
      },
    )
    .subscribe();

  return channel;
}

export function unsubscribeFromCommMessages(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
