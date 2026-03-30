/**
 * i18n — Re-export from split modules
 *
 * This file exists for backward compatibility.
 * All 165 consumers import from "@/lib/i18n" — this path still works.
 * The actual translations live in src/lib/i18n/locales/
 */
export { getTranslations, loc, loadNamespaces } from "./i18n/index";
export type { Translations, TranslationKey } from "./i18n/types";
