"use client";

import { useState } from "react";
import {
  ExternalLink,
  Plus,
  X,
  } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import type { WidgetSize } from "./WidgetRegistry";

interface QuickLink {
  id: string;
  label: string;
  url: string;
  emoji: string;
}

const LS_KEY = "cc-external-links";

const DEFAULT_LINKS: QuickLink[] = [
  { id: "origami", label: "Origami CRM", url: "https://app.origami.ms", emoji: "🔶" },
  { id: "notion", label: "Notion", url: "https://notion.so", emoji: "📝" },
  { id: "n8n", label: "n8n", url: "https://n8n.io", emoji: "⚡" },
  { id: "vercel", label: "Vercel", url: "https://vercel.com", emoji: "▲" },
  { id: "github", label: "GitHub", url: "https://github.com", emoji: "🐙" },
  { id: "wati", label: "WATI", url: "https://app.wati.io", emoji: "💬" },
];

function loadLinks(): QuickLink[] {
  if (typeof window === "undefined") return DEFAULT_LINKS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return DEFAULT_LINKS;
}

function saveLinks(links: QuickLink[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(links));
}

export function ExternalLinksPanel() {
  const { language } = useSettings();
  const t = getTranslations(language);

  const [links, setLinks] = useState<QuickLink[]>(loadLinks);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newEmoji, setNewEmoji] = useState("🔗");

  const handleAdd = () => {
    if (!newLabel.trim() || !newUrl.trim()) return;
    const updated = [
      ...links,
      {
        id: `custom-${Date.now()}`,
        label: newLabel.trim(),
        url: newUrl.startsWith("http") ? newUrl.trim() : `https://${newUrl.trim()}`,
        emoji: newEmoji || "🔗",
      },
    ];
    setLinks(updated);
    saveLinks(updated);
    setNewLabel("");
    setNewUrl("");
    setNewEmoji("🔗");
    setAdding(false);
  };

  const handleRemove = (id: string) => {
    const updated = links.filter((l) => l.id !== id);
    setLinks(updated);
    saveLinks(updated);
  };

  const handleReset = () => {
    setLinks(DEFAULT_LINKS);
    saveLinks(DEFAULT_LINKS);
  };

  return (
    <div className="space-y-2">
      {links.map((link) => (
        <div
          key={link.id}
          className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-700/30"
        >
          <span className="text-base shrink-0">{link.emoji}</span>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-0 flex items-center gap-1.5 text-sm text-slate-300 hover:text-slate-100 transition-colors"
          >
            <span className="truncate">{link.label}</span>
            <ExternalLink size={11} className="shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
          </a>
          {link.id.startsWith("custom-") && (
            <button
              type="button"
              onClick={() => handleRemove(link.id)}
              className="shrink-0 rounded p-0.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}

      {adding ? (
        <div className="space-y-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
          <div className="flex items-center gap-2">
            <input
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              className="w-10 rounded bg-slate-700 px-1.5 py-1 text-center text-sm text-slate-200 outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
              maxLength={2}
            />
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={t.widgets.externalLinksLabelPlaceholder}
              className="flex-1 rounded bg-slate-700 px-2 py-1 text-sm text-slate-200 placeholder-slate-500 outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
              autoFocus
            />
          </div>
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://..."
            dir="ltr"
            className="w-full rounded bg-slate-700 px-2 py-1 text-sm text-slate-200 placeholder-slate-500 outline-none focus:ring-1 focus:ring-[var(--cc-accent-500)]"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
            >
              {t.widgets.externalLinksCancel}
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newLabel.trim() || !newUrl.trim()}
              className="rounded bg-[var(--cc-accent-600)] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[var(--cc-accent-500)] disabled:opacity-40"
            >
              {t.widgets.externalLinksAdd}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-md border border-dashed border-slate-600 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-300"
          >
            <Plus size={12} />
            {t.widgets.externalLinksAddLink}
          </button>
          {links.some((l) => l.id.startsWith("custom-")) && (
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
            >
              {t.widgets.externalLinksReset}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ExternalLinksBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  const t = getTranslations(language);
  if (size < 2) return null;
  return (
    <span className="truncate text-xs text-slate-400">
      {t.widgets.externalLinksBar}
    </span>
  );
}
