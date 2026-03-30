"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  Trash2,
  GripVertical,
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  CheckSquare,
  StickyNote as StickyNoteIcon,
} from "lucide-react";
import {
  getNote,
  upsertNote,
  deleteNote,
  updateNoteSize,
  type StickyNote as StickyNoteType,
} from "@/lib/stickyNotes";

// ─── Open event ──────────────────────────────────────────────

export const STICKY_NOTE_OPEN_EVENT = "cc-sticky-note-open";

export interface StickyNoteOpenDetail {
  elementKey: string;
  elementLabel: string;
  x: number;
  y: number;
}

// ─── Mini Tiptap-like Editor ─────────────────────────────────

interface MiniEditorProps {
  initialContent: string;
  onChange: (html: string) => void;
  autoFocus?: boolean;
}

function MiniEditor({ initialContent, onChange, autoFocus }: MiniEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInitializedRef.current) {
      editorRef.current.innerHTML = initialContent;
      isInitializedRef.current = true;
      if (autoFocus) {
        editorRef.current.focus();
        // Move cursor to end
        const sel = window.getSelection();
        if (sel) {
          sel.selectAllChildren(editorRef.current);
          sel.collapseToEnd();
        }
      }
    }
  }, [initialContent, autoFocus]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const exec = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-amber-500/20 bg-amber-950/20 shrink-0">
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("bold"); }} className="rounded p-1 text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/10 transition-colors" title="Bold">
          <Bold className="h-3 w-3" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("italic"); }} className="rounded p-1 text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/10 transition-colors" title="Italic">
          <Italic className="h-3 w-3" />
        </button>
        <div className="w-px h-3.5 bg-amber-500/20 mx-0.5" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }} className="rounded p-1 text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/10 transition-colors" title="Bullet List">
          <List className="h-3 w-3" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("insertOrderedList"); }} className="rounded p-1 text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/10 transition-colors" title="Numbered List">
          <ListOrdered className="h-3 w-3" />
        </button>
        <div className="w-px h-3.5 bg-amber-500/20 mx-0.5" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("undo"); }} className="rounded p-1 text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/10 transition-colors" title="Undo">
          <Undo2 className="h-3 w-3" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("redo"); }} className="rounded p-1 text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/10 transition-colors" title="Redo">
          <Redo2 className="h-3 w-3" />
        </button>
        <div className="w-px h-3.5 bg-amber-500/20 mx-0.5" />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
              const range = sel.getRangeAt(0);
              const checkbox = document.createElement("div");
              checkbox.innerHTML = '<input type="checkbox" class="me-1.5 accent-amber-500" /><span></span>';
              checkbox.className = "flex items-center gap-0 my-0.5";
              range.insertNode(checkbox);
              range.collapse(false);
              handleInput();
            }
          }}
          className="rounded p-1 text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
          title="Checklist"
        >
          <CheckSquare className="h-3 w-3" />
        </button>
      </div>
      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-2 text-xs text-amber-100/80 leading-relaxed outline-none
          [&_b]:font-bold [&_i]:italic
          [&_ul]:list-disc [&_ul]:ms-4 [&_ul]:my-1
          [&_ol]:list-decimal [&_ol]:ms-4 [&_ol]:my-1
          [&_li]:my-0.5
          [&_input[type=checkbox]]:accent-amber-500"
        style={{ wordBreak: "break-word" }}
      />
    </div>
  );
}

// ─── Sticky Note Popup ───────────────────────────────────────

interface StickyNotePopupProps {
  elementKey: string;
  elementLabel: string;
  initialX: number;
  initialY: number;
  onClose: () => void;
}

function StickyNotePopup({ elementKey, elementLabel, initialX, initialY, onClose }: StickyNotePopupProps) {
  const existing = getNote(elementKey);
  const [content, setContent] = useState(existing?.content || "");
  const [expanded, setExpanded] = useState(false);
  const [size, setSize] = useState({
    width: existing?.width || 320,
    height: existing?.height || 200,
  });
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const popupRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Adjust position to stay in viewport
  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = expanded ? 480 : size.width;
    const h = expanded ? 400 : size.height;
    setPosition({
      x: Math.min(Math.max(8, initialX), vw - w - 8),
      y: Math.min(Math.max(8, initialY), vh - h - 8),
    });
  }, [initialX, initialY, expanded, size.width, size.height]);

  // Auto-save with debounce
  const handleChange = useCallback((html: string) => {
    setContent(html);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      upsertNote(elementKey, elementLabel, html, size);
    }, 500);
  }, [elementKey, elementLabel, size]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Save before closing
        upsertNote(elementKey, elementLabel, content, size);
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, elementKey, elementLabel, content, size]);

  const handleDelete = useCallback(() => {
    deleteNote(elementKey);
    onClose();
  }, [elementKey, onClose]);

  const handleClose = useCallback(() => {
    // Save current content
    if (content.trim() && content !== "<br>") {
      upsertNote(elementKey, elementLabel, content, size);
    }
    onClose();
  }, [content, elementKey, elementLabel, size, onClose]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  }, [position]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      setPosition({
        x: e.clientX - dragOffsetRef.current.x,
        y: e.clientY - dragOffsetRef.current.y,
      });
    };
    const handleUp = () => { isDraggingRef.current = false; };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  // Resize handler
  const handleResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.width;
    const startH = size.height;

    const onMove = (ev: MouseEvent) => {
      const newW = Math.max(260, startW + (ev.clientX - startX));
      const newH = Math.max(160, startH + (ev.clientY - startY));
      setSize({ width: newW, height: newH });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      // Persist size
      setSize((s) => {
        updateNoteSize(elementKey, s.width, s.height);
        return s;
      });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [size, elementKey]);

  const w = expanded ? 480 : size.width;
  const h = expanded ? 400 : size.height;

  return (
    <div
      ref={popupRef}
      className="fixed z-[90] flex flex-col rounded-lg border border-amber-500/30 bg-gradient-to-b from-amber-950/95 to-slate-900/95 shadow-2xl shadow-amber-900/20 backdrop-blur-sm overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: w,
        height: h,
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
    >
      {/* Header — draggable */}
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 border-b border-amber-500/20 cursor-move select-none shrink-0"
        onMouseDown={handleDragStart}
      >
        <GripVertical className="h-3 w-3 text-amber-500/40" />
        <StickyNoteIcon className="h-3 w-3 text-amber-400" />
        <span className="flex-1 text-[11px] font-medium text-amber-300 truncate">
          {elementLabel}
        </span>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="rounded p-0.5 text-amber-400/50 hover:text-amber-300 transition-colors"
          title={expanded ? "Minimize" : "Maximize"}
        >
          {expanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded p-0.5 text-amber-400/50 hover:text-red-400 transition-colors"
          title="Delete note"
        >
          <Trash2 className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="rounded p-0.5 text-amber-400/50 hover:text-amber-200 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Editor */}
      <MiniEditor
        initialContent={content}
        onChange={handleChange}
        autoFocus
      />

      {/* Resize handle */}
      {!expanded && (
        <div
          className="absolute bottom-0 end-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResize}
        >
          <svg className="w-3 h-3 text-amber-500/30 absolute bottom-0.5 end-0.5" viewBox="0 0 12 12">
            <path d="M11 1v10H1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 5v6H5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Sticky Notes Manager (renders all open notes) ───────────

export function StickyNotesManager() {
  const [openNotes, setOpenNotes] = useState<StickyNoteOpenDetail[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<StickyNoteOpenDetail>).detail;
      setOpenNotes((prev) => {
        // If already open for this element, just focus it (remove and re-add)
        const filtered = prev.filter((n) => n.elementKey !== detail.elementKey);
        return [...filtered, detail];
      });
    };
    window.addEventListener(STICKY_NOTE_OPEN_EVENT, handler);
    return () => window.removeEventListener(STICKY_NOTE_OPEN_EVENT, handler);
  }, []);

  const handleClose = useCallback((elementKey: string) => {
    setOpenNotes((prev) => prev.filter((n) => n.elementKey !== elementKey));
  }, []);

  return (
    <>
      {openNotes.map((note) => (
        <StickyNotePopup
          key={note.elementKey}
          elementKey={note.elementKey}
          elementLabel={note.elementLabel}
          initialX={note.x}
          initialY={note.y}
          onClose={() => handleClose(note.elementKey)}
        />
      ))}
    </>
  );
}
