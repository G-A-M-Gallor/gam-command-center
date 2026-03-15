"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Map,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { HealthBadge, getHealthStatus } from "@/components/command-center/HealthBadge";
import { Badge, SkeletonCard } from "@/components/ui";
import type { Project } from "@/components/command-center/ProjectCard";

interface Document {
  id: string;
  title: string;
  updated_at: string;
}

interface StoryCard {
  id: string;
  text: string;
  type: string;
  col: number;
  row: number;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { language } = useSettings();
  const t = getTranslations(language);
  const pd = t.projectDetail;
  const isRtl = language === "he";
  const localeMap: Record<string, string> = { he: "he-IL", en: "en-US", ru: "ru-RU" };

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [storyCards, setStoryCards] = useState<StoryCard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProject = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, health_score, layer, source")
        .eq("id", id)
        .single();

      if (error || !data) {
        setProject(null);
      } else {
        setProject(data);
      }

      // Load related documents
      const { data: docs } = await supabase
        .from("vb_records")
        .select("id, title, updated_at")
        .eq("project_id", id)
        .order("updated_at", { ascending: false })
        .limit(10);
      setDocuments(docs || []);

      // Load related story cards
      const { data: cards } = await supabase
        .from("story_cards")
        .select("id, text, type, col, row")
        .eq("project_id", id)
        .order("sort_order", { ascending: true })
        .limit(20);
      setStoryCards(cards || []);
    } catch {
      setProject(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-slate-400">
          {pd.notFound}
        </p>
        <button
          onClick={() => router.push("/dashboard/layers")}
          className="flex items-center gap-2 rounded-lg bg-slate-700/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
        >
          {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          {pd.backToLayers}
        </button>
      </div>
    );
  }

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

  const healthStatus = getHealthStatus(project.health_score);
  const epicCount = storyCards.filter((c) => c.type === "epic").length;
  const storyCount = storyCards.filter((c) => c.type !== "epic").length;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Back button + title */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/layers")}
          className="flex items-center gap-1.5 rounded-lg bg-slate-800/60 px-3 py-1.5 text-sm text-slate-400 transition-colors hover:text-slate-200"
        >
          {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          {pd.layers}
        </button>
        <div className="h-4 w-px bg-slate-700" />
        <h1 className="text-lg font-semibold text-slate-100">{project.name}</h1>
        <HealthBadge score={project.health_score} />
      </div>

      {/* Info cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/30 p-4">
          <p className="text-[11px] text-slate-500">{pd.layer}</p>
          <p className="mt-1 text-sm font-medium text-slate-200">{layerLabel}</p>
        </div>
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/30 p-4">
          <p className="text-[11px] text-slate-500">{pd.source}</p>
          <p className="mt-1 text-sm font-medium text-slate-200">{sourceLabel}</p>
        </div>
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/30 p-4">
          <p className="text-[11px] text-slate-500">{pd.health}</p>
          <p className={`mt-1 text-sm font-medium ${
            healthStatus === "green" ? "text-emerald-400" : healthStatus === "yellow" ? "text-amber-400" : "text-red-400"
          }`}>
            {project.health_score}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/30 p-4">
          <p className="text-[11px] text-slate-500">{pd.status}</p>
          <p className="mt-1 text-sm font-medium text-emerald-400">{t.layers.active}</p>
        </div>
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Documents */}
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/25 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-blue-400" />
              <h2 className="text-sm font-medium text-slate-200">
                {pd.documents}
              </h2>
              <Badge intent="neutral" size="md">{documents.length}</Badge>
            </div>
            <button
              onClick={() => router.push("/dashboard/editor")}
              className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300"
            >
              {pd.newDoc}
              <ExternalLink size={10} />
            </button>
          </div>
          {documents.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-600">
              {pd.noDocuments}
            </p>
          ) : (
            <div className="space-y-1.5">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => router.push(`/dashboard/editor?id=${doc.id}`)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-start transition-colors hover:bg-slate-700/30"
                >
                  <span className="truncate text-sm text-slate-300">{doc.title}</span>
                  <span className="shrink-0 text-[10px] text-slate-600">
                    {new Date(doc.updated_at).toLocaleDateString(localeMap[language] || "en-US")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Story Map */}
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/25 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map size={16} className="text-emerald-400" />
              <h2 className="text-sm font-medium text-slate-200">
                {pd.storyMap}
              </h2>
              <Badge intent="neutral" size="md">
                {epicCount}E / {storyCount}S
              </Badge>
            </div>
            <button
              onClick={() => router.push(`/dashboard/story-map?project=${id}`)}
              className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300"
            >
              {pd.openMap}
              <ExternalLink size={10} />
            </button>
          </div>
          {storyCards.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-600">
              {pd.noStoryCards}
            </p>
          ) : (
            <div className="space-y-1.5">
              {storyCards.slice(0, 8).map((card) => (
                <div
                  key={card.id}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-700/30"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      card.type === "epic" ? "bg-purple-400" : "bg-blue-400"
                    }`}
                  />
                  <span className="truncate text-sm text-slate-300">{card.text}</span>
                  <span className="shrink-0 rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {card.type}
                  </span>
                </div>
              ))}
              {storyCards.length > 8 && (
                <p className="text-center text-[11px] text-slate-600">
                  +{storyCards.length - 8} {pd.more}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
