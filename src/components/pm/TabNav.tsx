"use client";
// ===================================================
// GAM Command Center — Tab Navigation
// 5 tabs: Home, Hierarchy, Tasks, Wiki, BI
// ===================================================

import { cn } from "@/lib/utils";
import { Home, TreePine, CheckSquare, BookOpen, BarChart3 } from "lucide-react";

const TABS = [
  {
    id: "home",
    icon: Home,
    label: "בית",
    labelEn: "Home",
  },
  {
    id: "hierarchy",
    icon: TreePine,
    label: "היררכיה",
    labelEn: "Hierarchy",
  },
  {
    id: "tasks",
    icon: CheckSquare,
    label: "משימות",
    labelEn: "Tasks",
  },
  {
    id: "wiki",
    icon: BookOpen,
    label: "ויקי",
    labelEn: "Wiki",
  },
  {
    id: "bi",
    icon: BarChart3,
    label: "BI",
    labelEn: "BI",
  },
] as const;

export type TabId = (typeof TABS)[number]["id"];

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <div className="flex overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap min-w-fit",
                "border-b-2 border-transparent",
                "hover:text-white hover:bg-slate-800/50",
                isActive
                  ? "text-white border-b-purple-500 bg-slate-800/30"
                  : "text-slate-400"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}