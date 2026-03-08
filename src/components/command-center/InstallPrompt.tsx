"use client";

import { Download, X, Share } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { useInstallPrompt } from "@/lib/pwa/useInstallPrompt";

export function InstallPrompt() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const { state, install, dismiss } = useInstallPrompt();

  if (state !== "installable" && state !== "ios") return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-2xl sm:bottom-6">
      <button
        type="button"
        onClick={dismiss}
        className="absolute end-2 top-2 rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--cc-accent-600,#7c3aed)]/20">
          <Download className="h-5 w-5 text-[var(--cc-accent-400,#a78bfa)]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-100">
            {t.pwa.installTitle}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {t.pwa.installDescription}
          </p>

          {state === "ios" ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-700/50 p-2.5 text-xs text-slate-300">
              <Share className="h-4 w-4 shrink-0 text-blue-400" />
              <span>{t.pwa.iosShareGuide}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={install}
              className="mt-3 rounded-lg bg-[var(--cc-accent-600,#7c3aed)] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--cc-accent-500,#8b5cf6)]"
            >
              {t.pwa.installButton}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
