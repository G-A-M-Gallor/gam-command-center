"use client";

import { useState, useRef, useCallback } from "react";
import { PageHeader } from "@/components/command-center/PageHeader";
import { ColorPicker } from "@/components/command-center/ColorPicker";
import {
  useSettings,
  type AccentColor,
  type AccentEffect,
  type SavedColor,
  type FontFamily,
  type BorderRadius,
  type Density,
  type BrandProfile,
  type GlowIntensity,
  type SkinName,
} from "@/contexts/SettingsContext";
import { SKINS } from "@/lib/skins";
import { useWidgets, type HoverDelay } from "@/contexts/WidgetContext";
import { useStyleOverrides } from "@/contexts/StyleOverrideContext";
import { getTranslations } from "@/lib/i18n";
import { Layers, X as XIcon, Lock, LockOpen, Palette, Undo2, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const ACCENT_OPTIONS: { value: AccentColor; swatch: string }[] = [
  { value: "purple", swatch: "#9333ea" },
  { value: "blue", swatch: "#2563eb" },
  { value: "emerald", swatch: "#059669" },
  { value: "amber", swatch: "#d97706" },
  { value: "rose", swatch: "#e11d48" },
  { value: "cyan", swatch: "#0891b2" },
];

const FONT_OPTIONS: { value: FontFamily; key: "geist" | "inter" | "system" }[] = [
  { value: "geist", key: "geist" },
  { value: "inter", key: "inter" },
  { value: "system", key: "system" },
];

const RADIUS_OPTIONS: { value: BorderRadius; key: "sharp" | "default" | "round" }[] = [
  { value: "sharp", key: "sharp" },
  { value: "default", key: "default" },
  { value: "round", key: "round" },
];

const DENSITY_OPTIONS: { value: Density; key: "compact" | "default" | "spacious" }[] = [
  { value: "compact", key: "compact" },
  { value: "default", key: "default" },
  { value: "spacious", key: "spacious" },
];

type SettingsTab = "general" | "theme" | "brand";

const TAB_KEYS: { tab: SettingsTab; tKey: "tabGeneral" | "tabTheme" | "tabBrand" }[] = [
  { tab: "general", tKey: "tabGeneral" },
  { tab: "theme", tKey: "tabTheme" },
  { tab: "brand", tKey: "tabBrand" },
];

// --- Shared button classes ---
const activeBtn =
  "bg-[var(--cc-accent-600-30)] text-[var(--cc-accent-300)]";
const inactiveBtn =
  "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200";

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
        active ? activeBtn : inactiveBtn
      }`}
    >
      {children}
    </button>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-slate-800/50 p-4">
      <label className="mb-3 block text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── General Tab ──────────────────────────────────────────────

function GeneralTab() {
  const {
    language,
    sidebarPosition,
    sidebarVisibility,
    setLanguage,
    setSidebarPosition,
    setSidebarVisibility,
  } = useSettings();
  const { hoverDelay, setHoverDelay } = useWidgets();
  const t = getTranslations(language);

  const DELAY_OPTIONS: { value: HoverDelay; display: string }[] = [
    { value: "none", display: t.widgets.none },
    { value: 0.1, display: "0.1s" },
    { value: 0.3, display: "0.3s" },
    { value: 0.5, display: "0.5s" },
    { value: 1, display: "1s" },
    { value: 2, display: "2s" },
    { value: 3, display: "3s" },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <Section label={t.settings.language}>
        <div className="flex gap-2">
          <ToggleButton active={language === "he"} onClick={() => setLanguage("he")}>
            {t.settings.hebrew}
          </ToggleButton>
          <ToggleButton active={language === "en"} onClick={() => setLanguage("en")}>
            {t.settings.english}
          </ToggleButton>
        </div>
      </Section>

      <Section label={t.settings.sidebarPosition}>
        <div className="flex gap-2">
          <ToggleButton active={sidebarPosition === "right"} onClick={() => setSidebarPosition("right")}>
            {t.settings.right}
          </ToggleButton>
          <ToggleButton active={sidebarPosition === "left"} onClick={() => setSidebarPosition("left")}>
            {t.settings.left}
          </ToggleButton>
        </div>
      </Section>

      <Section label={t.settings.sidebarVisibility}>
        <div className="flex gap-2">
          {(["visible", "float", "hidden"] as const).map((mode) => (
            <ToggleButton
              key={mode}
              active={sidebarVisibility === mode}
              onClick={() => setSidebarVisibility(mode)}
            >
              {t.settings[mode]}
            </ToggleButton>
          ))}
        </div>
      </Section>

      <Section label={t.widgets.hoverDelay}>
        <div className="flex flex-wrap gap-2">
          {DELAY_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setHoverDelay(opt.value)}
              className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
                hoverDelay === opt.value ? activeBtn : inactiveBtn
              }`}
            >
              {opt.display}
            </button>
          ))}
        </div>
      </Section>

      <OverridesSection />
    </div>
  );
}

function OverridesSection() {
  const { language } = useSettings();
  const { viewMode, setViewMode, resetAll, personalOverrides } = useStyleOverrides();
  const t = getTranslations(language);
  const cm = t.contextMenu;
  const overrideCount = Object.keys(personalOverrides).length;

  return (
    <Section label={cm.overridesSection}>
      <p className="mb-3 text-xs text-slate-500">{cm.overridesHint}</p>
      <div className="flex items-center gap-2">
        <ToggleButton active={viewMode === "system"} onClick={() => setViewMode("system")}>
          {cm.systemDefault}
        </ToggleButton>
        <ToggleButton active={viewMode === "custom"} onClick={() => setViewMode("custom")}>
          {cm.myCustom}
        </ToggleButton>
      </div>
      {overrideCount > 0 && (
        <Button variant="danger" size="sm" icon={RotateCcw} onClick={resetAll} className="mt-3">
          {cm.resetAll} ({overrideCount})
        </Button>
      )}
    </Section>
  );
}

// ─── Color Combos data ────────────────────────────────────────

const COLOR_COMBOS: { key: string; tKey: string; colors: [string, string]; gradient: string }[] = [
  { key: "sunset", tKey: "comboSunset", colors: ["#f97316", "#fbbf24"], gradient: "linear-gradient(135deg, #f97316, #fbbf24)" },
  { key: "ocean", tKey: "comboOcean", colors: ["#0ea5e9", "#06b6d4"], gradient: "linear-gradient(135deg, #0ea5e9, #06b6d4)" },
  { key: "aurora", tKey: "comboAurora", colors: ["#a855f7", "#ec4899"], gradient: "linear-gradient(135deg, #a855f7, #ec4899)" },
  { key: "forest", tKey: "comboForest", colors: ["#10b981", "#14b8a6"], gradient: "linear-gradient(135deg, #10b981, #14b8a6)" },
  { key: "flame", tKey: "comboFlame", colors: ["#ef4444", "#f97316"], gradient: "linear-gradient(135deg, #ef4444, #f97316)" },
  { key: "royal", tKey: "comboRoyal", colors: ["#7c3aed", "#2563eb"], gradient: "linear-gradient(135deg, #7c3aed, #2563eb)" },
  { key: "midnight", tKey: "comboMidnight", colors: ["#1e40af", "#312e81"], gradient: "linear-gradient(135deg, #1e40af, #312e81)" },
  { key: "roseGold", tKey: "comboRoseGold", colors: ["#f43f5e", "#fb923c"], gradient: "linear-gradient(135deg, #f43f5e, #fb923c)" },
  { key: "glacier", tKey: "comboGlacier", colors: ["#67e8f9", "#a5b4fc"], gradient: "linear-gradient(135deg, #67e8f9, #a5b4fc)" },
];

const DIRECTION_OPTIONS = [
  { deg: 0, label: "↑" },
  { deg: 45, label: "↗" },
  { deg: 90, label: "→" },
  { deg: 135, label: "↘" },
  { deg: 180, label: "↓" },
];

// ─── Theme Tab ────────────────────────────────────────────────

function ThemeTab() {
  const {
    language,
    accentColor,
    fontFamily,
    borderRadius,
    density,
    brandProfile,
    customAccentHex,
    savedColors,
    archivedColors,
    accentEffect,
    skin,
    setAccentColor,
    setFontFamily,
    setBorderRadius,
    setDensity,
    setBrandProfile,
    setCustomAccentHex,
    setSavedColors,
    setArchivedColors,
    setAccentEffect,
    setSkin,
  } = useSettings();
  const t = getTranslations(language);
  const [pickerColor, setPickerColor] = useState(customAccentHex || "#9333ea");

  const handleApplyColor = useCallback((hex: string) => {
    setCustomAccentHex(hex);
    setAccentColor("custom");
  }, [setCustomAccentHex, setAccentColor]);

  const handleSaveColor = useCallback((hex: string) => {
    if (savedColors.length >= 20) return;
    if (savedColors.some((c) => c.hex.toLowerCase() === hex.toLowerCase())) return;
    setSavedColors([...savedColors, { hex }]);
  }, [savedColors, setSavedColors]);

  const handleToggleLock = useCallback((index: number) => {
    const updated = savedColors.map((c, i) =>
      i === index ? { ...c, locked: !c.locked } : c
    );
    setSavedColors(updated);
  }, [savedColors, setSavedColors]);

  const handleUseAsBrand = useCallback((hex: string) => {
    setBrandProfile({ ...brandProfile, brandPrimary: hex });
    setAccentColor("brand");
  }, [brandProfile, setBrandProfile, setAccentColor]);

  const handleRemoveSaved = useCallback((index: number) => {
    const color = savedColors[index];
    if (color.locked) return;
    setSavedColors(savedColors.filter((_, i) => i !== index));
    setArchivedColors([...archivedColors, { hex: color.hex, name: color.name }]);
  }, [savedColors, archivedColors, setSavedColors, setArchivedColors]);

  const handleRestoreColor = useCallback((index: number) => {
    const color = archivedColors[index];
    setArchivedColors(archivedColors.filter((_, i) => i !== index));
    if (savedColors.length < 20) {
      setSavedColors([...savedColors, color]);
    }
  }, [archivedColors, savedColors, setArchivedColors, setSavedColors]);

  const handlePermanentDelete = useCallback((index: number) => {
    setArchivedColors(archivedColors.filter((_, i) => i !== index));
  }, [archivedColors, setArchivedColors]);

  const handleUseSaved = useCallback((hex: string) => {
    setCustomAccentHex(hex);
    setAccentColor("custom");
  }, [setCustomAccentHex, setAccentColor]);

  const handleApplyCombo = useCallback((colors: [string, string]) => {
    setCustomAccentHex(colors[0]);
    setAccentColor("custom");
    setAccentEffect({
      ...accentEffect,
      gradient: { enabled: true, direction: 135, secondaryColor: colors[1] },
    });
  }, [setCustomAccentHex, setAccentColor, setAccentEffect, accentEffect]);

  const updateGradient = useCallback((partial: Partial<AccentEffect["gradient"]>) => {
    setAccentEffect({
      ...accentEffect,
      gradient: { ...accentEffect.gradient, ...partial },
    });
  }, [accentEffect, setAccentEffect]);

  const updateGlow = useCallback((partial: Partial<AccentEffect["glow"]>) => {
    setAccentEffect({
      ...accentEffect,
      glow: { ...accentEffect.glow, ...partial },
    });
  }, [accentEffect, setAccentEffect]);

  return (
    <div className="max-w-2xl space-y-4">
      {/* 0. Skin Selector */}
      <Section label={language === "he" ? "עיצוב כללי" : "Skin"}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SKINS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSkin(s.id)}
              className={`flex items-center gap-3 rounded-lg border p-3 text-right transition-all ${
                skin === s.id
                  ? "border-[var(--cc-accent-500)] bg-[var(--cc-accent-600-20)] ring-1 ring-[var(--cc-accent-500-30)]"
                  : "border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-700/50"
              }`}
            >
              <div className="flex shrink-0 gap-1">
                {s.preview.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-full border border-white/10"
                    style={{
                      width: i === 0 ? 16 : 12,
                      height: i === 0 ? 16 : 12,
                      backgroundColor: c,
                      marginTop: i === 0 ? 0 : 2,
                    }}
                  />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-slate-200">
                  {language === "he" ? s.nameHe : s.name}
                </div>
                <div className="truncate text-[10px] text-slate-500">
                  {language === "he" ? s.descHe : s.desc}
                </div>
              </div>
              {skin === s.id && (
                <span className="text-xs text-[var(--cc-accent-300)]">✓</span>
              )}
            </button>
          ))}
        </div>
      </Section>

      {/* 1. Accent Color Presets */}
      <Section label={t.settings.accentColor}>
        <div className="flex flex-wrap gap-3">
          {ACCENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAccentColor(opt.value)}
              className={`h-9 w-9 rounded-full transition-all ${
                accentColor === opt.value
                  ? "ring-2 ring-white/40 ring-offset-2 ring-offset-slate-800 scale-110"
                  : "hover:scale-110"
              }`}
              style={{ backgroundColor: opt.swatch }}
              title={opt.value}
            />
          ))}
          {brandProfile.brandPrimary && (
            <button
              type="button"
              onClick={() => setAccentColor("brand")}
              className={`h-9 w-9 rounded-full border border-slate-600 transition-all ${
                accentColor === "brand"
                  ? "ring-2 ring-white/40 ring-offset-2 ring-offset-slate-800 scale-110"
                  : "hover:scale-110"
              }`}
              style={{ backgroundColor: brandProfile.brandPrimary }}
              title={brandProfile.companyName || t.brand.brand}
            />
          )}
          {customAccentHex && (
            <button
              type="button"
              onClick={() => setAccentColor("custom")}
              className={`h-9 w-9 rounded-full border border-slate-600 transition-all ${
                accentColor === "custom"
                  ? "ring-2 ring-white/40 ring-offset-2 ring-offset-slate-800 scale-110"
                  : "hover:scale-110"
              }`}
              style={{ backgroundColor: customAccentHex }}
              title={t.settings.custom}
            />
          )}
        </div>
      </Section>

      {/* 2. Color Picker */}
      <Section label={t.settings.colorPicker}>
        <ColorPicker
          value={pickerColor}
          onChange={setPickerColor}
          onApply={handleApplyColor}
          onSave={handleSaveColor}
          applyLabel={t.settings.useAsAccent}
          saveLabel={t.settings.saveToPalette}
        />
      </Section>

      {/* 3. My Palette */}
      <Section label={t.settings.myPalette}>
        {savedColors.length === 0 ? (
          <p className="text-xs text-slate-500">{t.settings.noSavedColors}</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {savedColors.map((color, i) => (
              <div key={i} className="group relative">
                <button
                  type="button"
                  onClick={() => handleUseSaved(color.hex)}
                  className="h-9 w-9 rounded-full border border-slate-600 transition-all hover:scale-110"
                  style={{ backgroundColor: color.hex }}
                  title={color.name || color.hex}
                />
                {/* Lock badge */}
                {color.locked && (
                  <div className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 ring-1 ring-slate-600">
                    <Lock className="h-2.5 w-2.5 text-slate-300" />
                  </div>
                )}
                {/* Hover actions */}
                <div className="absolute -top-7 left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-md bg-slate-700 px-1 py-0.5 shadow-lg group-hover:flex">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleToggleLock(i); }}
                    className="rounded p-0.5 text-slate-400 transition-colors hover:text-white"
                    title={color.locked ? t.settings.unlockColor : t.settings.lockColor}
                  >
                    {color.locked ? <LockOpen className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleUseAsBrand(color.hex); }}
                    className="rounded p-0.5 text-slate-400 transition-colors hover:text-white"
                    title={t.settings.useAsBrand}
                  >
                    <Palette className="h-3 w-3" />
                  </button>
                  {!color.locked && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveSaved(i); }}
                      className="rounded p-0.5 text-slate-400 transition-colors hover:text-red-400"
                      title={t.settings.removeColor}
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 3.5 Color Archive */}
      <Section label={t.settings.colorArchive}>
        {archivedColors.length === 0 ? (
          <p className="text-xs text-slate-500">{t.settings.noArchivedColors}</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {archivedColors.map((color, i) => (
              <div key={i} className="group relative">
                <div
                  className="h-9 w-9 rounded-full border border-slate-700 opacity-50 transition-all group-hover:opacity-80"
                  style={{ backgroundColor: color.hex }}
                  title={color.name || color.hex}
                />
                {/* Hover actions */}
                <div className="absolute -top-7 left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-md bg-slate-700 px-1 py-0.5 shadow-lg group-hover:flex">
                  <button
                    type="button"
                    onClick={() => handleRestoreColor(i)}
                    className="rounded p-0.5 text-slate-400 transition-colors hover:text-emerald-400"
                    title={t.settings.restoreColor}
                  >
                    <Undo2 className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePermanentDelete(i)}
                    className="rounded p-0.5 text-slate-400 transition-colors hover:text-red-400"
                    title={t.settings.deletePermanently}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 4. Color Combos */}
      <Section label={t.settings.colorCombos}>
        <div className="grid grid-cols-3 gap-2">
          {COLOR_COMBOS.map((combo) => (
            <button
              key={combo.key}
              type="button"
              onClick={() => handleApplyCombo(combo.colors)}
              className="group relative h-12 overflow-hidden rounded-lg transition-all hover:scale-[1.02] hover:ring-1 hover:ring-white/20"
              style={{ background: combo.gradient }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white drop-shadow-md">
                {t.settings[combo.tKey as keyof typeof t.settings] as string}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* 5. Effects */}
      <Section label={t.settings.effects}>
        <div className="space-y-4">
          {/* Gradient */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{t.settings.gradient}</span>
              <div className="flex gap-1">
                <ToggleButton active={!accentEffect.gradient.enabled} onClick={() => updateGradient({ enabled: false })}>
                  {t.settings.off}
                </ToggleButton>
                <ToggleButton active={accentEffect.gradient.enabled} onClick={() => updateGradient({ enabled: true })}>
                  {t.settings.on}
                </ToggleButton>
              </div>
            </div>
            {accentEffect.gradient.enabled && (
              <div className="space-y-2 rounded-lg bg-slate-700/30 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">{t.settings.gradientDirection}</span>
                  <div className="flex gap-1">
                    {DIRECTION_OPTIONS.map((d) => (
                      <button
                        key={d.deg}
                        type="button"
                        onClick={() => updateGradient({ direction: d.deg })}
                        className={`h-7 w-7 rounded text-sm transition-colors ${
                          accentEffect.gradient.direction === d.deg ? activeBtn : inactiveBtn
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">{t.settings.secondaryColor}</span>
                  <input
                    type="color"
                    value={accentEffect.gradient.secondaryColor}
                    onChange={(e) => updateGradient({ secondaryColor: e.target.value })}
                    className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={accentEffect.gradient.secondaryColor}
                    onChange={(e) => {
                      if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) {
                        updateGradient({ secondaryColor: e.target.value });
                      }
                    }}
                    className="w-20 rounded bg-slate-700 px-2 py-1 text-[10px] font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
                  />
                </div>
                {/* Gradient preview */}
                <div
                  className="h-6 rounded-lg"
                  style={{
                    background: `linear-gradient(${accentEffect.gradient.direction}deg, var(--cc-accent-600, #9333ea), ${accentEffect.gradient.secondaryColor})`,
                  }}
                />
              </div>
            )}
          </div>

          {/* Glow */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{t.settings.glow}</span>
              <div className="flex gap-1">
                <ToggleButton active={!accentEffect.glow.enabled} onClick={() => updateGlow({ enabled: false })}>
                  {t.settings.off}
                </ToggleButton>
                <ToggleButton active={accentEffect.glow.enabled} onClick={() => updateGlow({ enabled: true })}>
                  {t.settings.on}
                </ToggleButton>
              </div>
            </div>
            {accentEffect.glow.enabled && (
              <div className="flex gap-1 rounded-lg bg-slate-700/30 p-3">
                {(["subtle", "medium", "strong"] as const).map((level) => (
                  <ToggleButton
                    key={level}
                    active={accentEffect.glow.intensity === level}
                    onClick={() => updateGlow({ intensity: level })}
                  >
                    {t.settings[level]}
                  </ToggleButton>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* 6. Font Family */}
      <Section label={t.settings.fontFamily}>
        <div className="flex gap-2">
          {FONT_OPTIONS.map((opt) => (
            <ToggleButton
              key={opt.value}
              active={fontFamily === opt.value}
              onClick={() => setFontFamily(opt.value)}
            >
              {t.settings[opt.key]}
            </ToggleButton>
          ))}
        </div>
      </Section>

      {/* 7. Corners */}
      <Section label={t.settings.borderRadius}>
        <div className="flex gap-2">
          {RADIUS_OPTIONS.map((opt) => (
            <ToggleButton
              key={opt.value}
              active={borderRadius === opt.value}
              onClick={() => setBorderRadius(opt.value)}
            >
              {t.settings[opt.key]}
            </ToggleButton>
          ))}
        </div>
      </Section>

      {/* 8. Density */}
      <Section label={t.settings.density}>
        <div className="flex gap-2">
          {DENSITY_OPTIONS.map((opt) => (
            <ToggleButton
              key={opt.value}
              active={density === opt.value}
              onClick={() => setDensity(opt.value)}
            >
              {t.settings[opt.key]}
            </ToggleButton>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Brand Tab ────────────────────────────────────────────────

function BrandTab() {
  const { language, brandProfile, setBrandProfile } = useSettings();
  const t = getTranslations(language);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateBrand = useCallback(
    (partial: Partial<BrandProfile>) => {
      setBrandProfile({ ...brandProfile, ...partial });
    },
    [brandProfile, setBrandProfile]
  );

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        updateBrand({ logoDataUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [updateBrand]
  );

  return (
    <div className="max-w-2xl space-y-4">
      {/* Logo + Company Name */}
      <Section label={t.brand.companyName}>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--cc-accent-600-20)] transition-colors hover:bg-[var(--cc-accent-600-30)]"
            title={t.brand.uploadLogo}
          >
            {brandProfile.logoDataUrl ? (
              <img
                src={brandProfile.logoDataUrl}
                alt="Logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <Layers className="h-8 w-8 text-[var(--cc-accent-400)]" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
          <div className="flex-1 space-y-2">
            <Input
              value={brandProfile.companyName}
              onChange={(e) => updateBrand({ companyName: e.target.value })}
              placeholder={t.brand.companyName}
            />
            {brandProfile.logoDataUrl && (
              <Button variant="ghost" size="sm" icon={XIcon} onClick={() => updateBrand({ logoDataUrl: "" })}>
                {t.brand.removeLogo}
              </Button>
            )}
          </div>
        </div>
      </Section>

      {/* Tagline */}
      <Section label={t.brand.tagline}>
        <Input
          value={brandProfile.tagline}
          onChange={(e) => updateBrand({ tagline: e.target.value })}
          placeholder={t.brand.tagline}
        />
      </Section>

      {/* Brand Colors */}
      <Section label={t.brand.brandColors}>
        <div className="space-y-3">
          {([
            { key: "brandPrimary" as const, label: t.brand.primary },
            { key: "brandSecondary" as const, label: t.brand.secondary },
            { key: "brandTertiary" as const, label: t.brand.tertiary },
          ]).map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-16 text-xs text-slate-400">{label}</span>
              <input
                type="color"
                value={brandProfile[key] || "#9333ea"}
                onChange={(e) => updateBrand({ [key]: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <input
                type="text"
                value={brandProfile[key]}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#?[0-9a-fA-F]{0,6}$/.test(v)) {
                    updateBrand({ [key]: v.startsWith("#") ? v : `#${v}` });
                  }
                }}
                placeholder="#000000"
                className="w-24 rounded bg-slate-700 px-2 py-1.5 text-xs font-mono text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
              />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const { language } = useSettings();
  const t = getTranslations(language);

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader pageKey="settings" />

      {/* Internal tab bar */}
      <div className="mt-6 flex gap-1 border-b border-slate-700/50 pb-0">
        {TAB_KEYS.map(({ tab, tKey }) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-[var(--cc-accent-500)] text-[var(--cc-accent-300)]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.settings[tKey]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 pt-6">
        {activeTab === "general" && <GeneralTab />}
        {activeTab === "theme" && <ThemeTab />}
        {activeTab === "brand" && <BrandTab />}
      </div>
    </div>
  );
}
