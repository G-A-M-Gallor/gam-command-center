import { supabase } from "@/lib/supabaseClient";
import type { PlanPhase } from "./planQueries";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface PlanRealtimeHandlers {
  onUpdate: (phase: PlanPhase) => void;
}

export function subscribeToPlanPhases(
  handlers: PlanRealtimeHandlers
): RealtimeChannel {
  const channel = supabase
    .channel("plan-phases")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "plan_phases",
      },
      (payload) => {
        handlers.onUpdate(payload.new as PlanPhase);
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribeFromPlanPhases(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
