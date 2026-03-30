"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { JSONContent } from "@tiptap/react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import {
  fetchDocTemplate,
  updateDocTemplate,
  createTemplateVersion,
} from "@/lib/supabase/documentQueries";
import type { DocumentTemplate, DocTemplateStatus } from "@/lib/supabase/schema";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Tag,
  _X,
  _Plus,
  ChevronDown,
  PanelRightOpen,
  PanelRightClose,
  GripVertical,
  Trash2,
  Type,
  Hash,
  Calendar,
  ListChecks,
  ToggleLeft,
  AlignLeft,
  Mail,
  Phone,
  ChevronUp,
} from "lucide-react";

const TiptapEditor = dynamic(
  () => import("@/components/editor/TiptapEditor"),
  { ssr: false },
);

type SaveState = "idle" | "saving" | "saved" | "error";

// ── Field Types ─────────────────────────────────────────
type TemplateFieldType = "text" | "number" | "date" | "select" | "checkbox" | "textarea" | "email" | "phone";

interface TemplateField {
  id: string;
  type: TemplateFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select type
  sort_order: number;
}

const FIELD_TYPE_ICONS: Record<TemplateFieldType, React.ElementType> = {
  text: Type,
  number: Hash,
  date: Calendar,
  select: ListChecks,
  checkbox: ToggleLeft,
  textarea: AlignLeft,
  email: Mail,
  phone: Phone,
};

const FIELD_TYPE_LABELS: Record<TemplateFieldType, { he: string; en: string; ru: string }> = {
  text: { he: "טקסט", en: "Text", ru: "Текст" },
  number: { he: "מספר", en: "Number", ru: "Число" },
  date: { he: "תאריך", en: "Date", ru: "Дата" },
  select: { he: "בחירה", en: "Select", ru: "Выбор" },
  checkbox: { he: "תיבת סימון", en: "Checkbox", ru: "Флажок" },
  textarea: { he: "טקסט ארוך", en: "Long Text", ru: "Длинный текст" },
  email: { he: "אימייל", en: "Email", ru: "Эл. почта" },
  phone: { he: "טלפון", en: "Phone", ru: "Телефон" },
};

function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ── Main Component ──────────────────────────────────────

export default function DocumentTemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const _router = useRouter();
  const { language } = useSettings();
  const _t = getTranslations(language);
  const dt = t.docTemplates;
  const df = t.docFields;
  const isRtl = language === "he";
  const langKey = language as "he" | "en" | "ru";

  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<DocTemplateStatus>("draft");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [content, setContent] = useState<JSONContent | null>(null);
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | undefined>();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showFieldsPanel, setShowFieldsPanel] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showAddField, setShowAddField] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameRef = useRef("");

  // ── Load template ─────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      const tpl = await fetchDocTemplate(id);
      if (!tpl) {
        setLoading(false);
        return;
      }
      setTemplate(tpl);
      setName(tpl.name);
      nameRef.current = tpl.name;
      setDescription(tpl.description || "");
      setStatus(tpl.status);
      setTags(tpl.tags);
      setContent(tpl.content as JSONContent);
      setFields((tpl.fields as unknown as TemplateField[]) || []);
      setLoading(false);
    }
    load();
  }, [id]);

  // ── Save helpers ──────────────────────────────────────
  const markSaved = useCallback(() => {
    setSaveState("saved");
    setLastSavedAt(new Date());
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setSaveState("idle"), 2000);
  }, []);

  const handleContentSave = useCallback(
    async (json: JSONContent) => {
      setSaveState("saving");
      const ok = await updateDocTemplate(id, { content: json as Record<string, unknown> });
      ok ? markSaved() : setSaveState("error");
    },
    [id, markSaved],
  );

  const saveMetadata = useCallback(
    async (patch: Partial<DocumentTemplate>) => {
      setSaveState("saving");
      const ok = await updateDocTemplate(id, patch);
      ok ? markSaved() : setSaveState("error");
    },
    [id, markSaved],
  );

  const saveFields = useCallback(
    async (newFields: TemplateField[]) => {
      setFields(newFields);
      setSaveState("saving");
      const ok = await updateDocTemplate(id, { fields: newFields as unknown as Record<string, unknown>[] });
      ok ? markSaved() : setSaveState("error");
    },
    [id, markSaved],
  );

  const handleNameBlur = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== nameRef.current) {
      nameRef.current = trimmed;
      saveMetadata({ name: trimmed });
    }
  }, [name, saveMetadata]);

  const handleDescBlur = useCallback(() => {
    if (template && description !== (template.description || "")) {
      saveMetadata({ description: description || null });
    }
  }, [description, template, saveMetadata]);

  const handleStatusChange = useCallback(
    (newStatus: DocTemplateStatus) => {
      setStatus(newStatus);
      setShowStatusMenu(false);
      saveMetadata({ status: newStatus });
    },
    [saveMetadata],
  );

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      const newTags = [...tags, tag];
      setTags(newTags);
      setTagInput("");
      saveMetadata({ tags: newTags });
    }
  }, [tagInput, tags, saveMetadata]);

  const handleRemoveTag = useCallback(
    (tag: string) => {
      const newTags = tags.filter((_t) => t !== tag);
      setTags(newTags);
      saveMetadata({ tags: newTags });
    },
    [tags, saveMetadata],
  );

  const handleSaveVersion = useCallback(async () => {
    if (!content || !template) return;
    await createTemplateVersion({
      template_id: id,
      version: template.version + 1,
      content: content as Record<string, unknown>,
      fields: fields as unknown as Record<string, unknown>[],
      change_note: null,
      created_by: null,
    });
    await updateDocTemplate(id, { version: template.version + 1 });
    setTemplate((prev) => prev ? { ...prev, version: prev.version + 1 } : prev);
  }, [content, template, id, fields]);

  // ── Field CRUD ────────────────────────────────────────
  const handleAddField = useCallback(
    (type: TemplateFieldType) => {
      const newField: TemplateField = {
        id: generateFieldId(),
        type,
        label: "",
        required: false,
        sort_order: fields.length,
        ...(type === "select" ? { options: [""] } : {}),
      };
      const newFields = [...fields, newField];
      saveFields(newFields);
      setEditingField(newField.id);
      setShowAddField(false);
    },
    [fields, saveFields],
  );

  const handleUpdateField = useCallback(
    (fieldId: string, patch: Partial<TemplateField>) => {
      const newFields = fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f));
      saveFields(newFields);
    },
    [fields, saveFields],
  );

  const handleDeleteField = useCallback(
    (fieldId: string) => {
      const newFields = fields
        .filter((f) => f.id !== fieldId)
        .map((f, i) => ({ ...f, sort_order: i }));
      saveFields(newFields);
      if (editingField === fieldId) setEditingField(null);
    },
    [fields, saveFields, editingField],
  );

  const handleMoveField = useCallback(
    (fieldId: string, direction: "up" | "down") => {
      const idx = fields.findIndex((f) => f.id === fieldId);
      if (idx < 0) return;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= fields.length) return;
      const newFields = [...fields];
      [newFields[idx], newFields[targetIdx]] = [newFields[targetIdx], newFields[idx]];
      saveFields(newFields.map((f, i) => ({ ...f, sort_order: i })));
    },
    [fields, saveFields],
  );

  // ── Render ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-_t-purple-400" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
        <AlertCircle className="h-8 w-8" />
        <p>{dt.templateNotFound}</p>
        <button
          onClick={() => router.push("/dashboard/documents/templates")}
          className="text-sm text-purple-400 hover:underline"
        >
          {dt.backToTemplates}
        </button>
      </div>
    );
  }

  const STATUS_OPTIONS: { value: DocTemplateStatus; label: string; color: string }[] = [
    { value: "draft", label: dt.statusDraft, color: "text-slate-400" },
    { value: "active", label: dt.statusActive, color: "text-emerald-400" },
    { value: "archived", label: dt.statusArchived, color: "text-slate-500" },
  ];

  return (
    <div className="flex h-full flex-col" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header bar */}
      <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-2">
        <button
          onClick={() => router.push("/dashboard/documents/templates")}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
          title={dt.backToTemplates}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          className="flex-1 bg-transparent text-base font-medium text-slate-200 placeholder:text-slate-600 focus:outline-none"
          placeholder={dt.untitledTemplate}
        />

        {/* Fields panel toggle */}
        <button
          onClick={() => setShowFieldsPanel(!showFieldsPanel)}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${
            showFieldsPanel
              ? "border-purple-600 text-purple-400"
              : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
          }`}
        >
          {showFieldsPanel ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
          {df.fields} ({fields.length})
        </button>

        {/* Status dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1 text-xs font-medium ${
              status === "active" ? "text-emerald-400" : status === "archived" ? "text-slate-500" : "text-slate-400"
            }`}
          >
            {STATUS_OPTIONS.find((o) => o.value === status)?.label}
            <ChevronDown className="h-3 w-3" />
          </button>
          {showStatusMenu && (
            <div className="absolute end-0 top-8 z-10 w-32 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-lg">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-start text-sm hover:bg-slate-700 ${opt.color}`}
                >
                  {opt.label}
                  {opt.value === status && <CheckCircle2 className="ms-auto h-3 w-3" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSaveVersion}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-400 hover:border-slate-600 hover:text-slate-300"
          title={dt.saveVersion}
        >
          <Save className="h-3.5 w-3.5" />
          v{template.version}
        </button>

        {saveState === "saving" && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-_t-purple-400" />
        )}
        {saveState === "saved" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
        {saveState === "error" && <AlertCircle className="h-4 w-4 text-red-400" />}
      </div>

      {/* Metadata panel */}
      <div className="border-b border-slate-800 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescBlur}
            placeholder={dt.addDescription}
            className="min-w-[200px] flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-slate-400 placeholder:text-slate-600 hover:border-slate-700 focus:border-slate-600 focus:outline-none"
          />
          <div className="flex items-center gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
                <button onClick={() => handleRemoveTag(tag)} className="text-slate-500 hover:text-slate-300">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            <div className="flex items-center">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                placeholder={dt.addTag}
                className="w-20 bg-transparent px-1 text-[11px] text-slate-500 placeholder:text-slate-600 focus:outline-none"
              />
              {tagInput.trim() && (
                <button onClick={handleAddTag} className="text-slate-500 hover:text-slate-300">
                  <_Plus className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main area: Editor + Fields panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor area */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-6">
            {content && (
              <TiptapEditor
                content={content}
                onChange={setContent}
                onSave={handleContentSave}
                editable
                autoFocus
                saveStatus={saveState}
                lastSavedAt={lastSavedAt}
              />
            )}
          </div>
        </div>

        {/* Fields panel */}
        {showFieldsPanel && (
          <div className="w-80 shrink-0 overflow-y-auto border-s border-slate-800 bg-slate-900/50">
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
              <h3 className="text-sm font-medium text-slate-300">{df.formFields}</h3>
              <div className="relative">
                <button
                  onClick={() => setShowAddField(!showAddField)}
                  className="flex items-center gap-1 rounded-lg bg-purple-600/20 px-2 py-1 text-xs text-purple-400 hover:bg-purple-600/30"
                >
                  <Plus className="h-3 w-3" />
                  {df.addField}
                </button>
                {showAddField && (
                  <div className="absolute end-0 top-8 z-10 w-44 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-lg">
                    {(Object.keys(FIELD_TYPE_ICONS) as TemplateFieldType[]).map((type) => {
                      const Icon = FIELD_TYPE_ICONS[type];
                      return (
                        <button
                          key={type}
                          onClick={() => handleAddField(type)}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-start text-sm text-slate-300 hover:bg-slate-700"
                        >
                          <Icon className="h-3.5 w-3.5 text-slate-500" />
                          {FIELD_TYPE_LABELS[type][langKey]}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Field list */}
            <div className="p-2">
              {fields.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-600">
                  {df.noFields}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {fields.map((field, idx) => (
                    <FieldCard
                      key={field.id}
                      field={field}
                      isEditing={editingField === field.id}
                      onEdit={() => setEditingField(editingField === field.id ? null : field.id)}
                      onUpdate={(patch) => handleUpdateField(field.id, patch)}
                      onDelete={() => handleDeleteField(field.id)}
                      onMoveUp={idx > 0 ? () => handleMoveField(field.id, "up") : undefined}
                      onMoveDown={idx < fields.length - 1 ? () => handleMoveField(field.id, "down") : undefined}
                      langKey={langKey}
                      df={df}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Field Card ──────────────────────────────────────────

function FieldCard({
  field,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  langKey,
  df,
}: {
  field: TemplateField;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (patch: Partial<TemplateField>) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  langKey: "he" | "en" | "ru";
  df: Record<string, string>;
}) {
  const Icon = FIELD_TYPE_ICONS[field.type];

  return (
    <div className={`rounded-lg border ${isEditing ? "border-purple-600/50 bg-slate-800/70" : "border-slate-800 bg-slate-900/50"} transition-colors`}>
      {/* Collapsed view */}
      <div
        onClick={onEdit}
        className="flex cursor-pointer items-center gap-2 px-2.5 py-2"
      >
        <GripVertical className="h-3 w-3 shrink-0 text-slate-600" />
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        <span className="flex-1 truncate text-xs text-slate-300">
          {field.label || FIELD_TYPE_LABELS[field.type][langKey]}
        </span>
        {field.required && (
          <span className="text-[9px] text-red-400">*</span>
        )}
        <span className="text-[10px] text-slate-600">{FIELD_TYPE_LABELS[field.type][langKey]}</span>
      </div>

      {/* Expanded edit form */}
      {isEditing && (
        <div className="space-y-2 border-_t border-slate-700/50 px-2.5 py-2.5">
          {/* Label */}
          <div>
            <label className="mb-0.5 block text-[10px] text-slate-500">{df.label}</label>
            <input
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder={FIELD_TYPE_LABELS[field.type][langKey]}
              className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Placeholder */}
          <div>
            <label className="mb-0.5 block text-[10px] text-slate-500">{df.placeholder}</label>
            <input
              value={field.placeholder || ""}
              onChange={(e) => onUpdate({ placeholder: e.target.value || undefined })}
              className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Select options */}
          {field.type === "select" && (
            <div>
              <label className="mb-0.5 block text-[10px] text-slate-500">{df.options}</label>
              {(field.options || []).map((opt, oi) => (
                <div key={oi} className="mb-1 flex items-center gap-1">
                  <input
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...(field.options || [])];
                      newOpts[oi] = e.target.value;
                      onUpdate({ options: newOpts });
                    }}
                    className="flex-1 rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                    placeholder={`${df.option} ${oi + 1}`}
                  />
                  <button
                    onClick={() => {
                      const newOpts = (field.options || []).filter((_, i) => i !== oi);
                      onUpdate({ options: newOpts });
                    }}
                    className="text-slate-600 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => onUpdate({ options: [...(field.options || []), ""] })}
                className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300"
              >
                <Plus className="h-2.5 w-2.5" />
                {df.addOption}
              </button>
            </div>
          )}

          {/* Required toggle */}
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
            />
            {df.required}
          </label>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              {onMoveUp && (
                <button onClick={onMoveUp} className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300">
                  <ChevronUp className="h-3 w-3" />
                </button>
              )}
              {onMoveDown && (
                <button onClick={onMoveDown} className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300">
                  <ChevronDown className="h-3 w-3" />
                </button>
              )}
            </div>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 rounded p-1 text-xs text-slate-500 hover:bg-red-900/30 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
