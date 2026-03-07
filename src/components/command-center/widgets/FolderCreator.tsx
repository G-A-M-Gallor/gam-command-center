"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { EMOJI_OPTIONS, type FolderDefinition } from "./FolderRegistry";
import { useWidgets } from "@/contexts/WidgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";

interface FolderCreatorProps {
  onClose: () => void;
}

export function FolderCreator({ onClose }: FolderCreatorProps) {
  const { addFolder, widgetPositions, widgetSizes } = useWidgets();
  const { language } = useSettings();
  const t = getTranslations(language);
  const ft = (t as unknown as Record<string, Record<string, string>>).folders;

  const [nameHe, setNameHe] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [icon, setIcon] = useState("📁");
  const [gridCols, setGridCols] = useState(2);
  const [gridRows, setGridRows] = useState(2);

  const handleCreate = () => {
    const name = nameHe.trim() || nameEn.trim() || "Folder";
    const folder: FolderDefinition = {
      id: `folder-${Date.now()}`,
      label: { he: nameHe.trim() || name, en: nameEn.trim() || name, ru: name },
      icon,
      defaultSize: 2,
      gridCols,
      gridRows,
      items: [],
      pinned: false,
    };

    addFolder(folder);

    // Auto-position: find next available column
    let nextCol = 0;
    for (const [id, col] of Object.entries(widgetPositions)) {
      const size = widgetSizes[id] ?? 1;
      const end = col + size;
      if (end > nextCol) nextCol = end;
    }
    // setWidgetPosition is available from useWidgets but we need the reference
    // The TopBar's auto-init effect will handle positioning if we don't set it here

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-16">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
        aria-label="Close"
      />
      <div
        className="relative z-10 flex w-80 max-h-[calc(100vh-5rem)] flex-col border border-slate-700 bg-slate-800 shadow-xl"
        style={{ borderRadius: "var(--cc-radius-lg)" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-700 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-100">
            {ft?.createFolder}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              {ft?.folderName}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nameHe}
                onChange={(e) => setNameHe(e.target.value)}
                placeholder="עברית"
                className="flex-1 rounded bg-slate-700 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
                dir="rtl"
                autoFocus
              />
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="English"
                className="flex-1 rounded bg-slate-700 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
                dir="ltr"
              />
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              {ft?.folderIcon}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`flex h-8 w-8 items-center justify-center rounded text-base transition-colors ${
                    icon === emoji
                      ? "bg-[var(--cc-accent-600-30)] ring-1 ring-[var(--cc-accent-500)]"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Size */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              {ft?.gridSize}
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500">{ft?.columns}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setGridCols(c)}
                      className={`h-7 w-7 rounded text-xs font-medium transition-colors ${
                        gridCols === c
                          ? "bg-[var(--cc-accent-600-30)] text-[var(--cc-accent-300)]"
                          : "bg-slate-700 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500">{ft?.rows}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setGridRows(r)}
                      className={`h-7 w-7 rounded text-xs font-medium transition-colors ${
                        gridRows === r
                          ? "bg-[var(--cc-accent-600-30)] text-[var(--cc-accent-300)]"
                          : "bg-slate-700 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-700 px-4 py-3">
          <button
            type="button"
            onClick={handleCreate}
            disabled={!nameHe.trim() && !nameEn.trim()}
            className="rounded bg-[var(--cc-accent-600)] px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {t.widgets.create}
          </button>
        </div>
      </div>
    </div>
  );
}
