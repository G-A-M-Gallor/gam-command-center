"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { Clock, Sparkles } from "lucide-react";

const labels = {
  he: { title: "בקרוב", subtitle: "העמוד הזה בפיתוח ויהיה זמין בקרוב", back: "חזרה לדשבורד" },
  en: { title: "Coming Soon", subtitle: "This page is under development and will be available soon", back: "Back to Dashboard" },
  ru: { title: "Скоро", subtitle: "Эта страница в разработке и скоро будет доступна", back: "На главную" },
};

interface ComingSoonPageProps {
  icon?: React.ReactNode;
  nameHe: string;
  nameEn: string;
  nameRu: string;
}

export function ComingSoonPage({ icon, nameHe, nameEn, nameRu }: ComingSoonPageProps) {
  const { language } = useSettings();
  const isRtl = language === "he";
  const l = labels[language];
  const name = language === "he" ? nameHe : language === "ru" ? nameRu : nameEn;

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800/50 border border-slate-700/50">
          {icon || <Sparkles className="h-8 w-8 text-[var(--cc-accent-400)]" />}
        </div>
        <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30">
          <Clock className="h-3 w-3 text-amber-400" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-1">{name}</h1>
      <span className="inline-block rounded-full bg-[var(--cc-accent-600)]/20 px-3 py-1 text-xs font-medium text-[var(--cc-accent-300)] mb-3">
        {l.title}
      </span>
      <p className="text-sm text-slate-400 max-w-md">{l.subtitle}</p>
      <a
        href="/dashboard"
        className="mt-6 rounded-lg bg-slate-800 border border-slate-700/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
      >
        {l.back}
      </a>
    </div>
  );
}
