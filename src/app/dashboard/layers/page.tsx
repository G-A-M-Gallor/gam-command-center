"use client";

import { useState, useEffect } from "react";
import {
  ProjectCard,
  type Project,
} from "@/components/command-center/ProjectCard";
import { getHealthStatus } from "@/components/command-center/HealthBadge";
import { PageHeader } from "@/components/command-center/PageHeader";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";
import { Badge, SkeletonCard } from "@/components/ui";

const FALLBACK_PROJECTS: Project[] = [
  { id: "1", name: "vBrain.io Platform", status: "active", health_score: 85, layer: "product", source: "claude" },
  { id: "2", name: "GAM Command Center", status: "active", health_score: 72, layer: "infrastructure", source: "claude" },
  { id: "3", name: "Client Portal", status: "active", health_score: 45, layer: "client", source: "manual" },
  { id: "4", name: "Origami Sync Pipeline", status: "active", health_score: 92, layer: "infrastructure", source: "trigger" },
  { id: "5", name: "WATI Integration", status: "active", health_score: 28, layer: "product", source: "manual" },
];

export default function LayersPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, status, health_score, layer, source')
          .eq('status', 'active')
          .order('updated_at', { ascending: false });

        if (error || !data || data.length === 0) {
          setProjects(FALLBACK_PROJECTS);
          setIsDemo(true);
        } else {
          setProjects(data);
          setIsDemo(false);
        }
      } catch {
        setProjects(FALLBACK_PROJECTS);
        setIsDemo(true);
      }
      setLoading(false);
    }
    loadProjects();
  }, []);

  const { healthy, atRisk, critical } = projects.reduce(
    (acc, p) => {
      const status = getHealthStatus(p.health_score);
      if (status === "green") acc.healthy++;
      else if (status === "yellow") acc.atRisk++;
      else acc.critical++;
      return acc;
    },
    { healthy: 0, atRisk: 0, critical: 0 }
  );

  const isRtl = language === "he";

  if (loading) {
    return (
      <div className="flex min-h-full flex-col">
        <PageHeader pageKey="layers" />
        <div className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader pageKey="layers" />

      <div className="flex flex-1 flex-col gap-6 pt-6">
        {isDemo && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300">
            <span>⚠️</span>
            <span>{language === 'he' ? 'נתוני הדגמה — אין חיבור ל-Origami. הנתונים אינם אמיתיים.' : 'Demo data — no Origami connection. Data is not real.'}</span>
          </div>
        )}
        <div
          className={`flex flex-wrap items-center gap-4 text-sm ${
            isRtl ? "flex-row-reverse" : ""
          }`}
        >
          <span className="font-medium text-slate-300">
            {t.layers.summaryTotal}: {projects.length} {t.layers.summaryProjects}
          </span>
          <Badge intent="success" dot>{t.health.healthy}: {healthy}</Badge>
          <Badge intent="warning" dot>{t.health.atRisk}: {atRisk}</Badge>
          <Badge intent="danger" dot>{t.health.critical}: {critical}</Badge>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="min-w-0">
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
