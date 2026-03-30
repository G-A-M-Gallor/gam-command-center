"use client";

import { useCallback, useState } from "react";
import {
  Bold, Italic, Strikethrough, Code, Link, List, ListOrdered, Languages,
} from "lucide-react";
import type { Language } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { detectGibberish, toHebrew, toEnglish } from "@/lib/gibberish";

interface ChatToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (newValue: string) => void;
  lang: Language;
}

type FormatAction =
  | { type: "wrap"; prefix: string; suffix: string; placeholder: string }
  | { type: "line"; prefix: string; placeholder: string };

const FORMATS: Record<string, FormatAction> = {
  bold:          { type: "wrap", prefix: "**", suffix: "**", placeholder: "bold text" },
  italic:        { type: "wrap", prefix: "*",  suffix: "*",  placeholder: "italic text" },
  strikethrough: { type: "wrap", prefix: "~~", suffix: "~~", placeholder: "strikethrough" },
  code:          { type: "wrap", prefix: "`",  suffix: "`",  placeholder: "code" },
  link:          { type: "wrap", prefix: "[",  suffix: "](url)", placeholder: "link text" },
  bulletList:    { type: "line", prefix: "- ",  placeholder: "item" },
  numberedList:  { type: "line", prefix: "1. ", placeholder: "item" },
};

export function ChatToolbar({ textareaRef, value, onChange, lang }: ChatToolbarProps) {
  const t = getTranslations(lang);
  const isRtl = lang === "he";
  const [flashConvert, setFlashConvert] = useState(false);

  const applyFormat = useCallback((formatKey: string) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const format = FORMATS[formatKey];
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const selected = value.slice(start, end);

    let newValue: string;
    let cursorPos: number;

    if (format.type === "wrap") {
      const text = selected || format.placeholder;
      const wrapped = format.prefix + text + format.suffix;
      newValue = value.slice(0, start) + wrapped + value.slice(end);
      if (selected) {
        cursorPos = start + wrapped.length;
      } else {
        // Select the placeholder text
        cursorPos = start + format.prefix.length;
      }
    } else {
      // Line prefix — prepend to current line
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      if (start === end) {
        // No selection — prepend prefix to current line
        newValue = value.slice(0, lineStart) + format.prefix + value.slice(lineStart);
        cursorPos = start + format.prefix.length;
      } else {
        // Wrap each selected line
        const lines = value.slice(start, end).split("\n");
        const prefixed = lines.map((l, i) => {
          const p = formatKey === "numberedList" ? `${i + 1}. ` : format.prefix;
          return p + l;
        }).join("\n");
        newValue = value.slice(0, start) + prefixed + value.slice(end);
        cursorPos = start + prefixed.length;
      }
    }

    onChange(newValue);

    // Restore focus & cursor after React re-render
    requestAnimationFrame(() => {
      ta.focus();
      if (selected || format.type === "line") {
        ta.setSelectionRange(cursorPos, cursorPos);
      } else if (format.type === "wrap") {
        // Select placeholder
        const placeholderEnd = cursorPos + (format as { placeholder: string }).placeholder.length;
        ta.setSelectionRange(cursorPos, placeholderEnd);
      }
    });
  }, [textareaRef, value, onChange]);

  const handleConvertLanguage = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const hasSelection = start !== end;

    let newValue: string;

    if (hasSelection) {
      // Convert only selected text
      const selected = value.slice(start, end);
      const detection = detectGibberish(selected);
      if (!detection) {
        // No gibberish detected — try converting based on dominant script
        const heCount = (selected.match(/[\u0590-\u05FF]/g) || []).length;
        const enCount = (selected.match(/[a-zA-Z]/g) || []).length;
        const converter = heCount > enCount ? toEnglish : toHebrew;
        const converted = converter(selected);
        if (converted === selected) return;
        newValue = value.slice(0, start) + converted + value.slice(end);
      } else {
        const converter = detection.direction === "to_hebrew" ? toHebrew : toEnglish;
        newValue = value.slice(0, start) + converter(selected) + value.slice(end);
      }
    } else {
      // Convert full text
      const detection = detectGibberish(value);
      if (!detection) return;
      const converter = detection.direction === "to_hebrew" ? toHebrew : toEnglish;
      newValue = converter(value);
    }

    onChange(newValue);
    setFlashConvert(true);
    setTimeout(() => setFlashConvert(false), 600);

    requestAnimationFrame(() => {
      ta.focus();
    });
  }, [textareaRef, value, onChange]);

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;

    switch (e.key.toLowerCase()) {
      case "b":
        e.preventDefault();
        applyFormat("bold");
        break;
      case "i":
        e.preventDefault();
        applyFormat("italic");
        break;
      case "e":
        e.preventDefault();
        applyFormat("code");
        break;
      case "k":
        e.preventDefault();
        applyFormat("link");
        break;
    }
  }, [applyFormat]);

  const buttons = [
    { key: "bold", icon: Bold, tooltip: t.aiHub.toolbarBold, shortcut: "Ctrl+B" },
    { key: "italic", icon: Italic, tooltip: t.aiHub.toolbarItalic, shortcut: "Ctrl+I" },
    { key: "strikethrough", icon: Strikethrough, tooltip: t.aiHub.toolbarStrikethrough },
    { key: "code", icon: Code, tooltip: t.aiHub.toolbarCode, shortcut: "Ctrl+E" },
    { key: "link", icon: Link, tooltip: t.aiHub.toolbarLink, shortcut: "Ctrl+K" },
    { key: "bulletList", icon: List, tooltip: t.aiHub.toolbarBulletList },
    { key: "numberedList", icon: ListOrdered, tooltip: t.aiHub.toolbarNumberedList },
  ];

  return {
    toolbar: (
      <div
        className={`flex items-center gap-0.5 rounded-t-lg border border-b-0 border-slate-600 bg-slate-800 px-1.5 h-8 ${
          isRtl ? "flex-row-reverse" : ""
        }`}
        data-cc-id="aihub.chat-toolbar"
      >
        {buttons.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.key}
              type="button"
              onClick={() => applyFormat(btn.key)}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200 active:text-purple-400"
              title={btn.tooltip + (btn.shortcut ? ` (${btn.shortcut})` : "")}
            >
              <Icon size={14} />
            </button>
          );
        })}

        {/* Separator */}
        <div className="mx-1 h-4 w-px bg-slate-600" />

        {/* Convert language button */}
        <button
          type="button"
          onClick={handleConvertLanguage}
          className={`flex h-7 items-center gap-1 rounded px-1.5 transition-colors ${
            flashConvert
              ? "bg-amber-500/20 text-amber-300"
              : "text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
          }`}
          title={t.aiHub.toolbarConvertTooltip}
        >
          <Languages size={14} />
          <span className="text-[10px] font-medium">{t.aiHub.toolbarConvertLang}</span>
        </button>
      </div>
    ),
    onKeyDown: handleKeyDown,
  };
}
