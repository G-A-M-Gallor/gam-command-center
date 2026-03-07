"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isHe = language === "he";

  if (!open) return null;

  const confirmText = confirmLabel || t.common.confirm;
  const cancelText = cancelLabel || t.common.cancel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-800 shadow-2xl"
        dir={isHe ? "rtl" : "ltr"}
      >
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          <p className="mt-2 text-sm text-slate-400">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-700 px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              variant === "danger"
                ? "bg-red-600 text-white hover:bg-red-500"
                : "bg-indigo-600 text-white hover:bg-indigo-500"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
