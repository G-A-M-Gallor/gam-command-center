"use client";

import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import type { ImportResult } from "@/lib/import/types";

interface ImportProgressProps {
  result: ImportResult | null;
  isRunning: boolean;
  progress: { imported: number; total: number };
}

export function ImportProgress({ result, isRunning, progress }: ImportProgressProps) {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const it = t.importEngine;

  const pct = progress.total > 0 ? Math.round((progress.imported / progress.total) * 100) : 0;

  if (isRunning) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        {/* Animated progress bar */}
        <div className="w-full max-w-md">
          <div className="mb-2 flex justify-between text-sm text-slate-400">
            <span>{it.importing}...</span>
            <span>{pct}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-center text-xs text-slate-500">
            {it.importProgress}: {progress.imported} / {progress.total}
          </p>
        </div>

        {/* Spinner */}
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-400 border-_t-transparent" />
      </div>
    );
  }

  if (!result) return null;

  const isSuccess = result.failedRows === 0;
  const hasErrors = result.errors.length > 0;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Status icon */}
      {isSuccess ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-emerald-400">{it.importComplete}</h3>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
            <AlertCircle className="h-10 w-10 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-amber-400">
            {result.importedRows > 0 ? it.importComplete : it.importFailed}
          </h3>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 rounded-lg bg-slate-800/50 px-8 py-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-200">{result.totalRows}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-400">{result.importedRows}</p>
          <p className="text-xs text-slate-500">{it.rowsImported}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-400">{result.failedRows}</p>
          <p className="text-xs text-slate-500">{it.rowsFailed}</p>
        </div>
      </div>

      {/* Error list */}
      {hasErrors && (
        <div className="w-full max-w-2xl">
          <h4 className="mb-2 text-sm font-medium text-slate-300">{it.errors}</h4>
          <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/50">
            {result.errors.slice(0, 50).map((err, i) => (
              <div
                key={i}
                className="flex items-start gap-2 border-b border-slate-700/50 px-4 py-2 text-xs last:border-0"
              >
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                <div>
                  <span className="text-slate-400">Row {err.row + 1}</span>
                  {err.column && (
                    <span className="text-slate-500"> &middot; {err.column}</span>
                  )}
                  <span className="text-red-300"> — {err.message}</span>
                </div>
              </div>
            ))}
            {result.errors.length > 50 && (
              <div className="px-4 py-2 text-center text-[10px] text-slate-500">
                + {result.errors.length - 50} more errors
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/dashboard/import"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          onClick={() => window.location.reload()}
        >
          {it.back}
        </Link>
        <Link
          href="/dashboard/import"
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-500 transition-colors"
        >
          {it.importHistory}
        </Link>
      </div>
    </div>
  );
}
