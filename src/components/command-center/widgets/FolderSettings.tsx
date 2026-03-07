"use client";

import { useState } from "react";
import { X, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { widgetRegistry, type WidgetSize } from "./WidgetRegistry";
import {
  EMOJI_OPTIONS,
  ACTION_CONFIG,
  ALL_ACTION_IDS,
  type FolderItem,
} from "./FolderRegistry";
import { useWidgets } from "@/contexts/WidgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";

const SIZE_OPTIONS: WidgetSize[] = [1, 2, 3, 4];
const GRID_COL_OPTIONS = [1, 2, 3, 4];
const GRID_ROW_OPTIONS = [1, 2, 3, 4, 5, 6];

interface FolderSettingsProps {
  folderId: string;
  onClose: () => void;
}

export function FolderSettings({ folderId, onClose }: FolderSettingsProps) {
  const { folders, updateFolder, removeFolder, widgetSizes, setWidgetSize, setWidgetPlacement } =
    useWidgets();
  const { language } = useSettings();
  const t = getTranslations(language);
  const ft = (t as unknown as Record<string, Record<string, string>>).folders;

  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return null;

  const size: WidgetSize = widgetSizes[folderId] ?? folder.defaultSize;
  const [addTab, setAddTab] = useState<"widgets" | "actions">("widgets");

  const activeWidgets = widgetRegistry.filter((w) => w.status === "active");

  const handleNameChange = (lang: "he" | "en" | "ru", value: string) => {
    updateFolder(folderId, {
      label: { ...folder.label, [lang]: value },
    });
  };

  const handleAddItem = (item: FolderItem) => {
    updateFolder(folderId, {
      items: [...folder.items, item],
    });
  };

  const handleRemoveItem = (itemId: string) => {
    updateFolder(folderId, {
      items: folder.items.filter((i) => i.id !== itemId),
    });
  };

  const handleDelete = () => {
    removeFolder(folderId);
    setWidgetPlacement(folderId, "disabled");
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
        className="relative z-10 w-[420px] border border-slate-700 bg-slate-800 shadow-xl"
        style={{ borderRadius: "var(--cc-radius-lg)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-base">{folder.icon}</span>
            <h3 className="text-sm font-semibold text-slate-100">
              {ft?.editFolder}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-4 space-y-4">
          {/* Folder Name */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              {ft?.folderName}
            </label>
            <div className="flex gap-2">
              <Input
                inputSize="sm"
                value={folder.label.he}
                onChange={(e) => handleNameChange("he", e.target.value)}
                placeholder="עברית"
                dir="rtl"
                className="flex-1"
              />
              <Input
                inputSize="sm"
                value={folder.label.en}
                onChange={(e) => handleNameChange("en", e.target.value)}
                placeholder="English"
                dir="ltr"
                className="flex-1"
              />
              <Input
                inputSize="sm"
                value={folder.label.ru}
                onChange={(e) => handleNameChange("ru", e.target.value)}
                placeholder="Русский"
                dir="ltr"
                className="flex-1"
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
                  onClick={() => updateFolder(folderId, { icon: emoji })}
                  className={`flex h-8 w-8 items-center justify-center rounded text-base transition-colors ${
                    folder.icon === emoji
                      ? "bg-[var(--cc-accent-600-30)] ring-1 ring-[var(--cc-accent-500)]"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Top bar size */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              {t.widgets.size}
            </label>
            <div className="flex gap-1">
              {SIZE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setWidgetSize(folderId, s)}
                  className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                    size === s
                      ? "bg-[var(--cc-accent-600-30)] text-[var(--cc-accent-300)]"
                      : "bg-slate-700 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Grid dimensions */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              {ft?.gridSize}
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500">{ft?.columns}</span>
                <div className="flex gap-1">
                  {GRID_COL_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateFolder(folderId, { gridCols: c })}
                      className={`h-7 w-7 rounded text-xs font-medium transition-colors ${
                        folder.gridCols === c
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
                  {GRID_ROW_OPTIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => updateFolder(folderId, { gridRows: r })}
                      className={`h-7 w-7 rounded text-xs font-medium transition-colors ${
                        folder.gridRows === r
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

          {/* Current Items */}
          {folder.items.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                {ft?.items} ({folder.items.length})
              </label>
              <div className="space-y-1">
                {folder.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    language={language}
                    onRemove={() => handleRemoveItem(item.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Add Items */}
          <div>
            <div className="mb-2 flex gap-1">
              <button
                type="button"
                onClick={() => setAddTab("widgets")}
                className={`flex-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                  addTab === "widgets"
                    ? "bg-[var(--cc-accent-600-30)] text-[var(--cc-accent-300)]"
                    : "bg-slate-700 text-slate-400 hover:text-slate-300"
                }`}
              >
                {ft?.widgetsTab}
              </button>
              <button
                type="button"
                onClick={() => setAddTab("actions")}
                className={`flex-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                  addTab === "actions"
                    ? "bg-[var(--cc-accent-600-30)] text-[var(--cc-accent-300)]"
                    : "bg-slate-700 text-slate-400 hover:text-slate-300"
                }`}
              >
                {ft?.actionsTab}
              </button>
            </div>

            {addTab === "widgets" && (
              <div className="space-y-1">
                {activeWidgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="flex items-center gap-2 rounded-lg bg-slate-700/30 px-2.5 py-2"
                  >
                    <widget.icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="flex-1 truncate text-xs text-slate-300">
                      {widget.label[language]}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddItem({
                          type: "widget",
                          id: `wi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                          widgetId: widget.id,
                        })
                      }
                      className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400 transition-colors hover:text-slate-200"
                      title={ft?.addWidget}
                    >
                      {ft?.addWidget}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddItem({
                          type: "shortcut",
                          id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                          widgetId: widget.id,
                        })
                      }
                      className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400 transition-colors hover:text-slate-200"
                      title={ft?.addShortcut}
                    >
                      {ft?.addShortcut}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {addTab === "actions" && (
              <div className="space-y-1">
                {ALL_ACTION_IDS.map((actionId) => {
                  const config = ACTION_CONFIG[actionId];
                  const ActionIcon = config.icon;
                  return (
                    <div
                      key={actionId}
                      className="flex items-center gap-2 rounded-lg bg-slate-700/30 px-2.5 py-2"
                    >
                      <ActionIcon
                        className={`h-3.5 w-3.5 shrink-0 ${config.color}`}
                      />
                      <span className="flex-1 truncate text-xs text-slate-300">
                        {config.label[language]}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleAddItem({
                            type: "action",
                            id: `ac-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                            actionId,
                          })
                        }
                        className="flex items-center gap-0.5 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400 transition-colors hover:text-slate-200"
                      >
                        <Plus className="h-2.5 w-2.5" />
                        {ft?.addAction}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer — Delete */}
        <div className="border-t border-slate-700 px-4 py-3">
          <Button variant="danger" size="sm" icon={Trash2} onClick={handleDelete}>
            {ft?.deleteFolder}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Item Row ───────────────────────────────────────────────

function ItemRow({
  item,
  language,
  onRemove,
}: {
  item: FolderItem;
  language: "he" | "en" | "ru";
  onRemove: () => void;
}) {
  let label = "";
  let typeLabel = "";

  if (item.type === "widget" || item.type === "shortcut") {
    const widget = widgetRegistry.find((w) => w.id === item.widgetId);
    label = widget?.label[language] || item.widgetId;
    typeLabel = item.type === "widget" ? "W" : "S";
  } else {
    const config = ACTION_CONFIG[item.actionId];
    label = config?.label[language] || item.actionId;
    typeLabel = "A";
  }

  return (
    <div className="flex items-center gap-2 rounded bg-slate-700/30 px-2 py-1.5">
      <span className="flex h-4 w-4 items-center justify-center rounded bg-slate-600 text-[9px] font-bold text-slate-300">
        {typeLabel}
      </span>
      <span className="flex-1 truncate text-xs text-slate-300">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-slate-600 transition-colors hover:text-red-400"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
