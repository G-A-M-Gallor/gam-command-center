"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import type { _Language } from "@/contexts/SettingsContext";
import type { FieldSlot, FieldActionType } from "./entityCard.types";
import { EntityCardField } from "./EntityCardField";

// Fields that should never be editable
const READ_ONLY_KEYS = new Set(["id", "created_at", "updated_at", "last_edited_at", "created_by"]);
const READ_ONLY_TYPES = new Set(["relation", "formula"]);

interface Props {
  fields: FieldSlot[];
  meta: Record<string, unknown>;
  language: Language;
  compact?: boolean;
  onAction?: (type: FieldActionType, value: string) => void;
  onFieldChange?: (metaKey: string, value: string) => void;
}

export function EntityCardBack({ fields, meta, language, _compact, onAction, onFieldChange }: Props) {
  const sorted = [...fields].sort((a, b) => a.priority - b.priority);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const isEditable = useCallback(
    (slot: FieldSlot): boolean => {
      if (!onFieldChange) return false;
      if (READ_ONLY_KEYS.has(slot.metaKey)) return false;
      if (READ_ONLY_TYPES.has(slot.fieldType)) return false;
      if (slot.displayType === "hidden") return false;
      return true;
    },
    [onFieldChange],
  );

  const startEdit = useCallback((slot: FieldSlot) => {
    const current = String(meta[slot.metaKey] ?? "");
    setEditValues((prev) => ({ ...prev, [slot.metaKey]: current }));
    setEditingField(slot.metaKey);
  }, [meta]);

  const cancelEdit = useCallback(() => {
    setEditingField(null);
  }, []);

  const saveEdit = useCallback(
    (metaKey: string) => {
      const newValue = editValues[metaKey] ?? "";
      const oldValue = String(meta[metaKey] ?? "");
      setEditingField(null);
      if (newValue !== oldValue) {
        onFieldChange?.(metaKey, newValue);
      }
    },
    [editValues, meta, onFieldChange],
  );

  return (
    <div className="flex flex-col gap-0.5 px-3 py-2">
      {sorted.map((slot) => {
        const editable = isEditable(slot);

        if (editingField === slot.metaKey && editable) {
          return (
            <EditingField
              key={slot.metaKey}
              slot={slot}
              language={language}
              value={editValues[slot.metaKey] ?? ""}
              onChange={(val) => setEditValues((prev) => ({ ...prev, [slot.metaKey]: val }))}
              onSave={() => saveEdit(slot.metaKey)}
              onCancel={cancelEdit}
            />
          );
        }

        return (
          <div
            key={slot.metaKey}
            className={`group/field relative rounded transition-colors ${
              editable
                ? "cursor-pointer hover:bg-slate-700/20"
                : ""
            }`}
            onClick={editable ? () => startEdit(slot) : undefined}
          >
            <EntityCardField
              slot={slot}
              value={meta[slot.metaKey]}
              language={language}
              compact={_compact}
              onAction={onAction}
            />
            {/* Pencil icon on hover for editable fields */}
            {editable && (
              <span className="absolute top-1 end-1 opacity-0 group-hover/field:opacity-100 transition-opacity">
                <Pencil className="w-2.5 h-2.5 text-slate-500" />
              </span>
            )}
          </div>
        );
      })}

      {sorted.length === 0 && (
        <p className="text-xs text-slate-500 py-2 text-center">אין שדות להצגה</p>
      )}
    </div>
  );
}

// ── Inline Edit Input ────────────────────────────────────

function EditingField({
  slot,
  language,
  value,
  onChange,
  onSave,
  onCancel,
}: {
  slot: FieldSlot;
  language: _Language;
  value: string;
  onChange: (val: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const label = slot.label[language] || slot.label.he;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && slot.fieldType !== "rich_text") onSave();
    if (e.key === "Escape") onCancel();
  };

  const inputClassName =
    "w-full bg-slate-800/80 border-2 border-blue-500/60 rounded px-2 py-1 text-xs text-slate-200 focus:border-blue-400 focus:outline-none";

  return (
    <div className="flex items-start gap-2 py-1 bg-blue-500/5 rounded px-1">
      {slot.icon && <span className="text-xs mt-1.5 shrink-0">{slot.icon}</span>}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-blue-400 leading-tight mb-0.5">{label}</div>
        {slot.fieldType === "rich_text" ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onSave}
            onKeyDown={handleKeyDown}
            rows={3}
            className={`${inputClassName} resize-none`}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={slot.fieldType === "number" || slot.fieldType === "currency" ? "number" : "text"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onSave}
            onKeyDown={handleKeyDown}
            className={inputClassName}
          />
        )}
      </div>
    </div>
  );
}
