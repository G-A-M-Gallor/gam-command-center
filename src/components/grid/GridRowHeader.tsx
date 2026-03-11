"use client";

import { DEFAULT_ROW_HEIGHT } from "@/lib/grid/types";

interface GridRowHeaderProps {
  rowNum: string;
}

export function GridRowHeader({ rowNum }: GridRowHeaderProps) {
  return (
    <div
      className="sticky left-0 z-10 flex items-center justify-center border-b border-r border-slate-600/50 bg-slate-800/80 text-[10px] font-medium text-slate-500 select-none"
      style={{ width: 40, minWidth: 40, height: DEFAULT_ROW_HEIGHT }}
    >
      {rowNum}
    </div>
  );
}
