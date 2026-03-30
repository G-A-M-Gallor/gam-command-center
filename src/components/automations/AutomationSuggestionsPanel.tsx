'use client';

import { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

interface AutomationSuggestionsPanelProps {
  t: Record<string, string>;
}

interface SuggestionDef {
  titleKey: string;
  descKey: string;
  stepsKey: string;
  difficulty: 'easy' | 'medium' | 'hard';
  impact: 'high' | 'medium' | 'low';
}

const SUGGESTIONS: SuggestionDef[] = [
  { titleKey: 'sug1Title', descKey: 'sug1Desc', stepsKey: 'sug1Steps', difficulty: 'easy', impact: 'high' },
  { titleKey: 'sug2Title', descKey: 'sug2Desc', stepsKey: 'sug2Steps', difficulty: 'medium', impact: 'high' },
  { titleKey: 'sug3Title', descKey: 'sug3Desc', stepsKey: 'sug3Steps', difficulty: 'medium', impact: 'medium' },
  { titleKey: 'sug4Title', descKey: 'sug4Desc', stepsKey: 'sug4Steps', difficulty: 'easy', impact: 'medium' },
  { titleKey: 'sug5Title', descKey: 'sug5Desc', stepsKey: 'sug5Steps', difficulty: 'easy', impact: 'high' },
  { titleKey: 'sug6Title', descKey: 'sug6Desc', stepsKey: 'sug6Steps', difficulty: 'easy', impact: 'low' },
];

const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  hard: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const impactColors: Record<string, string> = {
  high: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  medium: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  low: 'bg-slate-500/10 text-slate-500 border-slate-600/30',
};

export function AutomationSuggestionsPanel({ _t }: AutomationSuggestionsPanelProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const difficultyLabel = (d: string) => {
    if (d === 'easy') return t.easy;
    if (d === 'medium') return t.medium;
    return t.hard;
  };

  const impactLabel = (i: string) => {
    if (i === 'high') return t.high;
    if (i === 'medium') return t.medium;
    return t.low;
  };

  return (
    <div data-cc-id="automations.suggestions">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-200">{t.suggestions}</h3>
        <p className="text-xs text-slate-500">{_t.suggestionsDesc}</p>
      </div>

      <div className="space-y-3">
        {SUGGESTIONS.map((sug, i) => {
          const isExpanded = expandedIdx === i;
          return (
            <div key={i} className="rounded-xl border border-slate-700/50 bg-white/[0.02] transition-colors hover:bg-white/[0.03]">
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
                className="flex w-full items-start gap-3 p-4 text-start"
              >
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">{t[sug.titleKey]}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{t[sug.descKey]}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-medium ${difficultyColors[sug.difficulty]}`}>
                      {t.difficulty}: {difficultyLabel(sug.difficulty)}
                    </span>
                    <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-medium ${impactColors[sug.impact]}`}>
                      {t.impact}: {impactLabel(sug.impact)}
                    </span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-slate-700/30 px-4 pb-4 pt-3">
                  <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {t.learnMore}
                  </h4>
                  <pre className="whitespace-pre-wrap rounded-lg bg-slate-800/50 p-3 text-xs leading-relaxed text-slate-300" dir="ltr">
                    {_t[sug.stepsKey]}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
