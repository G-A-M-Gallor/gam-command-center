"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { generateAccentPalette, generateGlowShadow } from "@/lib/colorUtils";
import type { SkinConfig, ShellSkinId, ContentSkinId, MobileNavSkinId } from "@/lib/skins/types";
import { DEFAULT_SKIN_CONFIG } from "@/lib/skins/types";

const STORAGE_KEYS = {
  language: "cc-language",
  sidebarPosition: "cc-sidebar-position",
  sidebarVisibility: "cc-sidebar-visibility",
  accentColor: "cc-accent-color",
  fontFamily: "cc-font-family",
  borderRadius: "cc-border-radius",
  density: "cc-density",
  brandProfile: "cc-brand-profile",
  customAccentHex: "cc-custom-accent-hex",
  savedColors: "cc-saved-colors",
  accentEffect: "cc-accent-effect",
  archivedColors: "cc-archived-colors",
  gibberishDetect: "cc-gibberish-detect",
  navColor: "cc-nav-color",
  skinConfig: "cc-skin-config",
} as const;

export type Language = "he" | "en" | "ru";
export type SidebarPosition = "right" | "left";
export type SidebarVisibility = "visible" | "float" | "hidden";
export type AccentColor = "purple" | "blue" | "emerald" | "amber" | "rose" | "cyan" | "brand" | "custom";

export interface SavedColor {
  hex: string;
  name?: string;
  locked?: boolean;
}

export type GlowIntensity = "subtle" | "medium" | "strong";

export interface AccentEffect {
  gradient: {
    enabled: boolean;
    direction: number;
    secondaryColor: string;
  };
  glow: {
    enabled: boolean;
    intensity: GlowIntensity;
  };
}

export interface BrandProfile {
  companyName: string;
  logoDataUrl: string;
  tagline: string;
  brandPrimary: string;
  brandSecondary: string;
  brandTertiary: string;
}
export type FontFamily = "geist" | "inter" | "system";
export type BorderRadius = "sharp" | "default" | "round";
export type Density = "compact" | "default" | "spacious";

interface Settings {
  language: Language;
  sidebarPosition: SidebarPosition;
  sidebarVisibility: SidebarVisibility;
  accentColor: AccentColor;
  fontFamily: FontFamily;
  borderRadius: BorderRadius;
  density: Density;
  brandProfile: BrandProfile;
  customAccentHex: string;
  savedColors: SavedColor[];
  archivedColors: SavedColor[];
  accentEffect: AccentEffect;
  navColor: string;
  gibberishDetect: boolean;
  skinConfig: SkinConfig;
  setLanguage: (lang: _Language) => void;
  setSidebarPosition: (pos: SidebarPosition) => void;
  setSidebarVisibility: (mode: SidebarVisibility) => void;
  setAccentColor: (color: AccentColor) => void;
  setFontFamily: (font: FontFamily) => void;
  setBorderRadius: (radius: BorderRadius) => void;
  setDensity: (density: Density) => void;
  setBrandProfile: (_profile: BrandProfile) => void;
  setCustomAccentHex: (hex: string) => void;
  setSavedColors: (colors: SavedColor[]) => void;
  setArchivedColors: (colors: SavedColor[]) => void;
  setAccentEffect: (effect: AccentEffect) => void;
  setNavColor: (color: string) => void;
  setGibberishDetect: (enabled: boolean) => void;
  setSkinConfig: (config: SkinConfig) => void;
  setShellSkin: (skin: ShellSkinId) => void;
  setContentSkin: (skin: ContentSkinId) => void;
  setMobileNavSkin: (skin: MobileNavSkinId) => void;
}

const defaultBrandProfile: BrandProfile = {
  companyName: "",
  logoDataUrl: "",
  tagline: "",
  brandPrimary: "",
  brandSecondary: "",
  brandTertiary: "",
};

const defaultAccentEffect: AccentEffect = {
  gradient: { enabled: false, direction: 90, secondaryColor: "#ffffff" },
  glow: { enabled: false, intensity: "subtle" },
};

const PRESET_HEX_MAP: Record<string, string> = {
  purple: "#9333ea",
  blue: "#2563eb",
  emerald: "#059669",
  amber: "#d97706",
  rose: "#e11d48",
  cyan: "#0891b2",
};

const defaultSettings: Settings = {
  language: "he",
  sidebarPosition: "right",
  sidebarVisibility: "visible",
  accentColor: "purple",
  fontFamily: "geist",
  borderRadius: "default",
  density: "default",
  brandProfile: defaultBrandProfile,
  customAccentHex: "",
  savedColors: [],
  archivedColors: [],
  accentEffect: defaultAccentEffect,
  navColor: "",
  gibberishDetect: true,
  skinConfig: DEFAULT_SKIN_CONFIG,
  setLanguage: () => { /* no-op */ },
  setSidebarPosition: () => { /* no-op */ },
  setSidebarVisibility: () => { /* no-op */ },
  setAccentColor: () => { /* no-op */ },
  setFontFamily: () => { /* no-op */ },
  setBorderRadius: () => { /* no-op */ },
  setDensity: () => { /* no-op */ },
  setBrandProfile: () => { /* no-op */ },
  setCustomAccentHex: () => { /* no-op */ },
  setSavedColors: () => { /* no-op */ },
  setArchivedColors: () => { /* no-op */ },
  setAccentEffect: () => { /* no-op */ },
  setNavColor: () => { /* no-op */ },
  setGibberishDetect: () => { /* no-op */ },
  setSkinConfig: () => { /* no-op */ },
  setShellSkin: () => { /* no-op */ },
  setContentSkin: () => { /* no-op */ },
  setMobileNavSkin: () => { /* no-op */ },
};

const ACCENT_COLORS: AccentColor[] = ["purple", "blue", "emerald", "amber", "rose", "cyan", "brand", "custom"];
const FONT_FAMILIES: FontFamily[] = ["geist", "inter", "system"];
const BORDER_RADII: BorderRadius[] = ["sharp", "default", "round"];
const DENSITIES: Density[] = ["compact", "default", "spacious"];

const SettingsContext = createContext<Settings>(defaultSettings);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("he");
  const [sidebarPosition, setSidebarPositionState] = useState<SidebarPosition>("right");
  const [sidebarVisibility, setSidebarVisibilityState] = useState<SidebarVisibility>("visible");
  const [accentColor, setAccentColorState] = useState<AccentColor>("purple");
  const [fontFamily, setFontFamilyState] = useState<FontFamily>("geist");
  const [borderRadius, setBorderRadiusState] = useState<BorderRadius>("default");
  const [density, setDensityState] = useState<Density>("default");
  const [_brandProfile, setBrandProfileState] = useState<BrandProfile>(defaultBrandProfile);
  const [customAccentHex, setCustomAccentHexState] = useState("");
  const [savedColors, setSavedColorsState] = useState<SavedColor[]>([]);
  const [archivedColors, setArchivedColorsState] = useState<SavedColor[]>([]);
  const [accentEffect, setAccentEffectState] = useState<AccentEffect>(defaultAccentEffect);
  const [navColor, setNavColorState] = useState("");
  const [gibberishDetect, setGibberishDetectState] = useState(true);
  const [skinConfig, setSkinConfigState] = useState<SkinConfig>(DEFAULT_SKIN_CONFIG);
  const [mounted, setMounted] = useState(false);

  // Load all settings from localStorage on mount
  useEffect(() => {
    const storedLang = localStorage.getItem(STORAGE_KEYS.language) as Language | null;
    const storedPos = localStorage.getItem(STORAGE_KEYS.sidebarPosition) as SidebarPosition | null;
    const storedVis = localStorage.getItem(STORAGE_KEYS.sidebarVisibility) as SidebarVisibility | null;
    const storedAccent = localStorage.getItem(STORAGE_KEYS.accentColor) as AccentColor | null;
    const storedFont = localStorage.getItem(STORAGE_KEYS.fontFamily) as FontFamily | null;
    const storedRadius = localStorage.getItem(STORAGE_KEYS.borderRadius) as BorderRadius | null;
    const storedDensity = localStorage.getItem(STORAGE_KEYS.density) as Density | null;
    if (storedLang === "he" || storedLang === "en" || storedLang === "ru") setLanguageState(storedLang);
    if (storedPos === "right" || storedPos === "left") setSidebarPositionState(storedPos);
    if (storedVis === "visible" || storedVis === "float" || storedVis === "hidden") setSidebarVisibilityState(storedVis);
    if (storedAccent && ACCENT_COLORS.includes(storedAccent)) setAccentColorState(storedAccent);
    if (storedFont && FONT_FAMILIES.includes(storedFont)) setFontFamilyState(storedFont);
    if (storedRadius && BORDER_RADII.includes(storedRadius)) setBorderRadiusState(storedRadius);
    if (storedDensity && DENSITIES.includes(storedDensity)) setDensityState(storedDensity);

    try {
      const storedBrand = localStorage.getItem(STORAGE_KEYS._brandProfile);
      if (storedBrand) {
        const parsed = JSON.parse(storedBrand) as Partial<BrandProfile>;
        setBrandProfileState({ ...defaultBrandProfile, ...parsed });
      }
    } catch { /* ignore */ }

    const storedCustomHex = localStorage.getItem(STORAGE_KEYS.customAccentHex);
    if (storedCustomHex) setCustomAccentHexState(storedCustomHex);

    try {
      const storedSaved = localStorage.getItem(STORAGE_KEYS.savedColors);
      if (storedSaved) setSavedColorsState(JSON.parse(storedSaved));
    } catch { /* ignore */ }

    try {
      const storedArchived = localStorage.getItem(STORAGE_KEYS.archivedColors);
      if (storedArchived) setArchivedColorsState(JSON.parse(storedArchived));
    } catch { /* ignore */ }

    try {
      const storedEffect = localStorage.getItem(STORAGE_KEYS.accentEffect);
      if (storedEffect) {
        const parsed = JSON.parse(storedEffect);
        setAccentEffectState({ ...defaultAccentEffect, ...parsed });
      }
    } catch { /* ignore */ }

    const storedNavColor = localStorage.getItem(STORAGE_KEYS.navColor);
    if (storedNavColor) setNavColorState(storedNavColor);

    const storedGibberish = localStorage.getItem(STORAGE_KEYS.gibberishDetect);
    if (storedGibberish !== null) setGibberishDetectState(storedGibberish !== "false");

    try {
      const storedSkin = localStorage.getItem(STORAGE_KEYS.skinConfig);
      if (storedSkin) {
        const parsed = JSON.parse(storedSkin);
        setSkinConfigState({ ...DEFAULT_SKIN_CONFIG, ...parsed });
      }
    } catch { /* ignore */ }

    setMounted(true);
  }, []);

  // Apply language + direction
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dir = language === "he" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, mounted]);

  // Apply theme data attributes + inline accent variables
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.dataset.accent = accentColor;
    root.dataset.font = fontFamily;
    root.dataset.radius = borderRadius;
    root.dataset.density = density;
    root.dataset.shellSkin = skinConfig.shell;
    root.dataset.contentSkin = skinConfig.content;
    root.dataset.mobileNav = skinConfig.mobileNav;
  }, [accentColor, fontFamily, borderRadius, density, skinConfig, mounted]);

  // Apply brand color CSS vars when brand colors change
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (_brandProfile.brandPrimary) {
      const palette = generateAccentPalette(_brandProfile.brandPrimary);
      root.style.setProperty("--cc-brand-300", palette["300"]);
      root.style.setProperty("--cc-brand-400", palette["400"]);
      root.style.setProperty("--cc-brand-500", palette["500"]);
      root.style.setProperty("--cc-brand-600", palette["600"]);
      root.style.setProperty("--cc-brand-600-20", palette["600-20"]);
      root.style.setProperty("--cc-brand-600-30", palette["600-30"]);
      root.style.setProperty("--cc-brand-500-15", palette["500-15"]);
      root.style.setProperty("--cc-brand-500-30", palette["500-30"]);
      root.style.setProperty("--cc-brand-500-50", palette["500-50"]);
      // --cc-accent-* mapping handled via CSS [data-accent="brand"] selector
    } else {
      // Clean up brand vars if no primary color
      const vars = ["300", "400", "500", "600", "600-20", "600-30", "500-15", "500-30", "500-50"];
      vars.forEach((v) => root.style.removeProperty(`--cc-brand-${v}`));
    }
  }, [brandProfile.brandPrimary, accentColor, mounted]);

  // Apply custom accent CSS vars
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (customAccentHex) {
      const palette = generateAccentPalette(customAccentHex);
      root.style.setProperty("--cc-custom-300", palette["300"]);
      root.style.setProperty("--cc-custom-400", palette["400"]);
      root.style.setProperty("--cc-custom-500", palette["500"]);
      root.style.setProperty("--cc-custom-600", palette["600"]);
      root.style.setProperty("--cc-custom-600-20", palette["600-20"]);
      root.style.setProperty("--cc-custom-600-30", palette["600-30"]);
      root.style.setProperty("--cc-custom-500-15", palette["500-15"]);
      root.style.setProperty("--cc-custom-500-30", palette["500-30"]);
      root.style.setProperty("--cc-custom-500-50", palette["500-50"]);
      // --cc-accent-* mapping handled via CSS [data-accent="custom"] selector
    } else {
      const vars = ["300", "400", "500", "600", "600-20", "600-30", "500-15", "500-30", "500-50"];
      vars.forEach((v) => root.style.removeProperty(`--cc-custom-${v}`));
    }
  }, [customAccentHex, accentColor, mounted]);

  // Apply gradient + glow accent effects
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const currentHex =
      accentColor === "custom" ? customAccentHex
      : accentColor === "brand" ? brandProfile.brandPrimary
      : PRESET_HEX_MAP[accentColor] || "";

    if (accentEffect.gradient.enabled && currentHex) {
      root.style.setProperty(
        "--cc-accent-gradient",
        `linear-gradient(${accentEffect.gradient.direction}deg, ${currentHex}, ${accentEffect.gradient.secondaryColor})`
      );
    } else {
      root.style.removeProperty("--cc-accent-gradient");
    }

    if (accentEffect.glow.enabled && currentHex) {
      root.style.setProperty("--cc-accent-glow", generateGlowShadow(currentHex, accentEffect.glow.intensity));
    } else {
      root.style.removeProperty("--cc-accent-glow");
    }
  }, [accentEffect, accentColor, customAccentHex, brandProfile.brandPrimary, mounted]);

  // Apply navigation color override
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (navColor) {
      root.style.setProperty("--nav-bg", navColor);
      root.style.setProperty("--nav-border", `color-mix(in srgb, ${navColor} 85%, white)`);
    } else {
      root.style.removeProperty("--nav-bg");
      root.style.removeProperty("--nav-border");
    }
  }, [navColor, mounted]);

  const setLanguage = useCallback((lang: _Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.language, lang);
  }, []);

  const setSidebarPosition = useCallback((pos: SidebarPosition) => {
    setSidebarPositionState(pos);
    localStorage.setItem(STORAGE_KEYS.sidebarPosition, pos);
  }, []);

  const setSidebarVisibility = useCallback((mode: SidebarVisibility) => {
    setSidebarVisibilityState(mode);
    localStorage.setItem(STORAGE_KEYS.sidebarVisibility, mode);
  }, []);

  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem(STORAGE_KEYS.accentColor, color);
  }, []);

  const setFontFamily = useCallback((font: FontFamily) => {
    setFontFamilyState(font);
    localStorage.setItem(STORAGE_KEYS.fontFamily, font);
  }, []);

  const setBorderRadius = useCallback((radius: BorderRadius) => {
    setBorderRadiusState(radius);
    localStorage.setItem(STORAGE_KEYS.borderRadius, radius);
  }, []);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    localStorage.setItem(STORAGE_KEYS.density, d);
  }, []);

  const setBrandProfile = useCallback((_profile: BrandProfile) => {
    setBrandProfileState(_profile);
    localStorage.setItem(STORAGE_KEYS._brandProfile, JSON.stringify(_profile));
  }, []);

  const setCustomAccentHex = useCallback((hex: string) => {
    setCustomAccentHexState(hex);
    localStorage.setItem(STORAGE_KEYS.customAccentHex, hex);
  }, []);

  const setSavedColors = useCallback((colors: SavedColor[]) => {
    setSavedColorsState(colors);
    localStorage.setItem(STORAGE_KEYS.savedColors, JSON.stringify(colors));
  }, []);

  const setArchivedColors = useCallback((colors: SavedColor[]) => {
    setArchivedColorsState(colors);
    localStorage.setItem(STORAGE_KEYS.archivedColors, JSON.stringify(colors));
  }, []);

  const setAccentEffect = useCallback((effect: AccentEffect) => {
    setAccentEffectState(effect);
    localStorage.setItem(STORAGE_KEYS.accentEffect, JSON.stringify(effect));
  }, []);

  const setNavColor = useCallback((color: string) => {
    setNavColorState(color);
    if (color) {
      localStorage.setItem(STORAGE_KEYS.navColor, color);
    } else {
      localStorage.removeItem(STORAGE_KEYS.navColor);
    }
  }, []);

  const setGibberishDetect = useCallback((enabled: boolean) => {
    setGibberishDetectState(enabled);
    localStorage.setItem(STORAGE_KEYS.gibberishDetect, String(enabled));
  }, []);

  const setSkinConfig = useCallback((config: SkinConfig) => {
    setSkinConfigState(config);
    localStorage.setItem(STORAGE_KEYS.skinConfig, JSON.stringify(config));
  }, []);

  const setShellSkin = useCallback((skin: ShellSkinId) => {
    setSkinConfigState((prev) => {
      const next = { ...prev, shell: skin };
      localStorage.setItem(STORAGE_KEYS.skinConfig, JSON.stringify(next));
      return next;
    });
  }, []);

  const setContentSkin = useCallback((skin: ContentSkinId) => {
    setSkinConfigState((prev) => {
      const next = { ...prev, content: skin };
      localStorage.setItem(STORAGE_KEYS.skinConfig, JSON.stringify(next));
      return next;
    });
  }, []);

  const setMobileNavSkin = useCallback((skin: MobileNavSkinId) => {
    setSkinConfigState((prev) => {
      const next = { ...prev, mobileNav: skin };
      localStorage.setItem(STORAGE_KEYS.skinConfig, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<Settings>(
    () => ({
      language,
      sidebarPosition,
      sidebarVisibility,
      accentColor,
      fontFamily,
      borderRadius,
      density,
      _brandProfile,
      customAccentHex,
      savedColors,
      archivedColors,
      accentEffect,
      navColor,
      gibberishDetect,
      skinConfig,
      setLanguage,
      setSidebarPosition,
      setSidebarVisibility,
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
      setGibberishDetect,
      setSkinConfig,
      setShellSkin,
      setContentSkin,
      setMobileNavSkin,
    }),
    [
      language,
      sidebarPosition,
      sidebarVisibility,
      accentColor,
      fontFamily,
      borderRadius,
      density,
      _brandProfile,
      customAccentHex,
      savedColors,
      archivedColors,
      accentEffect,
      navColor,
      setLanguage,
      setSidebarPosition,
      setSidebarVisibility,
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
      gibberishDetect,
      setGibberishDetect,
      skinConfig,
      setSkinConfig,
      setShellSkin,
      setContentSkin,
      setMobileNavSkin,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
