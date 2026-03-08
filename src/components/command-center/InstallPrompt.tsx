"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Download, X, Share } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";

const DISMISS_KEY = "cc-pwa-install-dismissed";
const COOLDOWN_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    return Date.now() - ts < COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

export function InstallPrompt() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const [visible, setVisible] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    // iOS — show custom guide
    if (isIOS()) {
      setShowIOSGuide(true);
      setVisible(true);
      return;
    }

    // Chrome / Edge — capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  const install = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    deferredPromptRef.current = null;
  }, []);

  if (!visible) return null;

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

          {showIOSGuide ? (
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
