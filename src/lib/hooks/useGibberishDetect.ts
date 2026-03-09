"use client";

import { useEffect, useRef, useCallback } from "react";
import { detectGibberish, toHebrew, toEnglish, replaceFullText } from "@/lib/gibberish";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/contexts/ToastContext";
import { getTranslations } from "@/lib/i18n";

const DEBOUNCE_MS = 1200;
const COOLDOWN_MS = 30_000;
const EXCLUDED_TYPES = new Set(["password", "email", "url", "number"]);

function isExcluded(el: HTMLElement): boolean {
  if (el.closest("[data-no-gibberish]")) return true;
  if (el.closest(".ProseMirror")) return true;
  if (el.closest(".cm-editor")) return true;

  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    const input = el as HTMLInputElement;
    if (EXCLUDED_TYPES.has(input.type)) return true;
  }
  return false;
}

export function useGibberishDetect() {
  const { gibberishDetect, language } = useSettings();
  const { toast } = useToast();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownMap = useRef<Map<HTMLElement, { text: string; ts: number }>>(new Map());

  const handleInput = useCallback(
    (e: Event) => {
      if (!gibberishDetect) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
      if (isExcluded(target)) return;

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        const text = (target as HTMLInputElement | HTMLTextAreaElement).value;
        if (!text) return;

        // Cooldown: same element + same text → skip for 10s
        const prev = cooldownMap.current.get(target);
        if (prev && prev.text === text && Date.now() - prev.ts < COOLDOWN_MS) return;

        const result = detectGibberish(text);
        if (!result) return;

        const t = getTranslations(language);
        const message =
          result.direction === "to_hebrew"
            ? `${t.settings.gibberishMeantHebrew} "${result.preview}"`
            : `${t.settings.gibberishMeantEnglish} "${result.preview}"`;

        // Record cooldown
        cooldownMap.current.set(target, { text, ts: Date.now() });

        const el = target as HTMLInputElement | HTMLTextAreaElement;
        toast({
          type: "info",
          message,
          duration: 6000,
          action: {
            label: t.settings.gibberishConvert,
            onClick: () => {
              const converter = result.direction === "to_hebrew" ? toHebrew : toEnglish;
              replaceFullText(el, converter);
              el.focus();
            },
          },
        });
      }, DEBOUNCE_MS);
    },
    [gibberishDetect, language, toast]
  );

  useEffect(() => {
    if (!gibberishDetect) return;

    document.addEventListener("input", handleInput, true);
    return () => {
      document.removeEventListener("input", handleInput, true);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gibberishDetect, handleInput]);
}
