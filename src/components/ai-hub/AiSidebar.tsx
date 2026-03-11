"use client";

import { useState, useEffect } from "react";
import {
  Plus, Trash2, AlertTriangle, BookOpen, Search, X,
} from "lucide-react";
import { getTranslations } from "@/lib/i18n";
import { getUsagePercent, isOverBudget, isNearBudget } from "@/lib/ai/tokenTracker";
import type { AIMode } from "@/lib/ai/prompts";
import { MODE_ICONS, MODE_COLORS } from "./types";
import type { Conversation } from "./types";

// ─── Mode Selector ──────────────────────────────────────────────

function ModeSelector({
  mode, onModeChange, t,
}: {
  mode: AIMode;
  onModeChange: (m: AIMode) => void;
  t: ReturnType<typeof getTranslations>;
}) {
  const modes: { key: AIMode; label: string; desc: string }[] = [
    { key: "chat", label: t.aiHub.modeChat, desc: t.aiHub.modeChatDesc },
    { key: "analyze", label: t.aiHub.modeAnalyze, desc: t.aiHub.modeAnalyzeDesc },
    { key: "write", label: t.aiHub.modeWrite, desc: t.aiHub.modeWriteDesc },
    { key: "decompose", label: t.aiHub.modeDecompose, desc: t.aiHub.modeDecomposeDesc },
    { key: "work", label: t.aiHub.modeWork, desc: t.aiHub.modeWorkDesc },
  ];

  return (
    <div className="space-y-0.5" data-cc-id="aihub.mode-selector">
      {modes.map((m) => {
        const Icon = MODE_ICONS[m.key];
        const active = mode === m.key;
        const color = MODE_COLORS[m.key];
        return (
          <button
            key={m.key}
            onClick={() => onModeChange(m.key)}
            className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-start transition-all ${
              active
                ? `bg-${color}-500/15 text-${color}-300 shadow-sm shadow-${color}-500/10`
                : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
            }`}
          >
            <Icon size={15} className={`mt-0.5 shrink-0 ${active ? `text-${color}-400` : ""}`} />
            <div className="min-w-0">
              <div className="text-[13px] font-medium">{m.label}</div>
              <div className="text-[10px] text-slate-500 leading-tight">{m.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Token Usage Bar ────────────────────────────────────────────

function TokenUsageBar({ t }: { t: ReturnType<typeof getTranslations> }) {
  const [percent, setPercent] = useState(0);
  const near = isNearBudget();
  const over = isOverBudget();

  useEffect(() => {
    setPercent(getUsagePercent());
    const interval = setInterval(() => setPercent(getUsagePercent()), 5000);
    return () => clearInterval(interval);
  }, []);

  const barColor = over ? "bg-red-500" : near ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="px-3 py-2.5" data-cc-id="aihub.token-bar">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-slate-500">{t.aiHub.tokenUsage}</span>
        <span className={`text-[10px] font-medium ${over ? "text-red-400" : near ? "text-amber-400" : "text-slate-500"}`}>
          {percent}%
        </span>
      </div>
      <div className="h-1 rounded-full bg-slate-700/80">
        <div
          className={`h-1 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      {over && (
        <p className="mt-1.5 text-[10px] text-red-400 flex items-center gap-1">
          <AlertTriangle size={10} />
          {t.aiHub.tokenBudgetExceeded}
        </p>
      )}
      {near && !over && (
        <p className="mt-1.5 text-[10px] text-amber-400 flex items-center gap-1">
          <AlertTriangle size={10} />
          {t.aiHub.tokenBudgetWarning}
        </p>
      )}
    </div>
  );
}

// ─── Conversation List ──────────────────────────────────────────

function ConversationList({
  conversations, activeId, onSelect, onDelete, searchQuery, t,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  searchQuery: string;
  t: ReturnType<typeof getTranslations>;
}) {
  const filtered = searchQuery
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : conversations;

  if (filtered.length === 0) {
    return (
      <p className="px-3 py-4 text-center text-xs text-slate-600">
        {searchQuery ? t.common.noResults : t.aiHub.noConversations}
      </p>
    );
  }

  const now = Date.now();
  function relativeTime(ts: number): string {
    const diff = now - ts;
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  }

  return (
    <div className="space-y-0.5">
      {filtered.map((c) => {
        const active = c.id === activeId;
        const color = MODE_COLORS[c.mode];
        const ModeIcon = MODE_ICONS[c.mode];
        return (
          <div
            key={c.id}
            className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 cursor-pointer transition-all ${
              active
                ? "bg-slate-700/70 text-slate-200 shadow-sm"
                : "text-slate-400 hover:bg-slate-700/30 hover:text-slate-300"
            }`}
            onClick={() => onSelect(c.id)}
          >
            <ModeIcon size={14} className={`shrink-0 text-${color}-400/60`} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px]">{c.title || t.aiHub.untitled}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block rounded px-1 py-0.5 text-[9px] font-medium bg-${color}-500/20 text-${color}-400`}>
                  {t.aiHub[`mode${c.mode.charAt(0).toUpperCase() + c.mode.slice(1)}` as keyof typeof t.aiHub]}
                </span>
                <span className="text-[10px] text-slate-600">
                  {relativeTime(c.updatedAt)}
                </span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
              className="shrink-0 rounded p-1 text-slate-600 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
              title={t.aiHub.deleteConversation}
            >
              <Trash2 size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Sidebar ───────────────────────────────────────────────

interface AiSidebarProps {
  mode: AIMode;
  onModeChange: (m: AIMode) => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
  onKnowledgeOpen: () => void;
  isMobile: boolean;
  t: ReturnType<typeof getTranslations>;
}

export function AiSidebar({
  mode, onModeChange, conversations, activeId, onSelect, onDelete,
  onNewChat, onKnowledgeOpen, isMobile, t,
}: AiSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div
      data-cc-id="aihub.sidebar"
      className={`flex shrink-0 flex-col overflow-hidden border-e border-slate-700/50 ${
        isMobile
          ? "fixed inset-y-0 start-0 z-50 w-[280px] max-w-[calc(100vw-56px)] shadow-xl bg-slate-900/95 backdrop-blur-md"
          : "w-[280px] bg-slate-900/80 backdrop-blur-sm"
      }`}
    >
      {/* Mode selector */}
      <div className="border-b border-slate-700/50 p-3">
        <ModeSelector mode={mode} onModeChange={onModeChange} t={t} />
      </div>

      {/* Token usage bar */}
      <div className="border-b border-slate-700/50">
        <TokenUsageBar t={t} />
      </div>

      {/* Knowledge base button */}
      <div className="border-b border-slate-700/50 px-3 py-2">
        <button
          onClick={onKnowledgeOpen}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-300"
        >
          <BookOpen size={14} />
          {t.aiHub.knowledgeBase}
        </button>
      </div>

      {/* Conversation search */}
      <div className="border-b border-slate-700/50 px-3 py-2">
        <div className="relative">
          <Search size={13} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.aiHub.searchConversations}
            className="w-full rounded-lg bg-slate-800/80 py-1.5 ps-8 pe-8 text-[12px] text-slate-300 placeholder-slate-600 outline-none border border-slate-700/50 focus:border-slate-600 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
            {t.aiHub.conversations}
          </span>
          <span className="text-[10px] text-slate-600">
            {conversations.length}
          </span>
        </div>
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={onSelect}
          onDelete={onDelete}
          searchQuery={searchQuery}
          t={t}
        />
      </div>

      {/* New chat button */}
      <div className="border-t border-slate-700/50 p-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-600 px-3 py-2.5 text-sm text-slate-400 transition-all hover:border-[var(--cc-accent-500)] hover:bg-[var(--cc-accent-600-10)] hover:text-slate-300"
        >
          <Plus size={14} />
          {t.aiHub.newChat}
        </button>
      </div>
    </div>
  );
}
