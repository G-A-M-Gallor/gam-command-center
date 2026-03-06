"use client";

import { useState, useEffect } from "react";
import { X, RotateCcw, Clock } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import {
  fetchVersions,
  restoreVersion,
  type DocVersion,
} from "@/lib/supabase/editorQueries";

interface VersionHistoryProps {
  documentId: string;
  open: boolean;
  onClose: () => void;
  onRestore: () => void;
}

export function VersionHistory({
  documentId,
  open,
  onClose,
  onRestore,
}: VersionHistoryProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isHe = language === "he";
  const et = t.editor;

  const [versions, setVersions] = useState<DocVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchVersions(documentId)
        .then(setVersions)
        .finally(() => setLoading(false));
    }
  }, [open, documentId]);

  const handleRestore = async (versionId: string) => {
    setRestoring(versionId);
    const ok = await restoreVersion(documentId, versionId);
    setRestoring(null);
    if (ok) {
      onRestore();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      data-cc-id="editor.version-history"
      className="fixed inset-y-0 z-50 flex w-80 flex-col border-s border-slate-700 bg-slate-800 shadow-2xl"
      style={{ [isHe ? "left" : "right"]: 0, top: 0 }}
      dir={isHe ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-100">{et.versionHistory}</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
        >
          <X size={16} />
        </button>
      </div>

      {/* Versions list */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading && (
          <p className="text-center text-sm text-slate-500 py-4">{isHe ? "טוען..." : "Loading..."}</p>
        )}

        {!loading && versions.length === 0 && (
          <p className="text-center text-sm text-slate-500 py-4">{et.noVersions}</p>
        )}

        <div className="space-y-1">
          {versions.map((v) => (
            <div
              key={v.id}
              className="group rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-200">
                  v{v.version_number}
                </span>
                <button
                  onClick={() => handleRestore(v.id)}
                  disabled={restoring !== null}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-slate-400 opacity-0 transition-all hover:bg-purple-500/15 hover:text-purple-300 group-hover:opacity-100 disabled:opacity-40"
                  title={et.restore}
                >
                  <RotateCcw size={11} />
                  {restoring === v.id ? "..." : et.restore}
                </button>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {v.title}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-600">
                {new Date(v.created_at).toLocaleString(isHe ? "he-IL" : "en-US")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
