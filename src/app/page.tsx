"use client";

import Link from "next/link";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";

export default function Home() {
  const { language } = useSettings();
  const t = getTranslations(language);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <main className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-semibold text-slate-100">
          {t.home.title}
        </h1>
        <p className="text-slate-400">{t.home.description}</p>
        <Link
          href="/dashboard"
          className="rounded-lg bg-[var(--cc-accent-600)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--cc-accent-500)]"
        >
          {t.home.openDashboard}
        </Link>
      </main>
    </div>
  );
}
