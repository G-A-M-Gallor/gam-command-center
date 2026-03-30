"use client";

import {
  Plus, Minus, Bold, Italic, Download, Undo2, Redo2,
  Columns, Rows, Snowflake,
} from "lucide-react";
import { useGridStore } from "@/lib/grid/gridStore";
import { sheetToCSV, downloadCSV, getCellDisplayValue } from "@/lib/grid/gridHelpers";
import { ColorPickerPopover } from "./ColorPickerPopover";

interface GridToolbarProps {
  t: Record<string, string>;
}

function ToolbarBtn({ onClick, title, active, children }: { onClick: () => void; title: string; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded p-1.5 transition-colors ${
        active
          ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

export function GridToolbar({ t }: GridToolbarProps) {
  const sheet = useGridStore((s) => s.sheets.find((sh) => sh.id === s.activeSheetId) || s.sheets[0]);
  const activeCell = useGridStore((s) => s.activeCell);
  const editingCell = useGridStore((s) => s.editingCell);

  const addColumn = useGridStore((s) => s.addColumn);
  const removeColumn = useGridStore((s) => s.removeColumn);
  const addRow = useGridStore((s) => s.addRow);
  const removeRow = useGridStore((s) => s.removeRow);
  const setCellStyle = useGridStore((s) => s.setCellStyle);
  const setRangeStyle = useGridStore((s) => s.setRangeStyle);
  const undo = useGridStore((s) => s.undo);
  const redo = useGridStore((s) => s.redo);
  const setFrozenCols = useGridStore((s) => s.setFrozenCols);
  const setEditingCell = useGridStore((s) => s.setEditingCell);
  const setCellValue = useGridStore((s) => s.setCellValue);
  const recomputeFormulas = useGridStore((s) => s.recomputeFormulas);

  const currentCell = activeCell ? sheet.cells[activeCell] : undefined;
  const cellDisplay = activeCell
    ? (editingCell === activeCell ? currentCell?.value : getCellDisplayValue(currentCell)) || ""
    : "";

  const handleBold = () => {
    if (!activeCell) return;
    const toggled = !currentCell?.bold;
    setCellStyle(activeCell, { bold: toggled });
    setRangeStyle({ bold: toggled });
  };

  const handleItalic = () => {
    if (!activeCell) return;
    const toggled = !currentCell?.italic;
    setCellStyle(activeCell, { italic: toggled });
    setRangeStyle({ italic: toggled });
  };

  const handleExport = () => {
    const csv = sheetToCSV(sheet);
    downloadCSV(csv, `${sheet.name || "sheet"}.csv`);
  };

  const handleFreezeToggle = () => {
    setFrozenCols(sheet.frozenCols > 0 ? 0 : 1);
  };

  return (
    <div className="flex items-center gap-1 border-b border-slate-700/50 bg-slate-800/50 px-2 py-1">
      {/* Cell address */}
      <div className="flex h-7 w-14 items-center justify-center rounded border border-slate-700/50 bg-slate-900 text-[10px] font-mono text-slate-400">
        {activeCell || "—"}
      </div>

      {/* Formula bar */}
      <input
        className="mx-1 h-7 flex-1 rounded border border-slate-700/50 bg-slate-900 px-2 text-xs text-slate-200 outline-none focus:border-[var(--cc-accent-500)]/50"
        value={cellDisplay}
        placeholder={t.formulaBar || "fx"}
        onChange={(e) => {
          if (activeCell) {
            setCellValue(activeCell, e.target.value);
            setEditingCell(activeCell);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && activeCell) {
            setEditingCell(null);
            recomputeFormulas();
          }
        }}
      />

      <div className="mx-1 h-5 w-px bg-slate-700/50" />

      {/* Formatting */}
      <ToolbarBtn onClick={handleBold} title={t.bold || "Bold"} active={currentCell?.bold}>
        <Bold className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={handleItalic} title={t.italic || "Italic"} active={currentCell?.italic}>
        <Italic className="h-3.5 w-3.5" />
      </ToolbarBtn>

      {/* Cell color */}
      <ColorPickerPopover
        value={currentCell?.bg}
        onChange={(c) => {
          if (activeCell) setCellStyle(activeCell, { bg: c });
          setRangeStyle({ bg: c });
        }}
        onClear={() => {
          if (activeCell) setCellStyle(activeCell, { bg: undefined });
          setRangeStyle({ bg: undefined });
        }}
      >
        <button
          type="button"
          title={t.cellColor || "Cell Color"}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        >
          <div className="h-3.5 w-3.5 rounded border border-slate-600" style={{ backgroundColor: currentCell?.bg || "#1e293b" }} />
        </button>
      </ColorPickerPopover>

      {/* Text color */}
      <ColorPickerPopover
        value={currentCell?.fg}
        onChange={(c) => {
          if (activeCell) setCellStyle(activeCell, { fg: c });
          setRangeStyle({ fg: c });
        }}
        onClear={() => {
          if (activeCell) setCellStyle(activeCell, { fg: undefined });
          setRangeStyle({ fg: undefined });
        }}
      >
        <button
          type="button"
          title={t.textColor || "Text Color"}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        >
          <span className="text-[11px] font-bold" style={{ color: currentCell?.fg || "#e2e8f0" }}>A</span>
        </button>
      </ColorPickerPopover>

      <div className="mx-1 h-5 w-px bg-slate-700/50" />

      {/* Structure */}
      <ToolbarBtn onClick={addColumn} title={t.addColumn || "Add Column"}>
        <div className="flex items-center"><Columns className="h-3 w-3" /><Plus className="h-2.5 w-2.5" /></div>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => { const col = sheet.colOrder[sheet.colOrder.length - 1]; if (col) removeColumn(col); }} title={t.removeColumn || "Remove Column"}>
        <div className="flex items-center"><Columns className="h-3 w-3" /><Minus className="h-2.5 w-2.5" /></div>
      </ToolbarBtn>
      <ToolbarBtn onClick={addRow} title={t.addRow || "Add Row"}>
        <div className="flex items-center"><Rows className="h-3 w-3" /><Plus className="h-2.5 w-2.5" /></div>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => { const row = sheet.rowOrder[sheet.rowOrder.length - 1]; if (row) removeRow(row); }} title={t.removeRow || "Remove Row"}>
        <div className="flex items-center"><Rows className="h-3 w-3" /><Minus className="h-2.5 w-2.5" /></div>
      </ToolbarBtn>

      <ToolbarBtn onClick={handleFreezeToggle} title={t.freezeColumn || "Freeze Column"} active={sheet.frozenCols > 0}>
        <Snowflake className="h-3.5 w-3.5" />
      </ToolbarBtn>

      <div className="mx-1 h-5 w-px bg-slate-700/50" />

      {/* History + Export */}
      <ToolbarBtn onClick={undo} title={t.undo || "Undo"}>
        <Undo2 className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={redo} title={t.redo || "Redo"}>
        <Redo2 className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={handleExport} title={t.exportCSV || "Export CSV"}>
        <Download className="h-3.5 w-3.5" />
      </ToolbarBtn>
    </div>
  );
}
