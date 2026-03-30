"use client";

import { useState } from "react";
import { Download, FileText, FileType, FileCode, Copy, ChevronDown } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { _getTranslations } from "@/lib/i18n";
import {
  exportToHTML,
  exportToMarkdown,
  exportToPDF,
  exportToDOCX,
  triggerDownload,
} from "@/lib/editor/exportDocument";
import type { JSONContent } from "@tiptap/react";

interface ExportMenuProps {
  content: JSONContent;
  title: string;
}

export function ExportMenu({ content, title }: ExportMenuProps) {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const et = t.editor;
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: string) => {
    setExporting(format);
    try {
      switch (format) {
        case "pdf":
          exportToPDF(content, title);
          break;
        case "docx":
          await exportToDOCX(content, title);
          break;
        case "html": {
          const html = exportToHTML(content, title);
          triggerDownload(
            new Blob([html], { type: "text/html;charset=utf-8" }),
            `${title}.html`
          );
          break;
        }
        case "md": {
          const md = exportToMarkdown(content, title);
          triggerDownload(
            new Blob([md], { type: "text/markdown;charset=utf-8" }),
            `${title}.md`
          );
          break;
        }
        case "copy-md": {
          const markdown = exportToMarkdown(content, title);
          await navigator.clipboard.writeText(markdown);
          break;
        }
      }
    } catch (err) {
      console.error("[ExportMenu] Export failed:", err);
    }
    setExporting(null);
    setOpen(false);
  };

  const items = [
    { id: "pdf", label: "PDF", icon: FileText },
    { id: "docx", label: "DOCX", icon: FileType },
    { id: "html", label: "HTML", icon: FileCode },
    { id: "md", label: "Markdown", icon: FileCode },
    { id: "copy-md", label: et.copyAsMarkdown, icon: Copy },
  ];

  return (
    <div className="relative" data-cc-id="editor.export-menu">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200"
        title={et.export}
      >
        <Download className="h-3.5 w-3.5" />
        <span>{et.export}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute start-0 top-full z-50 mt-1 w-44 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleExport(item.id)}
                  disabled={exporting !== null}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                >
                  <Icon className="h-3.5 w-3.5 text-slate-500" />
                  {exporting === item.id ? "..." : item.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
