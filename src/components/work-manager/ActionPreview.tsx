"use client";

import { Check, X } from "lucide-react";
import type { WorkAction } from "@/lib/work-manager/parseAction";

const ACTION_TYPE_LABELS: Record<string, Record<string, string>> = {
  create_task: { he: "יצירת משימה", en: "Create Task", ru: "Создать задачу" },
  update_status: { he: "עדכון סטטוס", en: "Update Status", ru: "Обновить статус" },
  add_note: { he: "הוספת הערה", en: "Add Note", ru: "Добавить заметку" },
  invoke_persona: { he: "הפעלת פרסונה", en: "Invoke Persona", ru: "Вызвать персону" },
};

interface ActionPreviewProps {
  action: WorkAction;
  lang: "he" | "en" | "ru";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ActionPreview({ action, lang, onConfirm, onCancel }: ActionPreviewProps) {
  const typeLabel = ACTION_TYPE_LABELS[action.type]?.[lang] || action.type;
  const isRtl = lang === "he";
  const confirmLabel = lang === "he" ? "אשר" : lang === "ru" ? "Подтвердить" : "Confirm";
  const cancelLabel = lang === "he" ? "בטל" : lang === "ru" ? "Отменить" : "Cancel";

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="mt-2 animate-in slide-in-from-bottom-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
    >
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-400">
          {typeLabel}
        </span>
        <span className="text-sm font-medium text-slate-200">{action.title}</span>
      </div>

      {/* Details table */}
      {Object.keys(action.details).length > 0 && (
        <div className="mb-3 space-y-1">
          {Object.entries(action.details).map(([key, value]) => (
            <div key={key} className="flex gap-2 text-xs">
              <span className="shrink-0 text-slate-500">{key}:</span>
              <span className="text-slate-300">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-500"
        >
          <Check size={12} />
          {confirmLabel}
        </button>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-300"
        >
          <X size={12} />
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
