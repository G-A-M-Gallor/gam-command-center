"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { LauncherItem } from "@/lib/app-launcher/types";

interface Props {
  item: LauncherItem;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  language: "he" | "en" | "ru";
  labelOverride?: string;
}

export function AppLauncherItem({ item, isSelected, onClick, onDoubleClick, language, labelOverride }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  const Icon = item.icon;
  const label = labelOverride || item.label[language] || item.label.en;
  const isComingSoon = item.status === "coming-soon";

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`group flex flex-col items-center justify-center gap-2 rounded-2xl p-3 transition-all duration-200 cursor-pointer select-none outline-none
        ${isDragging ? "opacity-40 scale-95" : ""}
        ${isSelected
          ? "bg-purple-500/20 ring-2 ring-purple-500/40"
          : "hover:bg-white/[0.06]"
        }
        ${isComingSoon ? "opacity-40" : ""}
      `}
      style={style}
      {...listeners}
      {...attributes}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors
          ${item.type === "widget"
            ? "bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20"
            : "bg-white/[0.06] border border-white/[0.06]"
          }
          group-hover:border-white/10 group-hover:bg-white/[0.08]
        `}
      >
        <Icon className="h-6 w-6 text-slate-300 group-hover:text-white transition-colors" />
      </div>
      <span className="max-w-[88px] truncate text-center text-[11px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors leading-tight">
        {label}
      </span>
      {isComingSoon && (
        <span className="absolute -top-1 -right-1 rounded-full bg-slate-700 px-1.5 py-0.5 text-[8px] font-bold text-slate-400">
          Soon
        </span>
      )}
    </button>
  );
}
