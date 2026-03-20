"use client";

import { useDroppable } from "@dnd-kit/core";
import type { LauncherFolder, LauncherItem } from "@/lib/app-launcher/types";

interface Props {
  folder: LauncherFolder;
  items: LauncherItem[];
  isSelected: boolean;
  isExpanded: boolean;
  onClick: () => void;
  language: "he" | "en" | "ru";
}

export function AppLauncherFolder({ folder, items, isSelected, isExpanded, onClick, language }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: folder.id,
    data: { folder },
  });

  const label = folder.label[language] || folder.label.en;
  const previewItems = items.slice(0, 4);

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-center justify-center gap-2 rounded-2xl p-3 transition-all duration-200 cursor-pointer select-none outline-none
        ${isSelected ? "bg-purple-500/20 ring-2 ring-purple-500/40" : "hover:bg-white/[0.06]"}
        ${isOver ? "ring-2 ring-blue-400/50 bg-blue-500/10" : ""}
      `}
    >
      <div
        className="flex h-14 w-14 flex-wrap items-center justify-center gap-0.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1.5 transition-colors group-hover:border-white/10"
        style={{ borderColor: isExpanded ? folder.color + "40" : undefined }}
      >
        {previewItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="flex h-5 w-5 items-center justify-center">
              <Icon className="h-3.5 w-3.5 text-slate-400" />
            </div>
          );
        })}
        {items.length > 4 && (
          <span className="text-[8px] text-slate-500">+{items.length - 4}</span>
        )}
      </div>
      <span className="max-w-[88px] truncate text-center text-[11px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors leading-tight">
        {label}
      </span>
    </button>
  );
}

/** Expanded folder overlay */
export function FolderOverlay({
  folder,
  items,
  onClose,
  onItemClick,
  language,
}: {
  folder: LauncherFolder;
  items: LauncherItem[];
  onClose: () => void;
  onItemClick: (itemId: string) => void;
  language: "he" | "en" | "ru";
}) {
  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        aria-label="Close folder"
      />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-80 rounded-2xl border border-white/[0.08] bg-slate-900 p-6 shadow-2xl">
        <h3 className="mb-4 text-sm font-semibold text-slate-200">{folder.label[language]}</h3>
        <div className="grid grid-cols-3 gap-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onItemClick(item.id)}
                className="flex flex-col items-center gap-1.5 rounded-xl p-2 hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                  <Icon className="h-5 w-5 text-slate-300" />
                </div>
                <span className="max-w-[72px] truncate text-[10px] text-slate-400">
                  {item.label[language] || item.label.en}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
