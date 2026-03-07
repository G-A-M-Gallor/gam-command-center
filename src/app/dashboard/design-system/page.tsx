"use client";

import { useState, useCallback, useMemo } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import { DESIGNS, type DesignEntry } from "@/app/designs/registry";
import {
  componentRegistry,
  CATEGORY_COLORS,
  type ComponentEntry,
  type ComponentCategory,
} from "./componentRegistry";
import {
  Eye,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  X,
  Tag,
  Calendar,
  FolderOpen,
  Code2,
  Search,
  ChevronDown,
  ChevronRight,
  FileCode2,
  Layers,
  BookOpen,
  CheckCircle2,
  Circle,
  MapPin,
  Globe2,
  Palette,
} from "lucide-react";
import { Badge, Input, Tooltip, Button } from "@/components/ui";

type TabId = "gallery" | "components" | "handbook";

// ─── Gallery Card (preserved from original) ──────────────────────

function DesignCard({
  design,
  isHe,
  onPreview,
}: {
  design: DesignEntry;
  isHe: boolean;
  onPreview: (d: DesignEntry) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const title = isHe ? design.titleHe : design.title;
  const desc = isHe ? design.descriptionHe : design.description;
  const Arrow = isHe ? ArrowLeft : ArrowRight;

  return (
    <button
      type="button"
      onClick={() => onPreview(design)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/40 text-start transition-all duration-300 hover:border-slate-600/80 hover:bg-slate-800/60 hover:shadow-lg hover:shadow-black/20"
    >
      <div className="relative h-48 w-full overflow-hidden border-b border-slate-700/40 bg-slate-900">
        <iframe
          src={design.route}
          title={title}
          className="pointer-events-none h-[800px] w-[1280px] origin-top-left"
          style={{ transform: "scale(0.28)", transformOrigin: "top left" }}
          tabIndex={-1}
          loading="lazy"
        />
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity duration-200"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <span className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            <Eye className="h-4 w-4" />
            {isHe ? "תצוגה מקדימה" : "Preview"}
          </span>
        </div>
        <div className="absolute bottom-2 left-2 flex gap-1.5">
          {design.colors.map((c, i) => (
            <span
              key={i}
              className="h-3 w-3 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between">
          <h3 className="text-base font-semibold text-slate-100 group-hover:text-white">
            {title}
          </h3>
          <Arrow className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-300" />
        </div>
        <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {design.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-700/50 px-2 py-0.5 text-[11px] font-medium text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t border-slate-700/40 pt-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <FolderOpen className="h-3 w-3" />
            designs/{design.folder}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {design.createdAt}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Full-screen Preview (preserved from original) ───────────────

function DesignPreview({
  design,
  isHe,
  onClose,
}: {
  design: DesignEntry;
  isHe: boolean;
  onClose: () => void;
}) {
  const title = isHe ? design.titleHe : design.title;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950">
      <div className="flex h-12 items-center justify-between border-b border-slate-700/50 bg-slate-900/90 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={isHe ? ArrowRight : ArrowLeft}
            onClick={onClose}
          >
            {isHe ? "חזרה לגלריה" : "Back to Gallery"}
          </Button>
          <span className="h-4 w-px bg-slate-700" />
          <span className="text-sm font-medium text-slate-200">{title}</span>
          <Badge intent="neutral" size="md">
            <Code2 className="h-3 w-3" />
            designs/{design.folder}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <a href={design.route} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" icon={ExternalLink}>
              {isHe ? "פתח בחלון חדש" : "Open in new tab"}
            </Button>
          </a>
          <Button variant="ghost" size="sm" icon={X} onClick={onClose} />
        </div>
      </div>
      <iframe
        src={design.route}
        title={title}
        className="flex-1 border-0"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

// ─── Components Tab — Category Sidebar ───────────────────────────

const ALL_CATEGORIES: ComponentCategory[] = [
  "layout", "navigation", "data-display", "input", "feedback", "canvas", "editor", "widget",
];

const CATEGORY_LABEL_KEYS: Record<ComponentCategory, string> = {
  layout: "catLayout",
  navigation: "catNavigation",
  "data-display": "catDataDisplay",
  input: "catInput",
  feedback: "catFeedback",
  canvas: "catCanvas",
  editor: "catEditor",
  widget: "catWidget",
};

function CategorySidebar({
  selectedCategory,
  onSelect,
  counts,
  td,
}: {
  selectedCategory: ComponentCategory | "all";
  onSelect: (cat: ComponentCategory | "all") => void;
  counts: Record<string, number>;
  td: Record<string, string>;
}) {
  return (
    <div className="flex w-44 shrink-0 flex-col gap-0.5">
      <button
        onClick={() => onSelect("all")}
        className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
          selectedCategory === "all"
            ? "bg-purple-500/15 text-purple-300"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
        }`}
      >
        <span>{td.allCategories}</span>
        <span className="text-[10px] text-slate-600">{componentRegistry.length}</span>
      </button>
      {ALL_CATEGORIES.map((cat) => {
        const cc = CATEGORY_COLORS[cat];
        const count = counts[cat] || 0;
        if (count === 0) return null;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-purple-500/15 text-purple-300"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: cc.color }}
              />
              {td[CATEGORY_LABEL_KEYS[cat]]}
            </span>
            <span className="text-[10px] text-slate-600">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Components Tab — Component Card ─────────────────────────────

function ComponentCard({
  entry,
  isHe,
  expanded,
  onToggle,
  td,
}: {
  entry: ComponentEntry;
  isHe: boolean;
  expanded: boolean;
  onToggle: () => void;
  td: Record<string, string>;
}) {
  const cc = CATEGORY_COLORS[entry.category];
  const name = entry.name;
  const desc = isHe ? entry.descriptionHe : entry.description;
  const catLabel = td[CATEGORY_LABEL_KEYS[entry.category]];

  return (
    <div
      className={`rounded-xl border transition-colors ${
        expanded
          ? "border-slate-600/60 bg-slate-800/50"
          : "border-slate-700/40 bg-slate-800/25 hover:border-slate-600/50 hover:bg-slate-800/40"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-start"
      >
        <FileCode2 size={16} style={{ color: cc.color }} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-100">{name}</span>
            <span
              className="rounded-full px-1.5 py-px text-[10px] font-medium"
              style={{ color: cc.color, backgroundColor: cc.bg }}
            >
              {catLabel}
            </span>
            {entry.status === "beta" && (
              <Badge intent="warning">{td.beta}</Badge>
            )}
            {entry.status === "deprecated" && (
              <Badge intent="danger">{td.deprecated}</Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">{desc}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {entry.hasI18n && (
            <Tooltip content={td.hasI18n}><Globe2 size={12} className="text-blue-400/60" /></Tooltip>
          )}
          {entry.hasCcId && (
            <Tooltip content={td.hasCcId}><Palette size={12} className="text-purple-400/60" /></Tooltip>
          )}
          <span className="flex items-center gap-0.5 text-[10px] text-slate-600">
            <MapPin size={10} />
            {entry.usedIn.length}
          </span>
          {expanded ? (
            <ChevronDown size={14} className="text-slate-500" />
          ) : (
            <ChevronRight size={14} className="text-slate-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-700/30 px-4 py-3 text-[12px]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* File path */}
            <div>
              <span className="text-slate-600">{td.filePath}:</span>
              <span className="ms-1.5 font-mono text-slate-400">{entry.filePath}</span>
            </div>

            {/* Used in */}
            <div>
              <span className="text-slate-600">{td.usedIn}:</span>
              <span className="ms-1.5 text-slate-400">
                {entry.usedIn.join(", ")}
              </span>
            </div>

            {/* Dependencies */}
            {entry.dependencies.length > 0 && (
              <div className="sm:col-span-2">
                <span className="text-slate-600">{td.dependenciesLabel}:</span>
                <span className="ms-1.5 flex flex-wrap gap-1">
                  {entry.dependencies.map((dep) => (
                    <span
                      key={dep}
                      className="rounded bg-slate-700/50 px-1.5 py-0.5 text-[11px] text-slate-300"
                    >
                      {dep}
                    </span>
                  ))}
                </span>
              </div>
            )}

            {/* Props */}
            {entry.props && entry.props.length > 0 && (
              <div className="sm:col-span-2">
                <span className="mb-1.5 block text-slate-600">{td.propsLabel}:</span>
                <div className="overflow-x-auto rounded-lg border border-slate-700/30 bg-slate-900/50">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-700/30 text-slate-600">
                        <th className="px-2 py-1 text-start font-medium">Name</th>
                        <th className="px-2 py-1 text-start font-medium">Type</th>
                        <th className="px-2 py-1 text-start font-medium" />
                        <th className="px-2 py-1 text-start font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.props.map((p) => (
                        <tr key={p.name} className="border-b border-slate-700/20 last:border-0">
                          <td className="px-2 py-1 font-mono text-purple-300">{p.name}</td>
                          <td className="px-2 py-1 font-mono text-slate-400">{p.type}</td>
                          <td className="px-2 py-1">
                            {p.required ? (
                              <CheckCircle2 size={10} className="text-emerald-400" />
                            ) : (
                              <Circle size={10} className="text-slate-600" />
                            )}
                          </td>
                          <td className="px-2 py-1 text-slate-500">{p.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Handbook Tab ────────────────────────────────────────────────

interface HandbookRegistry {
  name: string;
  file: string;
  entries: number;
  description: string;
  descriptionHe: string;
}

const REGISTRIES: HandbookRegistry[] = [
  { name: "WidgetRegistry", file: "components/command-center/widgets/WidgetRegistry.ts", entries: 16, description: "Top bar widgets — active & coming soon, with size/tier/placement", descriptionHe: "ווידג'טים בסרגל עליון — פעילים ובקרוב, עם גודל/דרגה/מיקום" },
  { name: "ComponentRegistry", file: "app/dashboard/design-system/componentRegistry.ts", entries: componentRegistry.length, description: "All custom UI components — this catalog", descriptionHe: "כל קומפוננטות UI מותאמות — הקטלוג הזה" },
  { name: "FieldTypeRegistry", file: "components/command-center/fields/fieldTypes.ts", entries: 8, description: "Canvas field types — short text, checkbox, dropdown, date, etc.", descriptionHe: "סוגי שדות קנבס — טקסט קצר, תיבת סימון, נפתח, תאריך וכו'" },
  { name: "ShortcutRegistry", file: "lib/shortcuts/shortcutRegistry.ts", entries: 41, description: "Keyboard shortcuts — 9 categories, scoped by context", descriptionHe: "קיצורי מקלדת — 9 קטגוריות, ממוקדים לפי הקשר" },
  { name: "StyleOverrideRegistry", file: "lib/styleOverrideRegistry.ts", entries: 22, description: "Stylable UI elements — data-cc-id targets for visual customization", descriptionHe: "אלמנטים ניתנים לעיצוב — יעדי data-cc-id להתאמה ויזואלית" },
  { name: "DesignRegistry", file: "app/designs/registry.ts", entries: DESIGNS.length, description: "Design gallery entries — iframe previews with color palettes", descriptionHe: "ערכי גלריית עיצובים — תצוגות iframe עם פלטות צבע" },
];

interface HandbookSection {
  id: string;
  title: { he: string; en: string };
  content: { he: string; en: string }[];
}

const HANDBOOK_SECTIONS: HandbookSection[] = [
  {
    id: "conventions",
    title: { he: "מוסכמות", en: "Conventions" },
    content: [
      { he: "קבצים בשם PascalCase עבור קומפוננטות, camelCase לפונקציות, kebab-case לנתיבים", en: "PascalCase for component files, camelCase for functions, kebab-case for routes" },
      { he: "כל טקסט UI תומך עברית + אנגלית דרך lib/i18n.ts", en: "All UI text supports Hebrew + English via lib/i18n.ts" },
      { he: "מצב כהה בלבד — רקע Slate-900, הדגשות purple/blue, סטטוס emerald/amber/red", en: "Dark mode only — Slate-900 bg, purple/blue accents, emerald/amber/red for status" },
      { he: "Tailwind CSS + CSS variables, אייקוני Lucide React, גופן Inter", en: "Tailwind CSS + CSS variables, Lucide React icons, Inter font" },
      { he: "רגיסטריות משתמשות ב-{ he: string; en: string } לתוויות דו-לשוניות", en: "Registries use { he: string; en: string } for bilingual labels" },
      { he: "פונקציות חיפוש: getById(), getByCategory() בכל רגיסטרי", en: "Lookup functions: getById(), getByCategory() in every registry" },
    ],
  },
  {
    id: "anatomy",
    title: { he: "אנטומיית קומפוננטה", en: "Component Anatomy" },
    content: [
      { he: "ייבוא React + Lucide icons + הקשרים (SettingsContext, StyleOverrideContext)", en: "Import React + Lucide icons + contexts (SettingsContext, StyleOverrideContext)" },
      { he: "ממשקי TypeScript לכל prop — strict mode", en: "TypeScript interfaces for every prop — strict mode" },
      { he: "תמיכת i18n: const { language } = useSettings() + getTranslations(language)", en: "i18n support: const { language } = useSettings() + getTranslations(language)" },
      { he: "data-cc-id לאלמנטים הניתנים לעיצוב (22 יעדים ב-styleOverrideRegistry)", en: "data-cc-id on stylable elements (22 targets in styleOverrideRegistry)" },
      { he: "Tailwind classes + כיווניות RTL עם dir={isHe ? 'rtl' : 'ltr'}", en: "Tailwind classes + RTL directionality with dir={isHe ? 'rtl' : 'ltr'}" },
    ],
  },
  {
    id: "adding",
    title: { he: "הוספת קומפוננטה", en: "Adding a Component" },
    content: [
      { he: "1. צור קובץ .tsx ב-components/command-center/ (או canvas/ או editor/)", en: "1. Create .tsx file in components/command-center/ (or canvas/ or editor/)" },
      { he: "2. הגדר ממשק props עם TypeScript", en: "2. Define props interface with TypeScript" },
      { he: "3. הוסף תוויות i18n ל-lib/i18n.ts (he + en)", en: "3. Add i18n labels to lib/i18n.ts (he + en)" },
      { he: "4. הוסף data-cc-id אם הקומפוננטה צריכה להיות ניתנת לעיצוב", en: "4. Add data-cc-id if the component should be stylable" },
      { he: "5. רשום ב-componentRegistry.ts עם מטא-דאטה מלא", en: "5. Register in componentRegistry.ts with full metadata" },
      { he: "6. עדכן Dev Checklist בעמוד admin — 5 פריטים חובה", en: "6. Update Dev Checklist on admin page — 5 mandatory items" },
    ],
  },
];

function HandbookTab({
  isHe,
  td,
}: {
  isHe: boolean;
  td: Record<string, string>;
}) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["registries"]));

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Registries */}
      <div className="rounded-xl border border-slate-700/40 bg-slate-800/25">
        <button
          type="button"
          onClick={() => toggleSection("registries")}
          className="flex w-full items-center gap-2 px-4 py-3 text-start"
        >
          {openSections.has("registries") ? (
            <ChevronDown size={14} className="text-slate-500" />
          ) : (
            <ChevronRight size={14} className="text-slate-500" />
          )}
          <Layers size={15} className="text-purple-400" />
          <span className="text-sm font-medium text-slate-200">{td.registryOverview}</span>
          <span className="rounded-full bg-slate-700/40 px-2 py-px text-[10px] text-slate-500">
            {REGISTRIES.length}
          </span>
        </button>
        {openSections.has("registries") && (
          <div className="border-t border-slate-700/30 px-4 pb-3 pt-2">
            <div className="space-y-2">
              {REGISTRIES.map((r) => (
                <div
                  key={r.name}
                  className="flex items-start justify-between rounded-lg bg-slate-900/40 px-3 py-2"
                >
                  <div>
                    <span className="text-[12px] font-medium text-slate-200">{r.name}</span>
                    <p className="text-[11px] text-slate-500">
                      {isHe ? r.descriptionHe : r.description}
                    </p>
                    <span className="mt-0.5 block font-mono text-[10px] text-slate-600">
                      {r.file}
                    </span>
                  </div>
                  <Badge intent="accent" size="md">{r.entries}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic sections */}
      {HANDBOOK_SECTIONS.map((section) => (
        <div key={section.id} className="rounded-xl border border-slate-700/40 bg-slate-800/25">
          <button
            type="button"
            onClick={() => toggleSection(section.id)}
            className="flex w-full items-center gap-2 px-4 py-3 text-start"
          >
            {openSections.has(section.id) ? (
              <ChevronDown size={14} className="text-slate-500" />
            ) : (
              <ChevronRight size={14} className="text-slate-500" />
            )}
            <BookOpen size={15} className="text-blue-400" />
            <span className="text-sm font-medium text-slate-200">
              {isHe ? section.title.he : section.title.en}
            </span>
          </button>
          {openSections.has(section.id) && (
            <div className="border-t border-slate-700/30 px-4 pb-3 pt-2">
              <ul className="space-y-1.5">
                {section.content.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-slate-400">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
                    {isHe ? item.he : item.en}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function DesignSystemPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isHe = language === "he";
  const td = t.designSystem;

  const [activeTab, setActiveTab] = useState<TabId>("gallery");
  const [previewDesign, setPreviewDesign] = useState<DesignEntry | null>(null);

  // Components tab state
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of componentRegistry) {
      counts[c.category] = (counts[c.category] || 0) + 1;
    }
    return counts;
  }, []);

  const filteredComponents = useMemo(() => {
    let items = componentRegistry;
    if (selectedCategory !== "all") {
      items = items.filter((c) => c.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.nameHe.includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.descriptionHe.includes(q) ||
          c.filePath.toLowerCase().includes(q)
      );
    }
    return items;
  }, [selectedCategory, searchQuery]);

  const handlePreview = useCallback((d: DesignEntry) => setPreviewDesign(d), []);
  const handleClose = useCallback(() => setPreviewDesign(null), []);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "gallery", label: td.gallery, count: DESIGNS.length },
    { id: "components", label: td.components, count: componentRegistry.length },
    { id: "handbook", label: td.handbook, count: HANDBOOK_SECTIONS.length + 1 },
  ];

  return (
    <div className="min-h-screen">
      <PageHeader pageKey="designSystem" />

      <div className="px-3 py-4 sm:p-6">
        {/* Tab bar */}
        <div className="mb-5 flex items-center gap-1 rounded-lg bg-slate-800/40 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-px text-[10px] ${
                  activeTab === tab.id
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-slate-700/40 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab: Gallery */}
        {activeTab === "gallery" && (
          <>
            <div className="mb-6 flex items-center gap-3">
              <Tag className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-medium text-slate-200">
                {t.gallery.allDesigns}
              </h2>
              <span className="rounded-full bg-slate-700/50 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                {DESIGNS.length}
              </span>
            </div>
            {DESIGNS.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-700/60 bg-slate-800/20">
                <p className="text-sm text-slate-500">{t.gallery.noDesigns}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {DESIGNS.map((design) => (
                  <DesignCard
                    key={design.id}
                    design={design}
                    isHe={isHe}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab: Components */}
        {activeTab === "components" && (
          <div className="flex gap-5">
            {/* Desktop category sidebar */}
            <div className="hidden lg:block">
              <CategorySidebar
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
                counts={categoryCounts}
                td={td}
              />
            </div>

            {/* Mobile/tablet category pills */}
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    selectedCategory === "all"
                      ? "bg-purple-500/20 text-purple-300"
                      : "bg-slate-800 text-slate-500 hover:text-slate-400"
                  }`}
                >
                  {td.allCategories}
                </button>
                {ALL_CATEGORIES.map((cat) => {
                  const count = categoryCounts[cat] || 0;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        selectedCategory === cat
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-slate-800 text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      {(td as Record<string, string>)[CATEGORY_LABEL_KEYS[cat]]}
                    </button>
                  );
                })}
              </div>
              {/* Search */}
              <div className="mb-4">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={td.searchComponents}
                  iconStart={<Search size={14} />}
                />
              </div>

              {/* Stats */}
              <div className="mb-3 flex items-center gap-3 text-[11px] text-slate-600">
                <span>{td.totalComponents}: {filteredComponents.length}</span>
                {selectedCategory !== "all" && (
                  <>
                    <span className="h-3 w-px bg-slate-700" />
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {td.allCategories}
                    </button>
                  </>
                )}
              </div>

              {/* Component list */}
              {filteredComponents.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-700/60 bg-slate-800/20">
                  <p className="text-sm text-slate-500">{td.noResults}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredComponents.map((entry) => (
                    <ComponentCard
                      key={entry.id}
                      entry={entry}
                      isHe={isHe}
                      expanded={expandedId === entry.id}
                      onToggle={() =>
                        setExpandedId((prev) =>
                          prev === entry.id ? null : entry.id
                        )
                      }
                      td={td}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Handbook */}
        {activeTab === "handbook" && (
          <HandbookTab isHe={isHe} td={td} />
        )}
      </div>

      {/* Full-screen preview */}
      {previewDesign && (
        <DesignPreview
          design={previewDesign}
          isHe={isHe}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
