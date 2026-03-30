"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { SHELL_SKINS, CONTENT_SKINS, MOBILE_NAV_SKINS } from "@/lib/skins/registry";
import type { ShellSkinMeta, ContentSkinMeta, MobileNavSkinMeta } from "@/lib/skins/types";
import { Check, Monitor, Smartphone, Layout } from "lucide-react";

export function SkinsTab() {
  const {
    language,
    skinConfig,
    setShellSkin,
    setContentSkin,
    setMobileNavSkin,
  } = useSettings();

  const t = getTranslations(language);
  const lang = language;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-100">
          {t.settings.skinsTitle}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {t.settings.skinsSubtitle}
        </p>
      </div>

      {/* Shell Skins */}
      <SkinSection
        icon={<Monitor className="h-5 w-5" />}
        title={t.settings.skinShellTitle}
        description={t.settings.skinShellDesc}
        currentLabel={t.settings.skinCurrent}
        featuresLabel={t.settings.skinFeatures}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHELL_SKINS.map((skin) => (
            <ShellSkinCard
              key={skin.id}
              skin={skin}
              lang={lang}
              active={skinConfig.shell === skin.id}
              currentLabel={t.settings.skinCurrent}
              featuresLabel={t.settings.skinFeatures}
              onSelect={() => setShellSkin(skin.id)}
            />
          ))}
        </div>
      </SkinSection>

      {/* Content Skins */}
      <SkinSection
        icon={<Layout className="h-5 w-5" />}
        title={t.settings.skinContentTitle}
        description={t.settings.skinContentDesc}
        currentLabel={t.settings.skinCurrent}
        featuresLabel={t.settings.skinFeatures}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CONTENT_SKINS.map((skin) => (
            <ContentSkinCard
              key={skin.id}
              skin={skin}
              lang={lang}
              active={skinConfig.content === skin.id}
              currentLabel={t.settings.skinCurrent}
              featuresLabel={t.settings.skinFeatures}
              onSelect={() => setContentSkin(skin.id)}
            />
          ))}
        </div>
      </SkinSection>

      {/* Mobile Nav Skins */}
      <SkinSection
        icon={<Smartphone className="h-5 w-5" />}
        title={t.settings.skinMobileNavTitle}
        description={t.settings.skinMobileNavDesc}
        currentLabel={t.settings.skinCurrent}
        featuresLabel={t.settings.skinFeatures}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOBILE_NAV_SKINS.map((skin) => (
            <MobileNavSkinCard
              key={skin.id}
              skin={skin}
              lang={lang}
              active={skinConfig.mobileNav === skin.id}
              currentLabel={t.settings.skinCurrent}
              safetyLabel={t.settings.skinSafetyNote}
              onSelect={() => setMobileNavSkin(skin.id)}
            />
          ))}
        </div>
      </SkinSection>
    </div>
  );
}

// ─── Shared Section Wrapper ──────────────────────────────

function SkinSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  currentLabel: string;
  featuresLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-slate-800/50 p-5">
      <div className="mb-4 flex items-center gap-2 text-slate-200">
        {icon}
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Shell Skin Card ─────────────────────────────────────

function ShellSkinCard({
  skin,
  lang,
  active,
  currentLabel,
  featuresLabel,
  onSelect,
}: {
  skin: ShellSkinMeta;
  lang: "he" | "en" | "ru";
  active: boolean;
  currentLabel: string;
  featuresLabel: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col rounded-lg border p-4 text-start transition-all ${
        active
          ? "border-[var(--cc-accent-500)] bg-[var(--cc-accent-600-20)] ring-1 ring-[var(--cc-accent-500)]"
          : "border-slate-700 bg-slate-800 hover:border-slate-500 hover:bg-slate-750"
      }`}
    >
      {active && (
        <span className="absolute end-2 top-2 rounded-full bg-[var(--cc-accent-500)] p-0.5">
          <Check className="h-3 w-3 text-white" />
        </span>
      )}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl">{skin.preview}</span>
        <span className="font-medium text-slate-100">{skin.name[lang]}</span>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-slate-400">
        {skin.description[lang]}
      </p>
      <div className="mt-auto flex flex-wrap gap-1">
        {skin.features.map((f) => (
          <span
            key={f}
            className="rounded bg-slate-700/80 px-1.5 py-0.5 text-[10px] text-slate-400"
          >
            {f}
          </span>
        ))}
      </div>
      {active && (
        <span className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[var(--cc-accent-400)]">
          {currentLabel}
        </span>
      )}
    </button>
  );
}

// ─── Content Skin Card ───────────────────────────────────

function ContentSkinCard({
  skin,
  lang,
  active,
  currentLabel,
  featuresLabel,
  onSelect,
}: {
  skin: ContentSkinMeta;
  lang: "he" | "en" | "ru";
  active: boolean;
  currentLabel: string;
  featuresLabel: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col rounded-lg border p-4 text-start transition-all ${
        active
          ? "border-[var(--cc-accent-500)] bg-[var(--cc-accent-600-20)] ring-1 ring-[var(--cc-accent-500)]"
          : "border-slate-700 bg-slate-800 hover:border-slate-500 hover:bg-slate-750"
      }`}
    >
      {active && (
        <span className="absolute end-2 top-2 rounded-full bg-[var(--cc-accent-500)] p-0.5">
          <Check className="h-3 w-3 text-white" />
        </span>
      )}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl">{skin.preview}</span>
        <span className="font-medium text-slate-100">{skin.name[lang]}</span>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-slate-400">
        {skin.description[lang]}
      </p>
      <div className="mt-auto flex flex-wrap gap-1">
        {skin.features.map((f) => (
          <span
            key={f}
            className="rounded bg-slate-700/80 px-1.5 py-0.5 text-[10px] text-slate-400"
          >
            {f}
          </span>
        ))}
      </div>
      {active && (
        <span className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[var(--cc-accent-400)]">
          {currentLabel}
        </span>
      )}
    </button>
  );
}

// ─── Mobile Nav Skin Card ────────────────────────────────

function MobileNavSkinCard({
  skin,
  lang,
  active,
  currentLabel,
  safetyLabel,
  onSelect,
}: {
  skin: MobileNavSkinMeta;
  lang: "he" | "en" | "ru";
  active: boolean;
  currentLabel: string;
  safetyLabel: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col rounded-lg border p-4 text-start transition-all ${
        active
          ? "border-[var(--cc-accent-500)] bg-[var(--cc-accent-600-20)] ring-1 ring-[var(--cc-accent-500)]"
          : "border-slate-700 bg-slate-800 hover:border-slate-500 hover:bg-slate-750"
      }`}
    >
      {active && (
        <span className="absolute end-2 top-2 rounded-full bg-[var(--cc-accent-500)] p-0.5">
          <Check className="h-3 w-3 text-white" />
        </span>
      )}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl">{skin.preview}</span>
        <span className="font-medium text-slate-100">{skin.name[lang]}</span>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-slate-400">
        {skin.description[lang]}
      </p>
      {/* Safety / escape hatch */}
      <div className="mt-auto rounded bg-emerald-900/30 px-2 py-1.5 text-[10px] text-emerald-400">
        <span className="font-medium">{safetyLabel}:</span>{" "}
        {skin.escapeHatch}
      </div>
      {active && (
        <span className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[var(--cc-accent-400)]">
          {currentLabel}
        </span>
      )}
    </button>
  );
}
