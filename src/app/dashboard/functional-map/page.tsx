"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";

export default function FunctionalMapPage() {
  const { language } = useSettings();
  const t = getTranslations(language);

  return (
    <div className="min-h-screen">
      <PageHeader pageKey="functionalMap" />
      <div className="p-8">
        <p className="text-slate-400">{t.comingSoon} 5.</p>
      </div>
    </div>
  );
}
