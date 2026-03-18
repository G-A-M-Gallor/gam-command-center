"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ChevronDown, Check, Settings, User, Briefcase, Users, Globe,
  Building2, Wrench, Shield, Plus, LogOut,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { getTranslations } from "@/lib/i18n";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// ─── Workspace definitions ──────────────────────────────

interface WorkspaceItem {
  id: string;
  icon: React.ElementType;
  gradient: string;
  name: string;
  desc: string;
  badge?: { label: string; class: string };
  disabled?: boolean;
  notif?: boolean;
}

interface WorkspaceSection {
  label: string;
  items: WorkspaceItem[];
}

function getWorkspaceSections(lang: "he" | "en" | "ru"): WorkspaceSection[] {
  const isHe = lang === "he";
  return [
    {
      label: isHe ? "אישי" : "Personal",
      items: [
        {
          id: "personal",
          icon: User,
          gradient: "from-blue-500 to-cyan-500",
          name: isHe ? "vBrain — פרופיל אישי" : "vBrain — Personal",
          desc: isHe ? "כלים בסיסיים, פרופיל, הגדרות" : "Basic tools, profile, settings",
        },
      ],
    },
    {
      label: isHe ? "עסקי" : "Business",
      items: [
        {
          id: "gam-business",
          icon: Briefcase,
          gradient: "from-purple-500 to-indigo-500",
          name: isHe ? "G.A.M שירותי בניין" : "G.A.M Construction",
          desc: isHe ? "דף עסקי — 12 חברי צוות" : "Business page — 12 members",
          badge: { label: isHe ? "בעלים" : "Owner", class: "bg-purple-500/15 text-purple-400" },
        },
        {
          id: "gallor",
          icon: Briefcase,
          gradient: "from-indigo-500 to-indigo-400",
          name: isHe ? "גלאור יזמות" : "Gallor Ventures",
          desc: isHe ? "דף עסקי — 3 חברי צוות" : "Business page — 3 members",
          badge: { label: isHe ? "בעלים" : "Owner", class: "bg-purple-500/15 text-purple-400" },
        },
      ],
    },
    {
      label: isHe ? "קבוצות" : "Groups",
      items: [
        {
          id: "groups",
          icon: Users,
          gradient: "from-amber-500 to-red-500",
          name: isHe ? "קבוצות vBrain" : "vBrain Groups",
          desc: isHe ? "מרחבי עבודה שיתופיים" : "Collaborative workspaces",
          disabled: true,
          badge: { label: isHe ? "בקרוב" : "Soon", class: "bg-slate-500/20 text-slate-500 italic" },
        },
      ],
    },
    {
      label: isHe ? "ניהול פלטפורמה" : "Platform",
      items: [
        {
          id: "vbrain-office",
          icon: Building2,
          gradient: "from-emerald-500 to-emerald-600",
          name: "vBrain Office",
          desc: isHe ? "בק-אופיס — ניהול הפלטפורמה" : "Back-office — platform management",
          badge: { label: isHe ? "אדמין" : "Admin", class: "bg-red-500/15 text-red-400" },
        },
      ],
    },
    {
      label: "Super Admin",
      items: [
        {
          id: "command-center",
          icon: Settings,
          gradient: "from-pink-500 to-purple-500",
          name: "Command Center",
          desc: isHe ? "ניהול מערכת מלא" : "Full system control",
        },
        {
          id: "gam-tools",
          icon: Wrench,
          gradient: "from-orange-500 to-amber-500",
          name: isHe ? "Gallor GAM כלים" : "Gallor GAM Tools",
          desc: isHe ? "כלים פנימיים של GAM" : "GAM internal tools",
          notif: true,
        },
        {
          id: "gam-site",
          icon: Globe,
          gradient: "from-cyan-500 to-blue-500",
          name: "GAM.co.il",
          desc: isHe ? "ניהול אתר GAM" : "GAM website management",
        },
      ],
    },
  ];
}

// ─── Component ──────────────────────────────────────────

interface WorkspaceSwitcherProps {
  user: SupabaseUser;
  isCollapsed: boolean;
  onRight: boolean;
  expandedWidth: number;
  navTop: number;
}

export function WorkspaceSwitcher({ user, isCollapsed, onRight, expandedWidth, navTop }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const { language } = useSettings();
  const { signOut } = useAuth();
  const t = getTranslations(language);
  const isRtl = language === "he";
  const lang = language === "he" ? "he" : language === "ru" ? "ru" : "en";

  const [open, setOpen] = useState(false);
  const [activeWs, setActiveWs] = useState("command-center");
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 280 });

  const sections = getWorkspaceSections(lang as "he" | "en" | "ru");
  const activeItem = sections.flatMap(s => s.items).find(i => i.id === activeWs);

  // Compute dropdown position from trigger rect
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropPos({
      top: rect.bottom + 6,
      left: isCollapsed ? (onRight ? rect.right - 280 : rect.left) : rect.left,
      width: isCollapsed ? 280 : rect.width,
    });
  }, [isCollapsed, onRight]);

  useEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const userInitial = (user.email?.[0] || "?").toUpperCase();
  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  // ─── Collapsed: compact avatar trigger ───
  if (isCollapsed) {
    return (
      <div className="shrink-0 border-b border-slate-700/50 py-2 flex justify-center" ref={triggerRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cc-accent-500)]/10 border border-[var(--cc-accent-500)]/20 hover:bg-[var(--cc-accent-500)]/[0.18] hover:border-[var(--cc-accent-500)]/35 transition-all cursor-pointer"
        >
          <span className="text-sm font-bold text-[var(--cc-accent-300)]">{userInitial}</span>
          <span className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-500" />
        </button>

        {open && renderDropdown()}
      </div>
    );
  }

  // ─── Expanded: workspace trigger ───
  return (
    <div className="shrink-0 border-b border-slate-700/50" ref={triggerRef}>
      {/* Workspace trigger */}
      <div className="px-2 py-2 relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 bg-[var(--cc-accent-500)]/[0.08] border border-[var(--cc-accent-500)]/15 hover:bg-[var(--cc-accent-500)]/[0.14] hover:border-[var(--cc-accent-500)]/25 transition-all cursor-pointer ${isRtl ? "flex-row-reverse" : ""}`}
        >
          {/* Workspace icon */}
          {activeItem && (
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${activeItem.gradient}`}>
              <activeItem.icon className="h-3.5 w-3.5 text-white" />
            </div>
          )}

          {/* Workspace name */}
          <div className={`flex-1 min-w-0 ${isRtl ? "text-end" : "text-start"}`}>
            <div className="truncate text-[11px] font-medium text-slate-300">
              {activeItem ? activeItem.name.replace("vBrain — ", "").replace("Gallor ", "") : "Super Admin"}
            </div>
          </div>

          {/* Chevron */}
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && renderDropdown()}
      </div>
    </div>
  );

  // ─── Dropdown panel ───
  function renderDropdown() {
    const um = t.userMenu as Record<string, string>;

    return createPortal(
      <div
        ref={dropdownRef}
        className="fixed z-[60] rounded-xl border border-slate-700/80 overflow-hidden"
        style={{
          backgroundColor: "var(--nav-bg)",
          top: dropPos.top,
          left: dropPos.left,
          width: dropPos.width,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
          animation: "ws-drop-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          transformOrigin: "top center",
        }}
      >
        <style>{`
          @keyframes ws-drop-in {
            0% { opacity: 0; transform: translateY(-8px) scaleY(0.92); }
            40% { opacity: 1; }
            100% { opacity: 1; transform: translateY(0) scaleY(1); }
          }
        `}</style>

        {/* Current workspace header */}
        {activeItem && (
          <div className={`flex items-center gap-3 px-4 py-3 bg-[var(--cc-accent-500)]/[0.06] border-b border-slate-700/40 ${isRtl ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${activeItem.gradient} border-2 border-[var(--cc-accent-500)]/30`}>
              <activeItem.icon className="h-4 w-4 text-white" />
            </div>
            <div className={`flex-1 min-w-0 ${isRtl ? "text-end" : ""}`}>
              <div className="text-sm font-semibold text-slate-100">{activeItem.name}</div>
              <div className="text-[10px] text-[var(--cc-accent-400)] font-medium mt-0.5">Super Admin</div>
            </div>
            <Check className="h-4 w-4 text-[var(--cc-accent-400)] shrink-0" />
          </div>
        )}

        {/* Sections */}
        <div className="max-h-[60vh] overflow-y-auto">
          {sections.map((section) => (
            <div key={section.label} className="border-b border-slate-700/20 last:border-b-0 py-1.5">
              <div className={`px-4 py-1 text-[9px] font-semibold uppercase tracking-widest text-slate-600 ${isRtl ? "text-end" : ""}`}>
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive = item.id === activeWs;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => {
                      if (!item.disabled) {
                        setActiveWs(item.id);
                        setOpen(false);
                      }
                    }}
                    className={`flex w-full items-center gap-2.5 px-4 py-2 transition-colors cursor-pointer ${
                      isActive ? "bg-[var(--cc-accent-500)]/[0.06]" : "hover:bg-white/[0.03]"
                    } ${item.disabled ? "opacity-40 cursor-not-allowed" : ""} ${isRtl ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${item.gradient}`}>
                      <item.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className={`flex-1 min-w-0 ${isRtl ? "text-end" : "text-start"}`}>
                      <div className="text-[13px] font-medium text-slate-200 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${item.badge.class} shrink-0`}>
                        {item.badge.label}
                      </span>
                    )}
                    {item.notif && (
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                    )}
                    {isActive && !item.badge && (
                      <Check className="h-3.5 w-3.5 text-[var(--cc-accent-400)] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User + logout */}
        <div className={`flex items-center gap-2 border-t border-slate-700/40 px-3 py-2 ${isRtl ? "flex-row-reverse" : ""}`}>
          <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--cc-accent-500)] to-indigo-500">
            <span className="text-[9px] font-semibold text-white">{userInitial}</span>
            <span className="absolute -bottom-px -end-px h-2 w-2 rounded-full border-[1.5px] border-slate-900 bg-emerald-500" />
          </div>
          <div className={`flex-1 min-w-0 ${isRtl ? "text-end" : "text-start"}`}>
            <div className="truncate text-[11px] font-medium text-slate-300">{userName}</div>
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); signOut(); }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-600 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors cursor-pointer"
            title={(t.userMenu as Record<string, string>).signOut || "Log Out"}
          >
            <LogOut className="h-3 w-3" />
          </button>
        </div>
      </div>,
      document.body
    );
  }
}
