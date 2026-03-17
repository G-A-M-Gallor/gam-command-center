"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  RotateCcw,
  LayoutDashboard,
  Activity,
  FileEdit,
  Map,
  Bot,
  Database,
  MessagesSquare,
  FileSignature,
  BookOpen,
  Grid3X3,
  Palette,
  Calendar,
  Sheet,
  Presentation,
  Users,
  Sparkles,
  Mail,
  Compass,
  Network,
  Shield,
  ClipboardList,
  Upload,
  Rss,
  Zap,
  Settings,
  Gauge,
  Home,
  Star,
  Heart,
  Folder,
  Search,
  Bell,
  Globe,
  Lock,
  Briefcase,
  Building2,
  Phone,
  Camera,
  Image,
  Music,
  Video,
  Code,
  Terminal,
  Cpu,
  Wifi,
  Cloud,
  Sun,
  Moon,
  Flame,
  Rocket,
  Target,
  Award,
  Crown,
  Gem,
  Layers,
  Package,
  Truck,
  HardHat,
  Wrench,
  Hammer,
  type LucideIcon,
} from "lucide-react";
import type { ItemCustomization, IconPosition, LabelLanguage } from "@/lib/sidebar/sidebarCustomization";

// ─── Icon Registry ──────────────────────────────────────────

export const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Activity, FileEdit, Map, Bot, Database,
  MessagesSquare, FileSignature, BookOpen, Grid3X3, Palette,
  Calendar, Sheet, Presentation, Users, Sparkles, Mail,
  Compass, Network, Shield, ClipboardList, Upload, Rss, Zap,
  Settings, Gauge, Home, Star, Heart, Folder, Search, Bell,
  Globe, Lock, Briefcase, Building2, Phone, Camera, Image,
  Music, Video, Code, Terminal, Cpu, Wifi, Cloud, Sun, Moon,
  Flame, Rocket, Target, Award, Crown, Gem, Layers, Package,
  Truck, HardHat, Wrench, Hammer,
};

export function getIconByName(name: string | undefined): LucideIcon | null {
  if (!name) return null;
  return ICON_MAP[name] ?? null;
}

// ─── Props ──────────────────────────────────────────────────

interface ItemEditPopoverProps {
  itemKey: string;
  currentLabel: string;
  customization: ItemCustomization | undefined;
  onUpdate: (patch: Partial<ItemCustomization>) => void;
  onClear: () => void;
  onClose: () => void;
  isRtl: boolean;
  labels: {
    customLabel: string;
    language: string;
    iconPosition: string;
    changeIcon: string;
    reset: string;
    langHe: string;
    langEn: string;
    langRu: string;
    langCustom: string;
    posStart: string;
    posEnd: string;
    posAbove: string;
  };
}

// ─── Component ──────────────────────────────────────────────

export function ItemEditPopover({
  itemKey,
  currentLabel,
  customization,
  onUpdate,
  onClear,
  onClose,
  isRtl,
  labels,
}: ItemEditPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [localLabel, setLocalLabel] = useState(customization?.customLabel || "");
  const [labelLang, setLabelLang] = useState<LabelLanguage>(customization?.labelLanguage || "he");
  const [iconPos, setIconPos] = useState<IconPosition>(customization?.iconPosition || "start");
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(customization?.customIcon);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleLabelChange = useCallback((value: string) => {
    setLocalLabel(value);
    onUpdate({ customLabel: value, labelLanguage: "custom" });
    setLabelLang("custom");
  }, [onUpdate]);

  const handleLangChange = useCallback((lang: LabelLanguage) => {
    setLabelLang(lang);
    onUpdate({ labelLanguage: lang });
  }, [onUpdate]);

  const handleIconPosChange = useCallback((pos: IconPosition) => {
    setIconPos(pos);
    onUpdate({ iconPosition: pos });
  }, [onUpdate]);

  const handleIconSelect = useCallback((iconName: string) => {
    setSelectedIcon(iconName);
    onUpdate({ customIcon: iconName });
    setShowIconPicker(false);
  }, [onUpdate]);

  const handleReset = useCallback(() => {
    setLocalLabel("");
    setLabelLang("he");
    setIconPos("start");
    setSelectedIcon(undefined);
    onClear();
  }, [onClear]);

  const langOptions: { id: LabelLanguage; label: string }[] = [
    { id: "he", label: labels.langHe },
    { id: "en", label: labels.langEn },
    { id: "ru", label: labels.langRu },
    { id: "custom", label: labels.langCustom },
  ];

  const posOptions: { id: IconPosition; label: string }[] = [
    { id: "start", label: labels.posStart },
    { id: "end", label: labels.posEnd },
    { id: "above", label: labels.posAbove },
  ];

  return (
    <div
      ref={ref}
      dir={isRtl ? "rtl" : "ltr"}
      className="absolute z-50 w-64 rounded-xl border border-slate-700 shadow-2xl overflow-hidden"
      style={{ backgroundColor: "var(--nav-bg)" }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
        <span className="text-[11px] font-medium text-slate-300 truncate">{currentLabel}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleReset}
            className="rounded p-1 text-slate-500 hover:text-red-400 transition-colors"
            title={labels.reset}
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Custom label */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
            {labels.customLabel}
          </label>
          <input
            type="text"
            value={localLabel}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder={currentLabel}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-[var(--cc-accent-500)] focus:outline-none"
          />
        </div>

        {/* Language selector */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
            {labels.language}
          </label>
          <div className="flex gap-0.5 rounded-lg bg-slate-800/50 p-0.5">
            {langOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleLangChange(opt.id)}
                className={`flex-1 rounded-md px-1 py-1 text-[10px] font-medium transition-colors truncate ${
                  labelLang === opt.id
                    ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Icon position */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
            {labels.iconPosition}
          </label>
          <div className="flex gap-0.5 rounded-lg bg-slate-800/50 p-0.5">
            {posOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleIconPosChange(opt.id)}
                className={`flex-1 rounded-md px-1 py-1 text-[10px] font-medium transition-colors ${
                  iconPos === opt.id
                    ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Change icon */}
        <div>
          <button
            type="button"
            onClick={() => setShowIconPicker(!showIconPicker)}
            className="flex w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
          >
            {selectedIcon && ICON_MAP[selectedIcon] ? (() => {
              const SelectedIcon = ICON_MAP[selectedIcon];
              return <SelectedIcon className="h-3.5 w-3.5 text-[var(--cc-accent-400)]" />;
            })() : (
              <Palette className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span>{labels.changeIcon}</span>
          </button>

          {/* Icon grid */}
          {showIconPicker && (
            <div className="mt-2 grid grid-cols-8 gap-0.5 max-h-40 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/30 p-1.5">
              {Object.entries(ICON_MAP).map(([name, IconComp]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleIconSelect(name)}
                  className={`flex items-center justify-center rounded p-1.5 transition-colors ${
                    selectedIcon === name
                      ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
                      : "text-slate-500 hover:bg-slate-700/50 hover:text-slate-300"
                  }`}
                  title={name}
                >
                  <IconComp className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
