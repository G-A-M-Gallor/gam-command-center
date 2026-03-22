"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

// ── Types ────────────────────────────────────────────────

export interface RecentItem {
  id: string;
  record_id: string;
  entity_type: string;
  title: string;
  route: string;
  icon: string;
  visited_at: string;
}

// ── Fetch ────────────────────────────────────────────────

async function fetchRecentItems(): Promise<RecentItem[]> {
  const { data, error } = await supabase
    .from("user_recent_items")
    .select("*")
    .order("visited_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return (data ?? []) as RecentItem[];
}

// ── Hook ─────────────────────────────────────────────────

export function useRecentItems() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["recent-items"],
    queryFn: fetchRecentItems,
    staleTime: 60_000, // 1 minute
  });

  return {
    recentItems: data ?? [],
    isLoading,
    error: error as Error | null,
  };
}

// ── Track visit ──────────────────────────────────────────

export async function trackRecentItem(params: {
  record_id: string;
  entity_type: string;
  title: string;
  route: string;
  icon: string;
}) {
  const { error } = await supabase.from("user_recent_items").upsert(
    {
      record_id: params.record_id,
      entity_type: params.entity_type,
      title: params.title,
      route: params.route,
      icon: params.icon,
      visited_at: new Date().toISOString(),
    },
    { onConflict: "user_id,route" },
  );

  if (error) {
    console.warn("[trackRecentItem] failed:", error.message);
  }
}

// ── Delete ───────────────────────────────────────────────

export async function deleteRecentItem(id: string) {
  const { error } = await supabase
    .from("user_recent_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.warn("[deleteRecentItem] failed:", error.message);
  }
}
