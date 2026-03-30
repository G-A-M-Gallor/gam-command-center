"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/contexts/SettingsContext";
import { PageHeader } from "@/components/command-center/PageHeader";
import {
  APP_CATALOG, WIDGET_CATALOG, CATEGORY_META,
  type AppDefinition, type WidgetDefinition, type AppCategory,
} from "@/lib/app-catalog";
import {
  Search, ChevronRight, _ExternalLink, _Layers, Code,
  LayoutDashboard, Database, FileCheck, BookOpen, Sparkles, Map,
  Network, Video, CalendarDays, Lightbulb, MessageSquare, Mail,
  Rss, _Shield, Compass, GitBranch, Palette, Zap, Settings, Lock,
  Radio, Cloud, Grid3x3, Presentation, FileText, _Monitor, Building2,
  Cog, Globe, ArrowRight, _Star, Bot, _Plus, Bell, _Clock,
  ClipboardList, Calendar, TrendingUp, MessageCircle, BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Icon Map ───────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Grid3x3, Layers3: _Layers, FileText, Database, FileCheck,
  BookOpen, Sparkles, Map, Network, Video, CalendarDays, Lightbulb,
  MessageSquare, Mail, Rss, _Shield, Compass, GitBranch, Palette,
  Zap, Settings, Lock, Radio, Cloud, Grid3X3: Grid3x3, Presentation,
  Search, Bot, _Plus, _Star, Calendar, Bell, _Clock, ClipboardList,
  TrendingUp, MessageCircle, BarChart3, _Monitor, Building2, Cog, Globe,
};

function renderIcon(name: string, className: string = "") {
  const IconComponent = ICON_MAP[name] || LayoutDashboard;
  return <IconComponent className={className} />;
}

// ─── App Card ───────────────────────────────────────────

function AppCard({
  app,
  language,
  onClick,
}: {
  app: AppDefinition;
  language: "he" | "en" | "ru";
  onClick: () => void;
}) {
  const [from, to] = app.gradient;
  const lang = language === "ru" ? "en" : language;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col rounded-2xl border border-white/[0.06] p-4 text-start transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.03] cursor-pointer"
      style={{ background: "rgba(30, 41, 59, 0.4)" }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${from}, ${to})`,
            boxShadow: `0 4px 12px ${from}30`,
          }}
        >
          {renderIcon(app.iconName, "h-5.5 w-5.5 text-white")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100 truncate">
              {app.name[lang]}
            </h3>
            {app.status === "coming-soon" && (
              <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                Soon
              </span>
            )}
            {app.status === "beta" && (
              <span className="shrink-0 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                Beta
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {app.purpose[lang]}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1">
        {app.contains.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-500"
          >
            {tag}
          </span>
        ))}
        {app.contains.length > 3 && (
          <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-500">
            +{app.contains.length - 3}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-white/[0.04] pt-2.5">
        <div className="flex items-center gap-2">
          {app.tier !== "free" && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                app.tier === "pro"
                  ? "bg-purple-500/15 text-purple-400"
                  : "bg-amber-500/15 text-amber-400"
              }`}
            >
              {app.tier.toUpperCase()}
            </span>
          )}
          {app.subPages && app.subPages.length > 0 && (
            <span className="text-[10px] text-slate-600">
              {app.subPages.length} sub-pages
            </span>
          )}
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-slate-600 transition-colors group-hover:text-slate-400" />
      </div>
    </button>
  );
}

// ─── Widget Card ────────────────────────────────────────

function WidgetCard({
  widget,
  language,
}: {
  widget: WidgetDefinition;
  language: "he" | "en" | "ru";
}) {
  const [from, to] = widget.gradient;
  const lang = language === "ru" ? "en" : language;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] p-3 transition-colors hover:bg-white/[0.02]">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: `linear-gradient(135deg, ${from}, ${to})`,
          boxShadow: `0 3px 8px ${from}25`,
        }}
      >
        {renderIcon(widget.iconName, "h-4 w-4 text-white")}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-slate-200">{widget.name[lang]}</div>
        <div className="text-[11px] text-slate-500">{widget.purpose[lang]}</div>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        widget.panelMode === "modal" ? "bg-purple-500/10 text-purple-400"
          : widget.panelMode === "side-panel" ? "bg-blue-500/10 text-blue-400"
          : "bg-slate-500/10 text-slate-400"
      }`}>
        {widget.panelMode}
      </span>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────

function StatCard({ label, value, gradient }: { label: string; value: number; gradient: [string, string] }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(30, 41, 59, 0.4)" }}>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-2xl"
        style={{ background: gradient[0] }}
      />
    </div>
  );
}

// ─── Category Section ───────────────────────────────────

function CategorySection({
  category,
  apps,
  language,
  onAppClick,
}: {
  category: AppCategory;
  apps: AppDefinition[];
  language: "he" | "en" | "ru";
  onAppClick: (app: AppDefinition) => void;
}) {
  const meta = CATEGORY_META[category];
  const [from] = meta.gradient;
  const lang = language === "ru" ? "en" : language;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-1 w-6 rounded-full" style={{ background: from }} />
        <h2 className="text-base font-semibold text-slate-200">
          {meta.name[lang]}
        </h2>
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-slate-500">
          {apps.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <AppCard key={app.id} app={app} language={language} onClick={() => onAppClick(app)} />
        ))}
      </div>
    </div>
  );
}

// ─── App Detail Drawer ──────────────────────────────────

function AppDetailDrawer({
  app,
  language,
  onClose,
  onNavigate,
}: {
  app: AppDefinition;
  language: "he" | "en" | "ru";
  onClose: () => void;
  onNavigate: (href: string) => void;
}) {
  const [from, to] = app.gradient;
  const lang = language === "ru" ? "en" : language;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      <button type="button" onClick={onClose} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" aria-label="Close" />
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-white/[0.08]"
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(20px)",
          animation: "slide-in-right 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-slate-900/80 backdrop-blur-xl px-6 py-4">
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${from}, ${to})`,
                boxShadow: `0 6px 20px ${from}40`,
              }}
            >
              {renderIcon(app.iconName, "h-7 w-7 text-white")}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-white">{app.name[lang]}</h2>
              <p className="mt-1 text-sm text-slate-400">{app.purpose[lang]}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Quick Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/[0.04] p-3 text-center">
              <div className="text-xs text-slate-500">Status</div>
              <div className={`mt-1 text-sm font-medium ${
                app.status === "active" ? "text-emerald-400" : app.status === "coming-soon" ? "text-amber-400" : "text-slate-400"
              }`}>{app.status}</div>
            </div>
            <div className="rounded-xl bg-white/[0.04] p-3 text-center">
              <div className="text-xs text-slate-500">Tier</div>
              <div className="mt-1 text-sm font-medium text-slate-200">{app.tier}</div>
            </div>
            <div className="rounded-xl bg-white/[0.04] p-3 text-center">
              <div className="text-xs text-slate-500">Phase</div>
              <div className="mt-1 text-sm font-medium text-slate-200">{app.phase}</div>
            </div>
          </div>

          {/* Contains */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Contains</h3>
            <div className="flex flex-wrap gap-1.5">
              {app.contains.map((item) => (
                <span key={item} className="rounded-lg bg-white/[0.06] px-2.5 py-1 text-xs text-slate-300">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Route */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Route</h3>
            <button
              type="button"
              onClick={() => onNavigate(app.href)}
              className="flex w-full items-center gap-2 rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <Code className="h-4 w-4 text-slate-500" />
              <span className="font-mono text-xs">{app.href}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-slate-500" />
            </button>
          </div>

          {/* Sub-pages */}
          {app.subPages && app.subPages.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Sub-pages</h3>
              <div className="space-y-1.5">
                {app.subPages.map((sub) => (
                  <div key={sub.key} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
                    <span className="text-slate-300">{sub.name[lang]}</span>
                    <span className="ml-auto font-mono text-[10px] text-slate-600">{sub.href}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API Routes */}
          {app.apiRoutes && app.apiRoutes.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">API Routes</h3>
              <div className="space-y-1.5">
                {app.apiRoutes.map((route) => (
                  <div key={route} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
                    <Code className="h-3 w-3 text-emerald-500" />
                    <span className="font-mono text-slate-400">{route}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {app.dependsOn && app.dependsOn.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Dependencies</h3>
              <div className="flex flex-wrap gap-1.5">
                {app.dependsOn.map((dep) => (
                  <span key={dep} className="rounded-lg bg-purple-500/10 px-2.5 py-1 text-xs text-purple-300">
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contexts */}
          {app.contexts && app.contexts.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">React Contexts</h3>
              <div className="flex flex-wrap gap-1.5">
                {app.contexts.map((ctx) => (
                  <span key={ctx} className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs text-blue-300">
                    {ctx}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Open button */}
          {app.status === "active" && (
            <button
              type="button"
              onClick={() => onNavigate(app.href)}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-white transition-all hover:brightness-110 cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
            >
              <ExternalLink className="h-4 w-4" />
              {language === "he" ? "פתח אפליקציה" : "Open App"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Mermaid Diagram ────────────────────────────────────

const MERMAID_DEFINITION = `graph TB
  subgraph UI["UI Layer"]
    NEXTJS["Next.js + Vercel"]
  end
  subgraph Data["Data Layer"]
    SUPA["Supabase"]
  end
  subgraph SOT["Operational SOT"]
    ORIGAMI["Origami CRM"]
  end
  subgraph Knowledge["Knowledge SOT"]
    NOTION["Notion"]
  end
  subgraph Auto["Automation"]
    N8N["n8n"]
  end
  subgraph Msg["Messaging"]
    WATI["WATI"]
  end
  subgraph AI["AI Layer"]
    AIHUB["AI Hub"]
    WORKMGR["Work Manager"]
  end
  subgraph ExtAI["External AI"]
    ANTHROPIC["Anthropic API"]
  end
  NEXTJS -->|reads/writes| SUPA
  NEXTJS -.->|reads specs| NOTION
  N8N -->|syncs| SUPA
  N8N -->|webhooks| ORIGAMI
  N8N -->|triggers| WATI
  ORIGAMI -.->|SOT| SUPA
  AIHUB -->|mode 5| WORKMGR
  WORKMGR -->|calls| ANTHROPIC
  WORKMGR -->|budget check| SUPA
  AIHUB -->|calls| ANTHROPIC`;

function MermaidDiagram({ definition }: { definition: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#7c3aed",
            primaryTextColor: "#e2e8f0",
            primaryBorderColor: "#6d28d9",
            lineColor: "#64748b",
            secondaryColor: "#1e293b",
            tertiaryColor: "#0f172a",
            background: "#0f172a",
            mainBkg: "#1e293b",
            nodeBorder: "#475569",
            clusterBkg: "#1e293b",
            clusterBorder: "#334155",
            titleColor: "#e2e8f0",
            edgeLabelBackground: "#1e293b",
          },
          securityLevel: "strict",
          flowchart: { curve: "basis", padding: 16 },
        });
        if (cancelled || !containerRef.current) return;
        const { svg } = await mermaid.render("arch-diagram", definition);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }
    render();
    return () => { cancelled = true; };
  }, [definition]);

  if (error) return <div className="py-8 text-center text-sm text-slate-500">Failed to render diagram.</div>;
  return <div ref={containerRef} className="flex justify-center [&_svg]:max-w-full" />;
}

// ─── Tool Stack ─────────────────────────────────────────

const TOOL_STACK = [
  { name: "Next.js + Vercel", icon: _Monitor, gradient: ["#6366f1", "#818cf8"], role: "Dashboard, editor, forms, viz", roleHe: "דשבורד, עורך, טפסים, ויזואליזציה" },
  { name: "Supabase", icon: Database, gradient: ["#10b981", "#34d399"], role: "Mirror tables, Auth, Realtime, CRUD", roleHe: "טבלאות מראה, Auth, Realtime, CRUD" },
  { name: "Origami CRM", icon: Building2, gradient: ["#3b82f6", "#60a5fa"], role: "Clients, entities, statuses, pipeline", roleHe: "לקוחות, ישויות, סטטוסים, צנרת" },
  { name: "Notion", icon: BookOpen, gradient: ["#f59e0b", "#fbbf24"], role: "Specs, procedures, decisions, roadmap", roleHe: "מפרטים, נהלים, החלטות, מפת דרכים" },
  { name: "n8n", icon: Cog, gradient: ["#ec4899", "#f472b6"], role: "Sync Origami<>Supabase, webhooks", roleHe: "סנכרון Origami<>Supabase, webhooks" },
  { name: "WATI", icon: MessageSquare, gradient: ["#22c55e", "#4ade80"], role: "WhatsApp flows, chatbot", roleHe: "זרימות WhatsApp, צ'אטבוט" },
  { name: "Claude API", icon: Sparkles, gradient: ["#8b5cf6", "#a78bfa"], role: "5 chat modes + 6 agents", roleHe: "5 מצבי צ'אט + 6 סוכנים" },
];

// ─── Page Component ─────────────────────────────────────

export default function ArchitecturePage() {
  const { language } = useSettings();
  const _router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | "all">("all");
  const [selectedApp, setSelectedApp] = useState<AppDefinition | null>(null);
  const [activeTab, setActiveTab] = useState<"apps" | "widgets" | "stack">("apps");
  const lang = language === "ru" ? "en" : language;

  // Stats
  const activeApps = APP_CATALOG.filter((a) => a.status === "active").length;
  const activeWidgets = WIDGET_CATALOG.filter((w) => w.status === "active").length;
  const totalRoutes = APP_CATALOG.reduce((sum, a) => sum + 1 + (a.subPages?.length || 0), 0);

  // Filter apps
  const filteredApps = useMemo(() => {
    let apps = APP_CATALOG;
    if (selectedCategory !== "all") {
      apps = apps.filter((a) => a.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      apps = apps.filter((a) =>
        a.name.he.toLowerCase().includes(q) ||
        a.name.en.toLowerCase().includes(q) ||
        a.purpose.he.toLowerCase().includes(q) ||
        a.purpose.en.toLowerCase().includes(q) ||
        a.id.includes(q) ||
        a.contains.some((c) => c.toLowerCase().includes(q))
      );
    }
    return apps;
  }, [selectedCategory, searchQuery]);

  // Group by category
  const groupedApps = useMemo(() => {
    const groups: Partial<Record<AppCategory, AppDefinition[]>> = {};
    for (const app of filteredApps) {
      if (!groups[app.category]) groups[app.category] = [];
      groups[app.category]!.push(app);
    }
    return groups;
  }, [filteredApps]);

  const categoryOrder: AppCategory[] = ["core", "content", "tools", "communication", "data", "system"];

  // Filter widgets
  const filteredWidgets = useMemo(() => {
    if (!searchQuery.trim()) return WIDGET_CATALOG;
    const q = searchQuery.toLowerCase();
    return WIDGET_CATALOG.filter((w) =>
      w.name.he.toLowerCase().includes(q) ||
      w.name.en.toLowerCase().includes(q) ||
      w.id.includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen">
      <PageHeader pageKey="architecture" />

      <div className="px-4 py-5 sm:px-6">
        {/* ── Stats Row ── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label={lang === "he" ? "אפליקציות פעילות" : "Active Apps"} value={activeApps} gradient={["#6366f1", "#818cf8"]} />
          <StatCard label={lang === "he" ? "ווידג׳טים" : "Widgets"} value={activeWidgets} gradient={["#8b5cf6", "#a78bfa"]} />
          <StatCard label={lang === "he" ? "סה״כ נתיבים" : "Total Routes"} value={totalRoutes} gradient={["#10b981", "#34d399"]} />
          <StatCard label={lang === "he" ? "שירותים חיצוניים" : "External Services"} value={TOOL_STACK.length} gradient={["#f59e0b", "#fbbf24"]} />
        </div>

        {/* ── Tab Navigation ── */}
        <div className="mb-5 flex items-center gap-1 rounded-xl bg-white/[0.03] p-1 border border-white/[0.06]">
          {(["apps", "widgets", "stack"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-white/[0.08] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "apps" ? (lang === "he" ? "אפליקציות" : "Apps")
                : tab === "widgets" ? (lang === "he" ? "ווידג׳טים" : "Widgets")
                : (lang === "he" ? "שכבת טכנולוגיה" : "Tech Stack")}
              <span className="ml-1.5 text-[11px] text-slate-500">
                {tab === "apps" ? APP_CATALOG.length : tab === "widgets" ? WIDGET_CATALOG.length : TOOL_STACK.length}
              </span>
            </button>
          ))}
        </div>

        {/* ── Search + Filter ── */}
        {activeTab !== "stack" && (
          <div className="mb-5 flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "he" ? "חפש אפליקציה, ווידג׳ט, או יכולת..." : "Search apps, widgets, or capabilities..."}
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>
            {activeTab === "apps" && (
              <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    selectedCategory === "all" ? "bg-white/[0.08] text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {lang === "he" ? "הכל" : "All"}
                </button>
                {categoryOrder.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                        selectedCategory === cat ? "bg-white/[0.08] text-white" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {meta.name[lang]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Apps Tab ── */}
        {activeTab === "apps" && (
          <div className="space-y-8">
            {categoryOrder.map((cat) => {
              const apps = groupedApps[cat];
              if (!apps || apps.length === 0) return null;
              return (
                <CategorySection
                  key={cat}
                  category={cat}
                  apps={apps}
                  language={language}
                  onAppClick={setSelectedApp}
                />
              );
            })}
            {filteredApps.length === 0 && (
              <div className="py-16 text-center text-sm text-slate-500">
                {lang === "he" ? "לא נמצאו תוצאות" : "No results found"}
              </div>
            )}
          </div>
        )}

        {/* ── Widgets Tab ── */}
        {activeTab === "widgets" && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWidgets.map((w) => (
              <WidgetCard key={w.id} widget={w} language={language} />
            ))}
          </div>
        )}

        {/* ── Tech Stack Tab ── */}
        {activeTab === "stack" && (
          <div className="space-y-6">
            {/* System Diagram */}
            <div className="rounded-2xl border border-white/[0.06] p-5" style={{ background: "rgba(30, 41, 59, 0.4)" }}>
              <h3 className="mb-4 text-sm font-semibold text-slate-200">
                {lang === "he" ? "תרשים מערכת" : "System Diagram"}
              </h3>
              <MermaidDiagram definition={MERMAID_DEFINITION} />
            </div>

            {/* Tool Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TOOL_STACK.map((tool) => {
                const Icon = tool.icon;
                const [from, to] = tool.gradient;
                return (
                  <div
                    key={tool.name}
                    className="flex items-start gap-4 rounded-2xl border border-white/[0.06] p-4"
                    style={{ background: "rgba(30, 41, 59, 0.4)" }}
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${from}, ${to})`,
                        boxShadow: `0 4px 12px ${from}30`,
                      }}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">{tool.name}</h3>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                        {lang === "he" ? tool.roleHe : tool.role}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── App Detail Drawer ── */}
      {selectedApp && (
        <AppDetailDrawer
          app={selectedApp}
          language={language}
          onClose={() => setSelectedApp(null)}
          onNavigate={(href) => { setSelectedApp(null); router.push(href); }}
        />
      )}

      {/* Animations */}
      <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
