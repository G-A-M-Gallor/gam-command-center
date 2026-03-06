"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { Pin, GitCommit, Rocket, Loader2, ChevronDown } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import {
  isFavorite,
  toggleFavorite,
} from "./widgets/FavoritesWidget";

type PageKey =
  | "layers"
  | "editor"
  | "storyMap"
  | "functionalMap"
  | "aiHub"
  | "designSystem"
  | "formily"
  | "architecture"
  | "plan"
  | "settings"
  | "automations"
  | "admin";

const pageRoutes: Record<PageKey, string> = {
  layers: "/dashboard/layers",
  editor: "/dashboard/editor",
  storyMap: "/dashboard/story-map",
  functionalMap: "/dashboard/functional-map",
  aiHub: "/dashboard/ai-hub",
  designSystem: "/dashboard/design-system",
  formily: "/dashboard/formily",
  architecture: "/dashboard/architecture",
  plan: "/dashboard/plan",
  settings: "/dashboard/settings",
  automations: "/dashboard/automations",
  admin: "/dashboard/admin",
};

interface PageHeaderProps {
  pageKey: PageKey;
  children?: React.ReactNode;
}

function GitButtons({ language }: { language: 'he' | 'en' }) {
  const t = getTranslations(language);
  const ta = t.admin;
  const isHe = language === 'he';
  const isDev = process.env.NODE_ENV !== 'production';

  const [open, setOpen] = useState(false);
  const [commitMsg, setCommitMsg] = useState('');
  const [commitLoading, setCommitLoading] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  if (!isDev) return null;

  const handleCommit = async () => {
    if (!commitMsg.trim()) return;
    setCommitLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMsg.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', msg: `${ta.commitSuccess} — ${data.hash}` });
        setCommitMsg('');
      } else {
        setFeedback({ type: 'error', msg: data.error || ta.commitError });
      }
    } catch {
      setFeedback({ type: 'error', msg: ta.commitError });
    } finally {
      setCommitLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!confirm(ta.confirmDeploy)) return;
    setDeployLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/git/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMsg.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', msg: `${ta.deploySuccess} — ${data.commitHash}` });
        setCommitMsg('');
      } else {
        setFeedback({ type: 'error', msg: data.error || ta.deployError });
      }
    } catch {
      setFeedback({ type: 'error', msg: ta.deployError });
    } finally {
      setDeployLoading(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
      >
        <GitCommit size={13} className="text-purple-400" />
        Git
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute top-full z-50 mt-2 w-80 rounded-xl border border-white/[0.08] bg-slate-900 p-3 shadow-2xl"
          style={{ [isHe ? 'right' : 'left']: 0 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-500">{ta.devOnly}</span>
            {feedback && (
              <span className={`text-[10px] font-medium ${feedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                {feedback.msg}
              </span>
            )}
          </div>

          <input
            type="text"
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            placeholder={ta.commitPlaceholder}
            className="mb-2 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-purple-500/30"
            dir={isHe ? 'rtl' : 'ltr'}
            onKeyDown={e => { if (e.key === 'Enter' && commitMsg.trim()) handleCommit(); }}
          />

          <div className="flex gap-2">
            <button
              onClick={handleCommit}
              disabled={commitLoading || !commitMsg.trim()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {commitLoading ? <Loader2 size={12} className="animate-spin" /> : <GitCommit size={12} />}
              {ta.commitButton}
            </button>
            <button
              onClick={handleDeploy}
              disabled={deployLoading}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deployLoading ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
              {ta.deployButton}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PageHeader({ pageKey, children }: PageHeaderProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const pathname = usePathname();

  const href = pageRoutes[pageKey];
  const page = t.pages[pageKey];
  const title = page.title;
  const description = page.description;

  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    setPinned(isFavorite(href));
  }, [href]);

  const handleTogglePin = useCallback(() => {
    toggleFavorite(href, title);
    setPinned((prev) => !prev);
  }, [href, title]);

  const pinLabel = pinned ? t.widgets.unpinPage : t.widgets.pinPage;

  return (
    <header data-cc-id="page.header" className="shrink-0 border-b border-slate-700/50 pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 data-cc-id="page.header.title" data-cc-text="true" className="text-2xl font-semibold text-slate-100">{title}</h1>
          <button
            type="button"
            onClick={handleTogglePin}
            className={`rounded p-1 transition-colors ${
              pinned
                ? "text-[var(--cc-accent-400)] hover:text-[var(--cc-accent-300)]"
                : "text-slate-600 hover:text-slate-400"
            }`}
            title={pinLabel}
          >
            <Pin
              className="h-4 w-4"
              fill={pinned ? "currentColor" : "none"}
            />
          </button>
        </div>
        <GitButtons language={language} />
      </div>
      <p data-cc-id="page.header.description" data-cc-text="true" className="mt-1 text-sm text-slate-400">{description}</p>
      {children}
    </header>
  );
}
