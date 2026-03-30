"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import type { JSONContent } from "@tiptap/react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import {
  Plus,
  Search,
  Mail,
  Copy,
  Trash2,
  MoreVertical,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  X,
  Tag,
  Braces,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const TiptapEditor = dynamic(
  () => import("@/components/editor/TiptapEditor"),
  { ssr: false },
);

// ── Types ────────────────────────────────────────────────

interface EmailTemplate {
  id: string;
  tenant_id: string | null;
  name: string;
  subject: string;
  category: "system" | "transactional" | "marketing";
  engine: "react" | "unlayer";
  react_component: string | null;
  unlayer_json: Record<string, unknown> | null;
  html_compiled: string | null;
  variables: string[];
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";
type ViewMode = "list" | "editor" | "preview";

const CATEGORY_COLORS: Record<string, string> = {
  system: "bg-blue-900/50 text-blue-400",
  transactional: "bg-emerald-900/50 text-emerald-400",
  marketing: "bg-purple-900/50 text-purple-400",
};

const MERGE_VARIABLES = [
  { key: "name", label: { he: "שם", en: "Name", ru: "Имя" } },
  { key: "company", label: { he: "חברה", en: "Company", ru: "Компания" } },
  { key: "email", label: { he: "אימייל", en: "Email", ru: "Email" } },
  { key: "date", label: { he: "תאריך", en: "Date", ru: "Дата" } },
  { key: "link", label: { he: "קישור", en: "Link", ru: "Ссылка" } },
  { key: "phone", label: { he: "טלפון", en: "Phone", ru: "Телефон" } },
  { key: "amount", label: { he: "סכום", en: "Amount", ru: "Сумма" } },
  { key: "project", label: { he: "פרויקט", en: "Project", ru: "Проект" } },
];

// ── API Helpers ──────────────────────────────────────────

async function fetchTemplates(category?: string): Promise<EmailTemplate[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  const res = await fetch(`/api/email/templates?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.templates || [];
}

async function createTemplate(payload: Record<string, unknown>): Promise<EmailTemplate | null> {
  const res = await fetch("/api/email/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.template;
}

async function updateTemplate(id: string, payload: Record<string, unknown>): Promise<EmailTemplate | null> {
  const res = await fetch("/api/email/templates", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...payload }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.template;
}

async function deleteTemplate(id: string): Promise<boolean> {
  const res = await fetch(`/api/email/templates?id=${id}`, { method: "DELETE" });
  return res.ok;
}

// ── Helpers ──────────────────────────────────────────────

function jsonToHtml(json: JSONContent): string {
  if (!json || !json.content) return "";
  return renderNodes(json.content);
}

function renderNodes(nodes: JSONContent[]): string {
  return nodes.map((node) => {
    const children = node.content ? renderNodes(node.content) : "";
    const text = node.text || "";
    const marks = node.marks || [];

    if (node.type === "text") {
      let result = text;
      for (const mark of marks) {
        switch (mark.type) {
          case "bold": result = `<strong>${result}</strong>`; break;
          case "italic": result = `<em>${result}</em>`; break;
          case "underline": result = `<u>${result}</u>`; break;
          case "link": result = `<a href="${mark.attrs?.href || "#"}" style="color:#7c3aed">${result}</a>`; break;
          case "textStyle":
            if (mark.attrs?.color) result = `<span style="color:${mark.attrs.color}">${result}</span>`;
            break;
        }
      }
      return result;
    }

    switch (node.type) {
      case "paragraph": return `<p style="margin:0 0 12px;line-height:1.6">${children || "&nbsp;"}</p>`;
      case "heading": {
        const level = node.attrs?.level || 1;
        const sizes: Record<number, string> = { 1: "24px", 2: "20px", 3: "16px" };
        return `<h${level} style="margin:0 0 12px;font-size:${sizes[level] || "16px"};font-weight:600">${children}</h${level}>`;
      }
      case "bulletList": return `<ul style="margin:0 0 12px;padding-right:20px">${children}</ul>`;
      case "orderedList": return `<ol style="margin:0 0 12px;padding-right:20px">${children}</ol>`;
      case "listItem": return `<li style="margin:0 0 4px">${children}</li>`;
      case "blockquote": return `<blockquote style="border-right:3px solid #7c3aed;padding:8px 16px;margin:0 0 12px;color:#64748b">${children}</blockquote>`;
      case "horizontalRule": return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>`;
      case "hardBreak": return "<br/>";
      default: return children;
    }
  }).join("");
}

function replaceVariables(html: string, preview: boolean): string {
  return html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (preview) {
      const samples: Record<string, string> = {
        name: "ישראל ישראלי",
        company: "חברת GAM",
        email: "israel@example.com",
        date: new Date().toLocaleDateString("he-IL"),
        link: "https://example.com",
        phone: "050-1234567",
        amount: "₪15,000",
        project: "פרויקט מגורים",
      };
      return `<span style="background:#7c3aed20;color:#7c3aed;padding:1px 4px;border-radius:3px">${samples[key] || match}</span>`;
    }
    return `<span style="background:#7c3aed20;color:#7c3aed;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:12px">${match}</span>`;
  });
}

// ── Main Component ───────────────────────────────────────

export default function EmailTemplateDesignerPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const ed = t.emailDesigner;
  const isRtl = language === "he";
  const langKey = language as "he" | "en" | "ru";

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showList, setShowList] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("editor");

  // Editor state
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<"system" | "transactional" | "marketing">("transactional");
  const [editorContent, setEditorContent] = useState<JSONContent | null>(null);
  const [variables, setVariables] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | undefined>();
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showVariableMenu, setShowVariableMenu] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const nameRef = useRef("");
  const subjectRef = useRef("");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId) || null,
    [templates, selectedId],
  );

  // ── Load templates ─────────────────────────────────────

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    const data = await fetchTemplates(filterCategory === "all" ? undefined : filterCategory);
    setTemplates(data);
    setLoading(false);
  }, [filterCategory]);
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Select template ────────────────────────────────────

  const selectTemplate = useCallback((tpl: EmailTemplate) => {
    setSelectedId(tpl.id);
    setName(tpl.name);
    nameRef.current = tpl.name;
    setSubject(tpl.subject);
    subjectRef.current = tpl.subject;
    setCategory(tpl.category);
    setVariables(tpl.variables || []);
    setViewMode("editor");
    setSaveState("idle");

    if (tpl.html_compiled) {
      setEditorContent({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
      });
    } else {
      setEditorContent({
        type: "doc",
        content: [{ type: "paragraph" }],
      });
    }
  }, []);

  // ── Save helpers ───────────────────────────────────────

  const markSaved = useCallback(() => {
    setSaveState("saved");
    setLastSavedAt(new Date());
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setSaveState("idle"), 2000);
  }, []);

  const saveField = useCallback(
    async (field: string, value: unknown) => {
      if (!selectedId) return;
      setSaveState("saving");
      const result = await updateTemplate(selectedId, { [field]: value });
      if (result) {
        setTemplates((prev) => prev.map((t) => (t.id === result.id ? result : t)));
        markSaved();
      } else {
        setSaveState("error");
      }
    },
    [selectedId, markSaved],
  );

  const handleContentSave = useCallback(
    async (json: JSONContent) => {
      if (!selectedId) return;
      const html = jsonToHtml(json);
      setSaveState("saving");
      const result = await updateTemplate(selectedId, { html_compiled: html });
      if (result) {
        setTemplates((prev) => prev.map((t) => (t.id === result.id ? result : t)));
        markSaved();
      } else {
        setSaveState("error");
      }
    },
    [selectedId, markSaved],
  );

  const handleNameBlur = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== nameRef.current) {
      nameRef.current = trimmed;
      saveField("name", trimmed);
    }
  }, [name, saveField]);

  const handleSubjectBlur = useCallback(() => {
    const trimmed = subject.trim();
    if (trimmed && trimmed !== subjectRef.current) {
      subjectRef.current = trimmed;
      saveField("subject", trimmed);
    }
  }, [subject, saveField]);

  const handleCategoryChange = useCallback(
    (cat: "system" | "transactional" | "marketing") => {
      setCategory(cat);
      setShowCategoryMenu(false);
      saveField("category", cat);
    },
    [saveField],
  );

  // ── CRUD ───────────────────────────────────────────────

  const handleCreate = useCallback(async () => {
    const tpl = await createTemplate({
      name: ed.untitledTemplate,
      subject: ed.defaultSubject,
      category: "transactional",
      engine: "react",
      variables: [],
      html_compiled: "",
    });
    if (tpl) {
      setTemplates((prev) => [tpl, ...prev]);
      selectTemplate(tpl);
    }
  }, [ed.untitledTemplate, ed.defaultSubject, selectTemplate]);

  const handleDuplicate = useCallback(
    async (tpl: EmailTemplate) => {
      const dup = await createTemplate({
        name: `${tpl.name} (${ed.copy})`,
        subject: tpl.subject,
        category: tpl.category,
        engine: tpl.engine,
        variables: tpl.variables,
        html_compiled: tpl.html_compiled,
        tenant_id: tpl.tenant_id,
      });
      if (dup) {
        setTemplates((prev) => [dup, ...prev]);
        selectTemplate(dup);
      }
    },
    [ed.copy, selectTemplate],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const ok = await deleteTemplate(id);
      if (ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        if (selectedId === id) {
          setSelectedId(null);
          setEditorContent(null);
        }
      }
    },
    [selectedId],
  );

  // ── Variable insertion ─────────────────────────────────

  const insertVariable = useCallback(
    (varKey: string, target: "subject" | "body") => {
      const token = `{{${varKey}}}`;
      if (target === "subject") {
        const input = subjectInputRef.current;
        if (input) {
          const start = input.selectionStart || subject.length;
          const end = input.selectionEnd || subject.length;
          const newSubject = subject.slice(0, start) + token + subject.slice(end);
          setSubject(newSubject);
          subjectRef.current = newSubject;
          saveField("subject", newSubject);
          setTimeout(() => {
            input.focus();
            input.setSelectionRange(start + token.length, start + token.length);
          }, 0);
        }
      }
      if (!variables.includes(varKey)) {
        const newVars = [...variables, varKey];
        setVariables(newVars);
        saveField("variables", newVars);
      }
      setShowVariableMenu(false);
    },
    [subject, variables, saveField],
  );

  // ── Filtered list ──────────────────────────────────────

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.category.includes(q),
    );
  }, [templates, search]);

  // ── Preview HTML ───────────────────────────────────────

  const previewHtml = useMemo(() => {
    if (!selected) return "";
    const bodyHtml = selected.html_compiled || "";
    const subjectLine = replaceVariables(subject, true);
    return `
      <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden">
        <div style="background:#7c3aed;padding:24px 32px">
          <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:600">vBrain.io</h1>
        </div>
        <div style="padding:32px;direction:rtl;text-align:right">
          <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #e2e8f0">
            <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">${ed.subject}</div>
            <div style="font-size:16px;font-weight:600;color:#1e293b">${subjectLine}</div>
          </div>
          ${replaceVariables(bodyHtml, true)}
        </div>
        <div style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="margin:0;font-size:11px;color:#94a3b8">G.A.M &copy; ${new Date().getFullYear()}</p>
        </div>
      </div>
    `;
  }, [selected, subject, ed.subject]);

  // ── Category options ───────────────────────────────────

  const CATEGORIES: { value: "system" | "transactional" | "marketing"; label: string; color: string }[] = [
    { value: "system", label: ed.catSystem, color: "text-blue-400" },
    { value: "transactional", label: ed.catTransactional, color: "text-emerald-400" },
    { value: "marketing", label: ed.catMarketing, color: "text-purple-400" },
  ];

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader pageKey="emailTemplates">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ed.searchTemplates}
              className="h-8 rounded-lg border border-slate-700 bg-slate-800/50 pe-3 ps-9 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-8 rounded-lg border border-slate-700 bg-slate-800/50 px-2 text-sm text-slate-300 focus:border-purple-500 focus:outline-none"
          >
            <option value="all">{ed.allCategories}</option>
            <option value="system">{ed.catSystem}</option>
            <option value="transactional">{ed.catTransactional}</option>
            <option value="marketing">{ed.catMarketing}</option>
          </select>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-500"
          >
            <Plus className="h-4 w-4" />
            {ed.newTemplate}
          </button>
        </div>
      </PageHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Template List Panel ─────────────────────────── */}
        {showList && (
          <div className="w-72 shrink-0 overflow-y-auto border-e border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
              <span className="text-xs font-medium text-slate-400">
                {ed.templates} ({filtered.length})
              </span>
              <button
                onClick={() => setShowList(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-purple-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Mail className="mb-2 h-8 w-8 text-slate-600" />
                <p className="text-xs">{ed.noTemplates}</p>
              </div>
            ) : (
              <div className="space-y-0.5 p-1.5">
                {filtered.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => selectTemplate(tpl)}
                    className={`group relative cursor-pointer rounded-lg p-2.5 transition-colors ${
                      selectedId === tpl.id
                        ? "bg-purple-600/10 border border-purple-600/30"
                        : "hover:bg-white/[0.04] border border-transparent"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${CATEGORY_COLORS[tpl.category]}`}>
                        {CATEGORIES.find((c) => c.value === tpl.category)?.label || tpl.category}
                      </span>
                      <span className="ms-auto text-[10px] text-slate-600">v{tpl.version}</span>
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === tpl.id ? null : tpl.id); }}
                          className="rounded p-0.5 text-slate-500 opacity-0 transition-opacity hover:bg-slate-700 hover:text-slate-300 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                        {showMenu === tpl.id && (
                          <div
                            className="absolute end-0 top-6 z-10 w-36 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-lg"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => { handleDuplicate(tpl); setShowMenu(null); }}
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-start text-xs text-slate-300 hover:bg-slate-700"
                            >
                              <Copy className="h-3 w-3" />
                              {ed.duplicate}
                            </button>
                            <button
                              onClick={() => { handleDelete(tpl.id); setShowMenu(null); }}
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-start text-xs text-slate-400 hover:bg-slate-700 hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                              {ed.delete}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <h4 className="mb-0.5 truncate text-xs font-medium text-slate-200">{tpl.name}</h4>
                    <p className="truncate text-[10px] text-slate-500">{tpl.subject}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-600">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(tpl.updated_at).toLocaleDateString()}
                      </span>
                      {tpl.variables.length > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Braces className="h-2.5 w-2.5" />
                          {tpl.variables.length}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Editor Panel ────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-500">
              {!showList && (
                <button
                  onClick={() => setShowList(true)}
                  className="absolute start-4 top-16 rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              )}
              <Mail className="h-12 w-12 text-slate-600" />
              <p className="text-sm">{ed.selectOrCreate}</p>
              <button
                onClick={handleCreate}
                className="flex items-center gap-1.5 rounded-lg bg-purple-600/20 px-3 py-1.5 text-sm text-purple-400 hover:bg-purple-600/30"
              >
                <Plus className="h-4 w-4" />
                {ed.newTemplate}
              </button>
            </div>
          ) : (
            <>
              {/* Editor toolbar */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2">
                {!showList && (
                  <button
                    onClick={() => setShowList(true)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                  >
                    <PanelLeftOpen className="h-4 w-4" />
                  </button>
                )}

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleNameBlur}
                  className="flex-1 bg-transparent text-sm font-medium text-slate-200 placeholder:text-slate-600 focus:outline-none"
                  placeholder={ed.untitledTemplate}
                />

                {/* Category */}
                <div className="relative">
                  <button
                    onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                    className={`flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-[11px] font-medium ${
                      category === "marketing" ? "text-purple-400" : category === "system" ? "text-blue-400" : "text-emerald-400"
                    }`}
                  >
                    <Tag className="h-3 w-3" />
                    {CATEGORIES.find((c) => c.value === category)?.label}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {showCategoryMenu && (
                    <div className="absolute end-0 top-8 z-10 w-36 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-lg">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => handleCategoryChange(cat.value)}
                          className={`flex w-full items-center gap-2 px-3 py-1.5 text-start text-xs hover:bg-slate-700 ${cat.color}`}
                        >
                          {cat.label}
                          {cat.value === category && <CheckCircle2 className="ms-auto h-3 w-3" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* View toggle */}
                <div className="flex rounded-lg border border-slate-700">
                  <button
                    onClick={() => setViewMode("editor")}
                    className={`rounded-s-lg px-2 py-1 text-[11px] ${viewMode === "editor" ? "bg-slate-700 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    {ed.edit}
                  </button>
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`rounded-e-lg px-2 py-1 text-[11px] ${viewMode === "preview" ? "bg-slate-700 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    {ed.preview}
                  </button>
                </div>

                {/* Save indicator */}
                {saveState === "saving" && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-purple-400" />
                )}
                {saveState === "saved" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                {saveState === "error" && <AlertCircle className="h-4 w-4 text-red-400" />}
              </div>

              {/* Subject line */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2">
                <span className="text-[11px] text-slate-500">{ed.subject}:</span>
                <input
                  ref={subjectInputRef}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onBlur={handleSubjectBlur}
                  className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
                  placeholder={ed.subjectPlaceholder}
                />
                <div className="relative">
                  <button
                    onClick={() => setShowVariableMenu(!showVariableMenu)}
                    className="flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-400 hover:border-purple-600 hover:text-purple-400"
                  >
                    <Braces className="h-3 w-3" />
                    {ed.insertVariable}
                  </button>
                  {showVariableMenu && (
                    <div className="absolute end-0 top-8 z-20 w-52 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-lg">
                      <div className="px-3 py-1 text-[10px] font-medium text-slate-500">{ed.mergeVariables}</div>
                      {MERGE_VARIABLES.map((v) => (
                        <div key={v.key} className="flex items-center gap-1 px-3 py-1">
                          <button
                            onClick={() => insertVariable(v.key, "subject")}
                            className="flex-1 rounded px-2 py-1 text-start text-xs text-slate-300 hover:bg-slate-700"
                          >
                            <span className="me-2 rounded bg-purple-900/50 px-1.5 py-0.5 font-mono text-[10px] text-purple-400">{`{{${v.key}}}`}</span>
                            {v.label[langKey]}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Variables bar */}
              {variables.length > 0 && (
                <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-1.5">
                  <Braces className="h-3 w-3 text-slate-500" />
                  <span className="text-[10px] text-slate-500">{ed.variables}:</span>
                  {variables.map((v) => (
                    <span
                      key={v}
                      className="flex items-center gap-1 rounded-full bg-purple-900/30 px-2 py-0.5 font-mono text-[10px] text-purple-400"
                    >
                      {`{{${v}}}`}
                      <button
                        onClick={() => {
                          const newVars = variables.filter((x) => x !== v);
                          setVariables(newVars);
                          saveField("variables", newVars);
                        }}
                        className="text-purple-600 hover:text-purple-300"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Editor / Preview area */}
              <div className="flex-1 overflow-y-auto">
                {viewMode === "editor" ? (
                  <div className="mx-auto max-w-3xl px-4 py-6">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
                      <div className="rounded-lg bg-white p-8" style={{ minHeight: 400 }}>
                        <div className="prose-email" data-theme="light">
                          {editorContent && (
                            <TiptapEditor
                              content={editorContent}
                              onChange={setEditorContent}
                              onSave={handleContentSave}
                              editable
                              autoFocus
                              saveStatus={saveState}
                              lastSavedAt={lastSavedAt}
                              className="email-editor-light"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto bg-slate-950 p-6">
                    <div className="mx-auto max-w-[640px]">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs text-slate-500">{ed.previewMode}</span>
                        <span className="text-xs text-slate-600">{ed.previewHint}</span>
                      </div>
                      <div
                        className="rounded-xl border border-white/[0.06] bg-white shadow-2xl"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
