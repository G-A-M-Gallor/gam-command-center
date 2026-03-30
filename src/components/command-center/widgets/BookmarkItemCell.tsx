"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, GripVertical, X } from "lucide-react";
import type { FolderItemBookmark } from "./FolderRegistry";
import { useSettings } from "@/contexts/SettingsContext";
import { createBookmarkNote } from "@/lib/supabase/editorQueries";

interface BookmarkItemCellProps {
  item: FolderItemBookmark;
  editMode?: boolean;
  onRemove?: (itemId: string) => void;
  onUpdateNoteId?: (itemId: string, noteId: string) => void;
  dragIndex: number;
  onDragStart: (i: number) => void;
  onDragEnter: (i: number) => void;
  onDragEnd: () => void;
}

export function BookmarkItemCell({
  item,
  editMode,
  onRemove,
  onUpdateNoteId,
  dragIndex,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: BookmarkItemCellProps) {
  const { language } = useSettings();
  const router = useRouter();
  const [creatingNote, setCreatingNote] = useState(false);

  const dragProps = {
    draggable: true,
    onDragStart: () => onDragStart(dragIndex),
    onDragEnter: () => onDragEnter(dragIndex),
    onDragEnd,
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
  };

  const handleClick = () => {
    if (item.url.startsWith("/")) {
      router.push(item.url);
    } else {
      window.open(item.url, "_blank", "noopener");
    }
  };

  const handleOpenNote = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (item.noteId) {
      router.push(`/dashboard/editor?id=${item.noteId}`);
      return;
    }

    setCreatingNote(true);
    const note = await createBookmarkNote({
      id: item.id,
      url: item.url,
      label: item.label[language] || item.label.en,
    });
    setCreatingNote(false);

    if (note) {
      onUpdateNoteId?.(item.id, note.id);
      router.push(`/dashboard/editor?id=${note.id}`);
    }
  };

  const label = item.label[language] || item.label.en;

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
        <span className="shrink-0 text-sm">{item.icon}</span>
        <span className="flex-1 truncate text-xs text-start">{label}</span>
        {/* Note indicator */}
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); handleOpenNote(e as unknown as React.MouseEvent); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); handleOpenNote(e as unknown as React.MouseEvent); } }}
          className={`relative shrink-0 rounded p-0.5 transition-colors hover:bg-slate-600 cursor-pointer ${
            creatingNote ? "opacity-50 pointer-events-none" : ""
          }`}
          title={item.noteId ? "Open note" : "Create note"}
        >
          <FileText className="h-3 w-3 text-slate-500" />
          {item.noteId && (
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-blue-400" />
          )}
        </div>
        <ExternalLink className="h-3 w-3 shrink-0 text-slate-600" />
      </button>
    </div>
  );
}
