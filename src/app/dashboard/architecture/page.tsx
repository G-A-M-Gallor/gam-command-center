"use client";

import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import { Monitor, Database, Building2, BookOpen, Cog, MessageSquare, Lock } from "lucide-react";

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
  NEXTJS -->|reads/writes| SUPA
  NEXTJS -.->|reads specs| NOTION
  N8N -->|syncs| SUPA
  N8N -->|webhooks| ORIGAMI
  N8N -->|triggers| WATI
  ORIGAMI -.->|SOT| SUPA`;

// ─── Tool Stack ─────────────────────────────────────────

interface ToolEntry {
  icon: React.ElementType;
  name: string;
  layerKey: string;
  layerColor: string;
  role: string;
  roleHe: string;
  doesNot: string;
  doesNotHe: string;
}

const TOOL_STACK: ToolEntry[] = [
  {
    icon: Monitor,
    name: "Next.js + Vercel",
    layerKey: "layerUI",
    layerColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    role: "Dashboard, editor, forms, viz",
    roleHe: "דשבורד, עורך, טפסים, ויזואליזציה",
    doesNot: "DB, business logic",
    doesNotHe: "DB, לוגיקה עסקית",
  },
  {
    icon: Database,
    name: "Supabase",
    layerKey: "layerDB",
    layerColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    role: "Mirror tables, Auth, Realtime, CRUD",
    roleHe: "טבלאות מראה, Auth, Realtime, CRUD",
    doesNot: "Not operational SOT",
    doesNotHe: "לא SOT תפעולי",
  },
  {
    icon: Building2,
    name: "Origami CRM",
    layerKey: "layerSOT",
    layerColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    role: "Clients, entities, statuses, pipeline",
    roleHe: "לקוחות, ישויות, סטטוסים, צנרת",
    doesNot: "Not wiki, not knowledge",
    doesNotHe: "לא ויקי, לא ידע",
  },
  {
    icon: BookOpen,
    name: "Notion",
    layerKey: "layerKnowledge",
    layerColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    role: "Specs, procedures, decisions, roadmap",
    roleHe: "מפרטים, נהלים, החלטות, מפת דרכים",
    doesNot: "Not task manager",
    doesNotHe: "לא מנהל משימות",
  },
  {
    icon: Cog,
    name: "n8n",
    layerKey: "layerAutomation",
    layerColor: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    role: "Sync Origami<>Supabase, webhooks, alerts",
    roleHe: "סנכרון Origami<>Supabase, webhooks, התראות",
    doesNot: "Not SOT",
    doesNotHe: "לא SOT",
  },
  {
    icon: MessageSquare,
    name: "WATI",
    layerKey: "layerMessaging",
    layerColor: "bg-green-500/10 text-green-400 border-green-500/20",
    role: "WhatsApp flows, chatbot, data collection",
    roleHe: "זרימות WhatsApp, צ'אטבוט, איסוף נתונים",
    doesNot: "Not DB",
    doesNotHe: "לא DB",
  },
];

// ─── Mermaid Renderer ───────────────────────────────────

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

  if (error) {
    return (
      <div className="text-sm text-slate-500 p-4 text-center">
        Failed to render diagram. Check Mermaid syntax.
      </div>
    );
  }

  return <div ref={containerRef} className="flex justify-center [&_svg]:max-w-full" />;
}

// ─── Page ───────────────────────────────────────────────

export default function ArchitecturePage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const ap = t.architecturePage;

  return (
    <div className="min-h-screen">
      <PageHeader pageKey="architecture" />
      <div className="px-3 py-4 sm:p-6 space-y-6">
        {/* Read-only notice */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Lock className="w-3.5 h-3.5" />
          {ap.readOnly} — {ap.dataFromClaudeMd}
        </div>

        {/* Mermaid Diagram */}
        <div
          data-cc-id="arch.diagram"
          className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-6"
        >
          <h2 className="text-sm font-medium text-slate-300 mb-4">{ap.diagramTitle}</h2>
          <MermaidDiagram definition={MERMAID_DEFINITION} />
        </div>

        {/* Tool Stack Table */}
        <div
          data-cc-id="arch.toolstack"
          className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="text-sm font-medium text-slate-300">{ap.toolStackTitle}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 text-xs text-slate-500 uppercase">
                  <th className="text-start px-4 py-2.5 font-medium">{ap.colTool}</th>
                  <th className="text-start px-4 py-2.5 font-medium">{ap.colLayer}</th>
                  <th className="text-start px-4 py-2.5 font-medium">{ap.colRole}</th>
                  <th className="text-start px-4 py-2.5 font-medium">{ap.colDoesNot}</th>
                </tr>
              </thead>
              <tbody>
                {TOOL_STACK.map((tool) => {
                  const Icon = tool.icon;
                  const layerLabel = ap[tool.layerKey as keyof typeof ap] as string;
                  return (
                    <tr key={tool.name} className="border-b border-slate-700/30 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-200 font-medium">{tool.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex text-xs rounded px-2 py-0.5 border ${tool.layerColor}`}>
                          {layerLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {language === "he" ? tool.roleHe : tool.role}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {language === "he" ? tool.doesNotHe : tool.doesNot}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
