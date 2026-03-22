"use client";

import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { FEATURE_LABELS } from "@/lib/vcanvas/canvasConfig";
import type { CanvasFeatures } from "@/lib/vcanvas/canvasConfig";
import { Loader2, ToggleLeft, ToggleRight } from "lucide-react";

// ─── App Definitions ────────────────────────────────

const APPS = [
  { key: "vCanvas", label: { he: "vCanvas — לוח עצמאי", en: "vCanvas — Standalone Board", ru: "vCanvas — Самостоятельная доска" } },
  { key: "vNote", label: { he: "vNote — לוח ישות", en: "vNote — Entity Board", ru: "vNote — Доска сущности" } },
] as const;

const labels = {
  he: {
    title: "Feature Flags",
    description: "ניהול פיצ׳רים פעילים לפי אפליקציה",
    enabled: "פעיל",
    disabled: "כבוי",
    noFlags: "אין feature flags — הרץ את המיגרציה",
  },
  en: {
    title: "Feature Flags",
    description: "Manage active features per application",
    enabled: "Enabled",
    disabled: "Disabled",
    noFlags: "No feature flags — run the migration",
  },
  ru: {
    title: "Feature Flags",
    description: "Управление активными функциями по приложениям",
    enabled: "Включено",
    disabled: "Выключено",
    noFlags: "Нет feature flags — запустите миграцию",
  },
};

// ─── App Section ────────────────────────────────────

function AppFlagSection({
  appKey,
  appLabel,
  language,
}: {
  appKey: string;
  appLabel: string;
  language: "he" | "en" | "ru";
}) {
  const { flags, loading, toggle } = useFeatureFlags(appKey);
  const l = labels[language];
  const isRtl = language === "he";

  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">{appLabel}</h3>
        <div className="flex items-center justify-center py-6">
          <Loader2 size={16} className="animate-spin text-slate-500" />
        </div>
      </div>
    );
  }

  if (flags.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">{appLabel}</h3>
        <p className="text-xs text-slate-500">{l.noFlags}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <h3 className="text-sm font-semibold text-slate-200">{appLabel}</h3>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {flags.map((flag) => {
          const featureLabel =
            FEATURE_LABELS[flag.feature_name as keyof CanvasFeatures]?.[language] ??
            flag.feature_name;

          return (
            <div
              key={flag.id}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
              dir={isRtl ? "rtl" : "ltr"}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-slate-200">{featureLabel}</span>
                <span className="text-[10px] text-slate-600 font-mono">{flag.feature_name}</span>
              </div>
              <button
                type="button"
                onClick={() => toggle(flag.feature_name)}
                className="flex items-center gap-1.5 group"
              >
                {flag.enabled ? (
                  <>
                    <span className="text-[10px] font-medium text-emerald-400">{l.enabled}</span>
                    <ToggleRight size={22} className="text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-medium text-slate-600">{l.disabled}</span>
                    <ToggleLeft size={22} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────

export default function FeatureFlagsPage() {
  const { language } = useSettings();
  const isRtl = language === "he";
  const l = labels[language];

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex h-[calc(100vh-48px)] flex-col">
      <div className="shrink-0 px-5 pt-4 pb-2">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-bold text-slate-100">{l.title}</h1>
          <p className="text-xs text-slate-500">{l.description}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
          {APPS.map((app) => (
            <AppFlagSection
              key={app.key}
              appKey={app.key}
              appLabel={app.label[language]}
              language={language}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
