"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search } from "lucide-react";
import { searchNotes } from "@/lib/supabase/entityQueries";
import { getTranslations } from "@/lib/i18n";

const RECENT_KEY = "cc-ai-recent-mentions";
const MAX_RECENT = 5;

interface MentionResult {
  id: string;
  title: string;
  entity_type: string | null;
}

interface AiEntityMentionProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (entity: MentionResult) => void;
  t: ReturnType<typeof getTranslations>;
}

function getRecentMentions(): MentionResult[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentMention(entity: MentionResult) {
  const recent = getRecentMentions().filter((e) => e.id !== entity.id);
  recent.unshift(entity);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export function AiEntityMention({ isOpen, onClose, onSelect, t }: AiEntityMentionProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MentionResult[]>([]);
  const [recent, setRecent] = useState<MentionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
      setQuery("");
      setResults([]);
      setRecent(getRecentMentions());
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const notes = await searchNotes(q);
      setResults(
        notes.slice(0, 10).map((n) => ({
          id: n.id,
          title: n.title,
          entity_type: n.entity_type,
        }))
      );
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  const handleQueryChange = useCallback((v: string) => {
    setQuery(v);
    setSelectedIdx(0);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(v), 250);
  }, [doSearch]);

  const handleSelect = useCallback((entity: MentionResult) => {
    saveRecentMention(entity);
    onSelect(entity);
    onClose();
  }, [onSelect, onClose]);

  const displayList = query.trim() ? results : recent;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, displayList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && displayList[selectedIdx]) {
      e.preventDefault();
      handleSelect(displayList[selectedIdx]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }, [displayList, selectedIdx, handleSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute bottom-full start-0 mb-1 w-72 rounded-xl border border-slate-600 bg-slate-800 shadow-xl z-50"
      onKeyDown={handleKeyDown}
    >
      {/* Search input */}
      <div className="flex items-center gap-2 border-b border-slate-700 px-3 py-2">
        <Search size={14} className="text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.aiHub.mentionEntity}
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
        />
      </div>

      {/* Results */}
      <div className="max-h-48 overflow-y-auto p-1.5">
        {!query.trim() && recent.length > 0 && (
          <div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-slate-600">
            {t.aiHub.recentEntities}
          </div>
        )}

        {displayList.length === 0 && (
          <p className="px-3 py-3 text-center text-xs text-slate-600">
            {loading ? t.common.loading : query.trim() ? t.aiHub.noEntitiesFound : t.aiHub.mentionEntity}
          </p>
        )}

        {displayList.map((entity, i) => (
          <button
            key={entity.id}
            onClick={() => handleSelect(entity)}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start transition-colors ${
              i === selectedIdx ? "bg-slate-700 text-slate-200" : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px]">{entity.title}</div>
            </div>
            {entity.entity_type && (
              <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium bg-slate-600/50 text-slate-400">
                {entity.entity_type}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
