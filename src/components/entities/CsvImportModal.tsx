'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { createNote } from '@/lib/supabase/entityQueries';
import type { GlobalField } from '@/lib/entities/types';

// ─── Types ──────────────────────────────────────────

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  fields: GlobalField[];
  language: string;
  onImportComplete: () => void;
}

interface CsvData {
  headers: string[];
  rows: string[][];
  delimiter: string;
  fileName: string;
}

type FieldMapping = Record<number, string>; // csvColumnIndex → field meta_key (or "" for skip)

// ─── CSV Parsing ────────────────────────────────────

function detectDelimiter(firstLine: string): string {
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
  // Count delimiters outside quotes
  let inQuote = false;
  for (const ch of firstLine) {
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (!inQuote && ch in counts) counts[ch]++;
  }
  // Pick the delimiter with the highest count
  let best = ',';
  let max = 0;
  for (const [d, c] of Object.entries(counts)) {
    if (c > max) { max = c; best = d; }
  }
  return best;
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"') {
        // Check for escaped quote
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuote = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === delimiter) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string): CsvData & { error?: string } {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    return { headers: [], rows: [], delimiter: ',', fileName: '', error: 'no_data' };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);
  const rows = lines.slice(1).map(l => parseCsvLine(l, delimiter));

  return { headers, rows, delimiter, fileName: '' };
}

// ─── i18n helper ────────────────────────────────────

function getT(language: string): Record<string, string> {
  const he: Record<string, string> = {
    uploadTitle: 'העלאת CSV',
    uploadDesc: 'גרור קובץ CSV לכאן או לחץ לבחירה',
    dropHere: 'שחרר את הקובץ כאן',
    browse: 'בחר קובץ',
    fileSelected: 'קובץ נבחר',
    rowCount: 'שורות',
    mapFields: 'מיפוי שדות',
    csvColumn: 'עמודת CSV',
    entityField: 'שדה ישות',
    skipColumn: '-- דלג --',
    autoMapped: 'זוהה אוטומטית',
    preview: 'תצוגה מקדימה',
    importButton: 'ייבוא',
    importing: 'מייבא...',
    importComplete: 'הייבוא הושלם בהצלחה',
    importError: 'שגיאה בייבוא',
    step1: 'העלאה',
    step2: 'מיפוי',
    step3: 'ייבוא',
    next: 'הבא',
    back: 'חזרה',
    close: 'סגור',
    titleField: 'כותרת (title)',
    noTitleWarning: 'ללא מיפוי כותרת — ייווצר שם אוטומטי',
    rows: 'שורות',
    importCsv: 'ייבוא CSV',
    parseError: 'שגיאה בקריאת הקובץ',
    noData: 'הקובץ ריק או חסרות שורות נתונים',
    imported: 'יובאו',
    failed: 'נכשלו',
    of: 'מתוך',
  };
  const en: Record<string, string> = {
    uploadTitle: 'Upload CSV',
    uploadDesc: 'Drag a CSV file here or click to browse',
    dropHere: 'Drop file here',
    browse: 'Browse',
    fileSelected: 'File selected',
    rowCount: 'rows',
    mapFields: 'Map Fields',
    csvColumn: 'CSV Column',
    entityField: 'Entity Field',
    skipColumn: '-- Skip --',
    autoMapped: 'Auto-mapped',
    preview: 'Preview',
    importButton: 'Import',
    importing: 'Importing...',
    importComplete: 'Import completed successfully',
    importError: 'Import error',
    step1: 'Upload',
    step2: 'Map',
    step3: 'Import',
    next: 'Next',
    back: 'Back',
    close: 'Close',
    titleField: 'Title',
    noTitleWarning: 'No title mapped — auto-generated names will be used',
    rows: 'rows',
    importCsv: 'Import CSV',
    parseError: 'Error reading file',
    noData: 'File is empty or missing data rows',
    imported: 'imported',
    failed: 'failed',
    of: 'of',
  };
  const ru: Record<string, string> = {
    uploadTitle: 'Загрузка CSV',
    uploadDesc: 'Перетащите CSV файл или нажмите для выбора',
    dropHere: 'Отпустите файл здесь',
    browse: 'Обзор',
    fileSelected: 'Файл выбран',
    rowCount: 'строк',
    mapFields: 'Сопоставление полей',
    csvColumn: 'Столбец CSV',
    entityField: 'Поле сущности',
    skipColumn: '-- Пропустить --',
    autoMapped: 'Авто-сопоставление',
    preview: 'Предпросмотр',
    importButton: 'Импорт',
    importing: 'Импортирование...',
    importComplete: 'Импорт завершён успешно',
    importError: 'Ошибка импорта',
    step1: 'Загрузка',
    step2: 'Сопоставление',
    step3: 'Импорт',
    next: 'Далее',
    back: 'Назад',
    close: 'Закрыть',
    titleField: 'Заголовок (title)',
    noTitleWarning: 'Без заголовка — будут сгенерированы автоматические имена',
    rows: 'строк',
    importCsv: 'Импорт CSV',
    parseError: 'Ошибка чтения файла',
    noData: 'Файл пуст или отсутствуют строки данных',
    imported: 'импортировано',
    failed: 'ошибок',
    of: 'из',
  };
  if (language === 'he') return he;
  if (language === 'ru') return ru;
  return en;
}

// ─── Component ──────────────────────────────────────

export function CsvImportModal({ open, onClose, entityType, fields, language, onImportComplete }: CsvImportModalProps) {
  const t = getT(language);
  const isRtl = language === 'he';
  const lang = language === 'he' ? 'he' : language === 'ru' ? 'ru' : 'en';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [mapping, setMapping] = useState<FieldMapping>({});
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 });
  const [importDone, setImportDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-map CSV headers to fields
  const autoMap = useCallback((headers: string[], availableFields: GlobalField[]): FieldMapping => {
    const result: FieldMapping = {};
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i].toLowerCase().trim();
      // Try matching meta_key
      const byKey = availableFields.find(f => f.meta_key.toLowerCase() === h);
      if (byKey) { result[i] = byKey.meta_key; continue; }
      // Try matching label in any language
      const byLabel = availableFields.find(f =>
        f.label.he.toLowerCase() === h ||
        f.label.en.toLowerCase() === h ||
        f.label.ru.toLowerCase() === h
      );
      if (byLabel) { result[i] = byLabel.meta_key; continue; }
      // Try matching aliases
      const byAlias = availableFields.find(f =>
        f.aliases.some(a => a.toLowerCase() === h)
      );
      if (byAlias) { result[i] = byAlias.meta_key; continue; }
      // Check for "title" column
      if (h === 'title' || h === 'name' || h === 'כותרת' || h === 'שם' || h === 'название' || h === 'имя') {
        result[i] = '__title__';
        continue;
      }
      // Skip by default
      result[i] = '';
    }
    return result;
  }, []);

  const handleFile = useCallback((file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCsv(text);
        if (parsed.error === 'no_data') {
          setError(t.noData);
          return;
        }
        const data: CsvData = {
          headers: parsed.headers,
          rows: parsed.rows,
          delimiter: parsed.delimiter,
          fileName: file.name,
        };
        setCsvData(data);
        setMapping(autoMap(data.headers, fields));
      } catch {
        setError(t.parseError);
      }
    };
    reader.onerror = () => setError(t.parseError);
    reader.readAsText(file);
  }, [autoMap, fields, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const updateMapping = useCallback((colIndex: number, metaKey: string) => {
    setMapping(prev => ({ ...prev, [colIndex]: metaKey }));
  }, []);

  // Count how many columns are mapped (non-empty)
  const mappedCount = useMemo(() => {
    if (!csvData) return 0;
    return Object.values(mapping).filter(v => v !== '').length;
  }, [mapping, csvData]);

  // Has a title mapping
  const hasTitleMapping = useMemo(() => Object.values(mapping).includes('__title__'), [mapping]);

  // Preview rows (first 5)
  const previewRows = useMemo(() => {
    if (!csvData) return [];
    return csvData.rows.slice(0, 5);
  }, [csvData]);

  // Mapped headers for preview
  const mappedHeaders = useMemo(() => {
    if (!csvData) return [];
    return csvData.headers
      .map((h, i) => {
        const mk = mapping[i];
        if (!mk) return null;
        if (mk === '__title__') return { index: i, label: t.titleField, metaKey: mk };
        const f = fields.find(ff => ff.meta_key === mk);
        return f ? { index: i, label: f.label[lang] || f.meta_key, metaKey: mk } : null;
      })
      .filter(Boolean) as { index: number; label: string; metaKey: string }[];
  }, [csvData, mapping, fields, lang, t]);

  // Import handler
  const handleImport = useCallback(async () => {
    if (!csvData) return;
    setImporting(true);
    setProgress({ done: 0, total: csvData.rows.length, failed: 0 });

    let done = 0;
    let failed = 0;

    for (const row of csvData.rows) {
      // Build title
      let title = '';
      const meta: Record<string, unknown> = {};

      for (let i = 0; i < csvData.headers.length; i++) {
        const mk = mapping[i];
        if (!mk) continue;
        const value = row[i] ?? '';
        if (mk === '__title__') {
          title = value;
        } else {
          // Try to cast numbers
          const field = fields.find(f => f.meta_key === mk);
          if (field?.field_type === 'number') {
            const num = parseFloat(value);
            meta[mk] = isNaN(num) ? value : num;
          } else if (field?.field_type === 'checkbox') {
            meta[mk] = value === 'true' || value === '1' || value === 'yes';
          } else {
            meta[mk] = value;
          }
        }
      }

      if (!title) {
        // Auto-generate title from first mapped non-empty field or row index
        const firstMapped = mappedHeaders.find(h => h.metaKey !== '__title__');
        if (firstMapped) {
          title = row[firstMapped.index] || `Row ${done + 1}`;
        } else {
          title = `Row ${done + 1}`;
        }
      }

      // Apply field defaults for unmapped fields
      for (const f of fields) {
        if (!(f.meta_key in meta) && f.default_value !== null && f.default_value !== undefined) {
          meta[f.meta_key] = f.default_value;
        }
      }

      const result = await createNote(title, entityType, meta);
      if (result) {
        done++;
      } else {
        done++;
        failed++;
      }
      setProgress({ done, total: csvData.rows.length, failed });
    }

    setImporting(false);
    setImportDone(true);
    if (failed === 0) {
      onImportComplete();
    }
  }, [csvData, mapping, fields, entityType, mappedHeaders, onImportComplete]);

  const handleClose = useCallback(() => {
    setCsvData(null);
    setMapping({});
    setStep(1);
    setImporting(false);
    setProgress({ done: 0, total: 0, failed: 0 });
    setImportDone(false);
    setError(null);
    setDragOver(false);
    onClose();
  }, [onClose]);

  const handleDoneClose = useCallback(() => {
    if (importDone && progress.failed < progress.total) {
      onImportComplete();
    }
    handleClose();
  }, [importDone, progress, onImportComplete, handleClose]);

  if (!open) return null;

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const NextIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/95 backdrop-blur" onClick={handleClose}>
      <div
        className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-xl border border-white/[0.06] bg-slate-800 shadow-2xl flex flex-col"
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={20} className="text-purple-400" />
            <h2 className="text-lg font-semibold text-slate-100">{t.importCsv}</h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 px-6 py-3 border-b border-white/[0.04]">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                s === step ? 'bg-purple-600 text-white' :
                s < step ? 'bg-emerald-600/30 text-emerald-300' :
                'bg-white/[0.06] text-slate-500'
              }`}>
                {s < step ? <Check size={13} /> : s}
              </div>
              <span className={`text-xs ${s === step ? 'text-slate-200' : 'text-slate-500'}`}>
                {s === 1 ? t.step1 : s === 2 ? t.step2 : t.step3}
              </span>
              {s < 3 && <div className={`w-8 h-px ${s < step ? 'bg-emerald-600/50' : 'bg-white/[0.08]'}`} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 px-4 transition-colors cursor-pointer ${
                  dragOver
                    ? 'border-purple-500 bg-purple-500/10'
                    : csvData
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-white/[0.1] bg-white/[0.02] hover:border-white/[0.2]'
                }`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileInput}
                />

                {csvData ? (
                  <>
                    <FileSpreadsheet size={36} className="text-emerald-400 mb-3" />
                    <p className="text-sm font-medium text-emerald-300">{t.fileSelected}</p>
                    <p className="text-xs text-slate-400 mt-1">{csvData.fileName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {csvData.rows.length} {t.rows} &middot; {csvData.headers.length} {t.csvColumn.toLowerCase()}
                    </p>
                  </>
                ) : (
                  <>
                    <Upload size={36} className={`mb-3 ${dragOver ? 'text-purple-400' : 'text-slate-500'}`} />
                    <p className="text-sm text-slate-300">{dragOver ? t.dropHere : t.uploadDesc}</p>
                    <button className="mt-3 rounded-lg bg-white/[0.06] px-4 py-1.5 text-xs text-slate-300 hover:bg-white/[0.1] transition-colors">
                      {t.browse}
                    </button>
                  </>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-300">
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Map Fields */}
          {step === 2 && csvData && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-3">
                {mappedCount} / {csvData.headers.length} {t.mapFields.toLowerCase()}
              </p>

              <div className="space-y-2">
                {csvData.headers.map((header, i) => {
                  const autoMappedField = fields.find(f =>
                    f.meta_key.toLowerCase() === header.toLowerCase().trim() ||
                    f.label.he.toLowerCase() === header.toLowerCase().trim() ||
                    f.label.en.toLowerCase() === header.toLowerCase().trim() ||
                    f.label.ru.toLowerCase() === header.toLowerCase().trim() ||
                    f.aliases.some(a => a.toLowerCase() === header.toLowerCase().trim())
                  );
                  const isAutoMapped = mapping[i] && mapping[i] !== '' && autoMappedField && mapping[i] === autoMappedField.meta_key;

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5"
                    >
                      {/* CSV column */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{header}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {csvData.rows[0]?.[i] || '—'}
                        </p>
                      </div>

                      {/* Arrow */}
                      <NextIcon size={14} className="text-slate-600 flex-shrink-0" />

                      {/* Field selector */}
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <select
                          value={mapping[i] || ''}
                          onChange={e => updateMapping(i, e.target.value)}
                          className="flex-1 rounded-lg border border-white/[0.08] bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none appearance-none"
                        >
                          <option value="">{t.skipColumn}</option>
                          <option value="__title__">{t.titleField}</option>
                          {fields.map(f => (
                            <option key={f.meta_key} value={f.meta_key}>
                              {f.label[lang] || f.meta_key}
                            </option>
                          ))}
                        </select>

                        {/* Field type badge */}
                        {mapping[i] && mapping[i] !== '' && mapping[i] !== '__title__' && (() => {
                          const f = fields.find(ff => ff.meta_key === mapping[i]);
                          return f ? (
                            <span className="flex-shrink-0 rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] text-slate-400">
                              {f.field_type}
                            </span>
                          ) : null;
                        })()}

                        {isAutoMapped && (
                          <span className="flex-shrink-0 rounded bg-purple-600/20 px-1.5 py-0.5 text-[10px] text-purple-300">
                            {t.autoMapped}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!hasTitleMapping && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-xs text-amber-300">
                  <AlertCircle size={14} />
                  {t.noTitleWarning}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview & Import */}
          {step === 3 && csvData && (
            <div className="space-y-4">
              {!importDone && !importing && (
                <>
                  {/* Preview table */}
                  {mappedHeaders.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-white/[0.03]">
                            {mappedHeaders.map(h => (
                              <th key={h.index} className="px-3 py-2 text-start font-medium text-slate-400 whitespace-nowrap">
                                {h.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row, ri) => (
                            <tr key={ri} className="border-t border-white/[0.04]">
                              {mappedHeaders.map(h => (
                                <td key={h.index} className="px-3 py-2 text-slate-300 max-w-[200px] truncate">
                                  {row[h.index] || '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {csvData.rows.length > 5 && (
                    <p className="text-[11px] text-slate-500 text-center">
                      +{csvData.rows.length - 5} {t.rows}
                    </p>
                  )}
                </>
              )}

              {/* Progress */}
              {importing && (
                <div className="space-y-3 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="text-purple-400 animate-spin" />
                    <span className="text-sm text-slate-300">{t.importing}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-600 transition-all duration-300"
                      style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 text-center">
                    {progress.done} {t.of} {progress.total}
                  </p>
                </div>
              )}

              {/* Done */}
              {importDone && (
                <div className="flex flex-col items-center py-6 space-y-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    progress.failed === 0 ? 'bg-emerald-600/20' : 'bg-amber-600/20'
                  }`}>
                    {progress.failed === 0
                      ? <Check size={24} className="text-emerald-400" />
                      : <AlertCircle size={24} className="text-amber-400" />
                    }
                  </div>
                  <p className="text-sm font-medium text-slate-200">
                    {progress.failed === 0 ? t.importComplete : t.importError}
                  </p>
                  <p className="text-xs text-slate-500">
                    {progress.done - progress.failed} {t.imported}
                    {progress.failed > 0 && ` / ${progress.failed} ${t.failed}`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-3">
          <div>
            {step > 1 && !importing && !importDone && (
              <button
                onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-sm text-slate-400 hover:bg-white/[0.04] transition-colors"
              >
                <BackIcon size={14} />
                {t.back}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {importDone && (
              <button
                onClick={handleDoneClose}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--cc-accent-600,#7c3aed)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                {t.close}
              </button>
            )}

            {step === 1 && csvData && !importing && !importDone && (
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--cc-accent-600,#7c3aed)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                {t.next}
                <NextIcon size={14} />
              </button>
            )}

            {step === 2 && !importing && !importDone && (
              <button
                onClick={() => setStep(3)}
                disabled={mappedCount === 0}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--cc-accent-600,#7c3aed)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {t.next}
                <NextIcon size={14} />
              </button>
            )}

            {step === 3 && !importing && !importDone && csvData && (
              <button
                onClick={handleImport}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
              >
                <Upload size={14} />
                {t.importButton} {csvData.rows.length} {t.rows}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
