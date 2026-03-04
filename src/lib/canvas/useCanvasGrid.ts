// ===================================================
// useCanvasGrid — Grid positioning + overlap logic
// ===================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import type { FieldPlacement, GridPosition, GridRect } from './types';
import { DEFAULT_COLUMNS, DEFAULT_CELL_SIZE, MIN_ROWS } from './types';

interface UseCanvasGridOptions {
  cellSize?: number;
  columns?: number;
  placements: FieldPlacement[];
  editorZone?: GridRect;
}

export function useCanvasGrid({
  cellSize = DEFAULT_CELL_SIZE,
  columns = DEFAULT_COLUMNS,
  placements,
  editorZone,
}: UseCanvasGridOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Observe container resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Compute visible columns/rows from container size
  const visibleColumns = Math.max(columns, Math.floor(containerSize.width / cellSize));
  const visibleRows = Math.max(
    MIN_ROWS,
    Math.ceil(containerSize.height / cellSize) + 2
  );

  // 2D overlap check
  const isOverlapping = useCallback(
    (
      col: number,
      row: number,
      colSpan: number,
      rowSpan: number,
      excludeId?: string
    ): boolean => {
      // Check editor zone
      if (editorZone) {
        const noOverlap =
          col + colSpan <= editorZone.col ||
          editorZone.col + editorZone.col_span <= col ||
          row + rowSpan <= editorZone.row ||
          editorZone.row + editorZone.row_span <= row;
        if (!noOverlap) return true;
      }

      // Check other placements
      for (const p of placements) {
        if (p.id === excludeId || p.is_deleted) continue;
        const noOverlap =
          col + colSpan <= p.grid_col ||
          p.grid_col + p.col_span <= col ||
          row + rowSpan <= p.grid_row ||
          p.grid_row + p.row_span <= row;
        if (!noOverlap) return true;
      }

      return false;
    },
    [placements, editorZone]
  );

  // Find next available cell for a new placement
  const findNextAvailableCell = useCallback(
    (colSpan: number = 1, rowSpan: number = 1): GridPosition => {
      for (let row = 0; row < visibleRows; row++) {
        for (let col = 0; col <= visibleColumns - colSpan; col++) {
          if (!isOverlapping(col, row, colSpan, rowSpan)) {
            return { col, row };
          }
        }
      }
      // Fallback: place below everything
      return { col: 0, row: visibleRows };
    },
    [visibleColumns, visibleRows, isOverlapping]
  );

  // Convert pixel coords to grid cell
  const cellFromPixel = useCallback(
    (clientX: number, clientY: number): GridPosition => {
      const el = containerRef.current;
      if (!el) return { col: 0, row: 0 };

      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left + el.scrollLeft;
      const y = clientY - rect.top + el.scrollTop;

      return {
        col: Math.max(0, Math.floor(x / cellSize)),
        row: Math.max(0, Math.floor(y / cellSize)),
      };
    },
    [cellSize]
  );

  // Check bounds
  const isInBounds = useCallback(
    (col: number, row: number, colSpan: number, rowSpan: number): boolean => {
      return col >= 0 && row >= 0 && col + colSpan <= visibleColumns;
    },
    [visibleColumns]
  );

  return {
    containerRef,
    containerSize,
    visibleColumns,
    visibleRows,
    isOverlapping,
    findNextAvailableCell,
    cellFromPixel,
    isInBounds,
  };
}
