"use client";

import { useState, useEffect } from "react";
import { X, Link2, Copy, Check, Unlink } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import {
  createShareLink,
  revokeShareLink,
  type DocShare,
} from "@/lib/supabase/editorQueries";

const EXPIRY_OPTIONS = [
  { key: "noExpiry", days: undefined },
  { key: "expires24h", days: 1 },
  { key: "expires7d", days: 7 },
  { key: "expires30d", days: 30 },
] as const;

interface ShareDialogProps {
  documentId: string;
  open: boolean;
  onClose: () => void;
}

export function ShareDialog({ documentId, open, onClose }: ShareDialogProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isRtl = language === "he";
  const et = t.editor;
  const localeMap = { he: "he-IL", en: "en-US", ru: "ru-RU" } as const;

  const [share, setShare] = useState<DocShare | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiryDays, setExpiryDays] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
      setShare(null);
      setCopied(false);
      setExpiryDays(undefined);
    }
  }, [open]);

  const handleCreateLink = async () => {
    setLoading(true);
    const result = await createShareLink(documentId, expiryDays);
    setShare(result);
    setLoading(false);
  };

  const handleRevoke = async () => {
    if (!share) return;
    setLoading(true);
    await revokeShareLink(share.id);
    setShare(null);
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!share) return;
    const url = `${window.location.origin}/shared/doc/${share.share_token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        data-cc-id="editor.share-dialog"
        className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 shadow-2xl"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3">
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-100">{et.share}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {!share ? (
            <div className="space-y-4">
              <p className="text-center text-sm text-slate-400">{et.shareDescription}</p>

              {/* Expiry selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-500">{et.shareExpiry}</label>
                <div className="flex gap-1.5">
                  {EXPIRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setExpiryDays(opt.days)}
                      className={`flex-1 rounded-md px-2 py-1.5 text-xs transition-colors ${
                        expiryDays === opt.days
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "bg-slate-700/50 text-slate-400 border border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      {(et as Record<string, string>)[opt.key]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateLink}
                disabled={loading}
                className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-40"
              >
                {loading ? "..." : et.createShareLink}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                <span className="flex-1 truncate text-xs text-slate-300" dir="ltr">
                  {window.location.origin}/shared/doc/{share.share_token}
                </span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  title={et.copyLink}
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
              {share.expires_at && (
                <p className="text-[11px] text-slate-500">
                  {et.shareExpiry}: {new Date(share.expires_at).toLocaleDateString(localeMap[language])}
                </p>
              )}
              <button
                onClick={handleRevoke}
                disabled={loading}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-40"
              >
                <Unlink size={13} />
                {et.revokeLink}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
