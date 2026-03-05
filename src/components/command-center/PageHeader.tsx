"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Pin } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import {
  isFavorite,
  toggleFavorite,
} from "./widgets/FavoritesWidget";

type PageKey =
  | "layers"
  | "editor"
  | "storyMap"
  | "functionalMap"
  | "aiHub"
  | "designSystem"
  | "formily"
  | "architecture"
  | "plan"
  | "settings"
  | "automations";

const pageRoutes: Record<PageKey, string> = {
  layers: "/dashboard/layers",
  editor: "/dashboard/editor",
  storyMap: "/dashboard/story-map",
  functionalMap: "/dashboard/functional-map",
  aiHub: "/dashboard/ai-hub",
  designSystem: "/dashboard/design-system",
  formily: "/dashboard/formily",
  architecture: "/dashboard/architecture",
  plan: "/dashboard/plan",
  settings: "/dashboard/settings",
  automations: "/dashboard/automations",
};

interface PageHeaderProps {
  pageKey: PageKey;
  children?: React.ReactNode;
}

export function PageHeader({ pageKey, children }: PageHeaderProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const pathname = usePathname();

  const href = pageRoutes[pageKey];
  const page = t.pages[pageKey];
  const title = page.title;
  const description = page.description;

  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    setPinned(isFavorite(href));
  }, [href]);

  const handleTogglePin = useCallback(() => {
    toggleFavorite(href, title);
    setPinned((prev) => !prev);
  }, [href, title]);

  const pinLabel = pinned ? t.widgets.unpinPage : t.widgets.pinPage;

  return (
    <header data-cc-id="page.header" className="shrink-0 border-b border-slate-700/50 pb-6">
      <div className="flex items-center gap-2">
        <h1 data-cc-id="page.header.title" data-cc-text="true" className="text-2xl font-semibold text-slate-100">{title}</h1>
        <button
          type="button"
          onClick={handleTogglePin}
          className={`rounded p-1 transition-colors ${
            pinned
              ? "text-[var(--cc-accent-400)] hover:text-[var(--cc-accent-300)]"
              : "text-slate-600 hover:text-slate-400"
          }`}
          title={pinLabel}
        >
          <Pin
            className="h-4 w-4"
            fill={pinned ? "currentColor" : "none"}
          />
        </button>
      </div>
      <p data-cc-id="page.header.description" data-cc-text="true" className="mt-1 text-sm text-slate-400">{description}</p>
      {children}
    </header>
  );
}
