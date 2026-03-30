"use client";

import { useRouter } from "next/navigation";
import {
  FileEdit,
  Map,
  Database,
  BookOpen,
  Bot,
  Grid3X3,
} from "lucide-react";

interface QuickAccessCardDef {
  key: string;
  icon: React.ElementType;
  color: string;
  href: string;
}

const CARDS: QuickAccessCardDef[] = [
  { key: "editor", icon: FileEdit, color: "text-blue-400 bg-blue-500/15", href: "/dashboard/editor" },
  { key: "storyMap", icon: Map, color: "text-amber-400 bg-amber-500/15", href: "/dashboard/story-map" },
  { key: "entities", icon: Database, color: "text-purple-400 bg-purple-500/15", href: "/dashboard/entities" },
  { key: "wiki", icon: BookOpen, color: "text-emerald-400 bg-emerald-500/15", href: "/dashboard/wiki" },
  { key: "aiHub", icon: Bot, color: "text-pink-400 bg-pink-500/15", href: "/dashboard/ai-hub" },
  { key: "functionalMap", icon: Grid3X3, color: "text-cyan-400 bg-cyan-500/15", href: "/dashboard/functional-map" },
];

interface QuickAccessGridProps {
  tabLabels: Record<string, string>;
  onContextMenu?: (e: React.MouseEvent, href: string, label: string) => void;
}

export function QuickAccessGrid({ tabLabels, onContextMenu }: QuickAccessGridProps) {
  const _router = useRouter();

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      data-cc-id="hub.quickAccess"
    >
      {CARDS.map((card) => {
        const Icon = card.icon;
        const label = tabLabels[card.key] || card.key;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => router.push(card.href)}
            onContextMenu={
              onContextMenu
                ? (e) => onContextMenu(e, card.href, label)
                : undefined
            }
            className="gam-card gam-card-click flex flex-col items-center gap-2 rounded-[var(--cc-radius-lg)] border border-white/[0.06] p-4 transition-all hover:border-white/[0.12]"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-slate-300">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
