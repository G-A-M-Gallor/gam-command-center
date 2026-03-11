"use client";

import { useMemo } from "react";
import { CheckCircle2, AlertCircle, MinusCircle } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import type { GlobalField } from "@/lib/entities/types";
import type { ColumnMapping, ImportRow } from "@/lib/import/types";

interface PreviewTableProps {
  rows: ImportRow[];
  mappings: ColumnMapping[];
  fields: GlobalField[];
  totalRows: number;
}

export function PreviewTable({ rows, mappings, fields, totalRows }: PreviewTableProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const it = t.importEngine;

  const fieldMap = useMemo(
    () => new Map(fields.map(f => [f.meta_key, f])),
    [fields],
  );

  const validCount = rows.filter(r => r.valid).length;
  const invalidCount = rows.filter(r => !r.valid).length;
  const errorRate = totalRows > 0 ? ((totalRows - validCount) / totalRows) : 0;
  const previewRows = rows.slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg bg-slate-800/50 px-4 py-3">
        <div className="flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="text-emerald-400 font-medium">{validCount}</span>
          <span className="text-slate-400">{it.validRows}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-red-400 font-medium">{invalidCount}</span>
          <span className="text-slate-400">{it.invalidRows}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <MinusCircle className="h-4 w-4 text-slate-500" />
          <span className="text-slate-400">
            {it.errorRate}: {(errorRate * 100).toFixed(1)}%
          </span>
        </div>
        {errorRate > 0.1 && (
          <div className="ml-auto rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400">
            {it.errorRateWarning}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/80">
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 w-10">#</th>
              {mappings.map((m) => {
                const field = fieldMap.get(m.targetField);
                return (
                  <th
                    key={m.sourceIndex}
                    className="px-3 py-2 text-left text-xs font-medium text-slate-300"
                  >
                    {field?.label[language] || m.targetField}
                  </th>
                );
              })}
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 w-16">
                {it.status}
              </th>
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row) => {
              const hasErrors = row.errors.length > 0;
              const errorFields = new Set(row.errors.map(e => e.column));

              return (
                <tr
                  key={row.rowIndex}
                  className={`border-b border-slate-700/50 ${
                    hasErrors ? "bg-red-500/5" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {row.rowIndex + 1}
                  </td>
                  {mappings.map((m) => {
                    const value = String(row.data[m.targetField] ?? "");
                    const isError = errorFields.has(m.targetField);
                    const errorMsg = row.errors.find(e => e.column === m.targetField)?.message;

                    return (
                      <td
                        key={m.sourceIndex}
                        className="px-3 py-2"
                      >
                        <div
                          className={`rounded px-2 py-1 text-xs ${
                            isError
                              ? "border border-red-500/40 bg-red-500/10 text-red-300"
                              : value
                                ? "text-slate-300"
                                : "text-slate-600 italic"
                          }`}
                          title={errorMsg || undefined}
                        >
                          {value || "-"}
                          {isError && (
                            <span className="block mt-0.5 text-[10px] text-red-400">
                              {errorMsg}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2">
                    {hasErrors ? (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalRows > 10 && (
        <p className="text-center text-xs text-slate-500">
          {it.previewDescription} ({totalRows} {it.rowsImported.split(" ").pop()})
        </p>
      )}
    </div>
  );
}
