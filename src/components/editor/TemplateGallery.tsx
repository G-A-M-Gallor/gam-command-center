"use client";

import { useState, useEffect } from "react";
import { X, FileText, Briefcase, Code2, BarChart3, ClipboardList, Users, Rocket, File } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { fetchTemplates, createTemplate, type DocTemplate } from "@/lib/supabase/editorQueries";
import type { JSONContent } from "@tiptap/react";

// ─── Built-in templates ─────────────────────────────────────

const BUILTIN_TEMPLATES: {
  id: string;
  name: string;
  name_he: string;
  icon: string;
  category: string;
  description: string;
  description_he: string;
  content: JSONContent;
}[] = [
  {
    id: "weekly-report",
    name: "Weekly Report",
    name_he: "דוח שבועי",
    icon: "📊",
    category: "management",
    description: "Weekly status report template",
    description_he: "תבנית דוח סטטוס שבועי",
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "דוח שבועי" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "סיכום" }] },
        { type: "paragraph", content: [{ type: "text", text: "[סיכום השבוע]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "הישגים" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "[הישג 1]" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "[הישג 2]" }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "אתגרים" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "[אתגר 1]" }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "תוכנית לשבוע הבא" }] },
        { type: "taskList", content: [
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "[משימה 1]" }] }] },
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "[משימה 2]" }] }] },
        ]},
      ],
    },
  },
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    name_he: "סיכום ישיבה",
    icon: "📝",
    category: "management",
    description: "Meeting notes with action items",
    description_he: "סיכום ישיבה עם פריטי פעולה",
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "סיכום ישיבה" }] },
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "תאריך: " }, { type: "text", text: "[תאריך]" }] },
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "משתתפים: " }, { type: "text", text: "[שמות]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "נושאים" }] },
        { type: "orderedList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "[נושא 1]" }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "החלטות" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "[החלטה 1]" }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "פריטי פעולה" }] },
        { type: "taskList", content: [
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "[פעולה] — [אחראי]" }] }] },
        ]},
      ],
    },
  },
  {
    id: "technical-spec",
    name: "Technical Spec",
    name_he: "מפרט טכני",
    icon: "⚙️",
    category: "development",
    description: "Technical specification document",
    description_he: "מסמך מפרט טכני",
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "מפרט טכני" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "סקירה כללית" }] },
        { type: "paragraph", content: [{ type: "text", text: "[תיאור הפיצ'ר/מערכת]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "ארכיטקטורה" }] },
        { type: "paragraph", content: [{ type: "text", text: "[תיאור ארכיטקטורה]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "API" }] },
        { type: "codeBlock", content: [{ type: "text", text: "// API endpoints" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "מודל נתונים" }] },
        { type: "codeBlock", content: [{ type: "text", text: "// Schema" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "תלויות" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "[תלות 1]" }] }] },
        ]},
      ],
    },
  },
  {
    id: "decision-log",
    name: "Decision Log",
    name_he: "יומן החלטות",
    icon: "📋",
    category: "management",
    description: "Track important decisions",
    description_he: "מעקב אחר החלטות חשובות",
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "יומן החלטות" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "החלטה #1" }] },
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "תאריך: " }, { type: "text", text: "[תאריך]" }] },
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "מחליט: " }, { type: "text", text: "[שם]" }] },
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "הקשר: " }, { type: "text", text: "[רקע]" }] },
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "החלטה: " }, { type: "text", text: "[ההחלטה]" }] },
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "נימוק: " }, { type: "text", text: "[סיבה]" }] },
      ],
    },
  },
  {
    id: "client-proposal",
    name: "Client Proposal",
    name_he: "הצעה ללקוח",
    icon: "💼",
    category: "strategy",
    description: "Client proposal template",
    description_he: "תבנית הצעה ללקוח",
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "הצעת שירותים" }] },
        { type: "paragraph", content: [{ type: "text", text: "לכבוד [שם הלקוח]," }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "רקע" }] },
        { type: "paragraph", content: [{ type: "text", text: "[תיאור הצורך]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "היקף השירותים" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "[שירות 1]" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "[שירות 2]" }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "לוח זמנים" }] },
        { type: "paragraph", content: [{ type: "text", text: "[לוח זמנים]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "תמחור" }] },
        { type: "paragraph", content: [{ type: "text", text: "[פרטי תמחור]" }] },
        { type: "paragraph" },
        { type: "paragraph", content: [{ type: "text", text: "בברכה," }] },
        { type: "paragraph", content: [{ type: "text", text: "צוות G.A.M" }] },
      ],
    },
  },
  {
    id: "release-notes",
    name: "Release Notes",
    name_he: "הערות שחרור",
    icon: "🚀",
    category: "development",
    description: "Release notes template",
    description_he: "תבנית הערות שחרור גרסה",
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "גרסה [X.Y.Z] — הערות שחרור" }] },
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "תאריך: " }, { type: "text", text: "[תאריך]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "✨ חדש" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "[פיצ'ר חדש]" }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "🔧 תיקונים" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "[תיקון]" }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "⚠️ שינויים שוברים" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "אין" }] }] },
        ]},
      ],
    },
  },
  {
    id: "empty",
    name: "Empty Canvas",
    name_he: "דף ריק",
    icon: "📄",
    category: "general",
    description: "Start from scratch",
    description_he: "התחל מאפס",
    content: {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
  },
];

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  management: Briefcase,
  development: Code2,
  strategy: BarChart3,
  general: File,
};

// ─── Component ──────────────────────────────────────────────

interface TemplateGalleryProps {
  open: boolean;
  onClose: () => void;
  onSelect: (content: JSONContent, title: string) => void;
  currentContent?: JSONContent;
  currentTitle?: string;
}

export function TemplateGallery({
  open,
  onClose,
  onSelect,
  currentContent,
  currentTitle,
}: TemplateGalleryProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isHe = language === "he";
  const et = t.editor;

  const [customTemplates, setCustomTemplates] = useState<DocTemplate[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTemplates().then(setCustomTemplates).catch(() => {});
    }
  }, [open]);

  const handleSaveAsTemplate = async () => {
    if (!currentContent || !currentTitle) return;
    setSaving(true);
    const result = await createTemplate({
      name: currentTitle,
      name_he: currentTitle,
      content: currentContent,
      category: "general",
    });
    if (result) {
      setCustomTemplates((prev) => [result, ...prev]);
    }
    setSaving(false);
  };

  if (!open) return null;

  const allTemplates = [
    ...BUILTIN_TEMPLATES.map((t) => ({ ...t, isBuiltin: true })),
    ...customTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      name_he: t.name_he || t.name,
      icon: t.icon,
      category: t.category,
      description: t.description || "",
      description_he: t.description_he || t.description || "",
      content: t.content as JSONContent,
      isBuiltin: false,
    })),
  ];

  const categories = [...new Set(allTemplates.map((t) => t.category))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-800 shadow-2xl"
        dir={isHe ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-800 px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-100">{et.templates}</h2>
          <div className="flex items-center gap-2">
            {currentContent && currentTitle && (
              <button
                onClick={handleSaveAsTemplate}
                disabled={saving}
                className="rounded-lg bg-purple-500/15 px-3 py-1.5 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-500/25 disabled:opacity-40"
              >
                {saving ? "..." : et.saveAsTemplate}
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Template grid by category */}
        <div className="p-5 space-y-6">
          {categories.map((cat) => {
            const catTemplates = allTemplates.filter((t) => t.category === cat);
            const CatIcon = CATEGORY_ICONS[cat] || FileText;
            const catLabel = isHe
              ? { management: "ניהול", development: "פיתוח", strategy: "אסטרטגיה", general: "כללי" }[cat] || cat
              : cat.charAt(0).toUpperCase() + cat.slice(1);

            return (
              <div key={cat}>
                <div className="mb-2 flex items-center gap-1.5">
                  <CatIcon size={13} className="text-slate-500" />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    {catLabel}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {catTemplates.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        onSelect(tmpl.content, isHe ? tmpl.name_he : tmpl.name);
                        onClose();
                      }}
                      className="flex flex-col items-start rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-start transition-colors hover:border-purple-500/40 hover:bg-purple-500/5"
                    >
                      <span className="text-lg">{tmpl.icon}</span>
                      <span className="mt-1 text-sm font-medium text-slate-200">
                        {isHe ? tmpl.name_he : tmpl.name}
                      </span>
                      <span className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
                        {isHe ? tmpl.description_he : tmpl.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
