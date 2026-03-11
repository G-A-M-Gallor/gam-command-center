'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { searchNotes } from '@/lib/supabase/entityQueries';
import type { EnrichedEntityLink } from '@/lib/supabase/storyCardQueries';

interface Props {
  storyCardId: string;
  linkedEntities: EnrichedEntityLink[];
  onLink: (storyCardId: string, entityNoteId: string) => void;
  onUnlink: (linkId: string, storyCardId: string) => void;
  t: {
    searchEntity?: string;
    unlinkEntity?: string;
    linkedEntities?: string;
    noLinkedEntities?: string;
  };
}

interface SearchResult {
  id: string;
  title: string;
  entity_type: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  client: 'bg-blue-500/20 text-blue-300',
  project: 'bg-purple-500/20 text-purple-300',
  task: 'bg-amber-500/20 text-amber-300',
  deal: 'bg-emerald-500/20 text-emerald-300',
  lead: 'bg-cyan-500/20 text-cyan-300',
  contact: 'bg-rose-500/20 text-rose-300',
  document: 'bg-slate-500/20 text-slate-300',
  property: 'bg-orange-500/20 text-orange-300',
};

function getTypeBadgeClass(entityType: string | null) {
  if (!entityType) return 'bg-slate-500/20 text-slate-400';
  return TYPE_COLORS[entityType] ?? 'bg-slate-500/20 text-slate-400';
}

export function StoryCardEntityLinker({ storyCardId, linkedEntities, onLink, onUnlink, t }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const notes = await searchNotes(q);
    const linkedIds = new Set(linkedEntities.map((l) => l.entity_note_id));
    setResults(
      (notes ?? [])
        .filter((n) => !linkedIds.has(n.id))
        .slice(0, 8)
        .map((n) => ({ id: n.id, title: n.title, entity_type: n.entity_type ?? null }))
    );
    setSearching(false);
  }, [linkedEntities]);

  const handleInputChange = useCallback(
    (val: string) => {
      setQuery(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(val.trim()), 300);
    },
    [doSearch]
  );

  const handleSelect = useCallback(
    (noteId: string) => {
      onLink(storyCardId, noteId);
      setQuery('');
      setResults([]);
    },
    [storyCardId, onLink]
  );

  return (
    <div className="mt-1.5 space-y-1">
      {/* Existing links */}
      {linkedEntities.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {linkedEntities.map((link) => (
            <span
              key={link.id}
              className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-300"
            >
              <span className="max-w-[80px] truncate">{link.entity_title}</span>
              <button
                type="button"
                onClick={() => onUnlink(link.id, storyCardId)}
                className="text-emerald-400/50 hover:text-red-400"
                title={t.unlinkEntity}
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute start-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={t.searchEntity ?? 'Search entity...'}
          className="w-full rounded bg-slate-900/50 py-1 pe-2 ps-6 text-[11px] text-slate-300 outline-none ring-1 ring-slate-600/50 placeholder:text-slate-600 focus:ring-emerald-500/40"
        />
        {searching && (
          <Loader2 className="absolute end-1.5 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-slate-500" />
        )}
      </div>

      {/* Search results dropdown */}
      {results.length > 0 && (
        <div className="max-h-32 overflow-y-auto rounded border border-slate-700/50 bg-slate-900">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelect(r.id)}
              className="flex w-full items-center gap-1.5 px-2 py-1 text-start text-[11px] text-slate-300 transition-colors hover:bg-slate-800"
            >
              <span className="min-w-0 flex-1 truncate">{r.title}</span>
              {r.entity_type && (
                <span className={`shrink-0 rounded px-1 py-px text-[8px] font-medium ${getTypeBadgeClass(r.entity_type)}`}>
                  {r.entity_type}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
