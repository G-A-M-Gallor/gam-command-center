"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, _ExternalLink, _X, CheckCircle2, Circle, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations, loc } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";
import type { NotionTask } from "@/lib/notion/client";

// ─── Island Config (static styling + descriptions) ────────

interface IslandConfig {
  layerKey: string; // matches Notion "Layer" field prefix
  emoji: string;
  labelEn: string;
  labelHe: string;
  ring: string;
  bg: string;
  text: string;
  description: { en: string; he: string; ru: string };
}

const ISLAND_CONFIGS: IslandConfig[] = [
  {
    layerKey: "0",
    emoji: "\u{1F534}",
    labelEn: "Foundation",
    labelHe: "תשתית",
    ring: "ring-red-500",
    bg: "bg-red-500/20",
    text: "text-red-400",
    description: {
      en: "Core infrastructure: auth, env vars, CI/CD, DB schema, monitoring.",
      he: "תשתית ליבה: אימות, משתני סביבה, CI/CD, סכמת DB, ניטור.",
      ru: "Базовая инфраструктура: аутентификация, переменные среды, CI/CD, схема БД.",
    },
  },
  {
    layerKey: "1",
    emoji: "\u{1F9F1}",
    labelEn: "Entity Engine",
    labelHe: "מנוע ישויות",
    ring: "ring-blue-500",
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    description: {
      en: "Entity management: CRUD, fields, types, templates, Origami sync.",
      he: "ניהול ישויות: CRUD, שדות, סוגים, תבניות, סנכרון Origami.",
      ru: "Управление сущностями: CRUD, поля, типы, шаблоны, синхронизация Origami.",
    },
  },
  {
    layerKey: "2",
    emoji: "\u{1F517}",
    labelEn: "Views & Relations",
    labelHe: "תצוגות וקשרים",
    ring: "ring-emerald-500",
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    description: {
      en: "Views, relations, Work Manager agents, Notion write-back, personas.",
      he: "תצוגות, קשרים, סוכני Work Manager, כתיבה ל-Notion, פרסונות.",
      ru: "Представления, связи, агенты Work Manager, запись в Notion, персоны.",
    },
  },
  {
    layerKey: "3",
    emoji: "\u{1F3E2}",
    labelEn: "Business Module",
    labelHe: "מודול עסקי",
    ring: "ring-amber-500",
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    description: {
      en: "Business logic: chat, intent detection, advisor AI, Mattermost, testing.",
      he: "לוגיקה עסקית: צ'אט, זיהוי כוונה, AI ייעוצי, Mattermost, בדיקות.",
      ru: "Бизнес-логика: чат, определение намерений, AI-консультант, тестирование.",
    },
  },
  {
    layerKey: "4",
    emoji: "\u{1F310}",
    labelEn: "Platform",
    labelHe: "פלטפורמה",
    ring: "ring-purple-500",
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    description: {
      en: "Platform: multi-tenant, API gateway, self-building, model router.",
      he: "פלטפורמה: multi-tenant, שער API, בנייה עצמית, ניתוב מודלים.",
      ru: "Платформа: мультитенантность, API шлюз, самосборка, маршрутизация моделей.",
    },
  },
  {
    layerKey: "5",
    emoji: "\u{1F680}",
    labelEn: "SaaS",
    labelHe: "SaaS",
    ring: "ring-yellow-400",
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    description: {
      en: "SaaS launch: public APIs, client widgets, market index.",
      he: "השקת SaaS: ממשקי API ציבוריים, ווידג'טים ללקוחות, מדד שוק.",
      ru: "Запуск SaaS: публичные API, виджеты клиентов, рыночный индекс.",
    },
  },
];

// ─── Derived types ────────────────────────────────────────

interface PhaseData {
  config: IslandConfig;
  tasks: NotionTask[];
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Done: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  "In Progress": { bg: "bg-blue-500/20", text: "text-blue-400" },
  "Ready for QA": { bg: "bg-purple-500/20", text: "text-purple-400" },
  Blocked: { bg: "bg-red-500/20", text: "text-red-400" },
  Backlog: { bg: "bg-slate-500/20", text: "text-slate-400" },
};

const PRIORITY_COLORS: Record<string, string> = {
  "P0 Blocker": "text-red-400",
  "P1 Critical": "text-amber-400",
  "P2 Important": "text-blue-400",
  "P3 Nice": "text-slate-400",
};

// ─── Component ────────────────────────────────────────────

export function RoadmapView() {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const rt = (_t as Record<string, unknown>).roadmapPage as Record<string, string> | undefined;

  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);
  const [allTasks, setAllTasks] = useState<NotionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const isRTL = language === "he";

  // ── Fetch tasks from Notion ────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Not authenticated");
        return;
      }
      const res = await fetch("/api/notion/tasks", {
        _headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAllTasks(json.tasks ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── Group tasks by layer ───────────────────────────
  const phases: PhaseData[] = useMemo(() => {
    return ISLAND_CONFIGS.map((config) => {
      const layerTasks = allTasks.filter((task) => {
        const layerNum = task.layer?.match(/^(\d)/)?.[1];
        return layerNum === config.layerKey;
      });
      return {
        config,
        tasks: layerTasks,
        total: layerTasks.length,
        done: layerTasks.filter((_t) => t.status === "Done").length,
        inProgress: layerTasks.filter((_t) => t.status === "In Progress" || t.status === "Ready for QA").length,
        blocked: layerTasks.filter((_t) => t.status === "Blocked").length,
      };
    });
  }, [allTasks]);

  // Unassigned tasks (no layer)
  const unassignedTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const layerNum = task.layer?.match(/^(\d)/)?.[1];
      return !layerNum || !ISLAND_CONFIGS.some((c) => c.layerKey === layerNum);
    });
  }, [allTasks]);

  const totalTasks = allTasks.length;
  const totalDone = allTasks.filter((_t) => t.status === "Done").length;
  const overallProgress = totalTasks > 0 ? totalDone / totalTasks : 0;

  // Current phase = highest phase with any "Done" tasks
  const currentPhase = useMemo(() => {
    let highest = -1;
    for (let i = 0; i < phases.length; i++) {
      if (phases[i].done > 0) highest = i;
    }
    return highest;
  }, [phases]);

  // ── Stars ──────────────────────────────────────────
  const stars = useMemo(() => {
    const result: { x: number; y: number; size: number; delay: number; opacity: number }[] = [];
    let seed = 42;
    const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 35; i++) {
      result.push({ x: rand() * 100, y: rand() * 40, size: rand() > 0.7 ? 3 : 2, delay: rand() * 4, opacity: 0.3 + rand() * 0.7 });
    }
    return result;
  }, []);

  // ── Keyboard ───────────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") { setSelectedPhase(null); return; }
    if (e.key === "ArrowRight") { setSelectedPhase((p) => p === null ? 0 : (p + 1) % phases.length); }
    if (e.key === "ArrowLeft") { setSelectedPhase((p) => p === null ? phases.length - 1 : (p - 1 + phases.length) % phases.length); }
  }, [phases.length]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ── Helpers ────────────────────────────────────────
  const getLabel = (config: IslandConfig) => loc(config, "label", language);
  const getDescription = (config: IslandConfig) =>
    config.description[language as keyof typeof config.description] || config.description.en;

  const getIslandX = (index: number) => {
    const padding = 8;
    return padding + (index / (ISLAND_CONFIGS.length - 1)) * (100 - 2 * padding);
  };
  const getIslandY = (index: number) => 45 + Math.sin(index * 0.9) * 12;

  const selected = selectedPhase !== null ? phases[selectedPhase] : null;

  // Filter tasks in selected phase
  const filteredTasks = useMemo(() => {
    if (!selected) return [];
    if (!statusFilter) return selected.tasks;
    return selected.tasks.filter((_t) => t.status === statusFilter);
  }, [selected, statusFilter]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0f1e]">
      <style>{`
        @keyframes wave { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-25%); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes shipBob { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-6px) rotate(2deg); } }
      `}</style>

      {/* Stars */}
      <div className="pointer-events-none absolute inset-0">
        {stars.map((star, i) => (
          <div key={i} className="absolute animate-pulse rounded-full"
            style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size,
              backgroundColor: i % 5 === 0 ? "#93c5fd" : "#ffffff", opacity: star.opacity,
              animationDelay: `${star.delay}s`, animationDuration: `${2 + star.delay}s` }} />
        ))}
      </div>

      {/* Back button */}
      <Link href="/dashboard"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-2 text-sm text-slate-300 backdrop-blur-sm transition-colors hover:bg-slate-700/80 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        {rt?.back || "Back"}
      </Link>

      {/* Refresh button */}
      <button type="button" onClick={fetchTasks} disabled={loading}
        className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-2 text-sm text-slate-300 backdrop-blur-sm transition-colors hover:bg-slate-700/80 hover:text-white disabled:opacity-50">
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      </button>

      {/* Title + Stats */}
      <div className="relative z-10 pt-6 text-center">
        <h1 className="text-3xl font-bold text-white">{rt?.title || "Roadmap"}</h1>
        {loading ? (
          <p className="mt-1 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading from Notion...
          </p>
        ) : error ? (
          <p className="mt-1 flex items-center justify-center gap-2 text-sm text-red-400">
            <AlertTriangle className="h-3 w-3" /> {error}
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-400">
            {totalDone}/{totalTasks} tasks done ({Math.round(overallProgress * 100)}%)
            {unassignedTasks.length > 0 && ` · ${unassignedTasks.length} unassigned`}
          </p>
        )}
      </div>

      {/* Ocean + Islands */}
      <div className="relative mx-auto mt-8" style={{ height: "55vh", maxWidth: 1200 }}>
        {/* SVG dotted path */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid meet">
          {ISLAND_CONFIGS.slice(0, -1).map((_, i) => {
            const x1 = (getIslandX(i) / 100) * 1200, y1 = (getIslandY(i) / 100) * 600;
            const x2 = (getIslandX(i + 1) / 100) * 1200, y2 = (getIslandY(i + 1) / 100) * 600;
            return (
              <path key={i}
                d={`M ${x1} ${y1} C ${x1 + (x2 - x1) * 0.4} ${y1 - 30}, ${x1 + (x2 - x1) * 0.6} ${y2 - 30}, ${x2} ${y2}`}
                fill="none" stroke={i <= currentPhase ? "rgba(52, 211, 153, 0.4)" : "rgba(148, 163, 184, 0.3)"}
                strokeWidth="2" strokeDasharray="8,8" />
            );
          })}
        </svg>

        {/* Ship at current phase */}
        {currentPhase >= 0 && (
          <div className="absolute z-20 text-3xl"
            style={{ left: `${getIslandX(currentPhase)}%`, top: `${getIslandY(currentPhase) - 10}%`,
              transform: "translateX(-50%)", animation: "shipBob 2.5s ease-in-out infinite" }}>
            {"\u{1F6A2}"}
          </div>
        )}

        {/* Islands */}
        {phases.map((phase, i) => {
          const progress = phase.total > 0 ? phase.done / phase.total : 0;
          return (
            <button key={i} type="button"
              onClick={() => { setSelectedPhase(selectedPhase === i ? null : i); setStatusFilter(null); }}
              className="absolute z-20 flex flex-col items-center transition-transform duration-200 hover:scale-110 focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--cc-accent-500)]"
              style={{ left: `${getIslandX(i)}%`, top: `${getIslandY(i)}%`, transform: "translate(-50%, -50%)",
                animation: "float 3s ease-in-out infinite", animationDelay: `${i * 0.4}s` }}>
              {/* Island circle with progress ring */}
              <div className="relative">
                <div className={`flex h-20 w-20 items-center justify-center rounded-full ring-2 ${phase.config.ring} ${phase.config.bg} ${
                  selectedPhase === i ? "ring-4 scale-110" : ""} transition-all duration-200 sm:h-24 sm:w-24`}>
                  <span className="text-3xl sm:text-4xl">{phase.config.emoji}</span>
                </div>
                {/* Mini progress arc */}
                {phase.total > 0 && (
                  <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                    <circle cx="50" cy="50" r="46" fill="none"
                      stroke={progress === 1 ? "#34d399" : progress > 0.5 ? "#60a5fa" : "#94a3b8"}
                      strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${progress * 289} 289`}
                      transform="rotate(-90 50 50)" />
                  </svg>
                )}
              </div>

              {/* Label */}
              <span className={`mt-2 whitespace-nowrap text-xs font-medium sm:text-sm ${phase.config.text}`}>
                {getLabel(phase.config)}
              </span>

              {/* Task count badge */}
              <span className="mt-1 rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400">
                {loading ? "..." : `${phase.done}/${phase.total}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Waves */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
        <div className="absolute bottom-0 h-16 w-[200%] rounded-t-[40%] bg-blue-500/30" style={{ animation: "wave 8s ease-in-out infinite" }} />
        <div className="absolute bottom-0 h-20 w-[200%] rounded-t-[35%] bg-blue-600/20" style={{ animation: "wave 12s ease-in-out infinite reverse" }} />
        <div className="absolute bottom-0 h-24 w-[200%] rounded-t-[45%] bg-blue-700/10" style={{ animation: "wave 16s ease-in-out infinite" }} />
      </div>

      {/* Quick Nav + Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-700/50 bg-slate-900/95 px-6 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <div className="flex gap-1">
            {phases.map((phase, i) => {
              const progress = phase.total > 0 ? phase.done / phase.total : 0;
              return (
                <button key={i} type="button" onClick={() => { setSelectedPhase(i); setStatusFilter(null); }}
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                    selectedPhase === i
                      ? `${phase.config.bg} ${phase.config.text} ring-1 ${phase.config.ring}`
                      : progress === 1
                        ? "bg-emerald-900/50 text-emerald-400"
                        : i <= currentPhase
                          ? "bg-slate-700 text-white"
                          : "bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                  }`}>
                  {progress === 1 ? "✓" : i}
                </button>
              );
            })}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-blue-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${overallProgress * 100}%` }} />
              </div>
              <span className="text-xs text-slate-500">
                {totalDone}/{totalTasks}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      <div className={`fixed top-0 z-50 h-full w-[28rem] max-w-[90vw] border-l border-slate-700/50 bg-slate-900/95 backdrop-blur-sm transition-transform duration-300 ease-out ${
        isRTL ? "left-0 border-r border-l-0" : "right-0"
      } ${selected ? "translate-x-0" : isRTL ? "-translate-x-full" : "translate-x-full"}`}>
        {selected && (
          <div className="flex h-full flex-col overflow-y-auto p-6 pb-20">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${selected.config.bg} ring-1 ${selected.config.ring}`}>
                  <span className="text-2xl">{selected.config.emoji}</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    L{selected.config.layerKey}: {getLabel(selected.config)}
                  </h2>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                    selected.done === selected.total && selected.total > 0
                      ? "bg-emerald-500/20 text-emerald-400"
                      : selected.inProgress > 0
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-slate-700 text-slate-400"
                  }`}>
                    {selected.done === selected.total && selected.total > 0
                      ? "Complete"
                      : selected.inProgress > 0
                        ? "In Progress"
                        : "Not Started"}
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedPhase(null)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              <div className="rounded-lg bg-slate-800/50 p-2 text-center">
                <div className={`text-lg font-bold ${selected.config.text}`}>{selected.total}</div>
                <div className="text-[10px] text-slate-500">Total</div>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-2 text-center">
                <div className="text-lg font-bold text-emerald-400">{selected.done}</div>
                <div className="text-[10px] text-slate-500">Done</div>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-2 text-center">
                <div className="text-lg font-bold text-blue-400">{selected.inProgress}</div>
                <div className="text-[10px] text-slate-500">Active</div>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-2 text-center">
                <div className="text-lg font-bold text-slate-400">{selected.total - selected.done - selected.inProgress}</div>
                <div className="text-[10px] text-slate-500">Backlog</div>
              </div>
            </div>

            {/* Progress bar */}
            {selected.total > 0 && (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(selected.done / selected.total) * 100}%` }} />
                </div>
                <div className="mt-1 text-right text-[10px] text-slate-500">
                  {Math.round((selected.done / selected.total) * 100)}%
                </div>
              </div>
            )}

            {/* Description */}
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              {getDescription(selected.config)}
            </p>

            {/* Status filter tabs */}
            <div className="mt-4 flex gap-1">
              {[null, "Done", "In Progress", "Backlog", "Blocked"].map((status) => {
                const count = status === null
                  ? selected.total
                  : selected.tasks.filter((_t) => t.status === status).length;
                if (count === 0 && status !== null) return null;
                return (
                  <button key={status ?? "all"} type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                      statusFilter === status
                        ? "bg-slate-700 text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}>
                    {status ?? "All"} ({count})
                  </button>
                );
              })}
            </div>

            {/* Task list */}
            <div className="mt-3 flex flex-col gap-1.5">
              {filteredTasks.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  {selected.total === 0 ? "No tasks in this layer" : "No tasks match filter"}
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const statusStyle = STATUS_COLORS[task.status] ?? STATUS_COLORS.Backlog;
                  const priorityColor = PRIORITY_COLORS[task.priority] ?? "text-slate-500";
                  return (
                    <a key={task.id} href={task.url} target="_blank" rel="noopener noreferrer"
                      className="group flex items-start gap-2 rounded-lg bg-slate-800/40 p-2.5 transition-colors hover:bg-slate-800/80">
                      {/* Status icon */}
                      {task.status === "Done" ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      ) : task.status === "In Progress" ? (
                        <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-blue-400" />
                      ) : (
                        <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-slate-200 group-hover:text-white">
                          {task.task}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className={`rounded px-1 py-0.5 text-[9px] ${statusStyle.bg} ${statusStyle.text}`}>
                            {task.status}
                          </span>
                          {task.priority && (
                            <span className={`text-[9px] ${priorityColor}`}>{task.priority}</span>
                          )}
                          {task.effort && (
                            <span className="text-[9px] text-slate-600">{task.effort}</span>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  );
                })
              )}
            </div>

            {/* Open in Notion */}
            <div className="mt-auto pt-4">
              <button type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                onClick={() => window.open("https://www.notion.so/25a2ef6028654c6abbe57c6fb97504ed?v=9d21d5dfefd848d1a2b0a087d3202cce", "_blank")}>
                <ExternalLink className="h-4 w-4" />
                {rt?.openInNotion || "Open in Notion"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
