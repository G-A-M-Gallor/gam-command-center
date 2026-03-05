'use client';

import { forwardRef, type ReactNode } from 'react';
import type { GridPosition } from '@/lib/canvas/types';

interface CanvasGridProps {
  columns: number;
  rows: number;
  cellSize: number;
  showGrid: boolean;
  zoom: number;
  dragOverCell: GridPosition | null;
  isDragValid: boolean;
  children: ReactNode;
  onClick?: () => void;
}

export const CanvasGrid = forwardRef<HTMLDivElement, CanvasGridProps>(
  function CanvasGrid(
    { columns, rows, cellSize, showGrid, zoom, dragOverCell, isDragValid, children, onClick },
    ref
  ) {
    const gridWidth = columns * cellSize;
    const gridHeight = Math.max(rows * cellSize, 600);

    return (
      <div
        ref={ref}
        className="relative flex-1 overflow-auto"
        onClick={onClick}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top right',
        }}
      >
        <div
          className="relative"
          style={{
            width: gridWidth,
            minHeight: gridHeight,
            // Dot grid pattern
            backgroundImage: showGrid
              ? `radial-gradient(circle, rgba(148, 163, 184, 0.15) 1px, transparent 1px)`
              : 'none',
            backgroundSize: showGrid ? `${cellSize}px ${cellSize}px` : undefined,
          }}
        >
          {/* Drop target highlight */}
          {dragOverCell && (
            <div
              className={`pointer-events-none absolute rounded-md border-2 transition-all ${
                isDragValid
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : 'border-red-500/50 bg-red-500/10'
              }`}
              style={{
                left: dragOverCell.col * cellSize,
                top: dragOverCell.row * cellSize,
                width: cellSize - 4,
                height: cellSize - 4,
              }}
            />
          )}

          {children}
        </div>
      </div>
    );
  }
);
