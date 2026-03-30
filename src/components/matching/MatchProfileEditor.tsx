"use client";

import { useState, useEffect } from "react";
import { Save, Eye, Settings2 } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import type { MatchProfile, MatchWeights } from "@/lib/matching/types";
import { DEFAULT_WEIGHTS } from "@/lib/matching/types";

interface MatchProfileEditorProps {
  profile: MatchProfile | null;
  savedWeights?: MatchWeights;
  onSave?: (weights: MatchWeights) => void;
}

export function MatchProfileEditor({
  _profile,
  savedWeights,
  onSave,
}: MatchProfileEditorProps) {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const mt = t.matching as Record<string, string>;

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [weights, setWeights] = useState<MatchWeights>(
    savedWeights || DEFAULT_WEIGHTS
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (savedWeights) setWeights(savedWeights);
  }, [savedWeights]);

  const handleWeightChange = (key: keyof MatchWeights, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      onSave(weights);
    } finally {
      setSaving(false);
      setMode("view");
    }
  };

  // Normalize weights to sum to 1
  const normalizeWeights = () => {
    const total = weights.semantic + weights.field + weights.recency;
    if (total === 0) return;
    setWeights({
      semantic: Math.round((weights.semantic / total) * 100) / 100,
      field: Math.round((weights.field / total) * 100) / 100,
      recency: Math.round((weights.recency / total) * 100) / 100,
    });
  };

  if (!_profile) {
    return (
      <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 text-center text-sm text-slate-500">
        {mt.selectSource}
      </div>
    );
  }

  return (
    <div
      data-cc-id="matching._profile-editor"
      className="rounded-lg border border-slate-700/50 bg-slate-800/30"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 px-3 py-2">
        <h4 className="text-xs font-medium text-slate-300">
          {mt.matchProfile}
        </h4>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMode(mode === "view" ? "edit" : "view")}
            className={`rounded p-1 transition-colors ${
              mode === "edit"
                ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
                : "text-slate-500 hover:text-slate-300"
            }`}
            title={mode === "view" ? mt.editProfile : mt.matchProfile}
          >
            {mode === "view" ? (
              <Settings2 className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Profile fields */}
      <div className="p-3 space-y-2">
        {/* Semantic text preview */}
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-600">
            Semantic Text
          </span>
          <p className="mt-0.5 rounded bg-slate-800/50 p-2 text-[11px] text-slate-400 leading-relaxed max-h-20 overflow-y-auto">
            {profile.semanticText.slice(0, 300)}
            {profile.semanticText.length > 300 ? "..." : ""}
          </p>
        </div>

        {/* Extracted fields */}
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-600">
            {mt.matchedOn || "Extracted Fields"}
          </span>
          <div className="mt-1 space-y-1">
            {Object.entries(_profile.fields).map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded bg-slate-800/50 px-2 py-1"
              >
                <span className="text-[10px] text-slate-400">{key}</span>
                <span className="text-[10px] text-slate-300 max-w-[60%] truncate text-right">
                  {val.type === "string"
                    ? val.value
                    : val.type === "number"
                      ? String(val.value)
                      : val.type === "strings"
                        ? val.value.join(", ")
                        : val.type === "range"
                          ? `${val.min} - ${val.max}`
                          : val.type === "dateRange"
                            ? `${val.start.slice(0, 10)} - ${val.end.slice(0, 10)}`
                            : val.type === "boolean"
                              ? String(val.value)
                              : "?"}
                </span>
              </div>
            ))}
            {Object.keys(_profile.fields).length === 0 && (
              <p className="text-[10px] text-slate-600 italic">
                No structured fields extracted
              </p>
            )}
          </div>
        </div>

        {/* Weight editor */}
        {mode === "edit" && (
          <div className="mt-3 space-y-2 border-_t border-slate-700/50 pt-3">
            <span className="text-[10px] uppercase tracking-wider text-slate-600">
              Weights
            </span>
            {(["semantic", "field", "recency"] as const).map((key) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-16 text-[10px] text-slate-400 capitalize">
                  {key}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weights[key]}
                  onChange={(e) =>
                    handleWeightChange(key, parseFloat(e.target.value))
                  }
                  className="flex-1 h-1 accent-[var(--cc-accent-500)]"
                />
                <span className="w-8 text-right text-[10px] text-slate-300">
                  {Math.round(weights[key] * 100)}%
                </span>
              </div>
            ))}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={normalizeWeights}
                className="rounded px-2 py-0.5 text-[10px] text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                Normalize
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 rounded bg-[var(--cc-accent-600-20)] px-2 py-0.5 text-[10px] text-[var(--cc-accent-300)] hover:bg-[var(--cc-accent-600-30)] transition-colors disabled:opacity-50"
              >
                <Save className="h-3 w-3" />
                {mt.saveProfile}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
