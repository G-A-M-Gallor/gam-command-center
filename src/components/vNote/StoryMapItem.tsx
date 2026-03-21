"use client";

import type { StoryMapStep } from "./storyMap.types";

interface Props {
  step: StoryMapStep;
  onClick?: (blockId: string) => void;
}

export function StoryMapItem({ step, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(step.blockId)}
      className={`
        flex items-center gap-2 rounded-lg px-3 py-2 text-sm
        transition-colors duration-150 cursor-pointer
        ${
          step.isDone
            ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
            : "bg-slate-700/40 text-slate-400 hover:bg-slate-700/60"
        }
      `}
      title={
        step.isDone
          ? `${step.label} — הושלם`
          : `${step.label} — ${String(step.currentValue ?? "ללא ערך")}`
      }
    >
      <span className="text-base leading-none">
        {step.isDone ? "✅" : "🔲"}
      </span>
      <span className="truncate">{step.label}</span>
    </button>
  );
}
