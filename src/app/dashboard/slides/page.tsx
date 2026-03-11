"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import { SlideCanvas } from "@/components/slides/SlideCanvas";
import { SlideToolbar } from "@/components/slides/SlideToolbar";
import { SlideThumbnails } from "@/components/slides/SlideThumbnails";
import { SlidePresenter } from "@/components/slides/SlidePresenter";

export default function SlidesPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isRtl = language === "he";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slidesT = (t as any).slides as Record<string, string> | undefined;
  const st = slidesT || {};

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex h-[calc(100vh-48px)] flex-col">
      <div className="shrink-0 p-6 pb-2">
        <PageHeader pageKey="slides" />
      </div>

      <div className="flex min-h-0 flex-1 mx-6 mb-6 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {/* Thumbnails panel */}
        <SlideThumbnails t={st} />

        {/* Main area */}
        <div className="flex flex-1 flex-col min-w-0">
          <SlideToolbar t={st} />
          <SlideCanvas />
        </div>
      </div>

      {/* Fullscreen presenter */}
      <SlidePresenter t={st} />
    </div>
  );
}
