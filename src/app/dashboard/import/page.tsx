"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Upload, Columns, Eye, Play, History } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";
import { fetchEntityTypes, fetchGlobalFields } from "@/lib/supabase/entityQueries";
import { buildImportRows, validateImport } from "@/lib/import/validator";
import { UploadZone } from "@/components/import/UploadZone";
import { ColumnMapper } from "@/components/import/ColumnMapper";
import { PreviewTable } from "@/components/import/PreviewTable";
import { ImportProgress } from "@/components/import/ImportProgress";
import { ImportHistory } from "@/components/import/ImportHistory";
import type { EntityType, GlobalField } from "@/lib/entities/types";
import type { ParsedColumn, ColumnMapping, ImportRow, ImportResult } from "@/lib/import/types";

type Step = "upload" | "map" | "preview" | "import";

const STEPS: { key: Step; icon: React.ElementType }[] = [
  { key: "upload", icon: Upload },
  { key: "map", icon: Columns },
  { key: "preview", icon: Eye },
  { key: "import", icon: Play },
];

export default function ImportPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const it = t.importEngine;

  // ─── State ──────────────────────────────────────────
  const [step, setStep] = useState<Step>("upload");
  const [showHistory, setShowHistory] = useState(false);
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [fields, setFields] = useState<GlobalField[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState("");

  // Parse state
  const [isUploading, setIsUploading] = useState(false);
  const [columns, setColumns] = useState<ParsedColumn[]>([]);
  const [allRows, setAllRows] = useState<string[][]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);

  // Mapping state
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);

  // Preview state
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [errorRate, setErrorRate] = useState(0);

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importProgress, setImportProgress] = useState({ imported: 0, total: 0 });

  // ─── Load Entity Types & Fields ────────────────────
  useEffect(() => {
    fetchEntityTypes().then(setEntityTypes);
    fetchGlobalFields().then(setFields);
  }, []);

  // ─── Step Labels ───────────────────────────────────
  const stepLabels: Record<Step, string> = {
    upload: it.uploadFile,
    map: it.columnMapping,
    preview: it.preview,
    import: it.startImport,
  };

  // ─── Handle File Upload ────────────────────────────
  const handleFileSelected = useCallback(async (file: File) => {
    if (!selectedEntityType) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch("/api/import/parse", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");

      setColumns(data.columns);
      setAllRows(data.allRows);
      setTotalRows(data.totalRows);
      setFileName(data.fileName);
      setFileSize(data.fileSize);
      setMappings(data.suggestedMappings);
      setStep("map");
    } catch (err) {
      console.error("Parse error:", err);
    } finally {
      setIsUploading(false);
    }
  }, [selectedEntityType]);

  // ─── Handle Preview (validate) ─────────────────────
  const handlePreview = useCallback(() => {
    const rows = buildImportRows(allRows, mappings, fields);
    const { errorRate: rate } = validateImport(rows);
    setImportRows(rows);
    setErrorRate(rate);
    setStep("preview");
  }, [allRows, mappings, fields]);

  // ─── Handle Import ─────────────────────────────────
  const handleImport = useCallback(async () => {
    if (errorRate > 0.1) return;
    setIsImporting(true);
    setImportProgress({ imported: 0, total: totalRows });
    setStep("import");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch("/api/import/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          entity_type: selectedEntityType,
          mappings: mappings.map(m => ({
            sourceIndex: m.sourceIndex,
            sourceHeader: m.sourceHeader,
            targetField: m.targetField,
            confidence: m.confidence,
          })),
          rows: allRows,
          file_name: fileName,
          file_size: fileSize,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      setImportResult(data);
      setImportProgress({ imported: data.importedRows, total: data.totalRows });
    } catch (err) {
      console.error("Import error:", err);
      setImportResult({
        totalRows,
        importedRows: 0,
        failedRows: totalRows,
        errors: [{ row: 0, column: "", message: String(err), value: "" }],
        importLogId: "",
      });
    } finally {
      setIsImporting(false);
    }
  }, [errorRate, totalRows, selectedEntityType, mappings, allRows, fileName, fileSize]);

  // ─── Navigation ────────────────────────────────────
  const canGoNext = useMemo(() => {
    switch (step) {
      case "upload": return false; // auto-advance on file upload
      case "map": return mappings.length > 0;
      case "preview": return errorRate <= 0.1;
      case "import": return false;
    }
  }, [step, mappings, errorRate]);

  const handleBack = useCallback(() => {
    switch (step) {
      case "map": setStep("upload"); break;
      case "preview": setStep("map"); break;
      case "import": setStep("preview"); break;
    }
  }, [step]);

  const handleNext = useCallback(() => {
    switch (step) {
      case "map": handlePreview(); break;
      case "preview": handleImport(); break;
    }
  }, [step, handlePreview, handleImport]);

  // ─── Render ────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-48px)] flex-col overflow-hidden bg-slate-900">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-100">{it.title}</h1>
            <p className="text-sm text-slate-500">{it.description}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              showHistory
                ? "bg-purple-600/20 text-purple-300"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <History className="h-4 w-4" />
            {it.importHistory}
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="flex-1 overflow-y-auto p-6">
          <ImportHistory />
        </div>
      ) : (
        <>
          {/* Step indicator */}
          <div className="shrink-0 flex items-center justify-center gap-2 px-6 py-4">
            {STEPS.map(({ key, icon: StepIcon }, i) => {
              const stepIndex = STEPS.findIndex(s => s.key === step);
              const thisIndex = i;
              const isActive = key === step;
              const isDone = thisIndex < stepIndex;

              return (
                <div key={key} className="flex items-center gap-2">
                  {i > 0 && (
                    <div className={`h-px w-8 ${isDone ? "bg-purple-500" : "bg-slate-700"}`} />
                  )}
                  <div
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-purple-600/20 text-purple-300 ring-1 ring-purple-500/30"
                        : isDone
                          ? "bg-emerald-600/10 text-emerald-400"
                          : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    <StepIcon className="h-3.5 w-3.5" />
                    {stepLabels[key]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="mx-auto max-w-4xl">
              {step === "upload" && (
                <UploadZone
                  entityTypes={entityTypes}
                  selectedEntityType={selectedEntityType}
                  onEntityTypeChange={setSelectedEntityType}
                  onFileSelected={handleFileSelected}
                  isLoading={isUploading}
                />
              )}

              {step === "map" && (
                <ColumnMapper
                  columns={columns}
                  fields={fields}
                  mappings={mappings}
                  onMappingsChange={setMappings}
                />
              )}

              {step === "preview" && (
                <PreviewTable
                  rows={importRows}
                  mappings={mappings}
                  fields={fields}
                  totalRows={totalRows}
                />
              )}

              {step === "import" && (
                <ImportProgress
                  result={importResult}
                  isRunning={isImporting}
                  progress={importProgress}
                />
              )}
            </div>
          </div>

          {/* Navigation footer */}
          {step !== "import" && (
            <div className="shrink-0 flex items-center justify-between border-t border-slate-700/50 px-6 py-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === "upload"}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {it.back}
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext}
                className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {step === "preview" ? it.startImport : it.next}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
