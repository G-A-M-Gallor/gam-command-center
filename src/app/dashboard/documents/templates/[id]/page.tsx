"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { JSONContent } from "@tiptap/react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
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
  X,
  Plus,
  ChevronDown,
} from "lucide-react";

const TiptapEditor = dynamic(
  () => import("@/components/editor/TiptapEditor"),
  { ssr: false },
);

type SaveState = "idle" | "saving" | "saved" | "error";

export default function DocumentTemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { language } = useSettings();
  const t = getTranslations(language);
  const dt = t.docTemplates;
  const isRtl = language === "he";

  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<DocTemplateStatus>("draft");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [content, setContent] = useState<JSONContent | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | undefined>();
  const [showStatusMenu, setShowStatusMenu] = useState(false);

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
      setLoading(false);
    }
    load();
  }, [id]);

  // ── Save content (debounced via TiptapEditor) ─────────
  const handleContentSave = useCallback(
    async (json: JSONContent) => {
      setSaveState("saving");
      const ok = await updateDocTemplate(id, { content: json as Record<string, unknown> });
      if (ok) {
        setSaveState("saved");
        setLastSavedAt(new Date());
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => setSaveState("idle"), 2000);
      } else {
        setSaveState("error");
      }
    },
    [id],
  );

  // ── Save metadata ─────────────────────────────────────
  const saveMetadata = useCallback(
    async (patch: Partial<DocumentTemplate>) => {
      setSaveState("saving");
      const ok = await updateDocTemplate(id, patch);
      if (ok) {
        setSaveState("saved");
        setLastSavedAt(new Date());
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => setSaveState("idle"), 2000);
      } else {
        setSaveState("error");
      }
    },
    [id],
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
      const newTags = tags.filter((t) => t !== tag);
      setTags(newTags);
      saveMetadata({ tags: newTags });
    },
    [tags, saveMetadata],
  );

  // ── Save version snapshot ─────────────────────────────
  const handleSaveVersion = useCallback(async () => {
    if (!content || !template) return;
    await createTemplateVersion({
      template_id: id,
      version: template.version + 1,
      content: content as Record<string, unknown>,
      fields: template.fields as Record<string, unknown>[],
      change_note: null,
      created_by: null,
    });
    // Increment version on template
    await updateDocTemplate(id, { version: template.version + 1 });
    setTemplate((prev) => prev ? { ...prev, version: prev.version + 1 } : prev);
  }, [content, template, id]);

  // ── Render ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-purple-400" />
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

        {/* Name input */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          className="flex-1 bg-transparent text-base font-medium text-slate-200 placeholder:text-slate-600 focus:outline-none"
          placeholder={dt.untitledTemplate}
        />

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

        {/* Save version button */}
        <button
          onClick={handleSaveVersion}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-400 hover:border-slate-600 hover:text-slate-300"
          title={dt.saveVersion}
        >
          <Save className="h-3.5 w-3.5" />
          v{template.version}
        </button>

        {/* Save indicator */}
        {saveState === "saving" && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-purple-400" />
        )}
        {saveState === "saved" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
        {saveState === "error" && <AlertCircle className="h-4 w-4 text-red-400" />}
      </div>

      {/* Metadata panel */}
      <div className="border-b border-slate-800 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Description */}
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescBlur}
            placeholder={dt.addDescription}
            className="min-w-[200px] flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-slate-400 placeholder:text-slate-600 hover:border-slate-700 focus:border-slate-600 focus:outline-none"
          />

          {/* Tags */}
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
                  <Plus className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
