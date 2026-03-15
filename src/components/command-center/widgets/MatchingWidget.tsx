"use client";

import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";
import type { WidgetSize } from "./WidgetRegistry";
import type { MatchScoreRow } from "@/lib/matching/types";

interface TopMatch {
  score: MatchScoreRow;
  title: string;
  entityType: string;
}

export function MatchingPanel() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const mt = t.matching as Record<string, string>;

  const [topMatches, setTopMatches] = useState<TopMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentMatches = async () => {
    setLoading(true);
    try {
      // Get recent high-score matches
      const { data: scores } = await supabase
        .from("matching_scores")
        .select("*")
        .gte("total_score", 0.5)
        .order("computed_at", { ascending: false })
        .limit(5);

      if (!scores || scores.length === 0) {
        setTopMatches([]);
        setLoading(false);
        return;
      }

      // Fetch target titles
      const targetIds = scores.map((s: MatchScoreRow) => s.target_id);
      const { data: notes } = await supabase
        .from("vb_records")
        .select("id, title, entity_type")
        .in("id", targetIds);

      const noteMap = new Map(
        (notes ?? []).map((n: { id: string; title: string; entity_type: string }) => [n.id, n])
      );

      const matches: TopMatch[] = scores.map((s: MatchScoreRow) => {
        const note = noteMap.get(s.target_id);
        return {
          score: s,
          title: note?.title || s.target_id.slice(0, 8),
          entityType: note?.entity_type || s.target_type,
        };
      });

      setTopMatches(matches);
    } catch {
      setTopMatches([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
    fetchRecentMatches();
  }, []);

  const isRtl = language === "he";

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      data-cc-id="matching.panel"
      className="flex flex-col h-full max-h-[400px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--cc-accent-400)]" />
          <span className="text-xs font-medium text-slate-200">
            {mt.topMatches}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={fetchRecentMatches}
            disabled={loading}
            className="rounded p-1 text-slate-500 transition-colors hover:text-slate-300 disabled:opacity-50"
            title={mt.refresh}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/dashboard/matching"
            className="rounded p-1 text-slate-500 transition-colors hover:text-slate-300"
          >
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="h-4 w-4 animate-spin text-slate-500" />
          </div>
        ) : topMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Sparkles className="h-6 w-6 text-slate-700 mb-2" />
            <p className="text-xs text-slate-500">{mt.noMatches}</p>
            <Link
              href="/dashboard/matching"
              className="mt-2 text-[10px] text-[var(--cc-accent-400)] hover:underline"
            >
              {mt.findMatches}
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {topMatches.map(({ score, title, entityType }) => {
              const pct = Math.round(score.total_score * 100);
              const colorClass =
                score.total_score >= 0.7
                  ? "text-emerald-400"
                  : score.total_score >= 0.4
                    ? "text-amber-400"
                    : "text-red-400";
              const barColor =
                score.total_score >= 0.7
                  ? "bg-emerald-500"
                  : score.total_score >= 0.4
                    ? "bg-amber-500"
                    : "bg-red-500";

              return (
                <Link
                  key={score.id || `${score.source_id}-${score.target_id}`}
                  href={`/dashboard/entities/${entityType}/${score.target_id}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-800/50"
                >
                  <div className="flex-1 min-w-0">
                    <span className="block truncate text-xs text-slate-200">
                      {title}
                    </span>
                    <span className="text-[9px] text-slate-600">
                      {entityType}
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <div className="w-12 h-1 rounded-full bg-slate-700/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${colorClass} w-8 text-end`}>
                      {pct}%
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function MatchingBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const mt = t.matching as Record<string, string>;

  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    async function fetchCount() {
      const { count: total } = await supabase
        .from("matching_scores")
        .select("*", { count: "exact", head: true })
        .gte("total_score", 0.5);
      setCount(total || 0);
    }
    fetchCount();
  }, []);

  if (size < 2) return null;

  return (
    <span className="text-[10px] text-slate-500 truncate">
      {count > 0
        ? `${count} ${mt.topMatches?.toLowerCase() || "matches"}`
        : mt.noMatches || "No matches"}
    </span>
  );
}
