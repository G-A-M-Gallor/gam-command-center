import type { he } from "./locales/he";

/** Deep-writable: convert readonly literal types to mutable string types */
type DeepString<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends Record<string, unknown>
      ? DeepString<T[K]>
      : T[K];
};

/** Full translations object for a single locale (structural, not literal) */
export type Translations = DeepString<typeof he>;

/** Top-level section key (namespace) */
export type TranslationKey = keyof typeof he;
