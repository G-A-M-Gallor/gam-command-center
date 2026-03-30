"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Plus, X, Loader2 } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

interface QAPair {
  q: string;
  a: string;
}

const WIKI_CATEGORIES = ["sales", "ops", "tech", "people", "products"] as const;

export default function WikiNewPage() {
  const router = useRouter();
  const { language } = useSettings();
  const t = getTranslations(language);
  const isRtl = language === "he";
  const wikiT = t.wiki as any;
  const tw = wikiT as Record<string, string>;
  const catLabels = wikiT.categories as Record<string, string>;
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [qaPairs, setQaPairs] = useState<QAPair[]>([{ q: "", a: "" }]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!title.trim()) {
      setError(tw.titleRequired);
      return;
    }

    setCreating(true);
    setError("");

    const filteredPairs = qaPairs.filter((p) => p.q.trim() || p.a.trim());

    const { data, error: dbError } = await supabase
      .from("wiki_entries")
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        qa_pairs: filteredPairs.length > 0 ? filteredPairs : null,
      })
      .select("id")
      .single();

    if (dbError || !data) {
      setError(dbError?.message ?? "Failed to create");
      setCreating(false);
      return;
    }

    router.push(`/dashboard/wiki/${data.id}`);
  };

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
      </div>

      <h1 className="text-2xl font-semibold text-slate-100">{tw.newEntry}</h1>

      {/* Title */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          {tw.title} *
        </label>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError("");
          }}
          className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-[var(--cc-accent-500)]/40"
          placeholder={tw.title}
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          {tw.description}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-sm text-slate-300 outline-none placeholder:text-slate-600 focus:border-[var(--cc-accent-500)]/40"
          placeholder={tw.description}
        />
      </div>

      {/* Category */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          {tw.category}
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
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
            onClick={() => setQaPairs([...qaPairs, { q: "", a: "" }])}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-slate-400 hover:border-[var(--cc-accent-500)]/30 hover:text-[var(--cc-accent-300)] transition-colors"
          >
            <Plus className="h-3 w-3" />
            {tw.addQaPair}
          </button>
        </div>

        <div className="space-y-3">
          {qaPairs.map((pair, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="mt-1.5 shrink-0 rounded bg-[var(--cc-accent-600)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--cc-accent-400)]">
                  Q{i + 1}
                </span>
                <input
                  value={pair.q}
                  onChange={(e) => {
                    const updated = [...qaPairs];
                    updated[i] = { ...updated[i], q: e.target.value };
                    setQaPairs(updated);
                  }}
                  className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
                  placeholder={tw.question}
                />
                {qaPairs.length > 1 && (
                  <button
                    onClick={() => setQaPairs(qaPairs.filter((_, j) => j !== i))}
                    className="shrink-0 rounded p-1 text-slate-600 hover:text-red-400 transition-colors"
                    title={tw.removeQaPair}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-start gap-2">
                <span className="mt-1.5 shrink-0 rounded bg-emerald-600/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                  A{i + 1}
                </span>
                <textarea
                  value={pair.a}
                  onChange={(e) => {
                    const updated = [...qaPairs];
                    updated[i] = { ...updated[i], a: e.target.value };
                    setQaPairs(updated);
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

      {/* Error + Submit */}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 rounded-lg bg-[var(--cc-accent-600)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--cc-accent-500)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {creating && <Loader2 className="h-4 w-4 animate-spin" />}
          {creating ? tw.creating : tw.create}
        </button>
        <Link
          href="/dashboard/wiki"
          className="rounded-lg border border-white/[0.06] px-5 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          {tw.cancel}
        </Link>
      </div>
    </div>
  );
}
