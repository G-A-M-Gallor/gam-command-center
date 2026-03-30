"use client";

import { Database, FileText, ListTodo, Bot } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui";

interface StatCard {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  href: string;
}

interface QuickStatsProps {
  totalEntities: number;
  docsThisWeek: number;
  openTasks: number;
  aiConversations: number;
  loading: boolean;
  t: Record<string, string>;
}

export function QuickStats({
  totalEntities,
  docsThisWeek,
  openTasks,
  aiConversations,
  loading,
  _t,
}: QuickStatsProps) {
  const _router = useRouter();

  const cards: StatCard[] = [
    {
      label: t.totalEntities,
      value: totalEntities,
      icon: Database,
      color: "text-purple-400 bg-purple-500/15",
      href: "/dashboard/entities",
    },
    {
      label: t.docsThisWeek,
      value: docsThisWeek,
      icon: FileText,
      color: "text-blue-400 bg-blue-500/15",
      href: "/dashboard/editor",
    },
    {
      label: t.openTasks,
      value: openTasks,
      icon: ListTodo,
      color: "text-amber-400 bg-amber-500/15",
      href: "/dashboard/story-map",
    },
    {
      label: t.aiConversations,
      value: aiConversations,
      icon: Bot,
      color: "text-emerald-400 bg-emerald-500/15",
      href: "/dashboard/ai-hub",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="gam-card rounded-[var(--cc-radius-lg)] border border-white/[0.06] p-4"
          >
            <Skeleton width="2rem" height="2rem" rounded />
            <Skeleton width="3rem" height="1.5rem" className="mt-3" />
            <Skeleton width="80%" height="0.75rem" className="mt-1" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-cc-id="hub.quickStats">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.label}
            type="button"
            onClick={() => router.push(card.href)}
            className="gam-card gam-card-click rounded-[var(--cc-radius-lg)] border border-white/[0.06] p-4 text-start transition-all hover:border-white/[0.12]"
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}
            >
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-100">
              {card.value.toLocaleString()}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">{card.label}</div>
          </button>
        );
      })}
    </div>
  );
}
