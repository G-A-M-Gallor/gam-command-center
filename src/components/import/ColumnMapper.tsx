"use client";

import { useState, useMemo, useCallback } from "react";
import { ArrowRight, Sparkles, X, ChevronDown } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import type { GlobalField } from "@/lib/entities/types";
import type { ParsedColumn, ColumnMapping, DetectedFieldType } from "@/lib/import/types";

interface ColumnMapperProps {
  columns: ParsedColumn[];
  fields: GlobalField[];
  mappings: ColumnMapping[];
  onMappingsChange: (mappings: ColumnMapping[]) => void;
}

const TYPE_COLORS: Record<DetectedFieldType, string> = {
  text: "bg-slate-600/30 text-slate-400",
  email: "bg-blue-600/20 text-blue-400",
  phone: "bg-green-600/20 text-green-400",
  date: "bg-amber-600/20 text-amber-400",
  number: "bg-purple-600/20 text-purple-400",
  url: "bg-cyan-600/20 text-cyan-400",
  boolean: "bg-pink-600/20 text-pink-400",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "bg-emerald-600/20 text-emerald-400",
  medium: "bg-amber-600/20 text-amber-400",
  low: "bg-orange-600/20 text-orange-400",
};

function confidenceLabel(c: number): { text: string; level: string } {
  if (c >= 0.9) return { text: `${Math.round(c * 100)}%`, level: "high" };
  if (c >= 0.7) return { text: `${Math.round(c * 100)}%`, level: "medium" };
  return { text: `${Math.round(c * 100)}%`, level: "low" };
}

export function ColumnMapper({
  columns,
  fields,
  mappings,
  onMappingsChange,
}: ColumnMapperProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const it = t.importEngine;

  // Group fields by category
  const fieldsByCategory = useMemo(() => {
    const groups: Record<string, GlobalField[]> = {};
    for (const f of fields) {
      const cat = f.category || "general";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(f);
    }
    return groups;
  }, [fields]);

  // Map of sourceIndex -> mapping
  const mappingsBySource = useMemo(() => {
    const map = new Map<number, ColumnMapping>();
    for (const m of mappings) {
      map.set(m.sourceIndex, m);
    }
    return map;
  }, [mappings]);

  // Set of used target fields
  const usedTargets = useMemo(
    () => new Set(mappings.map(m => m.targetField)),
    [mappings],
  );

  const handleMapField = useCallback((sourceIndex: number, sourceHeader: string, targetField: string) => {
    const newMappings = mappings.filter(m => m.sourceIndex !== sourceIndex);
    if (targetField) {
      newMappings.push({
        sourceIndex,
        sourceHeader,
        targetField,
        confidence: 1.0,
        autoDetected: false,
      });
    }
    onMappingsChange(newMappings);
  }, [mappings, onMappingsChange]);

  const handleSkip = useCallback((sourceIndex: number) => {
    onMappingsChange(mappings.filter(m => m.sourceIndex !== sourceIndex));
  }, [mappings, onMappingsChange]);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4 px-4 py-2 text-xs font-medium uppercase tracking-wider text-slate-500">
        <span>{it.sourceColumn}</span>
        <span className="w-6" />
        <span>{it.targetField}</span>
      </div>

      {/* Column rows */}
      <div className="space-y-2">
        {columns.map((col) => {
          const mapping = mappingsBySource.get(col.index);
          const isMapped = !!mapping;
          const conf = mapping ? confidenceLabel(mapping.confidence) : null;

          return (
            <div
              key={col.index}
              className={`grid grid-cols-[1fr,auto,1fr] items-center gap-4 rounded-lg border px-4 py-3 transition-colors ${
                isMapped
                  ? "border-purple-500/30 bg-purple-500/5"
                  : "border-slate-700 bg-slate-800/50"
              }`}
            >
              {/* Source column info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-200">
                    {col.header}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[col.detectedType]}`}>
                    {col.detectedType}
                  </span>
                </div>
                {col.sampleValues.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {col.sampleValues.slice(0, 3).map((v, i) => (
                      <span key={i} className="truncate rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] text-slate-500 max-w-[120px]">
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Arrow */}
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-600" />

              {/* Target field selector */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative flex-1 min-w-0">
                  <select
                    value={mapping?.targetField || ""}
                    onChange={(e) => handleMapField(col.index, col.header, e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 pr-8 text-sm text-slate-200 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">{it.skip}</option>
                    {Object.entries(fieldsByCategory).map(([cat, catFields]) => (
                      <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                        {catFields.map((f) => (
                          <option
                            key={f.meta_key}
                            value={f.meta_key}
                            disabled={usedTargets.has(f.meta_key) && mapping?.targetField !== f.meta_key}
                          >
                            {f.label[language] || f.meta_key} ({f.field_type})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                </div>

                {/* Confidence badge */}
                {conf && mapping?.autoDetected && (
                  <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${CONFIDENCE_COLORS[conf.level]}`}>
                    <Sparkles className="h-2.5 w-2.5" />
                    {conf.text}
                  </span>
                )}

                {/* Skip button */}
                {isMapped && (
                  <button
                    type="button"
                    onClick={() => handleSkip(col.index)}
                    className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors"
                    title={it.skip}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3 text-xs text-slate-400">
        <span>
          {mappings.length} / {columns.length} {it.sourceColumn.toLowerCase()}s mapped
        </span>
        <span>
          {columns.length - mappings.length} {it.skippedColumns.toLowerCase()}
        </span>
      </div>
    </div>
  );
}
