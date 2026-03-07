import { supabase } from "@/lib/supabaseClient";
import type { FunctionalMapCell } from "./functionalMapQueries";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface FunctionalMapRealtimeHandlers {
  onUpdate: (cell: FunctionalMapCell) => void;
}

export function subscribeFunctionalMap(
  handlers: FunctionalMapRealtimeHandlers
): RealtimeChannel {
  const channel = supabase
    .channel("functional-map-cells")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "functional_map_cells",
      },
      (payload) => {
        handlers.onUpdate(payload.new as FunctionalMapCell);
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribeFromFunctionalMap(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
