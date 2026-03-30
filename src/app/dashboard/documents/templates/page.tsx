"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import {
  fetchDocTemplates,
  createDocTemplate,
  updateDocTemplate,
  createSubmissionFromTemplate,
} from "@/lib/supabase/documentQueries";
import type { DocumentTemplate, DocTemplateStatus } from "@/lib/supabase/schema";
import {
  _Plus,
  Search,
  FileText,
  Archive,
  PenLine,
  Copy,
  MoreVertical,
  Tag,
  _Clock,
  ArrowLeft,
  Send,
  ListChecks,
} from "lucide-react";

// ── Status badge colors ─────────────────────────────────────
const STATUS_COLORS: Record<DocTemplateStatus, string> = {
  draft: "bg-slate-700 text-slate-300",
  active: "bg-emerald-900/50 text-emerald-400",
  archived: "bg-slate-800 text-slate-500",
};

export default function DocumentTemplatesPage() {
  const _router = useRouter();
  const { language } = useSettings();
  const _t = getTranslations(language);
  const dt = t.docTemplates;
  const isRtl = language === "he";

  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<DocTemplateStatus | "all">("all");
  const [creating, setCreating] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    const data = await fetchDocTemplates(filterStatus === "all" ? undefined : filterStatus);
    setTemplates(data);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (tpl) =>
        tpl.name.toLowerCase().includes(q) ||
        tpl.description?.toLowerCase().includes(q) ||
        tpl.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [templates, search]);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    const tpl = await createDocTemplate({
      workspace_id: "default",
      name: dt.untitledTemplate,
      description: null,
      layout_id: null,
      content: { type: "doc", content: [{ type: "paragraph" }] },
      fields: [],
      tags: [],
      status: "draft",
      checklist: [],
      created_by: null,
    });
    setCreating(false);
    if (tpl) {
      router.push(`/dashboard/documents/templates/${tpl.id}`);
    }
  }, [dt.untitledTemplate, router]);

  const handleDuplicate = useCallback(
    async (tpl: DocumentTemplate) => {
      const dup = await createDocTemplate({
        workspace_id: tpl.workspace_id,
        name: `${tpl.name} (${dt.copy})`,
        description: tpl.description,
        layout_id: tpl.layout_id,
        content: tpl.content,
        fields: tpl.fields,
        tags: tpl.tags,
        status: "draft",
        checklist: tpl.checklist,
        created_by: null,
      });
      if (dup) loadTemplates();
    },
    [dt.copy, loadTemplates],
  );

  const handleArchive = useCallback(
    async (id: string) => {
      await updateDocTemplate(id, { status: "archived" });
      loadTemplates();
    },
    [loadTemplates],
  );

  const handleUseTemplate = useCallback(
    async (tpl: DocumentTemplate) => {
      const sub = await createSubmissionFromTemplate(tpl);
      if (sub) {
        router.push(`/dashboard/documents/${sub.id}`);
      }
    },
    [router],
  );

  return (
    <div className="flex h-full flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader pageKey="documents">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/dashboard/documents")}
            className="flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-sm text-slate-400 hover:border-slate-600 hover:text-slate-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {dt.backToPipeline}
          </button>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={dt.searchTemplates}
              className="h-8 rounded-lg border border-slate-700 bg-slate-800/50 pe-3 ps-9 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as DocTemplateStatus | "all")}
            className="h-8 rounded-lg border border-slate-700 bg-slate-800/50 px-2 text-sm text-slate-300 focus:border-purple-500 focus:outline-none"
          >
            <option value="all">{dt.allStatuses}</option>
            <option value="draft">{dt.statusDraft}</option>
            <option value="active">{dt.statusActive}</option>
            <option value="archived">{dt.statusArchived}</option>
          </select>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {dt.newTemplate}
          </button>
        </div>
      </PageHeader>

      {/* Template Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-_t-purple-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <FileText className="mb-3 h-10 w-10 text-slate-600" />
            <p className="text-sm">{dt.noTemplates}</p>
            <button
              onClick={handleCreate}
              className="mt-3 flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700"
            >
              <_Plus className="h-4 w-4" />
              {dt.createFirst}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                dt={dt}
                onOpen={() => router.push(`/dashboard/documents/templates/${tpl.id}`)}
                onDuplicate={() => handleDuplicate(tpl)}
                onArchive={() => handleArchive(tpl.id)}
                onUse={() => handleUseTemplate(tpl)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="border-t border-slate-800 px-4 py-2">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>{dt.total}: {templates.length}</span>
          <span className="text-emerald-500">
            {dt.statusActive}: {templates.filter((_t) => t.status === "active").length}
          </span>
          <span className="text-slate-400">
            {dt.statusDraft}: {templates.filter((_t) => t.status === "draft").length}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Template Card ───────────────────────────────────────────

function TemplateCard({
  template: tpl,
  dt,
  onOpen,
  onDuplicate,
  onArchive,
  onUse,
}: {
  template: DocumentTemplate;
  dt: Record<string, string>;
  onOpen: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onUse: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      onClick={onOpen}
      className="group relative cursor-pointer rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-slate-700 hover:bg-slate-800/50"
    >
      {/* Status badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[tpl.status]}`}>
          {dt[`status${tpl.status.charAt(0).toUpperCase() + tpl.status.slice(1)}` as keyof typeof dt] || tpl.status}
        </span>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="rounded p-1 text-slate-500 opacity-0 transition-opacity hover:bg-slate-700 hover:text-slate-300 group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {showMenu && (
            <div
              className="absolute end-0 top-8 z-10 w-40 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {tpl.status === "active" && (
                <button
                  onClick={() => { onUse(); setShowMenu(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-start text-sm text-purple-400 hover:bg-slate-700"
                >
                  <Send className="h-3.5 w-3.5" />
                  {dt.useTemplate}
                </button>
              )}
              <button
                onClick={() => { onDuplicate(); setShowMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-start text-sm text-slate-300 hover:bg-slate-700"
              >
                <Copy className="h-3.5 w-3.5" />
                {dt.duplicate}
              </button>
              {tpl.status !== "archived" && (
                <button
                  onClick={() => { onArchive(); setShowMenu(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-start text-sm text-slate-400 hover:bg-slate-700 hover:text-red-400"
                >
                  <Archive className="h-3.5 w-3.5" />
                  {dt.archive}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="mb-1 text-sm font-medium text-slate-200">{tpl.name}</h3>
      {tpl.description && (
        <p className="mb-3 line-clamp-2 text-xs text-slate-500">{tpl.description}</p>
      )}

      {/* Tags */}
      {tpl.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {tpl.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="flex items-center gap-0.5 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
          {tpl.tags.length > 3 && (
            <span className="text-[10px] text-slate-500">+{tpl.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(tpl.updated_at).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-2">
          {Array.isArray(tpl.fields) && tpl.fields.length > 0 && (
            <span className="flex items-center gap-0.5">
              <ListChecks className="h-3 w-3" />
              {tpl.fields.length}
            </span>
          )}
          <span className="flex items-center gap-1">
            <PenLine className="h-3 w-3" />
            v{tpl.version}
          </span>
        </div>
      </div>
    </div>
  );
}
