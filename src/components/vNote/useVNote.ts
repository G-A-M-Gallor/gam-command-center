"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { NoteRecord } from "@/lib/entities/types";
import type { LayoutBlock } from "./storyMap.types";
import type { VNoteLayout, VNoteData } from "./vNote.types";

// ── Fetch entity ────────────────────────────────────────────────

async function fetchEntity(entityId: string): Promise<NoteRecord> {
  const { data, error } = await supabase
    .from("vb_records")
    .select("*")
    .eq("id", entityId)
    .eq("is_deleted", false)
    .single();
  if (error) throw error;
  return data as NoteRecord;
}

// ── Fetch vblock_layouts for vnote context ──────────────────────

async function fetchVNoteLayout(entityId: string): Promise<VNoteLayout | null> {
  const { data, error } = await supabase
    .from("vblock_layouts")
    .select("*")
    .eq("context_type", "vnote")
    .eq("context_id", entityId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    context_type: data.context_type,
    context_id: data.context_id,
    blocks: (data.blocks as LayoutBlock[]) ?? [],
    updated_at: data.updated_at,
  };
}

// ── Hook ────────────────────────────────────────────────────────

export function useVNote(entityId: string): VNoteData {
  const {
    data: entity,
    isLoading: isLoadingEntity,
    error: entityError,
  } = useQuery({
    queryKey: ["vnote-entity", entityId],
    queryFn: () => fetchEntity(entityId),
    staleTime: 30_000,
    enabled: !!entityId,
  });

  const {
    data: layout,
    isLoading: isLoadingLayout,
    error: layoutError,
  } = useQuery({
    queryKey: ["vnote-layout", entityId],
    queryFn: () => fetchVNoteLayout(entityId),
    staleTime: 30_000,
    enabled: !!entityId,
  });

  return {
    entity: entity ?? null,
    blocks: layout?.blocks ?? [],
    layout: layout ?? null,
    isLoading: isLoadingEntity || isLoadingLayout,
    error: (entityError ?? layoutError) as Error | null,
  };
}
