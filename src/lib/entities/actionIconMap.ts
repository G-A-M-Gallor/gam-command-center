// ===================================================
// Action Icon Map — Shared icon resolver for action buttons
// ===================================================
// Replaces duplicated ICON_MAP objects in NoteActions, NoteActionBar, EntityActionBar.

import { LUCIDE_MAP } from '@/lib/icons/lucideIconList';
import { Circle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Resolves an icon name string to a Lucide icon component.
 * Falls back to Circle if the icon name is not found in LUCIDE_MAP.
 */
export function resolveActionIcon(name: string): LucideIcon {
  return LUCIDE_MAP[name] ?? Circle;
}
