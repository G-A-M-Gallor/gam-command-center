"use client";

import type { Language } from "@/contexts/SettingsContext";
import type { FieldSlot, FieldActionType } from "./entityCard.types";

interface Props {
  slot: FieldSlot;
  value: unknown;
  language: Language;
  compact?: boolean;
  onAction?: (type: FieldActionType, value: string) => void;
}

function formatDate(val: unknown): string {
  if (!val) return "—";
  const d = new Date(String(val));
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("he-IL");
}

function formatCurrency(val: unknown): string {
  if (!val) return "—";
  const n = Number(val);
  return isNaN(n) ? String(val) : `₪${n.toLocaleString("he-IL")}`;
}

export function EntityCardField({ slot, value, language, compact, onAction }: Props) {
  const label = slot.label[language] || slot.label.he;
  const strVal = value != null ? String(value) : "";

  if (!strVal && slot.displayType !== "hidden") {
    return null; // skip empty fields
  }

  const renderValue = () => {
    switch (slot.displayType) {
      case "badge":
        return (
          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
            {strVal}
          </span>
        );
      case "phone":
      case "email":
        return (
          <span className="text-sm text-blue-400 break-all" dir="ltr">
            {strVal}
          </span>
        );
      case "link":
        return (
          <a
            href={strVal.startsWith("http") ? strVal : `https://${strVal}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 underline break-all"
            dir="ltr"
          >
            {strVal}
          </a>
        );
      case "date":
        return <span className="text-sm text-slate-300">{formatDate(value)}</span>;
      case "currency":
        return <span className="text-sm font-medium text-emerald-400">{formatCurrency(value)}</span>;
      case "rating": {
        const n = Math.min(5, Math.max(0, Number(value) || 0));
        return <span className="text-sm">{"★".repeat(n)}{"☆".repeat(5 - n)}</span>;
      }
      case "progress": {
        const pct = Math.min(100, Math.max(0, Number(value) || 0));
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-purple-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">{pct}%</span>
          </div>
        );
      }
      case "hidden":
        return null;
      default:
        return <span className="text-sm text-slate-300 break-words">{strVal}</span>;
    }
  };

  return (
    <div className={`flex items-start gap-2 ${compact ? "py-0.5" : "py-1"}`}>
      {slot.icon && <span className="text-xs mt-0.5 shrink-0">{slot.icon}</span>}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-slate-500 leading-tight">{label}</div>
        {renderValue()}
      </div>
      {/* Action buttons */}
      {slot.actions && slot.actions.length > 0 && !compact && (
        <div className="flex items-center gap-0.5 shrink-0">
          {slot.actions.map((action) => (
            <button
              key={action.type}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction?.(action.type, strVal);
              }}
              className="rounded p-0.5 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors"
              title={action.label[language] || action.label.he}
            >
              <span className="text-xs">{action.icon}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
