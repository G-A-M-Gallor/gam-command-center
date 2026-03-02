import type { ShortcutDefinition, UserShortcutOverride } from "./shortcutRegistry";

// ─── Parsed Combo ───────────────────────────────────────────

export interface ParsedCombo {
  meta: boolean;
  shift: boolean;
  alt: boolean;
  key: string; // lowercase
}

// ─── Platform Detection ─────────────────────────────────────

let _isMac: boolean | null = null;

export function isMac(): boolean {
  if (_isMac !== null) return _isMac;
  if (typeof navigator === "undefined") return true; // SSR default
  _isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  return _isMac;
}

// ─── Parse ──────────────────────────────────────────────────

const MODIFIER_MAP: Record<string, "meta" | "shift" | "alt"> = {
  cmd: "meta",
  ctrl: "meta",
  shift: "shift",
  alt: "alt",
  option: "alt",
};

export function parseCombo(combo: string): ParsedCombo {
  const parts = combo.split("+").map((p) => p.trim().toLowerCase());
  const parsed: ParsedCombo = { meta: false, shift: false, alt: false, key: "" };

  for (const part of parts) {
    const mod = MODIFIER_MAP[part];
    if (mod) {
      parsed[mod] = true;
    } else {
      // Normalize special key names
      parsed.key = part === "enter" ? "enter"
        : part === "escape" || part === "esc" ? "escape"
        : part === "space" ? " "
        : part === "backspace" || part === "delete" ? "backspace"
        : part === "tab" ? "tab"
        : part === "arrowup" || part === "↑" ? "arrowup"
        : part === "arrowdown" || part === "↓" ? "arrowdown"
        : part === "arrowleft" || part === "←" ? "arrowleft"
        : part === "arrowright" || part === "→" ? "arrowright"
        : part;
    }
  }

  return parsed;
}

// ─── Match ──────────────────────────────────────────────────

export function matchesEvent(event: KeyboardEvent, parsed: ParsedCombo): boolean {
  // On Mac, Cmd = metaKey. On Win/Linux, Cmd = ctrlKey.
  const metaPressed = isMac() ? event.metaKey : event.ctrlKey;

  if (parsed.meta !== metaPressed) return false;
  if (parsed.shift !== event.shiftKey) return false;
  if (parsed.alt !== event.altKey) return false;

  // On Mac, if meta is not required, ensure ctrlKey is not pressed (avoid false matches)
  if (!parsed.meta && isMac() && event.ctrlKey) return false;
  // On Win/Linux, if meta is not required, ensure metaKey is not pressed
  if (!parsed.meta && !isMac() && event.metaKey) return false;

  const eventKey = event.key.toLowerCase();

  // Handle special keys
  if (parsed.key === "\\") return eventKey === "\\" || event.code === "Backslash";
  if (parsed.key === "/") return eventKey === "/" || event.code === "Slash";

  return eventKey === parsed.key;
}

// ─── Display Format ─────────────────────────────────────────

const MAC_SYMBOLS: Record<string, string> = {
  cmd: "⌘",
  ctrl: "⌃",
  shift: "⇧",
  alt: "⌥",
  option: "⌥",
  enter: "↵",
  escape: "Esc",
  esc: "Esc",
  backspace: "⌫",
  delete: "⌫",
  tab: "⇥",
  space: "␣",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
};

const WIN_SYMBOLS: Record<string, string> = {
  cmd: "Ctrl",
  ctrl: "Ctrl",
  shift: "Shift",
  alt: "Alt",
  option: "Alt",
  enter: "Enter",
  escape: "Esc",
  esc: "Esc",
  backspace: "Backspace",
  delete: "Delete",
  tab: "Tab",
  space: "Space",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
};

export function formatComboForDisplay(combo: string): string[] {
  const symbols = isMac() ? MAC_SYMBOLS : WIN_SYMBOLS;
  return combo.split("+").map((part) => {
    const lower = part.trim().toLowerCase();
    return symbols[lower] || part.trim().toUpperCase();
  });
}

// ─── Conflict Detection ─────────────────────────────────────

export interface ConflictResult {
  hasConflict: boolean;
  conflictWith: { id: string; displayName: { he: string; en: string } } | null;
}

export function detectConflict(
  keyCombo: string,
  allShortcuts: ShortcutDefinition[],
  userOverrides: UserShortcutOverride[],
  excludeId?: string
): ConflictResult {
  const normalizedNew = normalizeCombo(keyCombo);

  // Check system shortcuts
  for (const sc of allShortcuts) {
    if (sc.id === excludeId) continue;
    // Check if user has disabled this shortcut
    const override = userOverrides.find((o) => o.shortcutId === sc.id);
    if (override && !override.isActive) continue;

    if (normalizeCombo(sc.keyCombo) === normalizedNew) {
      return { hasConflict: true, conflictWith: { id: sc.id, displayName: sc.displayName } };
    }
  }

  // Check custom shortcuts
  for (const uo of userOverrides) {
    if (!uo.isCustom || !uo.isActive) continue;
    if (uo.shortcutId === excludeId) continue;
    if (normalizeCombo(uo.keyCombo) === normalizedNew) {
      return { hasConflict: true, conflictWith: { id: uo.shortcutId || uo.actionSlug, displayName: uo.displayName } };
    }
  }

  return { hasConflict: false, conflictWith: null };
}

function normalizeCombo(combo: string): string {
  return combo
    .split("+")
    .map((p) => p.trim().toLowerCase())
    .sort()
    .join("+");
}
