"use client";
// ===================================================
// GAM Command Center — Wiki Screen
// Spirit Index + Tools & Stack + Team
// ===================================================

import { useState, useEffect } from "react";
import { BookOpen, Wrench, Users, _ExternalLink, Mail, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeam } from "@/lib/pm-queries";

interface WikiScreenProps {
  className?: string;
}

// Mock data for Spirit Index and Tools (would normally come from Notion)
const SPIRIT_INDEX = {
  vision: "להיות הפלטפורמה המובילה לניהול פרויקטים בענף הבנייה בישראל",
  values: ["שקיפות מלאה", "איכות ללא פשרות", "חדשנות טכנולוגית", "שירות אישי"],
  rules: ["לעולם לא לפשר על איכות", "תמיד לדווח בזמן אמת", "ללמוד מכל שגיאה"],
  whatWeAreNot: ["לא חברת software כללית", "לא פתרון one-size-fits-all", "לא מתחרים במחיר"],
  voiceAndTone: "ישיר, מקצועי, אמין. מדברים בשפה של הלקוח, לא בז'רגון טכני."
};

const TOOLS_STACK = [
  {
    category: "Development Stack",
    items: [
      { name: "Next.js 16", role: "Frontend Framework", usage: "כל הממשקים והדפים" },
      { name: "Supabase", role: "Database & Auth", usage: "נתונים + אימות + Realtime" },
      { name: "Vercel", role: "Hosting & CDN", usage: "פריסה + זמינות גבוהה" },
      { name: "Claude API", role: "AI Assistant", usage: "עזרה בניהול משימות" },
    ]
  },
  {
    category: "Integrations",
    items: [
      { name: "Notion", role: "Project Management", usage: "מקור האמת לנתונים" },
      { name: "Origami CRM", role: "Customer Data", usage: "לידים ולקוחות" },
      { name: "WATI", role: "WhatsApp API", usage: "תקשורת עם לקוחות" },
      { name: "GitHub", role: "Code Repository", usage: "ניהול קוד + CI/CD" },
    ]
  },
  {
    category: "Libraries",
    items: [
      { name: "React Query", role: "Data Fetching", usage: "Cache + Sync מ-Supabase" },
      { name: "Tailwind CSS", role: "Styling", usage: "עיצוב responsive + dark mode" },
      { name: "Lucide React", role: "Icons", usage: "אייקונים עקביים" },
      { name: "Recharts", role: "Data Visualization", usage: "גרפים ב-BI מסך" },
    ]
  }
];

export function WikiScreen({ className }: WikiScreenProps) {
  const { data: team = [] } = useTeam();
  const [activeSection, setActiveSection] = useState<"spirit" | "tools" | "team">("spirit");

  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold text-white">ויקי</h1>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 border-b border-slate-700">
        {[
          { id: "spirit", label: "Spirit Index", icon: Globe },
          { id: "tools", label: "Tools & Stack", icon: Wrench },
          { id: "team", label: "Team", icon: Users },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
              activeSection === id
                ? "text-white border-purple-500 bg-slate-800/30"
                : "text-slate-400 border-transparent hover:text-white hover:bg-slate-800/20"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeSection === "spirit" && <SpiritIndexSection />}
        {activeSection === "tools" && <ToolsStackSection />}
        {activeSection === "team" && <TeamSection team={team} />}
      </div>
    </div>
  );
}

function SpiritIndexSection() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white mb-2">GAM Spirit Index</h2>
        <p className="text-slate-400">מי אנחנו, מה חשוב לנו, ואיך אנחנו עובדים</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vision */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
            🎯 החזון שלנו
          </h3>
          <p className="text-slate-300 leading-relaxed">{SPIRIT_INDEX.vision}</p>
        </div>

        {/* Values */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
            💎 הערכים שלנו
          </h3>
          <ul className="space-y-2">
            {SPIRIT_INDEX.values.map((value, i) => (
              <li key={i} className="text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0" />
                {value}
              </li>
            ))}
          </ul>
        </div>

        {/* Rules */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
            📜 החוקים שלנו
          </h3>
          <ul className="space-y-2">
            {SPIRIT_INDEX.rules.map((rule, i) => (
              <li key={i} className="text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* What We Are Not */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
            🚫 מה אנחנו לא
          </h3>
          <ul className="space-y-2">
            {SPIRIT_INDEX.whatWeAreNot.map((item, i) => (
              <li key={i} className="text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Voice & Tone */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
          🎤 Voice & Tone
        </h3>
        <p className="text-slate-300 leading-relaxed">{SPIRIT_INDEX.voiceAndTone}</p>
      </div>
    </div>
  );
}

function ToolsStackSection() {
  return (
    <div className="space-y-6">
      {TOOLS_STACK.map((category) => (
        <div key={category.category} className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            {category.category}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.items.map((tool) => (
              <div
                key={tool.name}
                className="bg-slate-800/30 rounded-lg border border-slate-700 p-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">{tool.name}</h4>
                  <_ExternalLink className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-sm text-purple-400 mb-2">{tool.role}</p>
                <p className="text-sm text-slate-400">{tool.usage}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamSection({ team }: { team: any[] }) {
  // Mock team data if empty
  const mockTeam = [
    { id: "1", name: "גל מילר", role: "CEO & Product", type: "מנהל", email: "gal@gam.co.il", active: true },
    { id: "2", name: "Claude", role: "AI Developer", type: "טכנולוגיה", email: null, active: true },
    { id: "3", name: "חני", role: "Operations", type: "תפעול", email: "hani@gam.co.il", active: true },
    { id: "4", name: "עידו", role: "Development", type: "טכנולוגיה", email: "ido@gam.co.il", active: true },
  ];

  const displayTeam = team.length > 0 ? team : mockTeam;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white mb-2">הצוות שלנו</h2>
        <p className="text-slate-400">האנשים שבונים את vBrain.io</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayTeam.map((member) => (
          <div
            key={member.id}
            className="bg-slate-800/30 rounded-xl border border-slate-700 p-6 text-center hover:bg-slate-800/50 transition-colors"
          >
            {/* Avatar */}
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-4">
              {member.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
            </div>

            {/* Name & Role */}
            <h3 className="text-lg font-medium text-white mb-1">{member.name}</h3>
            <p className="text-purple-400 text-sm mb-2">{member.role}</p>

            {/* Type Badge */}
            <div className="flex justify-center mb-4">
              <span className={cn(
                "px-2 py-1 text-xs rounded-full",
                member.type === "מנהל" ? "bg-purple-500/20 text-purple-400" :
                member.type === "טכנולוגיה" ? "bg-blue-500/20 text-blue-400" :
                "bg-emerald-500/20 text-emerald-400"
              )}>
                {member.type}
              </span>
            </div>

            {/* Contact */}
            {member.email && (
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <Mail className="w-4 h-4" />
                <span className="truncate">{member.email}</span>
              </div>
            )}

            {/* Status */}
            <div className="mt-4 pt-4 border-t border-slate-600">
              <span className={cn(
                "inline-flex items-center gap-1 text-xs",
                member.active ? "text-emerald-400" : "text-slate-500"
              )}>
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  member.active ? "bg-emerald-400" : "bg-slate-500"
                )} />
                {member.active ? "פעיל" : "לא פעיל"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}