"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileSpreadsheet, FileText, AlertCircle } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import type { EntityType } from "@/lib/entities/types";

interface UploadZoneProps {
  entityTypes: EntityType[];
  selectedEntityType: string;
  onEntityTypeChange: (slug: string) => void;
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

const ACCEPTED_TYPES = ".csv,.xlsx,.xls";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function UploadZone({
  entityTypes,
  selectedEntityType,
  onEntityTypeChange,
  onFileSelected,
  isLoading,
}: UploadZoneProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const it = t.importEngine;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    const ext = file.name.toLowerCase().split(".").pop();
    if (!["csv", "xlsx", "xls"].includes(ext || "")) {
      setError(it.supportedFormats);
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(it.maxFileSize);
      return;
    }
    setSelectedFile(file);
    onFileSelected(file);
  }, [onFileSelected, it]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-6">
      {/* Entity Type Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {it.selectEntityType}
        </label>
        <select
          value={selectedEntityType}
          onChange={(e) => onEntityTypeChange(e.target.value)}
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-slate-200 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="">{it.selectEntityType}...</option>
          {entityTypes.map((et) => (
            <option key={et.slug} value={et.slug}>
              {et.label[language] || et.slug}
            </option>
          ))}
        </select>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all ${
          isDragging
            ? "border-purple-400 bg-purple-500/10"
            : selectedFile
              ? "border-emerald-500/50 bg-emerald-500/5"
              : "border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleInputChange}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
            <p className="text-sm text-slate-400">{it.importing}...</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            {selectedFile.name.endsWith(".csv") ? (
              <FileText className="h-12 w-12 text-emerald-400" />
            ) : (
              <FileSpreadsheet className="h-12 w-12 text-emerald-400" />
            )}
            <p className="text-sm font-medium text-slate-200">{selectedFile.name}</p>
            <p className="text-xs text-slate-500">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
            <p className="text-xs text-purple-400">{it.orClickBrowse}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-12 w-12 text-slate-500" />
            <p className="text-sm font-medium text-slate-300">{it.dragDrop}</p>
            <p className="text-xs text-slate-500">{it.orClickBrowse}</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2.5 py-1 text-[10px] text-slate-400">
                <FileText className="h-3 w-3" /> CSV
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2.5 py-1 text-[10px] text-slate-400">
                <FileSpreadsheet className="h-3 w-3" /> XLSX
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2.5 py-1 text-[10px] text-slate-400">
                <FileSpreadsheet className="h-3 w-3" /> XLS
              </span>
            </div>
            <p className="text-[10px] text-slate-600">
              {it.maxFileSize} &middot; {it.maxRows}
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
