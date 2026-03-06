"use client";

import { useEffect, useState, useCallback } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import { routes } from "@/app/dashboard/admin/data";
import { Check, Clock, Circle, ChevronDown, ChevronUp } from "lucide-react";
import {
  getPlanPhases,
  updatePlanPhase,
  type PlanPhase,
} from "@/lib/supabase/planQueries";

// ─── Types ──────────────────────────────────────────────

type PhaseStatus = "complete" | "in-progress" | "planned";

interface PhaseData {
  phase: number;
  nameKey: string;
  descKey: string;
  status: PhaseStatus;
  notes: string;
  notesHe: string;
}

const STATUS_CYCLE: PhaseStatus[] = ["planned", "in-progress", "complete"];

const STATUS_CONFIG: Record<PhaseStatus, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  complete:      { icon: Check,  color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  "in-progress": { icon: Clock,  color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/30" },
  planned:       { icon: Circle, color: "text-slate-500",    bg: "bg-slate-500/10",   border: "border-slate-500/30" },
};

// ─── Page ───────────────────────────────────────────────

export default function PlanPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const pp = t.planPage;
  const [phases, setPhases] = useState<PhaseData[]>([]);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  const statusLabels: Record<PhaseStatus, string> = {
    complete: pp.statusComplete,
    "in-progress": pp.statusInProgress,
    planned: pp.statusPlanned,
  };

  // Compute initial phase data from routes
  useEffect(() => {
    const phaseNames: Record<number, { nameKey: string; descKey: string }> = {
      1: { nameKey: "phase1Name", descKey: "phase1Desc" },
      2: { nameKey: "phase2Name", descKey: "phase2Desc" },
      3: { nameKey: "phase3Name", descKey: "phase3Desc" },
      4: { nameKey: "phase4Name", descKey: "phase4Desc" },
      5: { nameKey: "phase5Name", descKey: "phase5Desc" },
    };

    // Compute status from routes
    const computed: PhaseData[] = [1, 2, 3, 4, 5].map((num) => {
      const phaseRoutes = routes.filter((r) => r.phase === num);
      const allActive = phaseRoutes.length > 0 && phaseRoutes.every((r) => r.status === "active");
      const someActive = phaseRoutes.some((r) => r.status === "active");
      const status: PhaseStatus = allActive ? "complete" : someActive ? "in-progress" : "planned";
      return {
        phase: num,
        ...phaseNames[num],
        status,
        notes: "",
        notesHe: "",
      };
    });

    // Override with Supabase data if available
    getPlanPhases()
      .then((dbPhases) => {
        if (dbPhases.length > 0) {
          const merged = computed.map((p) => {
            const db = dbPhases.find((d) => d.phase === p.phase);
            if (db) {
              return { ...p, status: db.status, notes: db.notes, notesHe: db.notes_he };
            }
            return p;
          });
          setPhases(merged);
        } else {
          setPhases(computed);
        }
      })
      .catch(() => {
        setPhases(computed);
      });
  }, []);

  const handleToggleStatus = useCallback(async (phaseNum: number) => {
    setPhases((prev) => {
      const updated = prev.map((p) => {
        if (p.phase !== phaseNum) return p;
        const idx = STATUS_CYCLE.indexOf(p.status);
        const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
        // fire-and-forget save
        updatePlanPhase(phaseNum, { status: next }).catch(() => {});
        return { ...p, status: next };
      });
      return updated;
    });
  }, []);

  const phaseRoutes = (phaseNum: number) => routes.filter((r) => r.phase === phaseNum);

  const completedCount = phases.filter((p) => p.status === "complete").length;
  const progress = phases.length > 0 ? Math.round((completedCount / phases.length) * 100) : 0;

  return (
    <div className="min-h-screen">
      <PageHeader pageKey="plan" />
      <div className="p-6 space-y-6">
        {/* Overall Progress */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">{pp.overallProgress}</span>
            <span className="text-sm text-slate-400">{progress}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Timeline */}
        <div data-cc-id="plan.timeline" className="relative">
          {/* Connecting line */}
          <div className="absolute start-6 top-0 bottom-0 w-px bg-slate-700" />

          <div className="space-y-4">
            {phases.map((phase) => {
              const config = STATUS_CONFIG[phase.status];
              const StatusIcon = config.icon;
              const pRoutes = phaseRoutes(phase.phase);
              const isExpanded = expandedPhase === phase.phase;
              const activeCount = pRoutes.filter((r) => r.status === "active").length;
              const phaseProgress = pRoutes.length > 0
                ? Math.round((activeCount / pRoutes.length) * 100)
                : 0;
              const phaseName = pp[phase.nameKey as keyof typeof pp] as string;
              const phaseDesc = pp[phase.descKey as keyof typeof pp] as string;

              return (
                <div key={phase.phase} data-cc-id="plan.phase" className="relative ps-14">
                  {/* Timeline dot */}
                  <div className={`absolute start-3 top-4 w-7 h-7 rounded-full flex items-center justify-center ${config.bg} border ${config.border} z-10`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${config.color}`} />
                  </div>

                  {/* Phase card */}
                  <div className={`bg-slate-800/50 border ${config.border} rounded-lg overflow-hidden`}>
                    <div className="px-4 py-3 flex items-center gap-3">
                      {/* Phase number */}
                      <span className={`text-xs font-bold ${config.color}`}>
                        {pp.phase} {phase.phase}
                      </span>

                      {/* Name + description */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-slate-200">{phaseName}</h3>
                        <p className="text-xs text-slate-500 truncate">{phaseDesc}</p>
                      </div>

                      {/* Progress bar (mini) */}
                      <div className="w-20 hidden sm:block">
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              phaseProgress === 100 ? "bg-emerald-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${phaseProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-600">{activeCount}/{pRoutes.length}</span>
                      </div>

                      {/* Status badge (clickable) */}
                      <button
                        onClick={() => handleToggleStatus(phase.phase)}
                        className={`inline-flex items-center gap-1.5 text-xs rounded px-2.5 py-1 border cursor-pointer hover:opacity-80 transition-opacity ${config.bg} ${config.color} ${config.border}`}
                        title={pp.clickToChangeStatus}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusLabels[phase.status]}
                      </button>

                      {/* Expand toggle */}
                      <button
                        onClick={() => setExpandedPhase(isExpanded ? null : phase.phase)}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Expanded routes list */}
                    {isExpanded && (
                      <div className="border-t border-slate-700/50 px-4 py-3">
                        <h4 className="text-xs text-slate-500 uppercase mb-2">{pp.phaseRoutes}</h4>
                        {pRoutes.length === 0 ? (
                          <p className="text-xs text-slate-600 italic">{pp.noRoutes}</p>
                        ) : (
                          <div className="space-y-1.5">
                            {pRoutes.map((route) => {
                              const RouteIcon = route.icon;
                              const isActive = route.status === "active";
                              return (
                                <div key={route.id} className="flex items-center gap-2.5 text-sm">
                                  <RouteIcon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-slate-600"}`} />
                                  <span className={isActive ? "text-slate-300" : "text-slate-600"}>
                                    {language === "he" ? route.nameHe : route.name}
                                  </span>
                                  <span className={`text-[10px] ms-auto ${isActive ? "text-emerald-500" : "text-slate-600"}`}>
                                    v{route.version}
                                  </span>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-600"}`} />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
