"use client";

import { useState } from "react";
import { Plus, X, Copy } from "lucide-react";
import { useGridStore } from "@/lib/grid/gridStore";

interface SheetTabsProps {
  t: Record<string, string>;
}

export function SheetTabs({ t }: SheetTabsProps) {
  const sheets = useGridStore((s) => s.sheets);
  const activeSheetId = useGridStore((s) => s.activeSheetId);
  const setActiveSheet = useGridStore((s) => s.setActiveSheet);
  const addSheet = useGridStore((s) => s.addSheet);
  const removeSheet = useGridStore((s) => s.removeSheet);
  const renameSheet = useGridStore((s) => s.renameSheet);
  const duplicateSheet = useGridStore((s) => s.duplicateSheet);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleDoubleClick = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleRenameEnd = () => {
    if (editingId && editName.trim()) {
      renameSheet(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex items-center gap-0.5 border-t border-slate-700/50 bg-slate-800/50 px-1 py-0.5">
      {sheets.map((sh) => (
        <div
          key={sh.id}
          className={`group flex items-center gap-1 rounded-t px-2 py-1 text-xs transition-colors cursor-pointer ${
            sh.id === activeSheetId
              ? "bg-slate-900 text-slate-200 border-t-2 border-t-[var(--cc-accent-500)]"
              : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
          }`}
          onClick={() => setActiveSheet(sh.id)}
          onDoubleClick={() => handleDoubleClick(sh.id, sh.name)}
        >
          {editingId === sh.id ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRenameEnd}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameEnd();
                if (e.key === "Escape") setEditingId(null);
              }}
              className="w-20 bg-transparent text-xs outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate max-w-[100px]">{sh.name}</span>
          )}

          <button
            type="button"
            title={t.duplicateSheet || "Duplicate"}
            onClick={(e) => { e.stopPropagation(); duplicateSheet(sh.id); }}
            className="rounded p-0.5 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-slate-300"
          >
            <Copy className="h-3 w-3" />
          </button>

          {sheets.length > 1 && (
            <button
              type="button"
              title={t.deleteSheet || "Delete"}
              onClick={(e) => { e.stopPropagation(); removeSheet(sh.id); }}
              className="rounded p-0.5 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-red-400"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addSheet}
        title={t.addSheet || "Add Sheet"}
        className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
