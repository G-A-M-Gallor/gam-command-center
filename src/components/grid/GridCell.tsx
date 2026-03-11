"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { GridCell as GridCellType, CellAddress } from "@/lib/grid/types";
import { DEFAULT_ROW_HEIGHT } from "@/lib/grid/types";
import { getCellDisplayValue } from "@/lib/grid/gridHelpers";
import { ExternalLink, Image as ImageIcon } from "lucide-react";

interface GridCellProps {
  addr: CellAddress;
  cell: GridCellType | undefined;
  width: number;
  isActive: boolean;
  isEditing: boolean;
  isSelected: boolean;
  onSelect: (addr: CellAddress, shift?: boolean) => void;
  onStartEdit: (addr: CellAddress) => void;
  onEndEdit: (addr: CellAddress, value: string) => void;
  onCancelEdit: () => void;
}

export function GridCellComponent({
  addr,
  cell,
  width,
  isActive,
  isEditing,
  isSelected,
  onSelect,
  onStartEdit,
  onEndEdit,
  onCancelEdit,
}: GridCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (isEditing && inputRef.current) {
      setEditValue(cell?.value || "");
      inputRef.current.focus();
    }
  }, [isEditing, cell?.value]);

  const handleDoubleClick = useCallback(() => {
    onStartEdit(addr);
  }, [addr, onStartEdit]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    onSelect(addr, e.shiftKey);
  }, [addr, onSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onEndEdit(addr, editValue);
    } else if (e.key === "Escape") {
      onCancelEdit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      onEndEdit(addr, editValue);
    }
  }, [addr, editValue, onEndEdit, onCancelEdit]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    const files = e.dataTransfer.files;

    if (files.length > 0 && files[0].type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        onEndEdit(addr, reader.result as string);
      };
      reader.readAsDataURL(files[0]);
      return;
    }

    if (url) {
      onEndEdit(addr, url);
    }
  }, [addr, onEndEdit]);

  const displayValue = getCellDisplayValue(cell);
  const isUrl = cell?.type === "url" || (cell?.value && /^https?:\/\//.test(cell.value));
  const isImage = cell?.type === "image" || (cell?.value && cell.value.startsWith("data:image/"));

  return (
    <div
      className={`relative border-b border-r border-slate-700/30 select-none ${
        isActive ? "ring-2 ring-[var(--cc-accent-500)] ring-inset z-10" : ""
      } ${isSelected && !isActive ? "bg-[var(--cc-accent-600)]/10" : ""}`}
      style={{
        width,
        height: DEFAULT_ROW_HEIGHT,
        backgroundColor: cell?.bg || undefined,
        color: cell?.fg || undefined,
        fontWeight: cell?.bold ? 700 : undefined,
        fontStyle: cell?.italic ? "italic" : undefined,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onEndEdit(addr, editValue)}
          className="absolute inset-0 w-full bg-slate-800 px-1.5 text-xs text-slate-100 outline-none"
          style={{ height: DEFAULT_ROW_HEIGHT }}
        />
      ) : (
        <div className="flex h-full items-center overflow-hidden px-1.5 text-xs text-slate-200">
          {isImage ? (
            <div className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3 text-slate-500" />
              <span className="truncate text-slate-400">image</span>
            </div>
          ) : isUrl ? (
            <a
              href={cell?.value}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[var(--cc-accent-400)] hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">{displayValue}</span>
            </a>
          ) : (
            <span className="truncate">{displayValue}</span>
          )}
        </div>
      )}
    </div>
  );
}
