'use client';

import { useState, useEffect } from 'react';
import { Map, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import { fetchStoryCardsForEntity } from '@/lib/supabase/storyCardQueries';

interface Props {
  noteId: string;
}

export function StoryCardBackRefPanel({ noteId }: Props) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const te = t.entities;

  const [expanded, setExpanded] = useState(true);
  const [cards, setCards] = useState<{ storyCardId: string; cardText: string; projectId: string; projectName: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
    setLoading(true);
    fetchStoryCardsForEntity(noteId).then((data) => {
      if (!cancelled) {
        setCards(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [noteId]);

  if (!loading && cards.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-start"
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
        <Map className="h-4 w-4 text-purple-400" />
        <span className="flex-1 text-xs font-medium text-slate-300">{te.storyCardRefs}</span>
        <span className="rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-300">
          {loading ? '...' : cards.length}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.06] px-3 py-2 space-y-1.5">
          {loading ? (
            <div className="flex flex-col gap-1.5">
              {[80, 65].map((w, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-slate-800" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : (
            cards.map((c) => (
              <a
                key={c.storyCardId}
                href={`/dashboard/story-map?project=${c.projectId}`}
                className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-white/[0.08] hover:bg-white/[0.04]"
              >
                <Map className="h-3 w-3 shrink-0 text-purple-400" />
                <div className="min-w-0 flex-1">
                  <div className="truncate">{c.cardText}</div>
                  <div className="truncate text-[10px] text-slate-500">{c.projectName}</div>
                </div>
                <ExternalLink className="h-3 w-3 shrink-0 text-slate-600" />
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
