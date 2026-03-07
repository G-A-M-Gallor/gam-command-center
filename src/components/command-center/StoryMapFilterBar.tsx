'use client';

import { type Ref } from 'react';
import { Search, X } from 'lucide-react';

const COLORS = [
  { id: 'slate', dot: 'bg-slate-400' },
  { id: 'purple', dot: 'bg-purple-400' },
  { id: 'blue', dot: 'bg-blue-400' },
  { id: 'emerald', dot: 'bg-emerald-400' },
  { id: 'amber', dot: 'bg-amber-400' },
  { id: 'red', dot: 'bg-red-400' },
  { id: 'cyan', dot: 'bg-cyan-400' },
  { id: 'rose', dot: 'bg-rose-400' },
];

const TYPES = ['epic', 'feature', 'story'] as const;

interface StoryMapFilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  typeFilter: Set<string>;
  setTypeFilter: (f: Set<string>) => void;
  colorFilter: Set<string>;
  setColorFilter: (f: Set<string>) => void;
  searchInputRef?: Ref<HTMLInputElement>;
  t: {
    filterSearch: string;
    clearFilters: string;
    epic: string;
    feature: string;
    story: string;
  };
}

export function StoryMapFilterBar({
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  colorFilter,
  setColorFilter,
  searchInputRef,
  t,
}: StoryMapFilterBarProps) {
  const hasFilters = searchQuery || typeFilter.size < 3 || colorFilter.size > 0;

  const toggleType = (type: string) => {
    const next = new Set(typeFilter);
    if (next.has(type)) {
      if (next.size > 1) next.delete(type);
    } else {
      next.add(type);
    }
    setTypeFilter(next);
  };

  const toggleColor = (colorId: string) => {
    const next = new Set(colorFilter);
    if (next.has(colorId)) next.delete(colorId);
    else next.add(colorId);
    setColorFilter(next);
  };

  const clearAll = () => {
    setSearchQuery('');
    setTypeFilter(new Set(TYPES));
    setColorFilter(new Set());
  };

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.filterSearch}
          className="h-8 w-48 rounded-lg border border-slate-700 bg-slate-800/60 ps-8 pe-2 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-purple-500/50"
        />
      </div>

      {/* Type pills */}
      <div className="flex items-center gap-1">
        {TYPES.map((type) => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              typeFilter.has(type)
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            {t[type as keyof typeof t]}
          </button>
        ))}
      </div>

      {/* Color dots */}
      <div className="flex items-center gap-1">
        {COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => toggleColor(c.id)}
            className={`h-4 w-4 rounded-full transition-all ${c.dot} ${
              colorFilter.has(c.id)
                ? 'ring-2 ring-white/40 scale-110'
                : 'opacity-40 hover:opacity-70'
            }`}
          />
        ))}
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X size={10} />
          {t.clearFilters}
        </button>
      )}
    </div>
  );
}
