"use client";

import { useStoryMap } from "./useStoryMap";
import { StoryMapItem } from "./StoryMapItem";
import type { LayoutBlock } from "./storyMap.types";

interface Props {
  contextId?: string;
  blocks?: LayoutBlock[];
  onStepClick?: (blockId: string) => void;
}

export function StoryMap({ contextId, blocks, onStepClick }: Props) {
  const { steps, doneCount, totalCount, progress, isLoading, hasSteps } =
    useStoryMap(contextId, blocks);

  // Hide when no blocks have storyMapConfig
  if (!isLoading && !hasSteps) return null;

  // Loading skeleton
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
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-slate-200">
          Story Map
        </h2>
        <span className="text-xs text-slate-400">
          {doneCount}/{totalCount} — {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-slate-700 mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #10b981, #6ee7b7)",
          }}
        />
      </div>

      {/* Steps */}
      <div className="flex flex-wrap gap-2">
        {steps.map((step) => (
          <StoryMapItem
            key={step.blockId}
            step={step}
            onClick={onStepClick}
          />
        ))}
      </div>
    </div>
  );
}
