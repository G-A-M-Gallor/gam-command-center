"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";

export default function AIHubPage() {
  const { language } = useSettings();
  const t = getTranslations(language);

  return (
    <div className="min-h-screen">
      <PageHeader pageKey="aiHub" />
      <div className="p-8">
        <p className="text-slate-400">{t.comingSoon} 4.</p>
      </div>
    </div>
  );
}
