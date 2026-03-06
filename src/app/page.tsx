"use client";

import Link from "next/link";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { LayoutDashboard, Users, Shield, ChevronLeft, ChevronRight, CheckCircle2, Clock, Globe } from "lucide-react";

interface ZoneCard {
  id: string;
  titleKey: "devDashboard" | "clientManagement" | "adminDevLog";
  descKey: "devDashboardDesc" | "clientManagementDesc" | "adminDevLogDesc";
  icon: React.ElementType;
  href: string | null;
  active: boolean;
}

const zones: ZoneCard[] = [
  {
    id: "dev-dashboard",
    titleKey: "devDashboard",
    descKey: "devDashboardDesc",
    icon: LayoutDashboard,
    href: "/dashboard",
    active: true,
  },
  {
    id: "client-management",
    titleKey: "clientManagement",
    descKey: "clientManagementDesc",
    icon: Users,
    href: null,
    active: false,
  },
  {
    id: "admin-dev-log",
    titleKey: "adminDevLog",
    descKey: "adminDevLogDesc",
    icon: Shield,
    href: "/dashboard/admin",
    active: true,
  },
];

export default function Home() {
  const { language, setLanguage } = useSettings();
  const t = getTranslations(language);
  const isHe = language === "he";
  const Arrow = isHe ? ChevronLeft : ChevronRight;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
      {/* Language toggle */}
      <button
        type="button"
        onClick={() => setLanguage(isHe ? "en" : "he")}
        className="fixed top-4 left-4 z-10 flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
      >
        <Globe size={13} />
        {isHe ? "EN" : "עב"}
      </button>

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[11px] text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {t.home.workspaceLabel}
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {t.home.workspaceName}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{t.home.description}</p>
      </div>

      {/* Zone Cards */}
      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {zones.map((zone) => {
          const Icon = zone.icon;
          const title = t.home[zone.titleKey];
          const desc = t.home[zone.descKey];

          if (!zone.active) {
            return (
              <div
                key={zone.id}
                className="flex flex-col items-center rounded-2xl border border-white/[0.04] bg-white/[0.015] p-6 text-center opacity-40"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]">
                  <Icon size={22} className="text-slate-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-400">{title}</h2>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-slate-600">
                  <Clock size={10} />
                  {t.home.comingSoon}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={zone.id}
              href={zone.href!}
              className="group flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center transition-all duration-200 hover:border-[var(--cc-accent-600-20)] hover:bg-[var(--cc-accent-500-15)]"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] transition-colors group-hover:bg-[var(--cc-accent-600-20)]">
                <Icon size={22} className="text-slate-400 transition-colors group-hover:text-[var(--cc-accent-500)]" />
              </div>
              <h2 className="text-sm font-semibold text-slate-200 group-hover:text-white">{title}</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-slate-600 transition-colors group-hover:text-[var(--cc-accent-500)]">
                <CheckCircle2 size={10} className="text-emerald-500" />
                Active
                <Arrow size={12} className="opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-[11px] text-slate-700">
        GAM Command Center v0.6.0
      </div>
    </div>
  );
}
