"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Trash2, Plus, X, Loader2, Check } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

interface QAPair {
  q: string;
  a: string;
}

interface WikiEntry {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  qa_pairs: QAPair[] | null;
  created_at: string;
  updated_at: string | null;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

const WIKI_CATEGORIES = ["sales", "ops", "tech", "people", "products"] as const;

export default function WikiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useSettings();
  const t = getTranslations(language);
  const isRtl = language === "he";
  const wikiT = t.wiki as any;
  const tw = wikiT as Record<string, string>;
  const catLabels = wikiT.categories as Record<string, string>;
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const [entry, setEntry] = useState<WikiEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("wiki_entries")
        .select("*")
        .eq("id", params.id)
        .single();
      if (data) setEntry(data);
      setLoading(false);
    })();
  }, [params.id]);

  const save = useCallback(
    async (updated: Partial<WikiEntry>) => {
      if (!entry) return;
      setSaveStatus("saving");
      const { error } = await supabase
        .from("wiki_entries")
        .update({ ...updated, updated_at: new Date().toISOString() })
        .eq("id", entry.id);
      setSaveStatus(error ? "error" : "saved");
      if (!error) {
        setEntry((prev) => (prev ? { ...prev, ...updated } : prev));
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
      }
    },
    [entry]
  );

  const handleFieldBlur = useCallback(
    (field: keyof WikiEntry, value: string) => {
      if (!entry || entry[field] === value) return;
      save({ [field]: value || null });
    },
    [entry, save]
  );

  const updateQaPairs = useCallback(
    (pairs: QAPair[]) => {
      setEntry((prev) => (prev ? { ...prev, qa_pairs: pairs } : prev));
      save({ qa_pairs: pairs as unknown as WikiEntry["qa_pairs"] });
    },
    [save]
  );

  const handleDelete = async () => {
    if (!entry) return;
    await supabase.from("wiki_entries").delete().eq("id", entry.id);
    router.push("/dashboard/wiki");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-[var(--cc-accent-400)]" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="p-6 text-center text-slate-400">
        Entry not found.
        <Link href="/dashboard/wiki" className="ms-2 text-[var(--cc-accent-400)] hover:underline">
          {tw.backToWiki}
        </Link>
      </div>
    );
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/wiki"
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <BackArrow className="h-4 w-4" />
          {tw.backToWiki}
        </Link>

        <div className="flex items-center gap-3">
          {/* Save status */}
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              {tw.saving}
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Check className="h-3 w-3" />
              {tw.saved}
            </span>
          )}

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">{tw.confirmDelete}</span>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500"
              >
                {tw.deleteEntry}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-white/[0.06] px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
              >
                {tw.cancel}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg border border-white/[0.06] p-1.5 text-slate-500 hover:border-red-500/30 hover:text-red-400 transition-colors"
              title={tw.deleteEntry}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <input
        defaultValue={entry.title}
        onBlur={(e) => handleFieldBlur("title", e.target.value)}
        className="w-full bg-transparent text-2xl font-semibold text-slate-100 outline-none placeholder:text-slate-600"
        placeholder={tw.title}
      />

      {/* Description */}
      <textarea
        defaultValue={entry.description ?? ""}
        onBlur={(e) => handleFieldBlur("description", e.target.value)}
        rows={3}
        className="w-full resize-none rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-sm text-slate-300 outline-none placeholder:text-slate-600 focus:border-[var(--cc-accent-500)]/40"
        placeholder={tw.description}
      />

      {/* Category */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          {tw.category}
        </label>
        <select
          value={entry.category ?? ""}
          onChange={(e) => save({ category: e.target.value || null })}
          className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-slate-200 outline-none focus:border-[var(--cc-accent-500)]/40"
        >
          <option value="">—</option>
          {WIKI_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{catLabels[cat]}</option>
          ))}
        </select>
      </div>

      {/* Q&A Pairs */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">{tw.qaPairs}</h2>
          <button
            onClick={() =>
              updateQaPairs([...(entry.qa_pairs ?? []), { q: "", a: "" }])
            }
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-slate-400 hover:border-[var(--cc-accent-500)]/30 hover:text-[var(--cc-accent-300)] transition-colors"
          >
            <Plus className="h-3 w-3" />
            {tw.addQaPair}
          </button>
        </div>

        <div className="space-y-3">
          {(entry.qa_pairs ?? []).map((pair, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="mt-1.5 shrink-0 rounded bg-[var(--cc-accent-600)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--cc-accent-400)]">
                  Q{i + 1}
                </span>
                <input
                  defaultValue={pair.q}
                  onBlur={(e) => {
                    const updated = [...(entry.qa_pairs ?? [])];
                    updated[i] = { ...updated[i], q: e.target.value };
                    updateQaPairs(updated);
                  }}
                  className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
                  placeholder={tw.question}
                />
                <button
                  onClick={() => {
                    const updated = (entry.qa_pairs ?? []).filter((_, j) => j !== i);
                    updateQaPairs(updated);
                  }}
                  className="shrink-0 rounded p-1 text-slate-600 hover:text-red-400 transition-colors"
                  title={tw.removeQaPair}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-start gap-2">
                <span className="mt-1.5 shrink-0 rounded bg-emerald-600/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                  A{i + 1}
                </span>
                <textarea
                  defaultValue={pair.a}
                  onBlur={(e) => {
                    const updated = [...(entry.qa_pairs ?? [])];
                    updated[i] = { ...updated[i], a: e.target.value };
                    updateQaPairs(updated);
                  }}
                  rows={2}
                  className="flex-1 resize-none bg-transparent text-sm text-slate-300 outline-none placeholder:text-slate-600"
                  placeholder={tw.answer}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
