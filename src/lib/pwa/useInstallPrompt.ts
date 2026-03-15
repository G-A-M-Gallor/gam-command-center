"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const DISMISS_KEY = "cc-pwa-install-dismissed";
const INSTALLED_KEY = "cc-pwa-installed";

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
    return localStorage.getItem(DISMISS_KEY) !== null;
  } catch {
    return false;
  }
}

function isInstalled(): boolean {
  try {
    return localStorage.getItem(INSTALLED_KEY) !== null;
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
    if (isStandalone() || isInstalled()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
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
      localStorage.setItem(INSTALLED_KEY, "1");
      return true;
    }
    return false;
  }, []);

  const dismiss = useCallback(() => {
    setState("hidden");
    localStorage.setItem(DISMISS_KEY, "1");
  }, []);

  const canInstall = state === "installable" || state === "ios";

  return { state, canInstall, install, dismiss };
}
