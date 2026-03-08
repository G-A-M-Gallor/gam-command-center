"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const DISMISS_KEY = "cc-pwa-install-dismissed";
const COOLDOWN_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallState = "standalone" | "installable" | "ios" | "hidden";

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

/**
 * Shared hook for PWA install prompt logic.
 * Used by both the floating InstallPrompt banner and the Sidebar install button.
 */
export function useInstallPrompt() {
  const [state, setState] = useState<InstallState>("hidden");
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) {
      setState("standalone");
      return;
    }

    if (isIOS() && !isDismissed()) {
      setState("ios");
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setState("installable");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return false;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferredPromptRef.current = null;
    if (outcome === "accepted") {
      setState("standalone");
      return true;
    }
    return false;
  }, []);

  const dismiss = useCallback(() => {
    setState("hidden");
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  const canInstall = state === "installable" || state === "ios";

  return { state, canInstall, install, dismiss };
}
