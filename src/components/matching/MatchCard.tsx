"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import type { MatchScoreRow } from "@/lib/matching/types";

interface MatchCardProps {
  score: MatchScoreRow;
  targetTitle?: string;
  targetEntityType?: string;
  onClick?: () => void;
}

export function MatchCard({
  score,
  targetTitle,
  targetEntityType,
  onClick,
}: MatchCardProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const mt = t.matching as Record<string, string>;

  const total = score.total_score;
  const colorClass =
    total >= 0.7
      ? "bg-emerald-500"
      : total >= 0.4
        ? "bg-amber-500"
        : "bg-red-500";

  const labelClass =
    total >= 0.7
      ? "text-emerald-400"
      : total >= 0.4
        ? "text-amber-400"
        : "text-red-400";

  const matchLabel =
    total >= 0.7
      ? mt.highMatch
      : total >= 0.4
        ? mt.mediumMatch
        : mt.lowMatch;

  const percentage = Math.round(total * 100);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-lg border border-slate-700/50 bg-slate-800/50 p-3 text-left transition-all hover:border-slate-600 hover:bg-slate-800"
      data-cc-id="matching.card"
    >
      {/* Header: title + type badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium text-slate-200 group-hover:text-slate-100">
            {targetTitle || score.target_id.slice(0, 8)}
          </h4>
          {targetEntityType && (
            <span className="mt-0.5 inline-block rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] text-slate-400">
              {targetEntityType}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className={`text-lg font-bold ${labelClass}`}>{percentage}%</span>
          <span className={`text-[10px] ${labelClass}`}>{matchLabel}</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700/50">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Score breakdown */}
      <div className="flex items-center gap-3 text-[10px] text-slate-500">
        <span title={mt.semanticScore}>
          {mt.semanticScore?.split(" ")[0] || "Semantic"}: {Math.round(score.semantic_score * 100)}%
        </span>
        <span title={mt.fieldScore}>
          {mt.fieldScore?.split(" ")[0] || "Field"}: {Math.round(score.field_score * 100)}%
        </span>
        <span title={mt.recencyScore}>
          {mt.recencyScore?.split(" ")[0] || "Recency"}: {Math.round(score.recency_score * 100)}%
        </span>
      </div>

      {/* Field breakdown (if available) */}
      {score.field_breakdown &&
        Object.keys(score.field_breakdown).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(score.field_breakdown)
              .filter(([, v]) => v > 0)
              .slice(0, 4)
              .map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center rounded bg-slate-700/30 px-1.5 py-0.5 text-[9px] text-slate-400"
                >
                  {key.replace("->", " \u2192 ")}: {Math.round(value * 100)}%
                </span>
              ))}
          </div>
        )}

      {/* Last computed */}
      {score.computed_at && (
        <div className="mt-1.5 text-[9px] text-slate-600">
          {mt.lastComputed}: {new Date(score.computed_at).toLocaleString()}
        </div>
      )}
    </button>
  );
}
