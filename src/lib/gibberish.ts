/**
 * Gibberish Converter — Hebrew ↔ English keyboard layout fixer.
 *
 * Converts text typed with the wrong keyboard layout selected.
 * Based on the standard Israeli (SI 1452) keyboard mapping.
 */

// English key → Hebrew character (standard Israeli keyboard)
const EN_TO_HE: Record<string, string> = {
  q: "/", w: "'", e: "ק", r: "ר", t: "א", y: "ט", u: "ו", i: "ן", o: "ם", p: "פ",
  a: "ש", s: "ד", d: "ג", f: "כ", g: "ע", h: "י", j: "ח", k: "ל", l: "ך",
  z: "ז", x: "ס", c: "ב", v: "ה", b: "נ", n: "מ", m: "צ",
  ",": "ת", ".": "ץ", "/": ".", ";": "ף", "'": ",",
  "[": "]", "]": "[",
  // Uppercase / shifted
  Q: "/", W: "'", E: "ק", R: "ר", T: "א", Y: "ט", U: "ו", I: "ן", O: "ם", P: "פ",
  A: "ש", S: "ד", D: "ג", F: "כ", G: "ע", H: "י", J: "ח", K: "ל", L: "ך",
  Z: "ז", X: "ס", C: "ב", V: "ה", B: "נ", N: "מ", M: "צ",
  "<": "ת", ">": "ץ", "?": ".", ":": "ף", '"': ",",
  "{": "}", "}": "{",
};

// Hebrew character → English key (reverse mapping)
const HE_TO_EN: Record<string, string> = {};
for (const [en, he] of Object.entries(EN_TO_HE)) {
  // Only map single-char lowercase English keys (avoid duplicate overwrites from uppercase)
  if (en.length === 1 && en === en.toLowerCase()) {
    HE_TO_EN[he] = en;
  }
}
// Add punctuation reverse mappings explicitly
HE_TO_EN["ת"] = ",";
HE_TO_EN["ץ"] = ".";
HE_TO_EN["ף"] = ";";
HE_TO_EN["."] = "/";
HE_TO_EN[","] = "'";
HE_TO_EN["]"] = "[";
HE_TO_EN["["] = "]";

function convertText(text: string, map: Record<string, string>): string {
  let result = "";
  for (const ch of text) {
    result += map[ch] ?? ch;
  }
  return result;
}

/** Convert English-typed text to Hebrew (user meant to type Hebrew) */
export function toHebrew(text: string): string {
  return convertText(text, EN_TO_HE);
}

/** Convert Hebrew-typed text to English (user meant to type English) */
export function toEnglish(text: string): string {
  return convertText(text, HE_TO_EN);
}

/**
 * Replace the currently selected text in the active element with converted text.
 * Works with input/textarea and contenteditable elements.
 */
export function replaceSelection(converter: (text: string) => string): boolean {
  const el = document.activeElement as HTMLElement | null;

  // Handle input / textarea
  if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
    const input = el as HTMLInputElement | HTMLTextAreaElement;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    if (start === end) return false; // no selection

    const selected = input.value.slice(start, end);
    const converted = converter(selected);
    if (converted === selected) return false;

    // Use native input setter to trigger React's onChange
    const nativeInputValueSetter =
      Object.getOwnPropertyDescriptor(
        el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
        "value"
      )?.set;

    const before = input.value.slice(0, start);
    const after = input.value.slice(end);

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, before + converted + after);
    } else {
      input.value = before + converted + after;
    }

    // Fire input event for React
    input.dispatchEvent(new Event("input", { bubbles: true }));

    // Restore selection
    input.setSelectionRange(start, start + converted.length);
    return true;
  }

  // Handle contenteditable or general selection
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return false;

  const selected = selection.toString();
  if (!selected) return false;

  const converted = converter(selected);
  if (converted === selected) return false;

  // execCommand maintains undo history in contenteditable
  document.execCommand("insertText", false, converted);
  return true;
}
