"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { LayoutBlock, StoryMapStep } from "./storyMap.types";

// ── Fetch blocks from vblock_layouts ────────────────────────────

async function fetchLayoutBlocks(contextId: string): Promise<LayoutBlock[]> {
  const { data, error } = await supabase
    .from("vblock_layouts")
    .select("blocks")
    .eq("context_id", contextId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.blocks as LayoutBlock[]) ?? [];
}

// ── Fetch entity field values in batch ──────────────────────────

async function fetchEntityValues(
  entityIds: string[],
  trackFields: string[],
): Promise<Map<string, Record<string, unknown>>> {
  if (entityIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("vb_records")
    .select("id, meta, status")
    .in("id", entityIds)
    .eq("is_deleted", false);

  if (error) throw error;

  const map = new Map<string, Record<string, unknown>>();
  for (const row of data ?? []) {
    const merged: Record<string, unknown> = {
      ...(row.meta as Record<string, unknown>),
      status: row.status,
    };
    map.set(row.id, merged);
  }
  return map;
}

// ── Hook ────────────────────────────────────────────────────────

export function useStoryMap(
  contextId?: string,
  externalBlocks?: LayoutBlock[],
) {
  // 1. Fetch layout blocks from Supabase (skip if external blocks provided)
  const {
    data: layoutBlocks,
    isLoading: isLoadingLayout,
  } = useQuery({
    queryKey: ["vblock-layout-blocks", contextId],
    queryFn: () => fetchLayoutBlocks(contextId!),
    enabled: !!contextId && !externalBlocks,
    staleTime: 30_000,
  });

  const blocks = externalBlocks ?? layoutBlocks ?? [];

  // 2. Filter blocks that have storyMapConfig
  const storyBlocks = useMemo(
    () => blocks.filter((b) => b.storyMapConfig),
    [blocks],
  );

  // 3. Collect entity IDs for batch fetch
  const entityIds = useMemo(
    () =>
      storyBlocks
        .map((b) => b.entityId)
        .filter((id): id is string => !!id),
    [storyBlocks],
  );

  const trackFields = useMemo(
    () => storyBlocks.map((b) => b.storyMapConfig!.trackField),
    [storyBlocks],
  );

  // 4. Batch-fetch entity data
  const {
    data: entityMap,
    isLoading: isLoadingEntities,
  } = useQuery({
    queryKey: ["story-map-entities", entityIds.join(",")],
    queryFn: () => fetchEntityValues(entityIds, trackFields),
    enabled: entityIds.length > 0,
    staleTime: 15_000,
  });

  // 5. Build steps
  const steps: StoryMapStep[] = useMemo(() => {
    return storyBlocks.map((block) => {
      const cfg = block.storyMapConfig!;
      const entityData = block.entityId
        ? entityMap?.get(block.entityId)
        : undefined;
      const currentValue =
        entityData?.[cfg.trackField] ?? cfg.staticValue ?? undefined;
      const isDone = currentValue != null && String(currentValue) === cfg.doneValue;

      return {
        blockId: block.blockId,
        label: cfg.label,
        trackField: cfg.trackField,
        doneValue: cfg.doneValue,
        currentValue,
        isDone,
      };
    });
  }, [storyBlocks, entityMap]);

  const doneCount = steps.filter((s) => s.isDone).length;
  const totalCount = steps.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return {
    steps,
    doneCount,
    totalCount,
    progress,
    isLoading: isLoadingLayout || isLoadingEntities,
    hasSteps: totalCount > 0,
  };
}
