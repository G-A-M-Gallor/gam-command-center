"use client";

import { useCallback, useRef } from "react";
import type { VBlockSize } from "./vBlock.types";

type Direction = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const CURSORS: Record<Direction, string> = {
  n: "cursor-n-resize",
  s: "cursor-s-resize",
  e: "cursor-e-resize",
  w: "cursor-w-resize",
  ne: "cursor-ne-resize",
  nw: "cursor-nw-resize",
  se: "cursor-se-resize",
  sw: "cursor-sw-resize",
};

interface Props {
  onResize: (size: VBlockSize) => void;
  onResizeStart: () => void;
  onResizeEnd: () => void;
  minSize: VBlockSize;
  maxSize: VBlockSize;
  currentSize: VBlockSize;
}

export function VBlockResize({
  onResize,
  onResizeStart,
  onResizeEnd,
  minSize,
  maxSize,
  currentSize,
}: Props) {
  const startRef = useRef<{
    x: number;
    y: number;
    w: number;
    h: number;
    dir: Direction;
  } | null>(null);

  const handlePointerDown = useCallback(
    (dir: Direction) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      startRef.current = {
        x: e.clientX,
        y: e.clientY,
        w: currentSize.width,
        h: currentSize.height,
        dir,
      };
      onResizeStart();

      const handleMove = (me: PointerEvent) => {
        if (!startRef.current) return;
        const { x, y, w, h, dir: d } = startRef.current;
        const dx = me.clientX - x;
        const dy = me.clientY - y;

        let newW = w;
        let newH = h;

        if (d.includes("e")) newW = w + dx;
        if (d.includes("w")) newW = w - dx;
        if (d.includes("s")) newH = h + dy;
        if (d.includes("n")) newH = h - dy;

        newW = Math.max(minSize.width, Math.min(maxSize.width, newW));
        newH = Math.max(minSize.height, Math.min(maxSize.height, newH));

        onResize({ width: newW, height: newH });
      };

      const handleUp = () => {
        startRef.current = null;
        onResizeEnd();
        document.removeEventListener("pointermove", handleMove);
        document.removeEventListener("pointerup", handleUp);
      };

      document.addEventListener("pointermove", handleMove);
      document.addEventListener("pointerup", handleUp);
    },
    [currentSize, minSize, maxSize, onResize, onResizeStart, onResizeEnd],
  );

  const HANDLE_SIZE = 6;
  const CORNER_SIZE = 10;

  const handles: { dir: Direction; style: React.CSSProperties }[] = [
    // edges
    { dir: "n", style: { top: 0, left: CORNER_SIZE, right: CORNER_SIZE, height: HANDLE_SIZE } },
    { dir: "s", style: { bottom: 0, left: CORNER_SIZE, right: CORNER_SIZE, height: HANDLE_SIZE } },
    { dir: "e", style: { top: CORNER_SIZE, right: 0, bottom: CORNER_SIZE, width: HANDLE_SIZE } },
    { dir: "w", style: { top: CORNER_SIZE, left: 0, bottom: CORNER_SIZE, width: HANDLE_SIZE } },
    // corners
    { dir: "nw", style: { top: 0, left: 0, width: CORNER_SIZE, height: CORNER_SIZE } },
    { dir: "ne", style: { top: 0, right: 0, width: CORNER_SIZE, height: CORNER_SIZE } },
    { dir: "sw", style: { bottom: 0, left: 0, width: CORNER_SIZE, height: CORNER_SIZE } },
    { dir: "se", style: { bottom: 0, right: 0, width: CORNER_SIZE, height: CORNER_SIZE } },
  ];

  return (
    <>
      {handles.map(({ dir, style }) => (
        <div
          key={dir}
          className={`absolute ${CURSORS[dir]} z-10`}
          style={style}
          onPointerDown={handlePointerDown(dir)}
        />
      ))}
    </>
  );
}
