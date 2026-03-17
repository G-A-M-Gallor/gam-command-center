"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/command-center/PageHeader";
import { ColorPicker } from "@/components/command-center/ColorPicker";
import {
  useSettings,
  type AccentColor,
  type AccentEffect,
  type FontFamily,
  type BorderRadius,
  type Density,
  type BrandProfile,
} from "@/contexts/SettingsContext";
import { ThemeSwitcher } from "@/components/settings/ThemeSwitcher";
import {
  useWidgets,
  type HoverDelay,
  BUILTIN_PROFILES,
  type WidgetBarProfile,
} from "@/contexts/WidgetContext";
import { useStyleOverrides } from "@/contexts/StyleOverrideContext";
import { getTranslations } from "@/lib/i18n";
import {
  Layers, X as XIcon, Lock, LockOpen, Palette, Undo2, Trash2, RotateCcw, Check, Pencil, Download, Upload,
  Smartphone, Bell, Camera, Users, Wifi, WifiOff, Share2, Moon, Vibrate, MapPin, BadgeCheck, RefreshCw, Send, ScanLine, Trash, Image,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useInstallPrompt } from "@/lib/pwa/useInstallPrompt";
import { usePushSubscription } from "@/lib/pwa/usePushSubscription";
import { useDeviceCapabilities } from "@/lib/pwa/useDeviceCapabilities";
import { useCamera } from "@/lib/pwa/useCamera";
import { useContacts } from "@/lib/pwa/useContacts";
import { useWakeLock } from "@/lib/pwa/useWakeLock";
import { IntegrationsTab } from "@/components/settings/IntegrationsTab";
import { EmailTemplatesTab } from "@/components/settings/EmailTemplatesTab";
import { SkinsTab } from "@/components/settings/SkinsTab";

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

type SettingsTab = "general" | "theme" | "skins" | "brand" | "widgetBar" | "pwa" | "accounts" | "emailTemplates";

const TAB_KEYS: { tab: SettingsTab; tKey: "tabGeneral" | "tabTheme" | "tabSkins" | "tabBrand" | "tabWidgetBar" | "tabPwa" | "tabAccounts" | "tabEmailTemplates" }[] = [
  { tab: "general", tKey: "tabGeneral" },
  { tab: "theme", tKey: "tabTheme" },
  { tab: "skins", tKey: "tabSkins" },
  { tab: "brand", tKey: "tabBrand" },
  { tab: "widgetBar", tKey: "tabWidgetBar" },
  { tab: "pwa", tKey: "tabPwa" },
  { tab: "accounts", tKey: "tabAccounts" },
  { tab: "emailTemplates", tKey: "tabEmailTemplates" },
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
  ccId,
}: {
  label: string;
  children: React.ReactNode;
  ccId?: string;
}) {
  return (
    <div className="rounded-lg bg-slate-800/50 p-4" data-cc-id={ccId}>
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
    gibberishDetect,
    setLanguage,
    setSidebarPosition,
    setSidebarVisibility,
    setGibberishDetect,
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
      <Section label={t.settings.language} ccId="settings.language">
        <div className="flex gap-2">
          <ToggleButton active={language === "he"} onClick={() => setLanguage("he")}>
            {t.settings.hebrew}
          </ToggleButton>
          <ToggleButton active={language === "en"} onClick={() => setLanguage("en")}>
            {t.settings.english}
          </ToggleButton>
          <ToggleButton active={language === "ru"} onClick={() => setLanguage("ru")}>
            {t.settings.russian}
          </ToggleButton>
        </div>
      </Section>

      <Section label={t.settings.sidebarPosition} ccId="settings.sidebarPosition">
        <div className="flex gap-2">
          <ToggleButton active={sidebarPosition === "right"} onClick={() => setSidebarPosition("right")}>
            {t.settings.right}
          </ToggleButton>
          <ToggleButton active={sidebarPosition === "left"} onClick={() => setSidebarPosition("left")}>
            {t.settings.left}
          </ToggleButton>
        </div>
      </Section>

      <Section label={t.settings.sidebarVisibility} ccId="settings.sidebarVisibility">
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

      <Section label={t.widgets.hoverDelay} ccId="settings.hoverDelay">
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

      <Section label={(t.bottomBar as Record<string, string>).editBottomBar} ccId="settings.bottomBar">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("cc-bottom-bar-edit"))}
          className={`rounded px-4 py-2 text-sm font-medium transition-colors ${inactiveBtn}`}
        >
          {(t.bottomBar as Record<string, string>).editMode}
        </button>
        <p className="mt-2 text-xs text-slate-500">
          {(t.bottomBar as Record<string, string>).longPressToEdit}
        </p>
      </Section>

      <Section label={t.settings.gibberishDetect} ccId="settings.gibberishDetect">
        <div className="flex gap-2">
          <ToggleButton active={gibberishDetect} onClick={() => setGibberishDetect(true)}>
            {t.settings.on}
          </ToggleButton>
          <ToggleButton active={!gibberishDetect} onClick={() => setGibberishDetect(false)}>
            {t.settings.off}
          </ToggleButton>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {t.settings.gibberishDetectHint}
        </p>
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
    <Section label={cm.overridesSection} ccId="settings.overrides">
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
    navColor,
    setAccentColor,
    setFontFamily,
    setBorderRadius,
    setDensity,
    setBrandProfile,
    setCustomAccentHex,
    setSavedColors,
    setArchivedColors,
    setAccentEffect,
    setNavColor,
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
      {/* 0. Color Theme (Uncodixfy palettes) */}
      <Section label={t.settings.colorTheme} ccId="settings.colorTheme">
        <ThemeSwitcher />
      </Section>

      {/* 0.5 Navigation Color */}
      <Section label={t.settings.navColor} ccId="settings.navColor">
        <p className="mb-2 text-[11px] text-slate-500">{t.settings.navColorHint}</p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={navColor || "#1e293b"}
            onChange={(e) => setNavColor(e.target.value)}
            className="h-9 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
          />
          <input
            type="text"
            value={navColor}
            onChange={(e) => {
              if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) {
                setNavColor(e.target.value);
              }
            }}
            placeholder="#1e293b"
            className="w-24 rounded bg-slate-700 px-2 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
          />
          {/* Preview stripe */}
          <div className="h-6 flex-1 rounded" style={{ backgroundColor: navColor || "var(--theme-surface)" }} />
          {navColor && (
            <button
              type="button"
              onClick={() => setNavColor("")}
              className="rounded bg-slate-700 px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-600 hover:text-slate-200"
            >
              <RotateCcw className="inline h-3 w-3 me-1" />
              {t.settings.resetNavColor}
            </button>
          )}
        </div>
      </Section>

      {/* 1. Accent Color Presets */}
      <Section label={t.settings.accentColor} ccId="settings.accentColor">
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
      <Section label={t.settings.colorPicker} ccId="settings.colorPicker">
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
      <Section label={t.settings.myPalette} ccId="settings.myPalette">
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
      <Section label={t.settings.colorArchive} ccId="settings.colorArchive">
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
      <Section label={t.settings.colorCombos} ccId="settings.colorCombos">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
      <Section label={t.settings.effects} ccId="settings.effects">
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
      <Section label={t.settings.fontFamily} ccId="settings.fontFamily">
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
      <Section label={t.settings.borderRadius} ccId="settings.borderRadius">
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
      <Section label={t.settings.density} ccId="settings.density">
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
      <Section label={t.brand.companyName} ccId="settings.brandLogo">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--cc-accent-600-20)] transition-colors hover:bg-[var(--cc-accent-600-30)]"
            title={t.brand.uploadLogo}
          >
            {brandProfile.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- dynamic data URL
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
      <Section label={t.brand.tagline} ccId="settings.brandTagline">
        <Input
          value={brandProfile.tagline}
          onChange={(e) => updateBrand({ tagline: e.target.value })}
          placeholder={t.brand.tagline}
        />
      </Section>

      {/* Brand Colors */}
      <Section label={t.brand.brandColors} ccId="settings.brandColors">
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

// ─── Widget Bar Tab ──────────────────────────────────────────

function WidgetBarTab() {
  const { language } = useSettings();
  const {
    profiles,
    activeProfileId,
    saveProfile,
    loadProfile,
    deleteProfile,
    renameProfile,
    updateProfileSnapshot,
    widgetPositions,
    widgetSizes,
    widgetPlacements,
    hoverDelay,
    folders,
  } = useWidgets();
  const t = getTranslations(language);
  const s = t.settings as Record<string, string>;

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const allProfiles = useMemo(
    () => [...BUILTIN_PROFILES, ...profiles],
    [profiles]
  );

  const activeProfile = useMemo(
    () => allProfiles.find((p) => p.id === activeProfileId) || null,
    [allProfiles, activeProfileId]
  );

  const isModified = useMemo(() => {
    if (!activeProfile) return false;
    const current = JSON.stringify({
      positions: widgetPositions,
      sizes: widgetSizes,
      placements: widgetPlacements,
      hoverDelay,
      folders,
    });
    return current !== JSON.stringify(activeProfile.snapshot);
  }, [activeProfile, widgetPositions, widgetSizes, widgetPlacements, hoverDelay, folders]);

  const handleSave = useCallback(() => {
    const name = newName.trim();
    if (!name) return;
    saveProfile(name);
    setNewName("");
  }, [newName, saveProfile]);

  const handleFinishRename = useCallback(
    (id: string) => {
      const name = editName.trim();
      if (name) renameProfile(id, name);
      setEditingId(null);
    },
    [editName, renameProfile]
  );

  const profileName = useCallback(
    (p: WidgetBarProfile) => (p.nameKey ? s[p.nameKey] || p.name : p.name),
    [s]
  );

  return (
    <div className="max-w-2xl space-y-4">
      {/* Active profile */}
      <Section label={s.activeProfile} ccId="settings.activeProfile">
        <div className="flex items-center gap-2 rounded-lg bg-slate-700/30 px-3 py-2.5">
          {activeProfile ? (
            <>
              <div className="h-2 w-2 rounded-full bg-[var(--cc-accent-500)]" />
              <span className="text-sm font-medium text-slate-200">
                {profileName(activeProfile)}
              </span>
              {activeProfile.builtIn && (
                <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {s.builtIn}
                </span>
              )}
              {isModified && (
                <span className="text-xs text-amber-400">{s.profileModified}</span>
              )}
            </>
          ) : (
            <span className="text-sm text-slate-500">{s.noActiveProfile}</span>
          )}
        </div>
      </Section>

      {/* Save current as new */}
      <Section label={s.saveNewProfile} ccId="settings.saveNewProfile">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            placeholder={s.profileNamePlaceholder}
            className="flex-1"
          />
          <Button onClick={handleSave} disabled={!newName.trim()} icon={Download}>
            {t.common?.save || "Save"}
          </Button>
        </div>
      </Section>

      {/* Overwrite active (only for user profiles that are modified) */}
      {activeProfile && !activeProfile.builtIn && isModified && (
        <Section label={s.updateProfile} ccId="settings.updateProfile">
          <Button
            variant="ghost"
            icon={Upload}
            onClick={() => updateProfileSnapshot(activeProfile.id)}
          >
            {s.overwriteProfile}
          </Button>
        </Section>
      )}

      {/* Profile list */}
      <Section label={s.savedProfiles} ccId="settings.savedProfiles">
        {allProfiles.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500">{s.noProfiles}</p>
        ) : (
          <div className="space-y-2">
            {allProfiles.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                  activeProfileId === p.id
                    ? "bg-[var(--cc-accent-600-20)] border border-[var(--cc-accent-500)]/20"
                    : "bg-slate-700/30"
                }`}
              >
                {/* Active dot */}
                {activeProfileId === p.id && (
                  <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--cc-accent-500)]" />
                )}

                {/* Name / edit */}
                <div className="flex-1 min-w-0">
                  {editingId === p.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFinishRename(p.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onBlur={() => handleFinishRename(p.id)}
                      autoFocus
                      className="w-full rounded bg-slate-700 px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
                    />
                  ) : (
                    <>
                      <span className="text-sm font-medium text-slate-200">
                        {profileName(p)}
                      </span>
                      {p.builtIn && (
                        <span className="ms-2 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500">
                          {s.builtIn}
                        </span>
                      )}
                      <div className="text-[10px] text-slate-600">
                        {new Date(p.createdAt).toLocaleDateString(
                          language === "he" ? "he-IL" : language === "ru" ? "ru-RU" : "en-US"
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => loadProfile(p.id)}
                    className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      activeProfileId === p.id
                        ? "bg-[var(--cc-accent-600)] text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {activeProfileId === p.id ? (
                      <Check className="inline h-3 w-3" />
                    ) : (
                      s.loadProfile
                    )}
                  </button>
                  {!p.builtIn && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(p.id);
                          setEditName(p.name);
                        }}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                        title={s.renameProfile}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProfile(p.id)}
                        className="rounded p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                        title={t.common?.delete || "Delete"}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ─── Notification Template Types ─────────────────────────────

type TemplateType = "status" | "mention" | "deadline" | "ai";

interface NotificationTemplate {
  title: string;
  body: string;
}

type NotificationTemplates = Record<TemplateType, NotificationTemplate>;

const DEFAULT_TEMPLATES: NotificationTemplates = {
  status: { title: "{{project}} — Status Update", body: "Status changed by {{user}}" },
  mention: { title: "{{user}} mentioned you", body: "In {{project}}" },
  deadline: { title: "Deadline: {{project}}", body: "Due {{date}}" },
  ai: { title: "AI Response Ready", body: "Your request in {{project}} is complete" },
};

const TEMPLATES_KEY = "cc-notification-templates";

function loadTemplates(): NotificationTemplates {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (raw) return { ...DEFAULT_TEMPLATES, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_TEMPLATES };
}

// ─── PWA Tab ─────────────────────────────────────────────────

function PWATab() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const p = t.pwa as Record<string, string>;
  const install = useInstallPrompt();
  const push = usePushSubscription();
  const caps = useDeviceCapabilities();
  const camera = useCamera();
  const contacts = useContacts();
  const wakeLock = useWakeLock();

  // Notification templates
  const [templates, setTemplates] = useState<NotificationTemplates>(DEFAULT_TEMPLATES);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
  useEffect(() => { setTemplates(loadTemplates()); }, []);

  const updateTemplate = useCallback(
    (type: TemplateType, field: "title" | "body", value: string) => {
      setTemplates((prev) => {
        const next = { ...prev, [type]: { ...prev[type], [field]: value } };
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  // QR Scanner modal
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Geolocation
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Push subscribers
  const [subscribers, setSubscribers] = useState<Array<{ user_id: string; endpoint: string; email?: string; created_at: string; updated_at: string }>>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [cleaningExpired, setCleaningExpired] = useState(false);

  useEffect(() => {
    async function fetchSubs() {
      setSubsLoading(true);
      try {
        const res = await fetch("/api/push/subscribers");
        if (res.ok) {
          const data = await res.json();
          setSubscribers(data.subscribers || []);
        }
      } catch { /* ignore */ }
      setSubsLoading(false);
    }
    fetchSubs();
  }, []);

  const handleSendTest = useCallback(async () => {
    await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "GAM CC — Test",
        body: p.testPushSent,
        url: "/dashboard/settings",
        tag: "test",
      }),
    });
  }, [p.testPushSent]);

  const handleSendToUser = useCallback(async (userId: string) => {
    await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "GAM CC",
        body: "Notification from admin",
        userId,
      }),
    });
  }, []);

  const handleSendToAll = useCallback(async () => {
    await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "GAM CC",
        body: "Broadcast notification",
      }),
    });
  }, []);

  const handleCleanExpired = useCallback(async () => {
    setCleaningExpired(true);
    try {
      const res = await fetch("/api/push/subscribers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "expired" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.cleaned > 0) {
          // Refresh list
          const listRes = await fetch("/api/push/subscribers");
          if (listRes.ok) {
            const listData = await listRes.json();
            setSubscribers(listData.subscribers || []);
          }
        }
      }
    } catch { /* ignore */ }
    setCleaningExpired(false);
  }, []);

  const handleTestShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "GAM Command Center",
          text: "Internal project management dashboard",
          url: window.location.origin + "/dashboard",
        });
      } catch { /* user cancelled */ }
    }
  }, []);

  const handleTestVibration = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }, []);

  const handleGetLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeoLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* denied */ }
    );
  }, []);

  // Permission badge helper
  const permBadge = (granted: boolean, label?: string) => (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        granted
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-slate-700 text-slate-400"
      }`}
    >
      {granted ? (label || p.supported) : (label || p.notSupported)}
    </span>
  );

  const TEMPLATE_TYPES: { type: TemplateType; tKey: string }[] = [
    { type: "status", tKey: "templateStatus" },
    { type: "mention", tKey: "templateMention" },
    { type: "deadline", tKey: "templateDeadline" },
    { type: "ai", tKey: "templateAi" },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      {/* Section 1: Installation Status */}
      <Section label={p.installationStatus} ccId="settings.pwa.install">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-slate-400" />
            {install.state === "standalone" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-400">
                {p.installedStandalone}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-sm font-medium text-amber-400">
                {p.runningInBrowser}
              </span>
            )}
          </div>

          {install.state === "installable" && (
            <Button icon={Download} onClick={install.install}>
              {p.installApp}
            </Button>
          )}
          {install.state === "ios" && (
            <p className="text-xs text-slate-500">{p.iosInstallHint}</p>
          )}

          <div className="space-y-1 text-xs text-slate-500">
            <div><span className="text-slate-400">{p.appName}:</span> GAM Command Center</div>
            <div><span className="text-slate-400">{p.appDescription}:</span> Internal project management dashboard for G.A.M</div>
          </div>
        </div>
      </Section>

      {/* Section 2: Push Notifications */}
      <Section label={p.pushNotifications} ccId="settings.pwa.push">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-slate-400" />
            {push.state === "subscribed" && permBadge(true, p.permGranted)}
            {push.state === "denied" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400">
                {p.permDenied}
              </span>
            )}
            {push.state === "prompt" && permBadge(false, p.permPrompt)}
            {push.state === "unsupported" && permBadge(false, p.permUnsupported)}
            {push.state === "loading" && (
              <span className="text-xs text-slate-500">{p.loading}</span>
            )}
          </div>

          <div className="flex gap-2">
            {push.state === "subscribed" ? (
              <Button variant="ghost" size="sm" icon={WifiOff} onClick={push.unsubscribe}>
                {p.disablePush}
              </Button>
            ) : push.state === "prompt" ? (
              <Button size="sm" icon={Wifi} onClick={push.subscribe}>
                {p.enablePush}
              </Button>
            ) : null}

            {push.state === "subscribed" && (
              <Button variant="ghost" size="sm" icon={Send} onClick={handleSendTest}>
                {p.sendTestPush}
              </Button>
            )}
          </div>

          {/* Notification Templates */}
          <div className="mt-2 space-y-2">
            <label className="block text-xs font-medium text-slate-400">{p.notificationTemplates}</label>
            <p className="text-[10px] text-slate-600">{p.templateVars}</p>
            {TEMPLATE_TYPES.map(({ type, tKey }) => (
              <div key={type} className="space-y-1 rounded-lg bg-slate-700/30 p-2.5">
                <span className="text-[11px] font-medium text-slate-300">{p[tKey]}</span>
                <input
                  type="text"
                  value={templates[type].title}
                  onChange={(e) => updateTemplate(type, "title", e.target.value)}
                  placeholder={p.templateTitle}
                  className="w-full rounded bg-slate-700 px-2 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
                />
                <input
                  type="text"
                  value={templates[type].body}
                  onChange={(e) => updateTemplate(type, "body", e.target.value)}
                  placeholder={p.templateBody}
                  className="w-full rounded bg-slate-700 px-2 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
                />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Section 3: Camera & Scanner */}
      <Section label={p.cameraScanner} ccId="settings.pwa.camera">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Camera className="h-5 w-5 text-slate-400" />
            {camera.isSupported ? (
              permBadge(camera.permission === "granted", camera.permission === "granted" ? p.permGranted : p.permPrompt)
            ) : (
              permBadge(false, p.permUnsupported)
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {camera.isSupported && camera.permission !== "granted" && (
              <Button size="sm" variant="ghost" icon={Camera} onClick={camera.requestPermission}>
                {p.requestCamera}
              </Button>
            )}
            <Button size="sm" variant="ghost" icon={ScanLine} onClick={() => setScannerOpen(true)}>
              {p.scanQR}
            </Button>
            <Button size="sm" variant="ghost" icon={Image} onClick={camera.takePhoto}>
              {p.takePhoto}
            </Button>
          </div>

          {/* QR Scanner Modal */}
          {scannerOpen && <QRScannerModal onClose={() => setScannerOpen(false)} onResult={(r) => { setScanResult(r); setScannerOpen(false); }} />}

          {scanResult && (
            <div className="rounded-lg bg-slate-700/30 p-2.5">
              <label className="text-[10px] font-medium text-slate-400">{p.scanResult}</label>
              <p className="mt-1 break-all text-xs text-slate-200">{scanResult}</p>
            </div>
          )}

          {camera.photoUrl && (
            <div className="space-y-2">
              <label className="text-[10px] font-medium text-slate-400">{p.photoPreview}</label>
              {/* eslint-disable-next-line @next/next/no-img-element -- dynamic data URL */}
              <img src={camera.photoUrl} alt="Captured" className="max-h-48 rounded-lg border border-slate-700" />
              <Button size="sm" variant="ghost" icon={Trash} onClick={camera.clearPhoto}>
                {p.clearPhoto}
              </Button>
            </div>
          )}
        </div>
      </Section>

      {/* Section 4: Contacts */}
      <Section label={p.contacts} ccId="settings.pwa.contacts">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-slate-400" />
            {contacts.isSupported ? (
              permBadge(true, p.contactsSupported)
            ) : (
              permBadge(false, p.contactsNotSupported)
            )}
          </div>

          {!contacts.isSupported && (
            <p className="text-xs text-slate-500">{p.contactsHint}</p>
          )}

          {contacts.isSupported && (
            <div className="flex gap-2">
              <Button size="sm" icon={Users} onClick={contacts.pickContacts} disabled={contacts.loading}>
                {p.importContacts}
              </Button>
              {contacts.contacts.length > 0 && (
                <Button size="sm" variant="ghost" icon={Trash} onClick={contacts.clearContacts}>
                  {p.clearContacts}
                </Button>
              )}
            </div>
          )}

          {contacts.contacts.length > 0 ? (
            <div className="max-h-48 overflow-y-auto rounded-lg bg-slate-700/30">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="px-2 py-1.5 text-start font-medium">{p.contactName}</th>
                    <th className="px-2 py-1.5 text-start font-medium">{p.contactEmail}</th>
                    <th className="px-2 py-1.5 text-start font-medium">{p.contactPhone}</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.contacts.map((c, i) => (
                    <tr key={i} className="border-b border-slate-700/50 last:border-0">
                      <td className="px-2 py-1.5 text-slate-200">{c.name || "—"}</td>
                      <td className="px-2 py-1.5 text-slate-300">{c.email || "—"}</td>
                      <td className="px-2 py-1.5 text-slate-300">{c.tel || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : contacts.isSupported ? (
            <p className="text-xs text-slate-500">{p.noContacts}</p>
          ) : null}
        </div>
      </Section>

      {/* Section 5: Device Capabilities */}
      <Section label={p.deviceCapabilities} ccId="settings.pwa.capabilities">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {/* Web Share */}
          <div className="rounded-lg bg-slate-700/30 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Share2 className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-300">{p.webShare}</span>
            </div>
            {permBadge(caps.share)}
            {caps.share && (
              <button type="button" onClick={handleTestShare} className="mt-2 w-full rounded bg-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-600">
                {p.testShare}
              </button>
            )}
          </div>

          {/* Wake Lock */}
          <div className="rounded-lg bg-slate-700/30 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Moon className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-300">{p.wakeLock}</span>
            </div>
            {permBadge(caps.wakeLock)}
            {caps.wakeLock && (
              <>
                <button
                  type="button"
                  onClick={wakeLock.toggle}
                  className={`mt-2 w-full rounded px-2 py-1 text-[10px] transition-colors ${
                    wakeLock.isActive
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {wakeLock.isActive ? p.wakeLockActive : p.wakeLock}
                </button>
              </>
            )}
          </div>

          {/* Vibration */}
          <div className="rounded-lg bg-slate-700/30 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Vibrate className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-300">{p.vibration}</span>
            </div>
            {permBadge(caps.vibration)}
            {caps.vibration && (
              <button type="button" onClick={handleTestVibration} className="mt-2 w-full rounded bg-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-600">
                {p.testVibration}
              </button>
            )}
          </div>

          {/* Geolocation */}
          <div className="rounded-lg bg-slate-700/30 p-3">
            <div className="mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-300">{p.geolocation}</span>
            </div>
            {permBadge(caps.geolocation)}
            {caps.geolocation && (
              <>
                <button type="button" onClick={handleGetLocation} className="mt-2 w-full rounded bg-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-600">
                  {p.getLocation}
                </button>
                {geoLocation && (
                  <p className="mt-1 text-[10px] font-mono text-slate-400">
                    {geoLocation.lat.toFixed(5)}, {geoLocation.lng.toFixed(5)}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Badge API */}
          <div className="rounded-lg bg-slate-700/30 p-3">
            <div className="mb-2 flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-300">{p.badgeApi}</span>
            </div>
            {permBadge(caps.badge)}
          </div>

          {/* Background Sync */}
          <div className="rounded-lg bg-slate-700/30 p-3">
            <div className="mb-2 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-300">{p.backgroundSync}</span>
            </div>
            {permBadge(caps.backgroundSync)}
          </div>

          {/* Service Worker */}
          <div className="rounded-lg bg-slate-700/30 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Wifi className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-300">{p.serviceWorkerStatus}</span>
            </div>
            {permBadge(caps.serviceWorker)}
          </div>
        </div>
      </Section>

      {/* Section 6: Push Subscribers Admin */}
      <Section label={p.pushAdmin} ccId="settings.pwa.admin">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" icon={Send} onClick={handleSendToAll} disabled={subscribers.length === 0}>
              {p.sendToAll}
            </Button>
            <Button size="sm" variant="ghost" icon={Trash} onClick={handleCleanExpired} disabled={cleaningExpired}>
              {cleaningExpired ? p.cleaning : p.cleanExpired}
            </Button>
          </div>

          {subsLoading ? (
            <p className="py-4 text-center text-xs text-slate-500">{p.loading}</p>
          ) : subscribers.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">{p.noSubscribers}</p>
          ) : (
            <div className="max-h-64 overflow-y-auto rounded-lg bg-slate-700/30">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="px-2 py-1.5 text-start font-medium">{p.subscriberEmail}</th>
                    <th className="px-2 py-1.5 text-start font-medium">{p.subscriberDate}</th>
                    <th className="px-2 py-1.5 text-start font-medium">{p.subscriberLastActive}</th>
                    <th className="px-2 py-1.5 text-end font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub, i) => (
                    <tr key={i} className="border-b border-slate-700/50 last:border-0">
                      <td className="px-2 py-1.5 text-slate-200">{sub.email || sub.user_id.slice(0, 8)}</td>
                      <td className="px-2 py-1.5 text-slate-400">
                        {new Date(sub.created_at).toLocaleDateString(language === "he" ? "he-IL" : language === "ru" ? "ru-RU" : "en-US")}
                      </td>
                      <td className="px-2 py-1.5 text-slate-400">
                        {new Date(sub.updated_at).toLocaleDateString(language === "he" ? "he-IL" : language === "ru" ? "ru-RU" : "en-US")}
                      </td>
                      <td className="px-2 py-1.5 text-end">
                        <button
                          type="button"
                          onClick={() => handleSendToUser(sub.user_id)}
                          className="rounded px-2 py-0.5 text-[10px] text-slate-400 hover:bg-slate-600 hover:text-slate-200"
                        >
                          {p.sendToUser}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

// ─── QR Scanner Modal ────────────────────────────────────────

function QRScannerModal({ onClose, onResult }: { onClose: () => void; onResult: (result: string) => void }) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled || !scannerRef.current) return;

      const scanner = new Html5Qrcode(scannerRef.current.id);
      html5QrRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            onResult(decodedText);
            scanner.stop().catch(() => {});
          },
          () => { /* ignore scan failures */ }
        );
      } catch {
        // Camera denied or unavailable
        onClose();
      }
    }

    init();

    return () => {
      cancelled = true;
      if (html5QrRef.current) {
        const s = html5QrRef.current as { stop: () => Promise<void> };
        s.stop().catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-lg bg-slate-800 p-4" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute end-2 top-2 rounded-full p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
        >
          <XIcon className="h-4 w-4" />
        </button>
        <div id="qr-scanner-container" ref={scannerRef} className="overflow-hidden rounded-lg" />
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const { language } = useSettings();
  const t = getTranslations(language);
  const searchParams = useSearchParams();

  // Auto-switch to accounts tab when redirected from Google OAuth
  useEffect(() => {
    if (searchParams.get("tab") === "accounts") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
      setActiveTab("accounts");
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader pageKey="settings" />

      {/* Internal tab bar */}
      <div className="mt-6 flex gap-1 border-b border-slate-700/50 pb-0 overflow-x-auto" data-cc-id="settings.tabs">
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
        {activeTab === "skins" && <SkinsTab />}
        {activeTab === "brand" && <BrandTab />}
        {activeTab === "widgetBar" && <WidgetBarTab />}
        {activeTab === "pwa" && <PWATab />}
        {activeTab === "accounts" && <IntegrationsTab />}
        {activeTab === "emailTemplates" && <EmailTemplatesTab />}
      </div>
    </div>
  );
}
