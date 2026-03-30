"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import { WeeklyPlannerPanel } from "@/components/command-center/widgets/WeeklyPlannerWidget";

export default function WeeklyPlannerPage() {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const isRtl = language === "he";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex h-[calc(100vh-48px)] flex-col">
      <div className="shrink-0 p-6 pb-2">
        <PageHeader pageKey="weeklyPlanner" />
      </div>

      <div className="flex min-h-0 flex-1 mx-6 mb-6 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <WeeklyPlannerPanel />
      </div>
    </div>
  );
}
