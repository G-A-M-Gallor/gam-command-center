"use client";

import { useState } from "react";
import { Check, X, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import type { WorkAction } from "@/lib/work-manager/parseAction";
import { getTranslations } from "@/lib/i18n";

const ACTION_TYPE_LABELS: Record<string, Record<string, string>> = {
  create_task: { he: "יצירת משימה", en: "Create Task", ru: "Создать задачу" },
  update_status: { he: "עדכון סטטוס", en: "Update Status", ru: "Обновить статус" },
  add_note: { he: "הוספת הערה", en: "Add Note", ru: "Добавить заметку" },
  invoke_persona: { he: "הפעלת פרסונה", en: "Invoke Persona", ru: "Вызвать персону" },
  create_notion_task: { he: "יצירת משימה ב-Notion", en: "Create Notion Task", ru: "Создать задачу в Notion" },
  create_entity: { he: "יצירת ישות", en: "Create Entity", ru: "Создать сущность" },
};

type ExecutionStatus = "idle" | "executing" | "success" | "error";

interface ActionPreviewProps {
  action: WorkAction;
  lang: "he" | "en" | "ru";
  onConfirm: () => Promise<{ success: boolean; message?: string }>;
  onCancel: () => void;
}

export function ActionPreview({ action, lang, onConfirm, onCancel }: ActionPreviewProps) {
  const [status, setStatus] = useState<ExecutionStatus>("idle");
  const [resultMessage, setResultMessage] = useState<string>("");
  const t = getTranslations(lang);

  const typeLabel = ACTION_TYPE_LABELS[action.type]?.[lang] || action.type;
  const isRtl = lang === "he";

  const handleConfirm = async () => {
    setStatus("executing");
    setResultMessage("");
    try {
      const result = await onConfirm();
      if (result.success) {
        setStatus("success");
        setResultMessage(result.message || t.aiHub.actionSuccess);
        // Auto-dismiss after 3s on success
        setTimeout(() => {
          onCancel(); // dismiss the preview
        }, 3000);
      } else {
        setStatus("error");
        setResultMessage(result.message || t.aiHub.actionError);
      }
    } catch (err) {
      setStatus("error");
      setResultMessage(err instanceof Error ? err.message : t.aiHub.actionError);
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setResultMessage("");
  };

  // Border/bg color based on status
  const borderColor =
    status === "success"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : status === "error"
        ? "border-red-500/30 bg-red-500/5"
        : "border-amber-500/30 bg-amber-500/5";

  const badgeColor =
    status === "success"
      ? "bg-emerald-500/20 text-emerald-400"
      : status === "error"
        ? "bg-red-500/20 text-red-400"
        : "bg-amber-500/20 text-amber-400";

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className={`mt-2 animate-in slide-in-from-bottom-2 rounded-lg border p-3 transition-colors ${borderColor}`}
    >
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${badgeColor}`}>
          {typeLabel}
        </span>
        <span className="text-sm font-medium text-slate-200">{action.title}</span>
      </div>

      {/* Details table */}
      {Object.keys(action.details).length > 0 && status === "idle" && (
        <div className="mb-3 space-y-1">
          {Object.entries(action.details).map(([key, value]) => (
            <div key={key} className="flex gap-2 text-xs">
              <span className="shrink-0 text-slate-500">{key}:</span>
              <span className="text-slate-300">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Idle — confirm/cancel buttons */}
      {status === "idle" && (
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-500"
          >
            <Check size={12} />
            {t.aiHub.actionConfirm}
          </button>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-300"
          >
            <X size={12} />
            {t.aiHub.actionCancel}
          </button>
        </div>
      )}

      {/* Executing — spinner */}
      {status === "executing" && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 size={14} className="animate-spin text-amber-400" />
          <span>{t.aiHub.actionExecuting}</span>
        </div>
      )}

      {/* Success — green check with message */}
      {status === "success" && (
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <Check size={14} />
          <span>{t.aiHub.actionSuccess}</span>
          {resultMessage && resultMessage !== t.aiHub.actionSuccess && (
            <span className="text-slate-400">— {resultMessage}</span>
          )}
        </div>
      )}

      {/* Error — red message with retry */}
      {status === "error" && (
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 text-xs text-red-400">
            <AlertCircle size={14} />
            <span>{resultMessage || t.aiHub.actionError}</span>
          </div>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-600 px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-300"
          >
            <RefreshCw size={11} />
            {t.aiHub.actionRetry}
          </button>
        </div>
      )}
    </div>
  );
}
