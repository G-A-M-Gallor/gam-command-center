"use client";

import { _ExternalLink, GripVertical, _X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/contexts/SettingsContext";
import { getWidgetById } from "./WidgetRegistry";
import {
  ACTION_CONFIG,
  type FolderItem,
  type QuickActionId,
} from "./FolderRegistry";
import { BookmarkItemCell } from "./BookmarkItemCell";

interface FolderItemCellProps {
  item: FolderItem;
  editMode?: boolean;
  onRemove?: (itemId: string) => void;
  onUpdateBookmarkNoteId?: (itemId: string, noteId: string) => void;
  dragIndex: number;
  onDragStart: (i: number) => void;
  onDragEnter: (i: number) => void;
  onDragEnd: () => void;
}

function dispatchAction(actionId: QuickActionId) {
  switch (actionId) {
    case "open-search":
      window.dispatchEvent(new CustomEvent("cc-open-search"));
      break;
    case "open-ai":
      window.dispatchEvent(new CustomEvent("cc-open-ai"));
      break;
    case "create-document":
    case "create-project":
    case "create-task":
      window.dispatchEvent(
        new CustomEvent("cc-quick-create", {
          detail: { type: actionId.replace("create-", "") },
        })
      );
      break;
    default:
      break;
  }
}

export function FolderItemCell({
  item,
  editMode,
  onRemove,
  onUpdateBookmarkNoteId,
  dragIndex,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: FolderItemCellProps) {
  const { language } = useSettings();
  const _router = useRouter();

  const dragProps = {
    draggable: true,
    onDragStart: () => onDragStart(dragIndex),
    onDragEnter: () => onDragEnter(dragIndex),
    onDragEnd,
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
  };

  if (item.type === "bookmark") {
    return (
      <BookmarkItemCell
        item={item}
        editMode={editMode}
        onRemove={onRemove}
        onUpdateNoteId={onUpdateBookmarkNoteId}
        dragIndex={dragIndex}
        onDragStart={onDragStart}
        onDragEnter={onDragEnter}
        onDragEnd={onDragEnd}
      />
    );
  }

  if (item.type === "widget") {
    const widget = getWidgetById(item.widgetId);
    if (!widget?.component) return null;
    const WidgetContent = widget.component;
    const Icon = widget.icon;

    return (
      <div
        className="relative rounded-lg border border-slate-700/50 bg-slate-700/20 p-2"
        {...dragProps}
      >
        {editMode && (
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-1 pt-1">
            <GripVertical className="h-3 w-3 cursor-grab text-slate-600" />
            <button
              type="button"
              onClick={() => onRemove?.(item.id)}
              className="rounded p-0.5 text-slate-600 hover:text-red-400"
              aria-label="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="mb-1.5 flex items-center gap-1">
          <Icon className="h-3 w-3 text-slate-500" />
          <span className="text-[10px] text-slate-500">
            {widget.label[language]}
          </span>
        </div>
        <div className="max-h-40 overflow-y-auto">
          <WidgetContent />
        </div>
      </div>
    );
  }

  if (item.type === "shortcut") {
    const widget = getWidgetById(item.widgetId);
    if (!widget) return null;
    const Icon = widget.icon;

    const handleClick = () => {
      if (widget.panelMode === "modal") {
        window.dispatchEvent(new CustomEvent("cc-open-search"));
      } else if (widget.panelMode === "side-panel") {
        window.dispatchEvent(new CustomEvent("cc-open-ai"));
      } else {
        window.dispatchEvent(
          new CustomEvent("cc-toggle-widget-panel", {
            detail: { widgetId: item.widgetId },
          })
        );
      }
    };

    return (
      <div className="relative" {...dragProps}>
        {editMode && (
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-1 pt-1">
            <GripVertical className="h-3 w-3 cursor-grab text-slate-600" />
            <button
              type="button"
              onClick={() => onRemove?.(item.id)}
              className="rounded p-0.5 text-slate-600 hover:text-red-400"
              aria-label="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={handleClick}
          className="flex w-full items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-700/30 px-2.5 py-2 text-slate-300 transition-colors hover:bg-slate-700/60"
        >
          <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--cc-accent-400)]" />
          <span className="truncate text-xs">{widget.label[language]}</span>
          <ExternalLink className="ms-auto h-3 w-3 shrink-0 text-slate-600" />
        </button>
      </div>
    );
  }

  // Action type
  const config = ACTION_CONFIG[item.actionId];
  if (!config) return null;
  const ActionIcon = config.icon;

  const handleActionClick = () => {
    const navActions: Record<string, string> = {
      "navigate-layers": "/dashboard/layers",
      "navigate-editor": "/dashboard/editor",
      "navigate-settings": "/dashboard/settings",
    };
    const navPath = navActions[item.actionId];
    if (navPath) {
      router.push(navPath);
    } else {
      dispatchAction(item.actionId);
    }
  };

  return (
    <div className="relative" {...dragProps}>
      {editMode && (
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-1 pt-1">
          <GripVertical className="h-3 w-3 cursor-grab text-slate-600" />
          <button
            type="button"
            onClick={() => onRemove?.(item.id)}
            className="rounded p-0.5 text-slate-600 hover:text-red-400"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={handleActionClick}
        className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-slate-700 bg-slate-800/50 px-2.5 py-2 text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700/40"
      >
        <ActionIcon className={`h-3.5 w-3.5 shrink-0 ${config.color}`} />
        <span className="truncate text-xs">{config.label[language]}</span>
      </button>
    </div>
  );
}
