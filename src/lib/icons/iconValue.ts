/**
 * Icon value format:
 *   - Raw emoji string (e.g. "📄") → emoji
 *   - "lucide:IconName"            → Lucide icon
 *   - "img:https://..."            → Image URL
 *   - "img:path/to/file"           → Supabase storage path
 */

export type IconKind = 'emoji' | 'lucide' | 'image';

export interface ParsedIcon {
  kind: IconKind;
  value: string; // emoji char, Lucide name, or URL/path
}

const LUCIDE_PREFIX = 'lucide:';
const IMG_PREFIX = 'img:';

// Simple emoji detection — single emoji or emoji sequence
const EMOJI_RE = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}](\u200d[\p{Emoji_Presentation}\p{Extended_Pictographic}])*[\uFE0F\u20E3]?$/u;

export function parseIconValue(raw: string | null | undefined): ParsedIcon | null {
  if (!raw) return null;

  if (raw.startsWith(LUCIDE_PREFIX)) {
    return { kind: 'lucide', value: raw.slice(LUCIDE_PREFIX.length) };
  }

  if (raw.startsWith(IMG_PREFIX)) {
    return { kind: 'image', value: raw.slice(IMG_PREFIX.length) };
  }

  // Treat anything else as emoji (backward compat with existing data)
  return { kind: 'emoji', value: raw };
}

export function serializeIcon(parsed: ParsedIcon): string {
  switch (parsed.kind) {
    case 'emoji':
      return parsed.value;
    case 'lucide':
      return `${LUCIDE_PREFIX}${parsed.value}`;
    case 'image':
      return `${IMG_PREFIX}${parsed.value}`;
  }
}

export function isEmoji(str: string): boolean {
  return EMOJI_RE.test(str);
}
