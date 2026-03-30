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

/** Convert English-typed text to Hebrew (_user meant to type Hebrew) */
export function toHebrew(text: string): string {
  return convertText(text, EN_TO_HE);
}

/** Convert Hebrew-typed text to English (_user meant to type English) */
export function toEnglish(text: string): string {
  return convertText(text, HE_TO_EN);
}

// ─── Language plausibility checks ────────────────────────────
// Real text has common letter pairs (digrams). Keyboard gibberish doesn't.

const EN_DIGRAMS = new Set([
  "th", "he", "in", "er", "an", "re", "on", "at", "en", "nd",
  "ti", "es", "or", "te", "of", "ed", "is", "it", "al", "ar",
  "st", "to", "nt", "ng", "se", "ha", "as", "ou", "io", "le",
]);

const HE_DIGRAMS = new Set([
  "של", "על", "את", "הי", "לא", "ים", "ות", "בר", "מה", "הו",
  "שה", "לה", "בו", "כל", "זה", "אל", "עם", "מא", "הם", "יה",
  "אם", "או", "וא", "לי", "כי", "שי", "הא", "תי", "לו", "ני",
]);

/** Does this look like intentional English? (vowels + common digrams) */
function looksLikeRealEnglish(text: string): boolean {
  const lower = text.toLowerCase();
  const alpha = (lower.match(/[a-z]/g) || []).length;
  if (alpha < 4) return false;

  // Vowel ratio: real English ≈ 30-50%, gibberish is outside this
  const vowels = (lower.match(/[aeiou]/g) || []).length;
  const vowelRatio = vowels / alpha;
  if (vowelRatio < 0.12 || vowelRatio > 0.75) return false;

  // At least one common English digram
  for (let i = 0; i < lower.length - 1; i++) {
    if (EN_DIGRAMS.has(lower.slice(i, i + 2))) return true;
  }
  return false;
}

/** Does this look like intentional Hebrew? (common digrams) */
function looksLikeRealHebrew(text: string): boolean {
  // Need enough Hebrew chars to judge
  let heChars = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x0590 && code <= 0x05ff) heChars++;
  }
  if (heChars < 4) return false;

  // At least one common Hebrew digram
  for (let i = 0; i < text.length - 1; i++) {
    if (HE_DIGRAMS.has(text.slice(i, i + 2))) return true;
  }
  return false;
}

/**
 * Detect if text was typed with the wrong keyboard layout.
 * Only triggers when the text is actual gibberish — NOT valid text in the wrong language.
 * Returns the direction to convert, or null if no gibberish detected.
 */
export function detectGibberish(
  text: string
): { direction: "to_hebrew" | "to_english"; preview: string; confidence: number } | null {
  const trimmed = text.trim();
  if (trimmed.length < 6) return null;

  let heCount = 0;
  let enCount = 0;

  for (const ch of trimmed) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x0590 && code <= 0x05ff) heCount++;
    else if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) enCount++;
  }

  const total = heCount + enCount;
  if (total < 4) return null;

  const ratio = Math.max(heCount, enCount) / total;
  const lengthBonus = Math.min(trimmed.length / 40, 0.1);
  const confidence = ratio + lengthBonus;

  if (confidence < 0.85) return null;

  if (enCount > heCount) {
    // Mostly English chars — but is it real English or keyboard gibberish?
    if (looksLikeRealEnglish(trimmed)) return null;

    const converted = toHebrew(trimmed);
    if (converted === trimmed) return null;
    return {
      direction: "to_hebrew",
      preview: converted.length > 40 ? converted.slice(0, 40) + "…" : converted,
      confidence,
    };
  } else {
    // Mostly Hebrew chars — but is it real Hebrew or keyboard gibberish?
    if (looksLikeRealHebrew(trimmed)) return null;

    const converted = toEnglish(trimmed);
    if (converted === trimmed) return null;
    return {
      direction: "to_english",
      preview: converted.length > 40 ? converted.slice(0, 40) + "…" : converted,
      confidence,
    };
  }
}

/**
 * Replace the full text of an input/textarea element with converted text.
 * Used by auto-detect to replace the entire field value.
 */
export function replaceFullText(
  el: HTMLInputElement | HTMLTextAreaElement,
  converter: (text: string) => string
): boolean {
  const original = el.value;
  const converted = converter(original);
  if (converted === original) return false;

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
    "value"
  )?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(el, converted);
  } else {
    el.value = converted;
  }

  el.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
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
