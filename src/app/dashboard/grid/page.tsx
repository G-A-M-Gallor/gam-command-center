"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import { GridCanvas } from "@/components/grid/GridCanvas";
import { GridToolbar } from "@/components/grid/GridToolbar";
import { SheetTabs } from "@/components/grid/SheetTabs";

export default function GridPage() {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const isRtl = language === "he";
  const gridT = (_t as any).grid as Record<string, string> | undefined;
  const gt = gridT || {};

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex h-[calc(100vh-48px)] flex-col">
      <div className="shrink-0 p-6 pb-2">
        <PageHeader pageKey="grid" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col mx-6 mb-6 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <GridToolbar t={gt} />
        <GridCanvas />
        <SheetTabs t={gt} />
      </div>
    </div>
  );
}
