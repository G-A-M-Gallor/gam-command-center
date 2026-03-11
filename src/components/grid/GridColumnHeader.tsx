"use client";

import { useCallback, useRef } from "react";
import { DEFAULT_ROW_HEIGHT } from "@/lib/grid/types";
import { GripVertical } from "lucide-react";

interface GridColumnHeaderProps {
  label: string;
  width: number;
  isFrozen: boolean;
  left?: number;
  onResize: (col: string, width: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function GridColumnHeader({
  label,
  width,
  isFrozen,
  left,
  onResize,
}: GridColumnHeaderProps) {
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startXRef.current = e.clientX;
      startWidthRef.current = width;

      const handleMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startXRef.current;
        onResize(label, startWidthRef.current + delta);
      };
      const handleUp = () => {
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [label, width, onResize]
  );

  return (
    <div
      className={`group relative flex items-center justify-center border-b border-r border-slate-600/50 bg-slate-800/80 text-[10px] font-semibold text-slate-400 select-none ${
        isFrozen ? "sticky z-20" : ""
      }`}
      style={{
        width,
        height: DEFAULT_ROW_HEIGHT,
        minWidth: width,
        ...(isFrozen && left != null ? { left, insetInlineStart: left } : {}),
      }}
    >
      <GripVertical className="absolute left-0.5 h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 cursor-grab" />
      {label}
      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-[var(--cc-accent-500)]/40"
        onMouseDown={handleResizeStart}
      />
    </div>
  );
}
