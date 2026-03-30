/**
 * i18n — Internationalization
 *
 * Phase 1: per-locale split (backward compat)
 *   getTranslations(lang) — returns full locale, same API as before
 *
 * Phase 2: per-namespace lazy loading (future)
 *   loadNamespaces(lang, ['common', 'entities']) — loads only what's needed
 */

import type { _Language } from "@/contexts/SettingsContext";
import { he } from "./locales/he";
import { en } from "./locales/en";
import { ru } from "./locales/ru";
import type { Translations, TranslationKey } from "./types";

const translations: Record<_Language, Translations> = { he, en, ru };

// ═══ Backward-compatible API ═══════════════════════════
// Drop-in replacement for the old getTranslations()

export function getTranslations(lang: _Language): Translations {
  return translations[lang];
}

// Re-export types for consumers that import them
export type { Translations, TranslationKey };

// ═══ loc() helper ══════════════════════════════════════
// Pick the right language variant from a bilingual/trilingual data object.

export function loc<T = string>(
  obj: Record<string, any>,
  field: string,
  language: _Language,
): T {
  if (language === "he") {
    return (obj[`${field}He`] ?? obj[`${field}_he`] ?? obj[field] ?? "") as T;
  }
  if (language === "ru") {
    return (obj[`${field}Ru`] ?? obj[`${field}_ru`] ?? obj[field] ?? "") as T;
  }
  return (obj[field] ?? "") as T;
}

// ═══ Phase 2: Namespace-aware loading (future) ═════════
// Available now, consumers migrate gradually.

const nsCache = new Map<string, Record<string, unknown>>();

export async function loadNamespaces(
  lang: _Language,
  namespaces: TranslationKey[],
): Promise<Partial<Translations>> {
  const result: Record<string, unknown> = {};
  for (const ns of namespaces) {
    const cacheKey = `${lang}:${ns}`;
    if (nsCache.has(cacheKey)) {
      result[ns] = nsCache.get(cacheKey);
      continue;
    }
    const mod = await import(`./locales/${lang}/${ns}.ts`);
    const data = mod.default;
    nsCache.set(cacheKey, data);
    result[ns] = data;
  }
  return result as Partial<Translations>;
}
