"use client";

import { useRouter } from "next/navigation";
import { HealthBadge } from "./HealthBadge";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";

export interface Project {
  id: string;
  name: string;
  status: string;
  health_score: number;
  layer: string;
  source: string;
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const router = useRouter();
  const isRtl = language === "he";

  const layerLabel =
    project.layer === "product"
      ? t.layers.product
      : project.layer === "infrastructure"
        ? t.layers.infrastructure
        : t.layers.client;
  const sourceLabel =
    project.source === "claude"
      ? t.layers.claude
      : project.source === "manual"
        ? t.layers.manual
        : t.layers.trigger;
  const statusLabel = t.layers.active;

  return (
    <div
      data-cc-id="card.project"
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/dashboard/layers/${project.id}`)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/dashboard/layers/${project.id}`); } }}
      className="cursor-pointer rounded-lg border border-slate-700/50 bg-slate-800/50 p-4 transition-colors hover:border-slate-600 hover:bg-slate-800/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500/50"
    >
      <div
        className={`flex items-start justify-between gap-3 ${
          isRtl ? "flex-row-reverse" : ""
        }`}
      >
        <div className="min-w-0 flex-1 text-start">
          <h3 data-cc-id="card.project.name" data-cc-text="true" className="truncate font-medium text-slate-100">{project.name}</h3>
          <div
            data-cc-id="card.project.meta"
            className={`mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-400 ${
              isRtl ? "flex-row-reverse" : ""
            }`}
          >
            <span>{layerLabel}</span>
            <span>•</span>
            <span>{sourceLabel}</span>
            <span>•</span>
            <span>{statusLabel}</span>
          </div>
        </div>
        <HealthBadge score={project.health_score} />
      </div>
    </div>
  );
}
