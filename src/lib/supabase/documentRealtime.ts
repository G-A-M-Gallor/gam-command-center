import { supabase } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface DocumentPayload {
  id: string;
  title: string;
  content: unknown;
  status: string | null;
  record_type: string;
  last_edited_at: string;
}

export interface DocumentRealtimeHandlers {
  onInsert: (doc: DocumentPayload) => void;
  onUpdate: (doc: DocumentPayload) => void;
  onDelete: (id: string) => void;
}

/**
 * Subscribe to realtime changes on vb_records (documents only).
 * Requires: vb_records added to supabase_realtime publication (migration 20260323).
 */
export function subscribeToDocuments(
  handlers: DocumentRealtimeHandlers
): RealtimeChannel {
  const channel = supabase
    .channel("documents-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "vb_records",
        filter: "record_type=eq.document",
      },
      (payload) => {
        handlers.onInsert(payload.new as DocumentPayload);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "vb_records",
        filter: "record_type=eq.document",
      },
      (payload) => {
        handlers.onUpdate(payload.new as DocumentPayload);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "vb_records",
      },
      (payload) => {
        handlers.onDelete((payload.old as { id: string }).id);
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribeFromDocuments(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}

/**
 * Subscribe to realtime changes on projects.
 * Useful for Layers page auto-refresh after Origami sync.
 */
export function subscribeToProjects(
  onUpdate: (project: Record<string, unknown>) => void
): RealtimeChannel {
  const channel = supabase
    .channel("projects-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "projects",
      },
      (payload) => {
        if (payload.eventType === "DELETE") return;
        onUpdate(payload.new as Record<string, unknown>);
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribeFromProjects(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
