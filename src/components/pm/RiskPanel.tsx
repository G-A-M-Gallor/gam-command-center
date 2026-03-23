"use client";
// ===================================================
// GAM Command Center — Risk Panel
// Displays risks with level-based colors
// ===================================================

import { AlertTriangle, Info, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Risk, RiskLevel } from "@/lib/pm-types";

interface RiskPanelProps {
  risks: Risk[];
  className?: string;
}

export function RiskPanel({ risks, className }: RiskPanelProps) {
  if (!risks.length) {
    return (
      <div className={cn("p-6 bg-slate-800/30 rounded-xl border border-slate-700", className)}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-emerald-400 rounded-full" />
          <h3 className="text-lg font-medium text-white">סטטוס</h3>
        </div>
        <p className="text-slate-400">✅ הכל תקין — אין סיכונים פעילים</p>
      </div>
    );
  }

  const sortedRisks = [...risks].sort((a, b) => {
    const order = { high: 0, medium: 1, info: 2 };
    return order[a.level] - order[b.level];
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-medium text-white">סיכונים ואיומים</h3>
        <span className="text-sm text-slate-400">({risks.length})</span>
      </div>

      <div className="space-y-3">
        {sortedRisks.map((risk, i) => (
          <RiskCard key={i} risk={risk} />
        ))}
      </div>
    </div>
  );
}

function RiskCard({ risk }: { risk: Risk }) {
  const config = getRiskConfig(risk.level);

  return (
    <div
      className={cn(
        "p-4 rounded-lg border",
        config.bg,
        config.border
      )}
    >
      <div className="flex items-start gap-3">
        <config.icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.iconColor)} />
        <div className="flex-1 min-w-0">
          <h4 className={cn("font-medium", config.textColor)}>{risk.title}</h4>
          <p className={cn("text-sm mt-1", config.descColor)}>
            {risk.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function getRiskConfig(level: RiskLevel) {
  switch (level) {
    case "high":
      return {
        icon: AlertTriangle,
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        iconColor: "text-red-400",
        textColor: "text-red-300",
        descColor: "text-red-400/80",
      };
    case "medium":
      return {
        icon: Clock,
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        iconColor: "text-amber-400",
        textColor: "text-amber-300",
        descColor: "text-amber-400/80",
      };
    case "info":
      return {
        icon: Info,
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        iconColor: "text-blue-400",
        textColor: "text-blue-300",
        descColor: "text-blue-400/80",
      };
  }
}