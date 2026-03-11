"use client";

import { useCallback, useRef, useEffect } from "react";
import { useGridStore } from "@/lib/grid/gridStore";
import { DEFAULT_ROW_HEIGHT, DEFAULT_COL_WIDTH } from "@/lib/grid/types";
import { buildCellAddress, parseCellAddress, colIndexToLabel, copyCellsToClipboard } from "@/lib/grid/gridHelpers";
import { GridCellComponent } from "./GridCell";
import { GridColumnHeader } from "./GridColumnHeader";
import { GridRowHeader } from "./GridRowHeader";

const ROW_HEADER_WIDTH = 40;

export function GridCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  const sheet = useGridStore((s) => s.sheets.find((sh) => sh.id === s.activeSheetId) || s.sheets[0]);
  const activeCell = useGridStore((s) => s.activeCell);
  const selection = useGridStore((s) => s.selection);
  const editingCell = useGridStore((s) => s.editingCell);

  const setActiveCell = useGridStore((s) => s.setActiveCell);
  const setSelection = useGridStore((s) => s.setSelection);
  const setEditingCell = useGridStore((s) => s.setEditingCell);
  const setCellValue = useGridStore((s) => s.setCellValue);
  const clearCells = useGridStore((s) => s.clearCells);
  const setColumnWidth = useGridStore((s) => s.setColumnWidth);
  const undo = useGridStore((s) => s.undo);
  const redo = useGridStore((s) => s.redo);
  const recomputeFormulas = useGridStore((s) => s.recomputeFormulas);

  // Check if a cell is within the current selection
  const isCellSelected = useCallback(
    (addr: string) => {
      if (!selection) return false;
      const sp = parseCellAddress(selection.start);
      const ep = parseCellAddress(selection.end);
      const cp = parseCellAddress(addr);
      const colOrder = sheet.colOrder;
      const rowOrder = sheet.rowOrder;
      const sc = colOrder.indexOf(sp.col);
      const ec = colOrder.indexOf(ep.col);
      const sr = rowOrder.indexOf(sp.row);
      const er = rowOrder.indexOf(ep.row);
      const cc = colOrder.indexOf(cp.col);
      const cr = rowOrder.indexOf(cp.row);
      return (
        cc >= Math.min(sc, ec) && cc <= Math.max(sc, ec) &&
        cr >= Math.min(sr, er) && cr <= Math.max(sr, er)
      );
    },
    [selection, sheet.colOrder, sheet.rowOrder]
  );

  const handleSelect = useCallback(
    (addr: string, shift?: boolean) => {
      if (shift && activeCell) {
        setSelection({ start: activeCell, end: addr });
      } else {
        setActiveCell(addr);
      }
    },
    [activeCell, setActiveCell, setSelection]
  );

  const handleStartEdit = useCallback(
    (addr: string) => {
      setEditingCell(addr);
    },
    [setEditingCell]
  );

  const handleEndEdit = useCallback(
    (addr: string, value: string) => {
      setCellValue(addr, value);
      setEditingCell(null);
      recomputeFormulas();
    },
    [setCellValue, setEditingCell, recomputeFormulas]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingCell(null);
  }, [setEditingCell]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept if editing
      if (editingCell) return;
      // Don't intercept if typing in an input/textarea outside the grid
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const { colOrder, rowOrder } = sheet;

      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "c" && activeCell && selection) {
        e.preventDefault();
        const text = copyCellsToClipboard(sheet, selection.start, selection.end);
        navigator.clipboard.writeText(text);
        return;
      }

      if (!activeCell) return;
      const { col, row } = parseCellAddress(activeCell);
      const colIdx = colOrder.indexOf(col);
      const rowIdx = rowOrder.indexOf(row);

      let nextCol = colIdx;
      let nextRow = rowIdx;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          nextRow = Math.max(0, rowIdx - 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          nextRow = Math.min(rowOrder.length - 1, rowIdx + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          nextCol = Math.max(0, colIdx - 1);
          break;
        case "ArrowRight":
        case "Tab":
          e.preventDefault();
          nextCol = Math.min(colOrder.length - 1, colIdx + 1);
          break;
        case "Enter":
          e.preventDefault();
          setEditingCell(activeCell);
          return;
        case "F2":
          e.preventDefault();
          setEditingCell(activeCell);
          return;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          if (selection) {
            // Get all cells in selection
            const sp = parseCellAddress(selection.start);
            const ep = parseCellAddress(selection.end);
            const sc = colOrder.indexOf(sp.col);
            const ec = colOrder.indexOf(ep.col);
            const sr = rowOrder.indexOf(sp.row);
            const er = rowOrder.indexOf(ep.row);
            const addresses: string[] = [];
            for (let c = Math.min(sc, ec); c <= Math.max(sc, ec); c++) {
              for (let r = Math.min(sr, er); r <= Math.max(sr, er); r++) {
                addresses.push(buildCellAddress(colOrder[c], rowOrder[r]));
              }
            }
            clearCells(addresses);
          }
          return;
        default:
          // Start editing on any printable character
          if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            setCellValue(activeCell, "");
            setEditingCell(activeCell);
          }
          return;
      }

      const newAddr = buildCellAddress(colOrder[nextCol], rowOrder[nextRow]);
      if (e.shiftKey) {
        setSelection({ start: activeCell, end: newAddr });
      } else {
        setActiveCell(newAddr);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeCell, editingCell, selection, sheet, setActiveCell, setSelection, setEditingCell, setCellValue, clearCells, undo, redo, recomputeFormulas]);

  // Compute frozen column positions
  const frozenColPositions: number[] = [];
  let frozenOffset = ROW_HEADER_WIDTH;
  for (let i = 0; i < sheet.frozenCols && i < sheet.colOrder.length; i++) {
    frozenColPositions.push(frozenOffset);
    frozenOffset += sheet.colWidths[sheet.colOrder[i]] || DEFAULT_COL_WIDTH;
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-slate-900"
      style={{ position: "relative" }}
    >
      <div style={{ display: "inline-flex", flexDirection: "column", minWidth: "100%" }}>
        {/* Column Headers */}
        <div className="sticky top-0 z-30 flex">
          {/* Top-left corner cell */}
          <div
            className="sticky left-0 z-40 border-b border-r border-slate-600/50 bg-slate-800/90"
            style={{ width: ROW_HEADER_WIDTH, minWidth: ROW_HEADER_WIDTH, height: DEFAULT_ROW_HEIGHT }}
          />
          {sheet.colOrder.map((col, idx) => {
            const isFrozen = idx < sheet.frozenCols;
            return (
              <GridColumnHeader
                key={col}
                label={col}
                width={sheet.colWidths[col] || DEFAULT_COL_WIDTH}
                isFrozen={isFrozen}
                left={isFrozen ? frozenColPositions[idx] : undefined}
                onResize={setColumnWidth}
              />
            );
          })}
        </div>

        {/* Data Rows */}
        {sheet.rowOrder.map((rowId) => (
          <div key={rowId} className="flex">
            <GridRowHeader rowNum={rowId} />
            {sheet.colOrder.map((col, colIdx) => {
              const addr = buildCellAddress(col, rowId);
              const isFrozen = colIdx < sheet.frozenCols;
              const cell = sheet.cells[addr];

              return (
                <div
                  key={addr}
                  className={isFrozen ? "sticky z-10" : ""}
                  style={
                    isFrozen
                      ? { left: frozenColPositions[colIdx], position: "sticky", zIndex: 10 }
                      : undefined
                  }
                >
                  <GridCellComponent
                    addr={addr}
                    cell={cell}
                    width={sheet.colWidths[col] || DEFAULT_COL_WIDTH}
                    isActive={activeCell === addr}
                    isEditing={editingCell === addr}
                    isSelected={isCellSelected(addr)}
                    onSelect={handleSelect}
                    onStartEdit={handleStartEdit}
                    onEndEdit={handleEndEdit}
                    onCancelEdit={handleCancelEdit}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
