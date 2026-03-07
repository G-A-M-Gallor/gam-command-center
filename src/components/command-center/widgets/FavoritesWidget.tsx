"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  X,
  Plus,
  Layers,
  FileEdit,
  Map,
  Grid3X3,
  Bot,
  Palette,
  FormInput,
  Network,
  Calendar,
  GripVertical,
  Pin,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import type { WidgetSize } from "./WidgetRegistry";

const FAVORITES_KEY = "cc-favorites";

export interface FavoriteItem {
  id: string;
  href: string;
  label: string;
}

const routeIcons: Record<string, typeof Layers> = {
  "/dashboard/layers": Layers,
  "/dashboard/editor": FileEdit,
  "/dashboard/story-map": Map,
  "/dashboard/functional-map": Grid3X3,
  "/dashboard/ai-hub": Bot,
  "/dashboard/design-system": Palette,
  "/dashboard/formily": FormInput,
  "/dashboard/architecture": Network,
  "/dashboard/plan": Calendar,
};

export function loadFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(items: FavoriteItem[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
}

export function isFavorite(href: string): boolean {
  return loadFavorites().some((f) => f.href === href);
}

export function toggleFavorite(href: string, label: string) {
  const favs = loadFavorites();
  const exists = favs.findIndex((f) => f.href === href);
  if (exists >= 0) {
    favs.splice(exists, 1);
  } else {
    favs.push({ id: `fav-${Date.now()}`, href, label });
  }
  saveFavorites(favs);
}

export function FavoritesPanel() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const router = useRouter();
  const pathname = usePathname();

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const removeFavorite = useCallback(
    (id: string) => {
      const updated = favorites.filter((f) => f.id !== id);
      setFavorites(updated);
      saveFavorites(updated);
    },
    [favorites]
  );

  const addCurrentPage = useCallback(() => {
    const pageKeys: Record<string, { he: string; en: string; ru: string }> = {
      "/dashboard/layers": { he: "שכבות", en: "Layers", ru: "Слои" },
      "/dashboard/editor": { he: "עורך", en: "Editor", ru: "Редактор" },
      "/dashboard/story-map": { he: "מפת סיפור", en: "Story Map", ru: "Карта историй" },
      "/dashboard/functional-map": { he: "מפה פונקציונלית", en: "Functional Map", ru: "Функциональная карта" },
      "/dashboard/ai-hub": { he: "מרכז AI", en: "AI Hub", ru: "Центр AI" },
      "/dashboard/design-system": { he: "מערכת עיצוב", en: "Design System", ru: "Дизайн-система" },
      "/dashboard/formily": { he: "טפסים", en: "Formily", ru: "Формы" },
      "/dashboard/architecture": { he: "ארכיטקטורה", en: "Architecture", ru: "Архитектура" },
      "/dashboard/plan": { he: "תוכנית", en: "Plan", ru: "План" },
    };
    const labels = pageKeys[pathname];
    if (!labels) return;
    if (favorites.some((f) => f.href === pathname)) return;
    const label = labels[language];
    const updated = [
      ...favorites,
      { id: `fav-${Date.now()}`, href: pathname, label },
    ];
    setFavorites(updated);
    saveFavorites(updated);
  }, [favorites, pathname, language]);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOver.current = index;
  };

  const handleDragEnd = () => {
    if (
      dragItem.current === null ||
      dragOver.current === null ||
      dragItem.current === dragOver.current
    ) {
      dragItem.current = null;
      dragOver.current = null;
      return;
    }
    const updated = [...favorites];
    const [removed] = updated.splice(dragItem.current, 1);
    updated.splice(dragOver.current, 0, removed);
    setFavorites(updated);
    saveFavorites(updated);
    dragItem.current = null;
    dragOver.current = null;
  };

  const alreadyPinned = favorites.some((f) => f.href === pathname);

  return (
    <div className="space-y-2">
      {favorites.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">
          {t.widgets.noFavorites}
        </p>
      ) : (
        <div className="space-y-0.5">
          {favorites.map((fav, i) => {
            const Icon = routeIcons[fav.href] || Layers;
            return (
              <div
                key={fav.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragEnter={() => handleDragEnter(i)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-700/50"
              >
                <GripVertical className="h-3 w-3 shrink-0 cursor-grab text-slate-600" />
                <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <button
                  type="button"
                  onClick={() => router.push(fav.href)}
                  className="flex-1 truncate text-left text-sm text-slate-300 hover:text-slate-100"
                >
                  {fav.label}
                </button>
                <button
                  type="button"
                  onClick={() => removeFavorite(fav.id)}
                  className="shrink-0 text-slate-600 hover:text-slate-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add current page */}
      <button
        type="button"
        onClick={addCurrentPage}
        disabled={alreadyPinned}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-600 py-2 text-xs text-slate-500 transition-colors hover:border-slate-500 hover:text-slate-400 disabled:opacity-40"
      >
        <Plus className="h-3 w-3" />
        {t.widgets.addFavorite}
      </button>
    </div>
  );
}

export function FavoritesBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  const favs = loadFavorites();

  if (size < 2) return null;

  if (size === 2) {
    return (
      <span className="truncate text-xs text-slate-400">
        {favs.length > 0 ? favs.length : ""}
      </span>
    );
  }

  const count = size === 3 ? 2 : 3;
  const names = favs.slice(0, count).map((f) => f.label);

  return (
    <span className="truncate text-xs text-slate-400">
      {names.length > 0 ? names.join(", ") : ""}
    </span>
  );
}
