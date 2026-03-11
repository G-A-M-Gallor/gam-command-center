"use client";

import { useCallback, useRef } from "react";

interface GridRowHeaderProps {
  rowNum: string;
  height: number;
  onResize: (row: string, height: number) => void;
}

export function GridRowHeader({ rowNum, height, onResize }: GridRowHeaderProps) {
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startYRef.current = e.clientY;
      startHeightRef.current = height;

      const handleMove = (ev: MouseEvent) => {
        const delta = ev.clientY - startYRef.current;
        onResize(rowNum, startHeightRef.current + delta);
      };
      const handleUp = () => {
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [rowNum, height, onResize]
  );

  return (
    <div
      className="group sticky left-0 z-10 flex items-center justify-center border-b border-r border-slate-600/50 bg-slate-800/80 text-[10px] font-medium text-slate-500 select-none"
      style={{ width: 40, minWidth: 40, height }}
    >
      {rowNum}
      {/* Resize handle */}
      <div
        className="absolute bottom-0 left-0 w-full h-1.5 cursor-row-resize hover:bg-[var(--cc-accent-500)]/40"
        onMouseDown={handleResizeStart}
      />
    </div>
  );
}
