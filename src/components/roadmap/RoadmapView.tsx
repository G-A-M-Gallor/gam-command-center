"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, X } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";

// ─── Island Data ─────────────────────────────────────────

interface Island {
  phase: number;
  emoji: string;
  labelEn: string;
  labelHe: string;
  tasks: number;
  ring: string;
  bg: string;
  text: string;
  description: {
    en: string;
    he: string;
    ru: string;
  };
}

const ISLANDS: Island[] = [
  {
    phase: 0,
    emoji: "\u{1F534}",
    labelEn: "Security Blockers",
    labelHe: "\u05D7\u05E1\u05D9\u05DE\u05D5\u05EA \u05D0\u05D1\u05D8\u05D7\u05D4",
    tasks: 6,
    ring: "ring-red-500",
    bg: "bg-red-500/20",
    text: "text-red-400",
    description: {
      en: "Critical security issues that must be resolved before any deployment. Auth hardening, RLS policies, API protection.",
      he: "\u05D1\u05E2\u05D9\u05D5\u05EA \u05D0\u05D1\u05D8\u05D7\u05D4 \u05E7\u05E8\u05D9\u05D8\u05D9\u05D5\u05EA \u05E9\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA \u05E4\u05EA\u05E8\u05D5\u05DF \u05DC\u05E4\u05E0\u05D9 \u05DB\u05DC \u05E4\u05E8\u05D9\u05E1\u05D4. \u05D7\u05D9\u05D6\u05D5\u05E7 \u05D0\u05D9\u05DE\u05D5\u05EA, \u05DE\u05D3\u05D9\u05E0\u05D9\u05D5\u05EA RLS, \u05D4\u05D2\u05E0\u05EA API.",
      ru: "\u041A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u044B \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0440\u0435\u0448\u0438\u0442\u044C \u043F\u0435\u0440\u0435\u0434 \u0440\u0430\u0437\u0432\u0451\u0440\u0442\u044B\u0432\u0430\u043D\u0438\u0435\u043C.",
    },
  },
  {
    phase: 1,
    emoji: "\u2699\uFE0F",
    labelEn: "Foundation",
    labelHe: "\u05EA\u05E9\u05EA\u05D9\u05EA",
    tasks: 19,
    ring: "ring-slate-400",
    bg: "bg-slate-500/20",
    text: "text-slate-300",
    description: {
      en: "Core infrastructure setup. Database schema, auth system, CI/CD pipeline, monitoring, and project scaffolding.",
      he: "\u05D4\u05E7\u05DE\u05EA \u05EA\u05E9\u05EA\u05D9\u05EA \u05D1\u05E1\u05D9\u05E1\u05D9\u05EA. \u05E1\u05DB\u05DE\u05EA \u05D1\u05E1\u05D9\u05E1 \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD, \u05DE\u05E2\u05E8\u05DB\u05EA \u05D0\u05D9\u05DE\u05D5\u05EA, CI/CD, \u05E0\u05D9\u05D8\u05D5\u05E8.",
      ru: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 \u0431\u0430\u0437\u043E\u0432\u043E\u0439 \u0438\u043D\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u044B. \u0421\u0445\u0435\u043C\u0430 \u0411\u0414, \u0430\u0443\u0442\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u044F, CI/CD.",
    },
  },
  {
    phase: 2,
    emoji: "\u{1F9F1}",
    labelEn: "Entity Engine",
    labelHe: "\u05DE\u05E0\u05D5\u05E2 \u05D9\u05E9\u05D5\u05D9\u05D5\u05EA",
    tasks: 24,
    ring: "ring-blue-500",
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    description: {
      en: "Entity management system. CRUD operations, Origami sync, real-time updates, and data validation layer.",
      he: "\u05DE\u05E2\u05E8\u05DB\u05EA \u05E0\u05D9\u05D4\u05D5\u05DC \u05D9\u05E9\u05D5\u05D9\u05D5\u05EA. \u05E4\u05E2\u05D5\u05DC\u05D5\u05EA CRUD, \u05E1\u05E0\u05DB\u05E8\u05D5\u05DF \u05DE Origami, \u05E2\u05D3\u05DB\u05D5\u05E0\u05D9\u05DD \u05D1\u05D6\u05DE\u05DF \u05D0\u05DE\u05EA.",
      ru: "\u0421\u0438\u0441\u0442\u0435\u043C\u0430 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0441\u0443\u0449\u043D\u043E\u0441\u0442\u044F\u043C\u0438. CRUD, \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F Origami, \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0432 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u043C \u0432\u0440\u0435\u043C\u0435\u043D\u0438.",
    },
  },
  {
    phase: 3,
    emoji: "\u{1F4DD}",
    labelEn: "Note + UI",
    labelHe: "\u05E4\u05EA\u05E7\u05D9\u05DD + UI",
    tasks: 40,
    ring: "ring-emerald-500",
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    description: {
      en: "Document editor, story map, functional map, and core UI components. Rich text editing with templates.",
      he: "\u05E2\u05D5\u05E8\u05DA \u05DE\u05E1\u05DE\u05DB\u05D9\u05DD, \u05DE\u05E4\u05EA \u05E1\u05D9\u05E4\u05D5\u05E8, \u05DE\u05E4\u05D4 \u05E4\u05D5\u05E0\u05E7\u05E6\u05D9\u05D5\u05E0\u05DC\u05D9\u05EA \u05D5\u05E7\u05D5\u05DE\u05E4\u05D5\u05E0\u05E0\u05D8\u05D5\u05EA UI \u05DE\u05E8\u05DB\u05D6\u05D9\u05D5\u05EA.",
      ru: "\u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432, \u043A\u0430\u0440\u0442\u0430 \u0438\u0441\u0442\u043E\u0440\u0438\u0439, \u0444\u0443\u043D\u043A\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u0430\u044F \u043A\u0430\u0440\u0442\u0430 \u0438 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B UI.",
    },
  },
  {
    phase: 4,
    emoji: "\u{1F3E2}",
    labelEn: "Business Module",
    labelHe: "\u05DE\u05D5\u05D3\u05D5\u05DC \u05E2\u05E1\u05E7\u05D9",
    tasks: 46,
    ring: "ring-amber-500",
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    description: {
      en: "Business logic layer. Client management, pipeline tracking, reporting, and Origami deep integration.",
      he: "\u05E9\u05DB\u05D1\u05EA \u05DC\u05D5\u05D2\u05D9\u05E7\u05D4 \u05E2\u05E1\u05E7\u05D9\u05EA. \u05E0\u05D9\u05D4\u05D5\u05DC \u05DC\u05E7\u05D5\u05D7\u05D5\u05EA, \u05DE\u05E2\u05E7\u05D1 \u05E6\u05E0\u05E8\u05EA, \u05D3\u05D5\u05D7\u05D5\u05EA \u05D5\u05D0\u05D9\u05E0\u05D8\u05D2\u05E8\u05E6\u05D9\u05D4 \u05E2\u05DE\u05D5\u05E7\u05D4 \u05E2\u05DD Origami.",
      ru: "\u0411\u0438\u0437\u043D\u0435\u0441-\u043B\u043E\u0433\u0438\u043A\u0430. \u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043A\u043B\u0438\u0435\u043D\u0442\u0430\u043C\u0438, \u043E\u0442\u0441\u043B\u0435\u0436\u0438\u0432\u0430\u043D\u0438\u0435 \u043F\u0430\u0439\u043F\u043B\u0430\u0439\u043D\u0430, \u043E\u0442\u0447\u0451\u0442\u043D\u043E\u0441\u0442\u044C.",
    },
  },
  {
    phase: 5,
    emoji: "\u{1F310}",
    labelEn: "Platform",
    labelHe: "\u05E4\u05DC\u05D8\u05E4\u05D5\u05E8\u05DE\u05D4",
    tasks: 29,
    ring: "ring-purple-500",
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    description: {
      en: "Platform features. Multi-tenant architecture, API gateway, webhooks, third-party integrations, and analytics.",
      he: "\u05EA\u05DB\u05D5\u05E0\u05D5\u05EA \u05E4\u05DC\u05D8\u05E4\u05D5\u05E8\u05DE\u05D4. \u05D0\u05E8\u05DB\u05D9\u05D8\u05E7\u05D8\u05D5\u05E8\u05EA multi-tenant, \u05E9\u05E2\u05E8 API, webhooks, \u05D0\u05D9\u05E0\u05D8\u05D2\u05E8\u05E6\u05D9\u05D5\u05EA \u05D5\u05D0\u05E0\u05DC\u05D9\u05D8\u05D9\u05E7\u05D4.",
      ru: "\u0424\u0443\u043D\u043A\u0446\u0438\u0438 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B. \u041C\u0443\u043B\u044C\u0442\u0438-\u0442\u0435\u043D\u0430\u043D\u0442\u043D\u0430\u044F \u0430\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u0443\u0440\u0430, API \u0448\u043B\u044E\u0437, \u0432\u0435\u0431\u0445\u0443\u043A\u0438, \u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u0438.",
    },
  },
  {
    phase: 6,
    emoji: "\u{1F680}",
    labelEn: "SaaS Launch",
    labelHe: "\u05D4\u05E9\u05E7\u05EA SaaS",
    tasks: 26,
    ring: "ring-yellow-400",
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    description: {
      en: "SaaS launch preparation. Billing, onboarding flows, documentation, marketing site, and public API.",
      he: "\u05D4\u05DB\u05E0\u05D4 \u05DC\u05D4\u05E9\u05E7\u05EA SaaS. \u05D7\u05D9\u05D5\u05D1\u05D9\u05DD, \u05EA\u05D4\u05DC\u05D9\u05DB\u05D9 \u05D4\u05E6\u05D8\u05E8\u05E4\u05D5\u05EA, \u05EA\u05D9\u05E2\u05D5\u05D3, \u05D0\u05EA\u05E8 \u05E9\u05D9\u05D5\u05D5\u05E7 \u05D5-API \u05E6\u05D9\u05D1\u05D5\u05E8\u05D9.",
      ru: "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u043A \u0437\u0430\u043F\u0443\u0441\u043A\u0443 SaaS. \u0411\u0438\u043B\u043B\u0438\u043D\u0433, \u043E\u043D\u0431\u043E\u0440\u0434\u0438\u043D\u0433, \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430\u0446\u0438\u044F, \u043C\u0430\u0440\u043A\u0435\u0442\u0438\u043D\u0433\u043E\u0432\u044B\u0439 \u0441\u0430\u0439\u0442.",
    },
  },
];

const TOTAL_TASKS = ISLANDS.reduce((sum, i) => sum + i.tasks, 0);
const CURRENT_PHASE = 0;

type DetailLevel = "goal" | "epic" | "sprint" | "task";

// ─── Component ───────────────────────────────────────────

export function RoadmapView() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const rt = (t as Record<string, unknown>).roadmapPage as Record<string, string>;

  const [selectedIsland, setSelectedIsland] = useState<number | null>(null);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("goal");

  const isRTL = language === "he";

  // ── Stars (stable random positions) ─────────────────
  const stars = useMemo(() => {
    const result: { x: number; y: number; size: number; delay: number; opacity: number }[] = [];
    // Seeded pseudo-random
    let seed = 42;
    const rand = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 35; i++) {
      result.push({
        x: rand() * 100,
        y: rand() * 40,
        size: rand() > 0.7 ? 3 : 2,
        delay: rand() * 4,
        opacity: 0.3 + rand() * 0.7,
      });
    }
    return result;
  }, []);

  // ── Keyboard navigation ─────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedIsland(null);
        return;
      }
      if (e.key === "ArrowRight") {
        setSelectedIsland((prev) =>
          prev === null ? 0 : (prev + 1) % ISLANDS.length
        );
        return;
      }
      if (e.key === "ArrowLeft") {
        setSelectedIsland((prev) =>
          prev === null ? ISLANDS.length - 1 : (prev - 1 + ISLANDS.length) % ISLANDS.length
        );
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ── Helpers ─────────────────────────────────────────
  const getLabel = (island: Island) =>
    language === "he" ? island.labelHe : island.labelEn;

  const getDescription = (island: Island) =>
    island.description[language as keyof typeof island.description] || island.description.en;

  const selected = selectedIsland !== null ? ISLANDS[selectedIsland] : null;

  // ── Island positions (evenly spaced across viewport) ─
  const getIslandX = (index: number) => {
    const padding = 8; // percentage
    return padding + (index / (ISLANDS.length - 1)) * (100 - 2 * padding);
  };

  const getIslandY = (index: number) => {
    // Sine wave for vertical variation
    return 45 + Math.sin(index * 0.9) * 12;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0f1e]">
      {/* Inline keyframes */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-25%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shipBob {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-6px) rotate(2deg); }
        }
      `}</style>

      {/* ── Stars ───────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute animate-pulse rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              backgroundColor: i % 5 === 0 ? "#93c5fd" : "#ffffff",
              opacity: star.opacity,
              animationDelay: `${star.delay}s`,
              animationDuration: `${2 + star.delay}s`,
            }}
          />
        ))}
      </div>

      {/* ── Back button ─────────────────────────────── */}
      <Link
        href="/dashboard"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-2 text-sm text-slate-300 backdrop-blur-sm transition-colors hover:bg-slate-700/80 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        {rt?.back || "Back"}
      </Link>

      {/* ── Title ───────────────────────────────────── */}
      <div className="relative z-10 pt-6 text-center">
        <h1 className="text-3xl font-bold text-white">
          {rt?.title || "Roadmap"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {rt?.description || "Development phases for vBrain.io"}
        </p>
      </div>

      {/* ── Ocean + Islands area ─────────────────────── */}
      <div className="relative mx-auto mt-8" style={{ height: "55vh", maxWidth: 1200 }}>
        {/* SVG dotted path connecting islands */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1200 600"
          preserveAspectRatio="xMidYMid meet"
        >
          {ISLANDS.slice(0, -1).map((_, i) => {
            const x1 = (getIslandX(i) / 100) * 1200;
            const y1 = (getIslandY(i) / 100) * 600;
            const x2 = (getIslandX(i + 1) / 100) * 1200;
            const y2 = (getIslandY(i + 1) / 100) * 600;
            const cx1 = x1 + (x2 - x1) * 0.4;
            const cy1 = y1 - 30;
            const cx2 = x1 + (x2 - x1) * 0.6;
            const cy2 = y2 - 30;
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                fill="none"
                stroke="rgba(148, 163, 184, 0.3)"
                strokeWidth="2"
                strokeDasharray="8,8"
              />
            );
          })}
        </svg>

        {/* Ship at Phase 0 */}
        <div
          className="absolute z-20 text-3xl"
          style={{
            left: `${getIslandX(0)}%`,
            top: `${getIslandY(0) - 10}%`,
            transform: "translateX(-50%)",
            animation: "shipBob 2.5s ease-in-out infinite",
          }}
        >
          {"\u{1F6A2}"}
        </div>

        {/* Islands */}
        {ISLANDS.map((island, i) => (
          <button
            key={island.phase}
            type="button"
            onClick={() =>
              setSelectedIsland(selectedIsland === i ? null : i)
            }
            className={`absolute z-20 flex flex-col items-center transition-transform duration-200 hover:scale-110 focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--cc-accent-500)]`}
            style={{
              left: `${getIslandX(i)}%`,
              top: `${getIslandY(i)}%`,
              transform: "translate(-50%, -50%)",
              animation: `float 3s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          >
            {/* Island circle */}
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full ring-2 ${island.ring} ${island.bg} ${
                selectedIsland === i ? "ring-4 scale-110" : ""
              } transition-all duration-200 sm:h-24 sm:w-24`}
            >
              <span className="text-3xl sm:text-4xl">{island.emoji}</span>
            </div>

            {/* Label */}
            <span
              className={`mt-2 whitespace-nowrap text-xs font-medium sm:text-sm ${island.text}`}
            >
              {getLabel(island)}
            </span>

            {/* Task count badge */}
            <span className="mt-1 rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400">
              {island.tasks} {rt?.taskCount || "tasks"}
            </span>
          </button>
        ))}
      </div>

      {/* ── Waves ────────────────────────────────────── */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
        <div
          className="absolute bottom-0 h-16 w-[200%] rounded-t-[40%] bg-blue-500/30"
          style={{ animation: "wave 8s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-0 h-20 w-[200%] rounded-t-[35%] bg-blue-600/20"
          style={{ animation: "wave 12s ease-in-out infinite reverse" }}
        />
        <div
          className="absolute bottom-0 h-24 w-[200%] rounded-t-[45%] bg-blue-700/10"
          style={{ animation: "wave 16s ease-in-out infinite" }}
        />
      </div>

      {/* ── Quick Nav + Progress Bar ─────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-700/50 bg-slate-900/95 px-6 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          {/* Phase buttons */}
          <div className="flex gap-1">
            {ISLANDS.map((island, i) => (
              <button
                key={island.phase}
                type="button"
                onClick={() => setSelectedIsland(i)}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                  selectedIsland === i
                    ? `${island.bg} ${island.text} ring-1 ${island.ring}`
                    : i <= CURRENT_PHASE
                      ? "bg-slate-700 text-white"
                      : "bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                }`}
              >
                {island.phase}
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-blue-500 to-emerald-500 transition-all duration-500"
                  style={{
                    width: `${((CURRENT_PHASE + 1) / ISLANDS.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs text-slate-500">
                {CURRENT_PHASE}/{ISLANDS.length - 1}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail Panel (slide-in) ──────────────────── */}
      <div
        className={`fixed top-0 z-50 h-full w-96 max-w-[90vw] border-l border-slate-700/50 bg-slate-900/95 backdrop-blur-sm transition-transform duration-300 ease-out ${
          isRTL ? "left-0 border-r border-l-0" : "right-0"
        } ${
          selected
            ? "translate-x-0"
            : isRTL
              ? "-translate-x-full"
              : "translate-x-full"
        }`}
      >
        {selected && (
          <div className="flex h-full flex-col overflow-y-auto p-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${selected.bg} ring-1 ${selected.ring}`}
                >
                  <span className="text-2xl">{selected.emoji}</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Phase {selected.phase}: {getLabel(selected)}
                  </h2>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                      selected.phase <= CURRENT_PHASE
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {selected.phase <= CURRENT_PHASE
                      ? rt?.inProgress || "In Progress"
                      : rt?.notStarted || "Not Started"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIsland(null)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Level tabs */}
            <div className="mt-6 flex rounded-lg bg-slate-800/50 p-1">
              {(["goal", "epic", "sprint", "task"] as DetailLevel[]).map(
                (level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDetailLevel(level)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      detailLevel === level
                        ? "bg-slate-700 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {rt?.[level] || level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                )
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-800/50 p-3">
                <div className={`text-2xl font-bold ${selected.text}`}>
                  {selected.tasks}
                </div>
                <div className="text-xs text-slate-500">
                  {rt?.taskCount || "Tasks"}
                </div>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-3">
                <div className="text-2xl font-bold text-slate-300">
                  {Math.round((selected.tasks / TOTAL_TASKS) * 100)}%
                </div>
                <div className="text-xs text-slate-500">
                  {rt?.effort || "Effort"}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <p className="text-sm leading-relaxed text-slate-300">
                {getDescription(selected)}
              </p>
            </div>

            {/* Open in Notion */}
            <div className="mt-auto pt-6">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                onClick={() =>
                  window.open(
                    "https://www.notion.so/3158f27212f881639507feab50d68d44",
                    "_blank"
                  )
                }
              >
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
