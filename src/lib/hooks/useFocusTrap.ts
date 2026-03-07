"use client";

import { useEffect, useRef, useCallback } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

interface FocusTrapOptions {
  /** Called when Escape is pressed */
  onEscape?: () => void;
  /** Whether the trap is currently active (default: true) */
  enabled?: boolean;
}

/**
 * Custom hook that traps focus within a container element.
 * - Cycles Tab/Shift+Tab within the container
 * - Calls onEscape when Escape is pressed
 * - Restores focus to the previously-focused element on unmount
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  options: FocusTrapOptions = {}
) {
  const { onEscape, enabled = true } = options;
  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store onEscape in a ref to avoid re-running the effect
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) => el.offsetParent !== null); // filter out hidden elements
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Save the currently focused element to restore later
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    // Focus the first focusable element inside the container
    const timer = requestAnimationFrame(() => {
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        // Focus the container itself if no focusable children
        containerRef.current?.focus();
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onEscapeRef.current?.();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      cancelAnimationFrame(timer);
      document.removeEventListener("keydown", handleKeyDown, true);

      // Restore focus to the previously-focused element
      if (previousFocusRef.current && previousFocusRef.current.isConnected) {
        previousFocusRef.current.focus();
      }
    };
  }, [enabled, getFocusableElements]);

  return containerRef;
}
