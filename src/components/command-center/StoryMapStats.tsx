'use client';

import type { StoryCard } from '@/lib/supabase/storyCardQueries';
import { ESTIMATIONS } from '@/components/command-center/StoryCard';

const POINTS_MAP: Record<string, number> = Object.fromEntries(
  ESTIMATIONS.map((e) => [e.id, e.points])
);

interface StoryMapStatsProps {
  cards: StoryCard[];
  t: {
    statsEpics: string;
    statsFeatures: string;
    statsStories: string;
    statsCompletion: string;
    statsTotal: string;
    totalPoints: string;
  };
}

export function StoryMapStats({ cards, t }: StoryMapStatsProps) {
  const epics = cards.filter((c) => c.type === 'epic').length;
  const features = cards.filter((c) => c.type === 'feature').length;
  const stories = cards.filter((c) => c.type === 'story').length;

  // Sub-story completion
  const allSubs = cards.flatMap((c) => c.subs || []);
  const totalSubs = allSubs.length;
  const doneSubs = allSubs.filter((s) => s.done).length;
  const completionPct = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;

  // Estimation points
  const totalPoints = cards.reduce((sum, c) => {
    if (c.estimation && POINTS_MAP[c.estimation]) {
      return sum + POINTS_MAP[c.estimation];
    }
    return sum;
  }, 0);

  return (
    <div className="mb-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
      <span>
        <span className="font-semibold text-purple-400">{epics}</span> {t.statsEpics}
      </span>
      <span>
        <span className="font-semibold text-blue-400">{features}</span> {t.statsFeatures}
      </span>
      <span>
        <span className="font-semibold text-slate-300">{stories}</span> {t.statsStories}
      </span>
      <span className="text-slate-600">|</span>
      <span className="flex items-center gap-1.5">
        {t.statsCompletion}:
        <span className="inline-flex h-1.5 w-16 rounded-full bg-slate-700 overflow-hidden">
          <span
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${completionPct}%` }}
          />
        </span>
        <span className="font-medium text-slate-300">{completionPct}%</span>
        {totalSubs > 0 && (
          <span className="text-slate-600">({doneSubs}/{totalSubs})</span>
        )}
      </span>
      {totalPoints > 0 && (
        <>
          <span className="text-slate-600">|</span>
          <span>
            {t.totalPoints}: <span className="font-semibold text-amber-400">{totalPoints}</span>
          </span>
        </>
      )}
      <span className="text-slate-600">|</span>
      <span>
        {t.statsTotal}: <span className="font-medium text-slate-300">{cards.length}</span>
      </span>
    </div>
  );
}
