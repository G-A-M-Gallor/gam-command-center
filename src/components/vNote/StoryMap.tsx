"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { supabase } from "@/lib/supabaseClient";
import { useStoryMap } from "./useStoryMap";
import { StoryMapItem } from "./StoryMapItem";
import type { LayoutBlock, StoryMapStep } from "./storyMap.types";

interface Props {
  contextId?: string;
  blocks?: LayoutBlock[];
  onStepClick?: (blockId: string) => void;
}

function progressGradient(pct: number): string {
  if (pct < 30) return "linear-gradient(90deg, #ef4444, #f87171)";
  if (pct < 70) return "linear-gradient(90deg, #f59e0b, #fbbf24)";
  return "linear-gradient(90deg, #10b981, #6ee7b7)";
}

function progressTextColor(pct: number): string {
  if (pct < 30) return "text-red-400";
  if (pct < 70) return "text-amber-400";
  return "text-emerald-400";
}

async function persistBlockOrder(
  contextId: string,
  orderedBlockIds: string[],
  allBlocks: LayoutBlock[],
) {
  // Re-sort the full blocks array to match the new step order
  const blockMap = new Map(allBlocks.map((b) => [b.blockId, b]));
  const storyBlockIds = new Set(orderedBlockIds);
  // Keep non-story blocks in place, reorder story blocks
  const nonStoryBlocks = allBlocks.filter((b) => !storyBlockIds.has(b.blockId));
  const reorderedStory = orderedBlockIds
    .map((id) => blockMap.get(id))
    .filter((b): b is LayoutBlock => !!b);
  const reorderedBlocks = [...reorderedStory, ...nonStoryBlocks];

  await supabase
    .from("vblock_layouts")
    .update({ blocks: reorderedBlocks })
    .eq("context_type", "vnote")
    .eq("context_id", contextId);
}

export function StoryMap({ contextId, blocks, onStepClick }: Props) {
  const { steps: rawSteps, doneCount, totalCount, progress, isLoading, hasSteps } =
    useStoryMap(contextId, blocks);

  const [orderedSteps, setOrderedSteps] = useState<StoryMapStep[] | null>(null);
  const steps = orderedSteps ?? rawSteps;

  // Reset local order when raw data changes
  const [prevRaw, setPrevRaw] = useState(rawSteps);
  if (rawSteps !== prevRaw) {
    setPrevRaw(rawSteps);
    setOrderedSteps(null);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = steps.findIndex((s) => s.blockId === active.id);
      const newIndex = steps.findIndex((s) => s.blockId === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(steps, oldIndex, newIndex);
      setOrderedSteps(reordered);

      // Persist to Supabase
      if (contextId && blocks) {
        persistBlockOrder(
          contextId,
          reordered.map((s) => s.blockId),
          blocks,
        );
      }
    },
    [steps, contextId, blocks],
  );

  if (!isLoading && !hasSteps) return null;

  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 animate-pulse">
        <div className="h-4 w-40 rounded bg-slate-700 mb-3" />
        <div className="h-2 w-full rounded-full bg-slate-700 mb-3" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 w-28 rounded-lg bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-slate-200">Story Map</h2>
        <span className={`text-xs font-medium ${progressTextColor(progress)}`}>
          {doneCount}/{totalCount} — {progress}%
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-slate-700 mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: progressGradient(progress),
          }}
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={steps.map((s) => s.blockId)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex flex-wrap gap-2">
            {steps.map((step, idx) => (
              <StoryMapItem
                key={step.blockId}
                step={step}
                index={idx + 1}
                onClick={onStepClick}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
