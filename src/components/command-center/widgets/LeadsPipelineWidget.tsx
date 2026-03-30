"use client";

import { useState, useEffect } from "react";
import { RefreshCw, _ExternalLink } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";
import type { WidgetSize } from "./WidgetRegistry";
import Link from "next/link";

// ─── Pipeline stage definitions ──────────────────────────
const PIPELINE_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
] as const;

type PipelineStage = (typeof PIPELINE_STAGES)[number];

const STAGE_COLORS: Record<PipelineStage, { bar: string; bg: string; text: string }> = {
  lead:         { bar: "bg-gray-500",    bg: "bg-gray-500/10",    text: "text-gray-400" },
  qualified:    { bar: "bg-blue-500",    bg: "bg-blue-500/10",    text: "text-blue-400" },
  proposal:     { bar: "bg-purple-500",  bg: "bg-purple-500/10",  text: "text-purple-400" },
  negotiation:  { bar: "bg-amber-500",   bg: "bg-amber-500/10",   text: "text-amber-400" },
  closed_won:   { bar: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  closed_lost:  { bar: "bg-red-500",     bg: "bg-red-500/10",     text: "text-red-400" },
};

// i18n keys for each stage
const STAGE_I18N_KEYS: Record<PipelineStage, "stageLead" | "stageQualified" | "stageProposal" | "stageNegotiation" | "stageClosedWon" | "stageClosedLost"> = {
  lead: "stageLead",
  qualified: "stageQualified",
  proposal: "stageProposal",
  negotiation: "stageNegotiation",
  closed_won: "stageClosedWon",
  closed_lost: "stageClosedLost",
};

type StageCounts = Record<PipelineStage, number>;

function emptyCounts(): StageCounts {
  return {
    lead: 0,
    qualified: 0,
    proposal: 0,
    negotiation: 0,
    closed_won: 0,
    closed_lost: 0,
  };
}

// ─── Panel (expanded dropdown) ───────────────────────────
export function LeadsPipelinePanel() {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const [counts, setCounts] = useState<StageCounts | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vb_records")
        .select("meta")
        .eq("entity_type", "lead");

      if (error) throw error;

      const _grouped = emptyCounts();
      for (const row of data || []) {
        const stage = (row.meta as Record<string, unknown>)?.pipeline_stage as string | undefined;
        if (stage && stage in _grouped) {
          grouped[stage as PipelineStage]++;
        } else {
          // Records without a stage count as "lead"
          grouped.lead++;
        }
      }
      setCounts(_grouped);
    } catch {
      setCounts(emptyCounts());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const totalActive = counts
    ? counts.lead + counts.qualified + counts.proposal + counts.negotiation
    : 0;

  const maxCount = counts ? Math.max(...Object.values(counts), 1) : 1;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {t.widgets.leadsPipeline}
          </span>
          {!loading && counts && (
            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
              {totalActive} {_t.widgets.activeLeads}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={fetchPipeline}
          disabled={loading}
          className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300 disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Funnel bars */}
      <div className="space-y-2">
        {PIPELINE_STAGES.map((stage) => {
          const count = counts?.[stage] ?? 0;
          const colors = STAGE_COLORS[stage];
          const widthPct = counts ? Math.max((count / maxCount) * 100, 4) : 0;
          const i18nKey = STAGE_I18N_KEYS[stage];

          return (
            <div key={stage} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${colors.text}`}>
                  {_t.widgets[i18nKey]}
                </span>
                <span className="text-slate-500 tabular-nums">
                  {loading ? (
                    <span className="inline-block h-3 w-5 animate-pulse rounded bg-slate-700" />
                  ) : (
                    count
                  )}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800">
                {loading ? (
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-slate-700" />
                ) : (
                  <div
                    className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                    style={{ width: `${widthPct}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <div className="pt-1 border-t border-slate-700/50">
        <Link
          href="/dashboard/entities/lead"
          className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300"
        >
          <ExternalLink size={11} />
          {t.widgets.viewAllLeads}
        </Link>
      </div>
    </div>
  );
}

// ─── Bar content (collapsed widget in TopBar) ────────────
export function LeadsPipelineBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { count, error } = await supabase
          .from("vb_records")
          .select("id", { count: "exact", head: true })
          .eq("entity_type", "lead")
          .not("meta->pipeline_stage", "in", '("closed_won","closed_lost")');

        if (!error) setTotal(count ?? 0);
      } catch {
        /* silent */
      }
    })();
  }, []);

  if (size < 2) return null;

  return (
    <span className="truncate text-xs text-slate-400">
      {total !== null ? `${total} ${t.widgets.activeLeads}` : _t.widgets.leadsPipelineBar}
    </span>
  );
}
