"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { X, Plus, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { getTranslations } from "@/lib/i18n";
import type { AIMode } from "@/lib/ai/prompts";
import { MODE_ICONS, MODE_COLORS } from "./types";

const STORAGE_KEY = "cc-ai-knowledge-urls";
const MAX_URLS_PER_MODE = 5;

export type KnowledgeUrls = Record<AIMode, string[]>;

function loadKnowledgeUrls(): KnowledgeUrls {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {} as KnowledgeUrls;
  }
}

function saveKnowledgeUrls(urls: KnowledgeUrls) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
}

export function getKnowledgeUrlsForMode(mode: AIMode): string[] {
  return loadKnowledgeUrls()[mode] || [];
}

interface AiKnowledgeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AIMode;
  t: ReturnType<typeof getTranslations>;
}

export function AiKnowledgeDialog({ isOpen, onClose, mode, t }: AiKnowledgeDialogProps) {
  const [urls, setUrls] = useState<KnowledgeUrls>({} as KnowledgeUrls);
  const [newUrl, setNewUrl] = useState("");
  const [fetching, setFetching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
      setUrls(loadKnowledgeUrls());
      setNewUrl("");
      setError(null);
    }
  }, [isOpen]);

  const currentUrls = useMemo(() => urls[mode] || [], [urls, mode]);
  const ModeIcon = MODE_ICONS[mode];
  const color = MODE_COLORS[mode];

  const handleAdd = useCallback(async () => {
    const url = newUrl.trim();
    if (!url) return;

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError(t.aiHub.invalidUrl);
      return;
    }

    if (currentUrls.length >= MAX_URLS_PER_MODE) {
      setError(t.aiHub.urlLimit);
      return;
    }

    if (currentUrls.includes(url)) {
      setError(t.aiHub.urlDuplicate);
      return;
    }

    // Verify URL is fetchable
    setFetching(url);
    setError(null);
    try {
      const res = await fetch("/api/ai/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        setError(t.aiHub.urlFetchFailed);
        setFetching(null);
        return;
      }
    } catch {
      setError(t.aiHub.urlFetchFailed);
      setFetching(null);
      return;
    }

    const updated = {
      ...urls,
      [mode]: [...currentUrls, url],
    };
    setUrls(updated);
    saveKnowledgeUrls(updated);
    setNewUrl("");
    setFetching(null);
  }, [newUrl, currentUrls, urls, mode, t]);

  const handleRemove = useCallback((url: string) => {
    const updated = {
      ...urls,
      [mode]: currentUrls.filter((u) => u !== url),
    };
    setUrls(updated);
    saveKnowledgeUrls(updated);
  }, [urls, mode, currentUrls]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <div className="flex items-center gap-2">
            <ModeIcon size={16} className={`text-${color}-400`} />
            <h2 className="text-sm font-medium text-slate-200">{t.aiHub.knowledgeBase}</h2>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium bg-${color}-500/20 text-${color}-400`}>
              {t.aiHub[`mode${mode.charAt(0).toUpperCase() + mode.slice(1)}` as keyof typeof t.aiHub]}
            </span>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="mb-4 text-xs text-slate-500">{t.aiHub.knowledgeDescription}</p>

          {/* URL list */}
          {currentUrls.length > 0 && (
            <div className="mb-4 space-y-2">
              {currentUrls.map((url) => (
                <div
                  key={url}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2"
                >
                  <ExternalLink size={13} className="shrink-0 text-slate-500" />
                  <span className="flex-1 truncate text-[13px] text-slate-300">{url}</span>
                  <button
                    onClick={() => handleRemove(url)}
                    className="shrink-0 rounded p-1 text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add URL input */}
          <div className="flex gap-2">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => { setNewUrl(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="https://..."
              className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-[var(--cc-accent-500)] transition-colors"
            />
            <button
              onClick={handleAdd}
              disabled={!newUrl.trim() || fetching !== null}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--cc-accent-600)] px-4 py-2 text-sm text-white transition-colors hover:bg-[var(--cc-accent-500)] disabled:opacity-40"
            >
              {fetching ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {t.aiHub.addUrl}
            </button>
          </div>

          {error && (
            <p className="mt-2 text-xs text-red-400">{error}</p>
          )}

          <p className="mt-3 text-[10px] text-slate-600">
            {currentUrls.length}/{MAX_URLS_PER_MODE} URLs
          </p>
        </div>
      </div>
    </div>
  );
}
