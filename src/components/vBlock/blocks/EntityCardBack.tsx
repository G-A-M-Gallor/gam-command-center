"use client";

import type { Language } from "@/contexts/SettingsContext";
import type { FieldSlot, FieldActionType } from "./entityCard.types";
import { EntityCardField } from "./EntityCardField";

interface Props {
  fields: FieldSlot[];
  meta: Record<string, unknown>;
  language: Language;
  compact?: boolean;
  onAction?: (type: FieldActionType, value: string) => void;
}

export function EntityCardBack({ fields, meta, language, compact, onAction }: Props) {
  const sorted = [...fields].sort((a, b) => a.priority - b.priority);

  return (
    <div className="flex flex-col gap-0.5 px-3 py-2">
      {sorted.map((slot) => (
        <EntityCardField
          key={slot.metaKey}
          slot={slot}
          value={meta[slot.metaKey]}
          language={language}
          compact={compact}
          onAction={onAction}
        />
      ))}
      {sorted.length === 0 && (
        <p className="text-xs text-slate-500 py-2 text-center">אין שדות להצגה</p>
      )}
    </div>
  );
}
