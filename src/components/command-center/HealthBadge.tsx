"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";

export type HealthStatus = "green" | "yellow" | "red";

export function getHealthStatus(score: number): HealthStatus {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
}

const statusConfig: Record<
  HealthStatus,
  { bg: string; text: string; labelKey: "healthy" | "atRisk" | "critical" }
> = {
  green: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    labelKey: "healthy",
  },
  yellow: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    labelKey: "atRisk",
  },
  red: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    labelKey: "critical",
  },
};

interface HealthBadgeProps {
  score: number;
  showLabel?: boolean;
}

export function HealthBadge({ score, showLabel = true }: HealthBadgeProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const status = getHealthStatus(score);
  const config = statusConfig[status];
  const label =
    config.labelKey === "healthy"
      ? t.health.healthy
      : config.labelKey === "atRisk"
        ? t.health.atRisk
        : t.health.critical;

  return (
    <span
      data-cc-id="badge.health"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "green"
            ? "bg-emerald-400"
            : status === "yellow"
              ? "bg-amber-400"
              : "bg-red-400"
        }`}
      />
      {showLabel && label}
      <span className="opacity-80">({score})</span>
    </span>
  );
}
