"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Grid3X3, List, FileText, Copy, Trash2, Upload,
  LayoutTemplate, SortAsc, SortDesc, Link2,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import {
  fetchDocuments,
  createDocument,
  deleteDocument,
  duplicateDocument,
  fetchActiveShareDocIds,
  type DocRecord,
} from "@/lib/supabase/editorQueries";
import { importDocument } from "@/lib/editor/importDocument";
import { TemplateGallery } from "./TemplateGallery";
import { ConfirmDialog } from "@/components/command-center/ConfirmDialog";
import type { JSONContent } from "@tiptap/react";
import { supabase } from "@/lib/supabaseClient";

type ViewMode = "grid" | "list";
type SortBy = "date" | "title";

interface DocumentListViewProps {
  onOpenDoc?: (id: string) => void;
}

export function DocumentListView({ onOpenDoc }: DocumentListViewProps) {
  const router = useRouter();
  const { language } = useSettings();
  const t = getTranslations(language);
  const isRtl = language === "he";
  const et = t.editor;
  const localeMap = { he: "he-IL", en: "en-US", ru: "ru-RU" } as const;

  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [sharedDocIds, setSharedDocIds] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    const data = await fetchDocuments();
    setDocs(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
    loadDocs();
    fetchActiveShareDocIds().then(setSharedDocIds).catch(() => {});
  }, [loadDocs]);

  const openDoc = (id: string) => {
    if (onOpenDoc) {
      onOpenDoc(id);
    } else {
      router.push(`/dashboard/editor?id=${id}`);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    const doc = await createDocument(et.newDocument);
    if (doc) {
      openDoc(doc.id);
    }
    setCreating(false);
  };

  const handleCreateFromTemplate = async (content: JSONContent, title: string) => {
    setCreating(true);
    const doc = await createDocument(title);
    if (doc) {
      // Update content with template content
      await supabase
        .from("vb_records")
        .update({ content })
        .eq("id", doc.id);
      openDoc(doc.id);
    }
    setCreating(false);
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const dup = await duplicateDocument(id);
    if (dup) {
      setDocs((prev) => [dup, ...prev]);
    }
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const ok = await deleteDocument(deleteTarget);
    if (ok) {
      setDocs((prev) => prev.filter((d) => d.id !== deleteTarget));
    }
    setDeleteTarget(null);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importDocument(file);
    if ("error" in result) {
      alert(result.error);
      return;
    }

    setCreating(true);
    const doc = await createDocument(result.title);
    if (doc) {
      await supabase
        .from("vb_records")
        .update({ content: result.content })
        .eq("id", doc.id);
      openDoc(doc.id);
    }
    setCreating(false);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(localeMap[language], {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Filter & sort
  const filtered = docs
    .filter((d) => {
      if (!search) return true;
      return d.title.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === "title") {
        const cmp = a.title.localeCompare(b.title);
        return sortAsc ? cmp : -cmp;
      }
      const cmp = new Date(a.last_edited_at).getTime() - new Date(b.last_edited_at).getTime();
      return sortAsc ? cmp : -cmp;
    });

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="mx-auto max-w-4xl px-6 py-8" data-cc-id="editor.doclist.root">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">📄 {et.documents}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {filtered.length} {et.documentsCount}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700"
          >
            <LayoutTemplate size={14} />
            {et.templates}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700"
          >
            <Upload size={14} />
            {et.import}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,.md,.txt,.json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            <Plus size={14} />
            {creating ? "..." : et.newDocument}
          </button>
        </div>
      </div>

      {/* Toolbar: search, view toggle, sort */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            data-cc-id="editor.doclist.search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={et.searchDocuments}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 ps-9 pe-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500"
          />
        </div>
        <button
          onClick={() => {
            if (sortBy === "date") setSortAsc(!sortAsc);
            else { setSortBy("date"); setSortAsc(false); }
          }}
          className={`rounded-md px-2 py-1.5 text-xs ${sortBy === "date" ? "bg-slate-700 text-slate-200" : "text-slate-500 hover:bg-slate-700"}`}
        >
          {sortAsc ? <SortAsc size={14} /> : <SortDesc size={14} />}
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`rounded-md p-1.5 ${viewMode === "list" ? "bg-slate-700 text-slate-200" : "text-slate-500 hover:bg-slate-700"}`}
        >
          <List size={14} />
        </button>
        <button
          onClick={() => setViewMode("grid")}
          className={`rounded-md p-1.5 ${viewMode === "grid" ? "bg-slate-700 text-slate-200" : "text-slate-500 hover:bg-slate-700"}`}
        >
          <Grid3X3 size={14} />
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <p className="py-8 text-center text-sm text-slate-500">
          {"⏳ "}{et.loadingDocuments}
        </p>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-700 py-12 text-center">
          <div className="text-2xl mb-2">📝</div>
          <p className="text-sm text-slate-500">
            {search
              ? t.common.noResults
              : et.noDocumentsYet}
          </p>
        </div>
      )}

      {/* List view */}
      {!loading && viewMode === "list" && filtered.length > 0 && (
        <div className="space-y-1.5">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              onClick={() => openDoc(doc.id)}
              className="group flex cursor-pointer items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3 transition-colors hover:border-indigo-500/30 hover:bg-indigo-500/5"
            >
              <FileText size={16} className="shrink-0 text-slate-500" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-200">
                  {doc.title || et.untitled}
                  {sharedDocIds.has(doc.id) && <Link2 size={11} className="shrink-0 text-purple-400" />}
                </div>
                <div className="text-[11px] text-slate-500">
                  {formatDate(doc.last_edited_at)}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => handleDuplicate(doc.id, e)}
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                  title={et.duplicate}
                >
                  <Copy size={13} />
                </button>
                <button
                  onClick={(e) => handleDeleteClick(doc.id, e)}
                  className="rounded p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                  title={et.delete}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid view */}
      {!loading && viewMode === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              onClick={() => openDoc(doc.id)}
              className="group cursor-pointer rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 transition-colors hover:border-indigo-500/30 hover:bg-indigo-500/5"
            >
              <div className="flex items-center justify-between mb-2">
                <FileText size={20} className="text-slate-500" />
                {sharedDocIds.has(doc.id) && <Link2 size={12} className="text-purple-400" />}
              </div>
              <div className="truncate text-sm font-medium text-slate-200">
                {doc.title || et.untitled}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {formatDate(doc.last_edited_at)}
              </div>
              <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => handleDuplicate(doc.id, e)}
                  className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={(e) => handleDeleteClick(doc.id, e)}
                  className="rounded p-1 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template gallery modal */}
      <TemplateGallery
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={handleCreateFromTemplate}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title={et.confirmDeleteDoc}
        message={et.confirmDeleteDocMessage}
        confirmLabel={et.delete}
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
