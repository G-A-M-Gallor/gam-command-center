"use client";

import { useState, useCallback, useRef } from "react";
import { _X, Search, FileText } from "lucide-react";
import { searchNotes, fetchNote } from "@/lib/supabase/entityQueries";
import { _getTranslations } from "@/lib/i18n";

// ─── Tiptap JSON → plain text ───────────────────────────────────

function extractNodeText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as Record<string, unknown>;
  if (typeof n.text === "string") return n.text;
  if (Array.isArray(n.content)) {
    return n.content.map(extractNodeText).join("");
  }
  return "";
}

function tiptapJsonToText(content: Record<string, unknown>): string {
  if (!Array.isArray(content.content)) return "";
  return (content.content as unknown[])
    .map((node) => {
      const text = extractNodeText(node);
      const n = node as Record<string, unknown>;
      // Add line breaks for block-level nodes
      if (n.type === "paragraph" || n.type === "heading" || n.type === "blockquote") {
        return text + "\n";
      }
      if (n.type === "bulletList" || n.type === "orderedList") {
        if (Array.isArray(n.content)) {
          return (n.content as unknown[])
            .map((item, i) => {
              const itemText = extractNodeText(item);
              const prefix = n.type === "orderedList" ? `${i + 1}. ` : "- ";
              return prefix + itemText;
            })
            .join("\n") + "\n";
        }
      }
      return text;
    })
    .join("")
    .trim();
}

// ─── Component ──────────────────────────────────────────────────

interface DocPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDocChange: (doc: { id: string; title: string; content: string; entityType: string | null } | null) => void;
  t: ReturnType<typeof getTranslations>;
}

export function AiDocPanel({ isOpen, onClose, onDocChange, _t }: DocPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; entity_type: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<{
    id: string;
    title: string;
    content: string;
    entityType: string | null;
  } | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const notes = await searchNotes(q);
      setSearchResults(
        notes.slice(0, 15).map((n) => ({
          id: n.id,
          title: n.title,
          entity_type: n.entity_type,
        }))
      );
    } catch {
      setSearchResults([]);
    }
    setLoading(false);
  }, []);

  const handleSearchChange = useCallback((v: string) => {
    setSearchQuery(v);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => doSearch(v), 300);
  }, [doSearch]);

  const handleSelectDoc = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const note = await fetchNote(id);
      if (note) {
        // Extract readable text from Tiptap JSON content
        let contentStr = "";
        if (note.content) {
          if (typeof note.content === "string") {
            contentStr = note.content;
          } else {
            contentStr = tiptapJsonToText(note.content);
            // Fallback to JSON if extraction yields nothing
            if (!contentStr.trim()) {
              contentStr = JSON.stringify(note.content, null, 2);
            }
          }
        }
        const doc = {
          id: note.id,
          title: note.title,
          content: contentStr,
          entityType: note.entity_type,
        };
        setSelectedDoc(doc);
        onDocChange(doc);
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }, [onDocChange]);

  const handleClose = useCallback(() => {
    setSelectedDoc(null);
    onDocChange(null);
    onClose();
  }, [onClose, onDocChange]);

  if (!isOpen) return null;

  return (
    <div className="flex w-[400px] shrink-0 flex-col border-s border-slate-700/50 bg-slate-900/60 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-300">
            {selectedDoc ? selectedDoc.title : _t.aiHub.docPanel}
          </span>
          {selectedDoc?.entityType && (
            <span className="rounded px-1.5 py-0.5 text-[9px] font-medium bg-slate-600/50 text-slate-400">
              {selectedDoc.entityType}
            </span>
          )}
        </div>
        <button
          onClick={handleClose}
          className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Search bar */}
      <div className="border-b border-slate-700/50 px-4 py-2">
        <div className="relative">
          <Search size={13} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t.aiHub.searchDocument}
            className="w-full rounded-lg bg-slate-800/80 py-2 ps-8 pe-3 text-[13px] text-slate-300 placeholder-slate-600 outline-none border border-slate-700/50 focus:border-slate-600 transition-colors"
          />
        </div>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800">
            {searchResults.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleSelectDoc(doc.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm text-slate-400 hover:bg-slate-700/50 hover:text-slate-300 transition-colors"
              >
                <FileText size={13} className="shrink-0 text-slate-500" />
                <span className="truncate flex-1">{doc.title}</span>
                {doc.entity_type && (
                  <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium bg-slate-600/50 text-slate-400">
                    {doc.entity_type}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <p className="mt-2 text-center text-xs text-slate-600">{_t.common.loading}</p>
        )}
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedDoc ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-300">
            {selectedDoc.content}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <FileText size={32} className="text-slate-700" />
            <p className="text-sm text-slate-600">{_t.aiHub.noDocSelected}</p>
          </div>
        )}
      </div>
    </div>
  );
}
