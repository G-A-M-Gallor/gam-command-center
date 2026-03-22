"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { StoryMapStep } from "./storyMap.types";

interface Props {
  step: StoryMapStep;
  index: number;
  onClick?: (blockId: string) => void;
}

export function StoryMapItem({ step, index, onClick }: Props) {
  const [expanded, setExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.blockId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    scale: isDragging ? "0.98" : "1",
    zIndex: isDragging ? 10 : undefined,
  };

  const statusIcon = step.isDone ? "✅" : "🔲";

  return (
    <div ref={setNodeRef} style={style} className="group flex flex-col">
      <div className="flex items-center">
        {/* Drag handle — ⠿ visible on hover only */}
        <span
          className="opacity-0 group-hover:opacity-100 p-0.5 cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 touch-none transition-opacity duration-150 select-none"
          {...attributes}
          {...listeners}
        >
          ⠿
        </span>

        <button
          type="button"
          onClick={() => {
            setExpanded(!expanded);
            onClick?.(step.blockId);
          }}
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
          <span className="text-[10px] font-mono text-slate-500 w-4 text-center">{index}</span>
          <span className="text-base leading-none">{statusIcon}</span>
          <span className="truncate">{step.label}</span>
          <ChevronDown
            className={`w-3 h-3 shrink-0 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {expanded && !isDragging && (
        <div className="mt-1 ms-6 px-3 py-2 rounded-md bg-slate-800/80 border border-slate-700/30 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-500">שדה:</span>
            <span className="text-slate-300 font-mono">{step.trackField}</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-500">ערך נוכחי:</span>
            <span className="text-slate-300">{String(step.currentValue ?? "—")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">ערך יעד:</span>
            <span className="text-emerald-400">{step.doneValue}</span>
          </div>
        </div>
      )}
    </div>
  );
}
