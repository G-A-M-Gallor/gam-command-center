import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GridSheet, GridCell, CellAddress, SelectionRange } from "./types";
import { DEFAULT_COL_WIDTH, DEFAULT_ROW_HEIGHT } from "./types";
import { createDefaultSheet, colIndexToLabel, parseCellAddress, buildCellAddress } from "./gridHelpers";
import { evaluateFormula } from "./formulaEngine";

// ─── History ────────────────────────────────────────────────

interface HistoryEntry {
  sheets: GridSheet[];
  activeSheetId: string;
}

// ─── Store Interface ────────────────────────────────────────

interface GridStore {
  sheets: GridSheet[];
  activeSheetId: string;
  activeCell: CellAddress | null;
  selection: SelectionRange | null;
  editingCell: CellAddress | null;

  // History
  past: HistoryEntry[];
  future: HistoryEntry[];

  // Sheet actions
  addSheet: () => void;
  removeSheet: (id: string) => void;
  renameSheet: (id: string, name: string) => void;
  duplicateSheet: (id: string) => void;
  setActiveSheet: (id: string) => void;

  // Cell actions
  setCellValue: (addr: CellAddress, value: string) => void;
  setCellType: (addr: CellAddress, type: GridCell["type"]) => void;
  setCellStyle: (addr: CellAddress, style: Partial<Pick<GridCell, "bold" | "italic" | "bg" | "fg">>) => void;
  clearCells: (addresses: CellAddress[]) => void;

  // Bulk style (selection)
  setRangeStyle: (style: Partial<Pick<GridCell, "bold" | "italic" | "bg" | "fg">>) => void;

  // Selection
  setActiveCell: (addr: CellAddress | null) => void;
  setSelection: (sel: SelectionRange | null) => void;
  setEditingCell: (addr: CellAddress | null) => void;

  // Column / Row actions
  addColumn: () => void;
  removeColumn: (col: string) => void;
  addRow: () => void;
  removeRow: (row: string) => void;
  setColumnWidth: (col: string, width: number) => void;
  setRowHeight: (row: string, height: number) => void;
  reorderColumns: (fromIdx: number, toIdx: number) => void;
  reorderRows: (fromIdx: number, toIdx: number) => void;
  setFrozenCols: (count: number) => void;

  // History
  undo: () => void;
  redo: () => void;

  // Helpers
  getActiveSheet: () => GridSheet;
  getCellValue: (addr: CellAddress) => string | number;
  recomputeFormulas: () => void;
}

// ─── Helper: push history ───────────────────────────────────

function pushHistory(state: GridStore): Pick<GridStore, "past" | "future"> {
  return {
    past: [...state.past.slice(-49), { sheets: JSON.parse(JSON.stringify(state.sheets)), activeSheetId: state.activeSheetId }],
    future: [],
  };
}

// ─── Store ──────────────────────────────────────────────────

const defaultSheet = createDefaultSheet("sheet-1", "Sheet 1");

export const useGridStore = create<GridStore>()(
  persist(
    (set, get) => ({
      sheets: [defaultSheet],
      activeSheetId: "sheet-1",
      activeCell: null,
      selection: null,
      editingCell: null,
      past: [],
      future: [],

      // ── Sheet actions ─────────────────────────────────────
      addSheet: () => set((s) => {
        const num = s.sheets.length + 1;
        const id = `sheet-${Date.now()}`;
        return {
          ...pushHistory(s),
          sheets: [...s.sheets, createDefaultSheet(id, `Sheet ${num}`)],
          activeSheetId: id,
        };
      }),

      removeSheet: (id) => set((s) => {
        if (s.sheets.length <= 1) return s;
        const filtered = s.sheets.filter((sh) => sh.id !== id);
        return {
          ...pushHistory(s),
          sheets: filtered,
          activeSheetId: s.activeSheetId === id ? filtered[0].id : s.activeSheetId,
        };
      }),

      renameSheet: (id, name) => set((s) => ({
        sheets: s.sheets.map((sh) => sh.id === id ? { ...sh, name } : sh),
      })),

      duplicateSheet: (id) => set((s) => {
        const src = s.sheets.find((sh) => sh.id === id);
        if (!src) return s;
        const newId = `sheet-${Date.now()}`;
        const dup: GridSheet = { ...JSON.parse(JSON.stringify(src)), id: newId, name: `${src.name} (copy)` };
        return {
          ...pushHistory(s),
          sheets: [...s.sheets, dup],
          activeSheetId: newId,
        };
      }),

      setActiveSheet: (id) => set({ activeSheetId: id }),

      // ── Cell actions ──────────────────────────────────────
      setCellValue: (addr, value) => set((s) => {
        const sheet = s.sheets.find((sh) => sh.id === s.activeSheetId);
        if (!sheet) return s;

        const hist = pushHistory(s);
        const newCells = { ...sheet.cells };

        if (!value && !newCells[addr]?.bg && !newCells[addr]?.fg && !newCells[addr]?.bold && !newCells[addr]?.italic) {
          delete newCells[addr];
        } else {
          const existing = newCells[addr] || { value: "", type: "text" as const };
          const isFormula = value.startsWith("=");
          const isNumber = !isFormula && value !== "" && !isNaN(Number(value));
          const type = isFormula ? "formula" : isNumber ? "number" : existing.type === "image" || existing.type === "url" ? existing.type : "text";

          newCells[addr] = { ...existing, value, type };

          if (isFormula) {
            const getCellValue = (a: string): string | number => {
              const c = newCells[a];
              if (!c) return 0;
              if (c.type === "formula") return c.computed ?? 0;
              const n = parseFloat(c.value);
              return isNaN(n) ? c.value : n;
            };
            newCells[addr].computed = evaluateFormula(value, getCellValue, addr);
          } else {
            delete newCells[addr].computed;
          }
        }

        return {
          ...hist,
          sheets: s.sheets.map((sh) => sh.id === s.activeSheetId ? { ...sh, cells: newCells } : sh),
        };
      }),

      setCellType: (addr, type) => set((s) => {
        const sheet = s.sheets.find((sh) => sh.id === s.activeSheetId);
        if (!sheet) return s;
        const cell = sheet.cells[addr];
        if (!cell) return s;
        return {
          sheets: s.sheets.map((sh) => sh.id === s.activeSheetId
            ? { ...sh, cells: { ...sh.cells, [addr]: { ...cell, type } } }
            : sh),
        };
      }),

      setCellStyle: (addr, style) => set((s) => {
        const sheet = s.sheets.find((sh) => sh.id === s.activeSheetId);
        if (!sheet) return s;
        const existing = sheet.cells[addr] || { value: "", type: "text" as const };
        return {
          sheets: s.sheets.map((sh) => sh.id === s.activeSheetId
            ? { ...sh, cells: { ...sh.cells, [addr]: { ...existing, ...style } } }
            : sh),
        };
      }),

      clearCells: (addresses) => set((s) => {
        const sheet = s.sheets.find((sh) => sh.id === s.activeSheetId);
        if (!sheet) return s;
        const hist = pushHistory(s);
        const newCells = { ...sheet.cells };
        addresses.forEach((a) => delete newCells[a]);
        return {
          ...hist,
          sheets: s.sheets.map((sh) => sh.id === s.activeSheetId ? { ...sh, cells: newCells } : sh),
        };
      }),

      setRangeStyle: (style) => set((s) => {
        const sheet = s.sheets.find((sh) => sh.id === s.activeSheetId);
        if (!sheet || !s.selection) return s;

        const { start, end } = s.selection;
        const sp = parseCellAddress(start);
        const ep = parseCellAddress(end);
        const startColIdx = sheet.colOrder.indexOf(sp.col);
        const endColIdx = sheet.colOrder.indexOf(ep.col);
        const startRowIdx = sheet.rowOrder.indexOf(sp.row);
        const endRowIdx = sheet.rowOrder.indexOf(ep.row);
        const minCol = Math.min(startColIdx, endColIdx);
        const maxCol = Math.max(startColIdx, endColIdx);
        const minRow = Math.min(startRowIdx, endRowIdx);
        const maxRow = Math.max(startRowIdx, endRowIdx);

        const newCells = { ...sheet.cells };
        for (let c = minCol; c <= maxCol; c++) {
          for (let r = minRow; r <= maxRow; r++) {
            const addr = buildCellAddress(sheet.colOrder[c], sheet.rowOrder[r]);
            const existing = newCells[addr] || { value: "", type: "text" as const };
            newCells[addr] = { ...existing, ...style };
          }
        }

        return {
          sheets: s.sheets.map((sh) => sh.id === s.activeSheetId ? { ...sh, cells: newCells } : sh),
        };
      }),

      // ── Selection ─────────────────────────────────────────
      setActiveCell: (addr) => set({ activeCell: addr, selection: addr ? { start: addr, end: addr } : null }),
      setSelection: (sel) => set({ selection: sel }),
      setEditingCell: (addr) => set({ editingCell: addr }),

      // ── Column / Row ──────────────────────────────────────
      addColumn: () => set((s) => {
        const sheet = s.sheets.find((sh) => sh.id === s.activeSheetId);
        if (!sheet) return s;
        const hist = pushHistory(s);
        const nextIdx = sheet.colOrder.length;
        const label = colIndexToLabel(nextIdx);
        return {
          ...hist,
          sheets: s.sheets.map((sh) => sh.id === s.activeSheetId
            ? { ...sh, colOrder: [...sh.colOrder, label], colWidths: { ...sh.colWidths, [label]: DEFAULT_COL_WIDTH } }
            : sh),
        };
      }),

      removeColumn: (col) => set((s) => {
        const sheet = s.sheets.find((sh) => sh.id === s.activeSheetId);
        if (!sheet || sheet.colOrder.length <= 1) return s;
        const hist = pushHistory(s);
        const newCells = { ...sheet.cells };
        // Remove all cells in this column
        for (const rowId of sheet.rowOrder) {
          delete newCells[buildCellAddress(col, rowId)];
        }
        const newWidths = { ...sheet.colWidths };
        delete newWidths[col];
        return {
          ...hist,
          sheets: s.sheets.map((sh) => sh.id === s.activeSheetId
            ? { ...sh, colOrder: sh.colOrder.filter((c) => c !== col), cells: newCells, colWidths: newWidths }
            : sh),
        };
      }),

      addRow: () => set((s) => {
        const sheet = s.sheets.find((sh) => sh.id === s.activeSheetId);
        if (!sheet) return s;
        const hist = pushHistory(s);
        const nextRow = String(Math.max(...sheet.rowOrder.map(Number)) + 1);
        return {
          ...hist,
          sheets: s.sheets.map((sh) => sh.id === s.activeSheetId
            ? { ...sh, rowOrder: [...sh.rowOrder, nextRow], rowHeights: { ...sh.rowHeights, [nextRow]: DEFAULT_ROW_HEIGHT } }
            : sh),
        };
      }),

      removeRow: (row) => set((s) => {
        const sheet = s.sheets.find((sh) => sh.id === s.activeSheetId);
        if (!sheet || sheet.rowOrder.length <= 1) return s;
        const hist = pushHistory(s);
        const newCells = { ...sheet.cells };
        for (const colId of sheet.colOrder) {
          delete newCells[buildCellAddress(colId, row)];
        }
        const newHeights = { ...sheet.rowHeights };
        delete newHeights[row];
        return {
          ...hist,
          sheets: s.sheets.map((sh) => sh.id === s.activeSheetId
            ? { ...sh, rowOrder: sh.rowOrder.filter((r) => r !== row), cells: newCells, rowHeights: newHeights }
            : sh),
        };
      }),

      setColumnWidth: (col, width) => set((s) => ({
        sheets: s.sheets.map((sh) => sh.id === s.activeSheetId
          ? { ...sh, colWidths: { ...sh.colWidths, [col]: Math.max(40, width) } }
          : sh),
      })),

      setRowHeight: (row, height) => set((s) => ({
        sheets: s.sheets.map((sh) => sh.id === s.activeSheetId
          ? { ...sh, rowHeights: { ...sh.rowHeights, [row]: Math.max(24, height) } }
          : sh),
      })),

      reorderColumns: (fromIdx, toIdx) => set((s) => {
        const sheet = s.sheets.find((sh) => sh.id === s.activeSheetId);
        if (!sheet) return s;
        const hist = pushHistory(s);
        const newOrder = [...sheet.colOrder];
        const [moved] = newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, moved);
        return {
          ...hist,
          sheets: s.sheets.map((sh) => sh.id === s.activeSheetId ? { ...sh, colOrder: newOrder } : sh),
        };
      }),

      reorderRows: (fromIdx, toIdx) => set((s) => {
        const sheet = s.sheets.find((sh) => sh.id === s.activeSheetId);
        if (!sheet) return s;
        const hist = pushHistory(s);
        const newOrder = [...sheet.rowOrder];
        const [moved] = newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, moved);
        return {
          ...hist,
          sheets: s.sheets.map((sh) => sh.id === s.activeSheetId ? { ...sh, rowOrder: newOrder } : sh),
        };
      }),

      setFrozenCols: (count) => set((s) => ({
        sheets: s.sheets.map((sh) => sh.id === s.activeSheetId ? { ...sh, frozenCols: count } : sh),
      })),

      // ── History ───────────────────────────────────────────
      undo: () => set((s) => {
        if (s.past.length === 0) return s;
        const prev = s.past[s.past.length - 1];
        return {
          past: s.past.slice(0, -1),
          future: [{ sheets: JSON.parse(JSON.stringify(s.sheets)), activeSheetId: s.activeSheetId }, ...s.future.slice(0, 49)],
          sheets: prev.sheets,
          activeSheetId: prev.activeSheetId,
        };
      }),

      redo: () => set((s) => {
        if (s.future.length === 0) return s;
        const next = s.future[0];
        return {
          future: s.future.slice(1),
          past: [...s.past, { sheets: JSON.parse(JSON.stringify(s.sheets)), activeSheetId: s.activeSheetId }],
          sheets: next.sheets,
          activeSheetId: next.activeSheetId,
        };
      }),

      // ── Helpers ───────────────────────────────────────────
      getActiveSheet: () => {
        const s = get();
        return s.sheets.find((sh) => sh.id === s.activeSheetId) || s.sheets[0];
      },

      getCellValue: (addr) => {
        const sheet = get().getActiveSheet();
        const cell = sheet.cells[addr];
        if (!cell) return 0;
        if (cell.type === "formula" && cell.computed != null) return cell.computed;
        const n = parseFloat(cell.value);
        return isNaN(n) ? cell.value : n;
      },

      recomputeFormulas: () => set((s) => {
        const sheet = s.sheets.find((sh) => sh.id === s.activeSheetId);
        if (!sheet) return s;
        const newCells = { ...sheet.cells };
        const getCellValue = (a: string): string | number => {
          const c = newCells[a];
          if (!c) return 0;
          if (c.type === "formula") return c.computed ?? 0;
          const n = parseFloat(c.value);
          return isNaN(n) ? c.value : n;
        };

        for (const [addr, cell] of Object.entries(newCells)) {
          if (cell.type === "formula") {
            newCells[addr] = { ...cell, computed: evaluateFormula(cell.value, getCellValue, addr) };
          }
        }

        return {
          sheets: s.sheets.map((sh) => sh.id === s.activeSheetId ? { ...sh, cells: newCells } : sh),
        };
      }),
    }),
    {
      name: "cc-grid-store",
      partialize: (state) => ({
        sheets: state.sheets,
        activeSheetId: state.activeSheetId,
      }),
    }
  )
);
