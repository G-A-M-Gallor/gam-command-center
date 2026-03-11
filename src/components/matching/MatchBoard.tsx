"use client";

import { useState } from "react";
import { RefreshCw, ArrowUpDown, Filter } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { MatchCard } from "./MatchCard";
import type { MatchScoreRow } from "@/lib/matching/types";

interface MatchBoardProps {
  sourceTitle: string;
  sourceType: string;
  scores: MatchScoreRow[];
  targetTitles: Record<string, string>;
  targetTypes: Record<string, string>;
  loading: boolean;
  onRefresh: () => void;
  onCardClick?: (targetId: string) => void;
}

type SortField = "total" | "semantic" | "field" | "recency";

export function MatchBoard({
  sourceTitle,
  sourceType,
  scores,
  targetTitles,
  targetTypes,
  loading,
  onRefresh,
  onCardClick,
}: MatchBoardProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const mt = t.matching as Record<string, string>;

  const [sortBy, setSortBy] = useState<SortField>("total");
  const [minScore, setMinScore] = useState<number>(0);

  // Sort and filter scores
  const sorted = [...scores]
    .filter((s) => s.total_score >= minScore)
    .sort((a, b) => {
      switch (sortBy) {
        case "semantic":
          return b.semantic_score - a.semantic_score;
        case "field":
          return b.field_score - a.field_score;
        case "recency":
          return b.recency_score - a.recency_score;
        default:
          return b.total_score - a.total_score;
      }
    });

  return (
    <div data-cc-id="matching.board" className="flex flex-col h-full">
      {/* Source info header */}
      <div className="shrink-0 border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-200">{sourceTitle}</h3>
            <span className="text-[11px] text-slate-500">
              {sourceType} &middot; {sorted.length} {mt.topMatches?.toLowerCase() || "matches"}
            </span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
            title={mt.refresh}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Sort + Filter controls */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-slate-800/50 p-0.5">
            <ArrowUpDown className="h-3 w-3 text-slate-500 mx-1" />
            {(["total", "semantic", "field", "recency"] as SortField[]).map(
              (field) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => setSortBy(field)}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
                    sortBy === field
                      ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {field === "total"
                    ? mt.score || "Score"
                    : field === "semantic"
                      ? (mt.semanticScore || "Semantic").split(" ")[0]
                      : field === "field"
                        ? (mt.fieldScore || "Field").split(" ")[0]
                        : (mt.recencyScore || "Recency").split(" ")[0]}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-1">
            <Filter className="h-3 w-3 text-slate-500" />
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="rounded bg-slate-800/50 border border-slate-700/50 px-1.5 py-0.5 text-[10px] text-slate-400"
            >
              <option value={0}>All</option>
              <option value={0.3}>30%+</option>
              <option value={0.5}>50%+</option>
              <option value={0.7}>70%+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-500 mb-2" />
            <span className="text-sm text-slate-500">{mt.loadingMatches}</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-sm text-slate-500">{mt.noMatches}</span>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {sorted.map((score) => (
              <MatchCard
                key={score.id || `${score.source_id}-${score.target_id}`}
                score={score}
                targetTitle={targetTitles[score.target_id]}
                targetEntityType={targetTypes[score.target_id]}
                onClick={
                  onCardClick
                    ? () => onCardClick(score.target_id)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
