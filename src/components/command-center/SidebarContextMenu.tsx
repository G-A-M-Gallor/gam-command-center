"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  EyeOff,
  _ExternalLink,
  _Star,
  FolderInput,
  FolderPlus,
  Trash2,
  StickyNote,
} from "lucide-react";
import type { CustomFolder } from "@/lib/sidebar/sidebarCustomization";
import { STICKY_NOTE_OPEN_EVENT, type StickyNoteOpenDetail } from "./StickyNote";
import { getNote } from "@/lib/stickyNotes";

interface SidebarContextMenuProps {
  x: number;
  y: number;
  itemKey: string;
  href: string;
  label: string;
  isHidden: boolean;
  customFolders: CustomFolder[];
  isFavorite: boolean;
  onToggleFav: () => void;
  onToggleHide: () => void;
  onMoveToFolder: (folderId: string) => void;
  onRemoveFromFolder: () => void;
  onCreateFolder: (name: string) => void;
  onClose: () => void;
  isRtl: boolean;
  /** i18n labels */
  labels: {
    hide: string;
    show: string;
    openNewTab: string;
    addFav: string;
    removeFav: string;
    moveToFolder: string;
    newFolder: string;
    removeFromFolder: string;
    folderName: string;
    addNote: string;
    editNote: string;
  };
}

export function SidebarContextMenu({
  x,
  y,
  itemKey,
  href,
  label,
  isHidden,
  customFolders,
  isFavorite,
  onToggleFav,
  onToggleHide,
  onMoveToFolder,
  onRemoveFromFolder,
  onCreateFolder,
  onClose,
  isRtl,
  labels,
}: SidebarContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [showFolders, setShowFolders] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Focus input when creating folder
  useEffect(() => {
    if (creatingFolder && inputRef.current) inputRef.current.focus();
  }, [creatingFolder]);

  // Position: ensure menu stays in viewport
  const menuStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 9999,
    top: Math.min(y, window.innerHeight - 300),
    left: isRtl ? undefined : Math.min(x, window.innerWidth - 220),
    right: isRtl ? Math.min(window.innerWidth - x, window.innerWidth - 220) : undefined,
  };

  const handleCreateFolder = useCallback(() => {
    const name = newFolderName.trim();
    if (!name) return;
    onCreateFolder(name);
    setNewFolderName("");
    setCreatingFolder(false);
    onClose();
  }, [newFolderName, onCreateFolder, onClose]);

  const isInAnyFolder = customFolders.some((f) => f.itemKeys.includes(itemKey));

  const menuItem = (
    icon: React.ElementType,
    text: string,
    onClick: () => void,
    variant?: "danger",
  ) => {
    const Icon = icon;
    return (
      <button
        key={text}
        type="button"
        onClick={() => { onClick(); onClose(); }}
        className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
          isRtl ? "flex-row-reverse text-right" : ""
        } ${
          variant === "danger"
            ? "text-red-400 hover:bg-red-500/10"
            : "text-slate-300 hover:bg-slate-700/50"
        }`}
      >
        <Icon size={13} className="shrink-0" />
        <span className="truncate">{text}</span>
      </button>
    );
  };

  return (
    <div ref={ref} style={menuStyle} className="w-52 rounded-xl border border-white/[0.08] bg-slate-900 p-1.5 shadow-2xl">
      {/* Hide / Show */}
      {menuItem(EyeOff, isHidden ? labels.show : labels.hide, onToggleHide)}

      {/* Open in new tab */}
      {menuItem(_ExternalLink, labels.openNewTab, () => window.open(href, "_blank"))}

      {/* Add/Remove favorite */}
      {menuItem(_Star, isFavorite ? labels.removeFav : labels.addFav, onToggleFav)}

      {/* Sticky note */}
      {menuItem(StickyNote, getNote(`sidebar:${itemKey}`) ? labels.editNote : labels.addNote, () => {
        window.dispatchEvent(new CustomEvent<StickyNoteOpenDetail>(STICKY_NOTE_OPEN_EVENT, {
          detail: { elementKey: `sidebar:${itemKey}`, elementLabel: label, x, y },
        }));
      })}

      {/* Separator */}
      <div className="my-1 border-t border-slate-700/50" />

      {/* Move to folder */}
      <button
        type="button"
        onClick={() => setShowFolders(!showFolders)}
        className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-700/50 ${
          isRtl ? "flex-row-reverse text-right" : ""
        }`}
      >
        <FolderInput size={13} className="shrink-0" />
        <span className="flex-1 truncate">{labels.moveToFolder}</span>
      </button>

      {/* Folder submenu */}
      {showFolders && (
        <div className={`${isRtl ? "pr-4" : "pl-4"} space-y-0.5`}>
          {customFolders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => { onMoveToFolder(folder.id); onClose(); }}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-[11px] text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200 ${
                isRtl ? "flex-row-reverse text-right" : ""
              }`}
            >
              <FolderInput size={11} className="shrink-0" />
              <span className="truncate">{folder.name}</span>
            </button>
          ))}

          {/* Create new folder */}
          {creatingFolder ? (
            <div className="flex items-center gap-1 px-1">
              <input
                ref={inputRef}
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); if (e.key === "Escape") setCreatingFolder(false); }}
                placeholder={labels.folderName}
                className="flex-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-200 outline-none focus:border-[var(--cc-accent-500)]"
                dir={isRtl ? "rtl" : "ltr"}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreatingFolder(true)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-[11px] text-[var(--cc-accent-400)] transition-colors hover:bg-slate-700/50 ${
                isRtl ? "flex-row-reverse text-right" : ""
              }`}
            >
              <FolderPlus size={11} className="shrink-0" />
              <span className="truncate">{labels.newFolder}</span>
            </button>
          )}
        </div>
      )}

      {/* Remove from folder */}
      {isInAnyFolder && (
        <>
          <div className="my-1 border-_t border-slate-700/50" />
          {menuItem(Trash2, labels.removeFromFolder, onRemoveFromFolder, "danger")}
        </>
      )}
    </div>
  );
}
