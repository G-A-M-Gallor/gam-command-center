"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  Send, Plus, X, MessageCircle, BarChart3, PenTool, GitBranch,
  Trash2, Sparkles, PanelLeftClose, PanelLeftOpen, Square, Zap,
  AlertTriangle,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import { streamChat } from "@/lib/ai/client";
import { addUsage, getUsagePercent, isOverBudget, isNearBudget } from "@/lib/ai/tokenTracker";
import { MODE_MODELS, MAX_CONVERSATION_MESSAGES, type AIMode } from "@/lib/ai/prompts";
import {
  saveConversation as saveToSupabase,
  loadConversations as loadFromSupabase,
  deleteConversation as deleteFromSupabase,
} from "@/lib/supabase/aiConversationQueries";

// ─── Types ──────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  mode: AIMode;
  messages: ChatMessage[];
  title: string;
  createdAt: number;
  updatedAt: number;
  totalTokensInput: number;
  totalTokensOutput: number;
}

// ─── Constants ──────────────────────────────────────────────────────

const STORAGE_KEY = "cc-ai-hub-conversations";

const MODE_ICONS: Record<AIMode, typeof MessageCircle> = {
  chat: MessageCircle,
  analyze: BarChart3,
  write: PenTool,
  decompose: GitBranch,
};

const MODE_COLORS: Record<AIMode, string> = {
  chat: "purple",
  analyze: "blue",
  write: "emerald",
  decompose: "amber",
};

const MODEL_LABELS: Record<string, string> = {
  "claude-haiku-4-5-20251001": "Haiku 4.5",
  "claude-sonnet-4-6": "Sonnet 4.6",
};

// ─── localStorage helpers ───────────────────────────────────────────

function loadConversationsLocal(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversationsLocal(convos: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
}

// ─── Page key from pathname (for context) ───────────────────────────

const pageKeys: Record<string, string> = {
  "/dashboard/layers": "layers",
  "/dashboard/editor": "editor",
  "/dashboard/story-map": "storyMap",
  "/dashboard/functional-map": "functionalMap",
  "/dashboard/ai-hub": "aiHub",
  "/dashboard/design-system": "designSystem",
  "/dashboard/formily": "formily",
  "/dashboard/architecture": "architecture",
  "/dashboard/plan": "plan",
};

function getPageLabel(pathname: string, t: ReturnType<typeof getTranslations>): string {
  const key = pageKeys[pathname];
  if (key && key in t.tabs) return t.tabs[key as keyof typeof t.tabs];
  return pathname.split("/").pop() || "Dashboard";
}

// ─── Mode Selector (sidebar section) ────────────────────────────────

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
  ];

  return (
    <div className="space-y-1" data-cc-id="aihub.mode-selector">
      {modes.map((m) => {
        const Icon = MODE_ICONS[m.key];
        const active = mode === m.key;
        const color = MODE_COLORS[m.key];
        return (
          <button
            key={m.key}
            onClick={() => onModeChange(m.key)}
            className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-start transition-colors ${
              active
                ? `bg-${color}-500/15 text-${color}-300`
                : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
            }`}
          >
            <Icon size={16} className={`mt-0.5 shrink-0 ${active ? `text-${color}-400` : ""}`} />
            <div className="min-w-0">
              <div className="text-sm font-medium">{m.label}</div>
              <div className="text-[11px] text-slate-500 leading-tight">{m.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Conversation List ──────────────────────────────────────────────

function ConversationList({
  conversations, activeId, onSelect, onDelete, t,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof getTranslations>;
}) {
  if (conversations.length === 0) {
    return (
      <p className="px-3 py-4 text-center text-xs text-slate-600">
        {t.aiHub.noConversations}
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {conversations.map((c) => {
        const active = c.id === activeId;
        const color = MODE_COLORS[c.mode];
        return (
          <div
            key={c.id}
            className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
              active
                ? "bg-slate-700/60 text-slate-200"
                : "text-slate-400 hover:bg-slate-700/30 hover:text-slate-300"
            }`}
            onClick={() => onSelect(c.id)}
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">{c.title || t.aiHub.untitled}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block rounded px-1 py-0.5 text-[9px] font-medium bg-${color}-500/20 text-${color}-400`}>
                  {t.aiHub[`mode${c.mode.charAt(0).toUpperCase() + c.mode.slice(1)}` as keyof typeof t.aiHub]}
                </span>
                <span className="text-[10px] text-slate-600">
                  {new Date(c.updatedAt).toLocaleDateString()}
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

// ─── Mode Tab Bar (top of chat area) ────────────────────────────────

function ModeTabBar({
  mode, onModeChange, t,
}: {
  mode: AIMode;
  onModeChange: (m: AIMode) => void;
  t: ReturnType<typeof getTranslations>;
}) {
  const modes: { key: AIMode; label: string }[] = [
    { key: "chat", label: t.aiHub.modeChat },
    { key: "analyze", label: t.aiHub.modeAnalyze },
    { key: "write", label: t.aiHub.modeWrite },
    { key: "decompose", label: t.aiHub.modeDecompose },
  ];

  return (
    <div className="flex gap-1 border-b border-slate-700/50 px-4 py-2">
      {modes.map((m) => {
        const Icon = MODE_ICONS[m.key];
        const active = mode === m.key;
        const color = MODE_COLORS[m.key];
        return (
          <button
            key={m.key}
            onClick={() => onModeChange(m.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? `bg-${color}-500/15 text-${color}-300`
                : "text-slate-500 hover:bg-slate-700/50 hover:text-slate-400"
            }`}
          >
            <Icon size={13} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Suggestion chips per mode ──────────────────────────────────────

function getSuggestions(mode: AIMode, t: ReturnType<typeof getTranslations>): string[] {
  switch (mode) {
    case "chat":
      return [t.aiHub.suggestChatStatus, t.aiHub.suggestChatSummarize];
    case "analyze":
      return [t.aiHub.suggestAnalyzeHealth, t.aiHub.suggestAnalyzeAttention];
    case "write":
      return [t.aiHub.suggestWriteReport, t.aiHub.suggestWriteEmail];
    case "decompose":
      return [t.aiHub.suggestDecomposeEpic, t.aiHub.suggestDecomposeTasks];
  }
}

// ─── Token Usage Bar ────────────────────────────────────────────────

function TokenUsageBar({ t }: { t: ReturnType<typeof getTranslations> }) {
  const [percent, setPercent] = useState(0);
  const near = isNearBudget();
  const over = isOverBudget();

  useEffect(() => {
    setPercent(getUsagePercent());
    const interval = setInterval(() => setPercent(getUsagePercent()), 5000);
    return () => clearInterval(interval);
  }, []);

  const barColor = over
    ? "bg-red-500"
    : near
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="px-3 py-2" data-cc-id="aihub.token-bar">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-slate-500">{t.aiHub.tokenUsage}</span>
        <span className={`text-[10px] ${over ? "text-red-400" : near ? "text-amber-400" : "text-slate-500"}`}>
          {percent}%
        </span>
      </div>
      <div className="h-1 rounded-full bg-slate-700">
        <div
          className={`h-1 rounded-full transition-all ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {over && (
        <p className="mt-1 text-[10px] text-red-400 flex items-center gap-1">
          <AlertTriangle size={10} />
          {t.aiHub.tokenBudgetExceeded}
        </p>
      )}
      {near && !over && (
        <p className="mt-1 text-[10px] text-amber-400 flex items-center gap-1">
          <AlertTriangle size={10} />
          {t.aiHub.tokenBudgetWarning}
        </p>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function AIHubPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const pathname = usePathname();
  const isHe = language === "he";

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<AIMode>("chat");
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [contexts, setContexts] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<"idle" | "saving" | "saved" | "offline">("idle");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load conversations on mount
  useEffect(() => {
    const loaded = loadConversationsLocal();
    setConversations(loaded);
    if (loaded.length > 0) {
      setActiveId(loaded[0].id);
      setMode(loaded[0].mode);
    }
    setContexts([getPageLabel(pathname, t)]);

    // Try loading from Supabase (non-blocking)
    loadFromSupabase().then((cloudConvos) => {
      if (cloudConvos.length > 0) {
        const merged = mergeConversations(loaded, cloudConvos);
        setConversations(merged);
        saveConversationsLocal(merged);
        if (!loaded.length && merged.length > 0) {
          setActiveId(merged[0].id);
          setMode(merged[0].mode);
        }
      }
    }).catch(() => {
      setCloudStatus("offline");
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages / streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeId, isStreaming, streamingContent]);

  // Focus textarea
  useEffect(() => {
    textareaRef.current?.focus();
  }, [activeId]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Active conversation
  const activeConvo = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  const messages = activeConvo?.messages ?? [];
  const suggestions = getSuggestions(mode, t);
  const currentPageLabel = getPageLabel(pathname, t);
  const currentModel = MODE_MODELS[mode];
  const modelLabel = MODEL_LABELS[currentModel] || currentModel;

  // ─── Helpers ──────────────────────────────────────────────────────

  function mergeConversations(
    local: Conversation[],
    cloud: { id: string; mode: string; messages: { role: "user" | "assistant"; content: string; timestamp: number }[]; title?: string | null; total_tokens_input: number; total_tokens_output: number; created_at: string; updated_at: string }[]
  ): Conversation[] {
    const localMap = new Map(local.map((c) => [c.id, c]));
    for (const cc of cloud) {
      const existing = localMap.get(cc.id);
      const cloudUpdated = new Date(cc.updated_at).getTime();
      if (!existing || cloudUpdated > existing.updatedAt) {
        localMap.set(cc.id, {
          id: cc.id,
          mode: cc.mode as AIMode,
          messages: cc.messages,
          title: cc.title || "",
          createdAt: new Date(cc.created_at).getTime(),
          updatedAt: cloudUpdated,
          totalTokensInput: cc.total_tokens_input,
          totalTokensOutput: cc.total_tokens_output,
        });
      }
    }
    return Array.from(localMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  const debouncedCloudSave = useCallback((convo: Conversation) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setCloudStatus("saving");
      const ok = await saveToSupabase({
        id: convo.id,
        mode: convo.mode,
        messages: convo.messages,
        title: convo.title,
        total_tokens_input: convo.totalTokensInput,
        total_tokens_output: convo.totalTokensOutput,
      });
      setCloudStatus(ok ? "saved" : "offline");
      if (ok) {
        setTimeout(() => setCloudStatus("idle"), 2000);
      }
    }, 1500);
  }, []);

  // ─── Actions ────────────────────────────────────────────────────

  const updateConversations = useCallback((updated: Conversation[]) => {
    setConversations(updated);
    saveConversationsLocal(updated);
  }, []);

  const createNewChat = useCallback(() => {
    const newConvo: Conversation = {
      id: crypto.randomUUID(),
      mode,
      messages: [],
      title: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalTokensInput: 0,
      totalTokensOutput: 0,
    };
    const updated = [newConvo, ...conversations];
    updateConversations(updated);
    setActiveId(newConvo.id);
    setInput("");
  }, [mode, conversations, updateConversations]);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    const convo = conversations.find((c) => c.id === id);
    if (convo) setMode(convo.mode);
    setInput("");
  }, [conversations]);

  const handleDeleteConversation = useCallback((id: string) => {
    const updated = conversations.filter((c) => c.id !== id);
    updateConversations(updated);
    if (activeId === id) {
      setActiveId(updated.length > 0 ? updated[0].id : null);
    }
    deleteFromSupabase(id);
  }, [conversations, activeId, updateConversations]);

  const handleModeChange = useCallback((newMode: AIMode) => {
    setMode(newMode);
    if (activeConvo && activeConvo.messages.length === 0) {
      const updated = conversations.map((c) =>
        c.id === activeId ? { ...c, mode: newMode } : c
      );
      updateConversations(updated);
    }
  }, [activeConvo, conversations, activeId, updateConversations]);

  const addContext = useCallback(() => {
    if (!contexts.includes(currentPageLabel)) {
      setContexts((prev) => [...prev, currentPageLabel]);
    }
  }, [contexts, currentPageLabel]);

  const removeContext = useCallback((ctx: string) => {
    setContexts((prev) => prev.filter((c) => c !== ctx));
  }, []);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleSend = useCallback((text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isStreaming) return;

    // Check budget
    if (isOverBudget()) return;

    // Check conversation limit
    if (messages.length >= MAX_CONVERSATION_MESSAGES) return;

    // Auto-create conversation if none active
    let targetId = activeId;
    let currentConvos = conversations;
    if (!targetId) {
      const newConvo: Conversation = {
        id: crypto.randomUUID(),
        mode,
        messages: [],
        title: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        totalTokensInput: 0,
        totalTokensOutput: 0,
      };
      currentConvos = [newConvo, ...conversations];
      targetId = newConvo.id;
      setActiveId(targetId);
    }

    const userMsg: ChatMessage = { role: "user", content: msg, timestamp: Date.now() };

    const updated = currentConvos.map((c) => {
      if (c.id !== targetId) return c;
      const newMessages = [...c.messages, userMsg];
      return {
        ...c,
        messages: newMessages,
        title: c.title || msg.slice(0, 50),
        updatedAt: Date.now(),
      };
    });
    updateConversations(updated);
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    // Prepare messages for API
    const convo = updated.find((c) => c.id === targetId)!;
    const apiMessages = convo.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Stream response
    const controller = new AbortController();
    abortRef.current = controller;

    const finalId = targetId;

    streamChat({
      messages: apiMessages,
      mode,
      contexts,
      signal: controller.signal,
      onToken: (token) => {
        setStreamingContent((prev) => prev + token);
      },
      onDone: (usage) => {
        addUsage(usage.input_tokens, usage.output_tokens);
        setStreamingContent((prev) => {
          const assistantMsg: ChatMessage = {
            role: "assistant",
            content: prev,
            timestamp: Date.now(),
          };
          setConversations((prevConvos) => {
            const next = prevConvos.map((c) => {
              if (c.id !== finalId) return c;
              return {
                ...c,
                messages: [...c.messages, assistantMsg],
                updatedAt: Date.now(),
                totalTokensInput: c.totalTokensInput + usage.input_tokens,
                totalTokensOutput: c.totalTokensOutput + usage.output_tokens,
              };
            });
            saveConversationsLocal(next);
            const saved = next.find((c) => c.id === finalId);
            if (saved) debouncedCloudSave(saved);
            return next;
          });
          return "";
        });
        setIsStreaming(false);
        abortRef.current = null;
      },
      onError: (error) => {
        // If aborted by user, save partial content
        setStreamingContent((prev) => {
          if (prev) {
            const assistantMsg: ChatMessage = {
              role: "assistant",
              content: prev + (controller.signal.aborted ? "" : `\n\n⚠️ ${error}`),
              timestamp: Date.now(),
            };
            setConversations((prevConvos) => {
              const next = prevConvos.map((c) => {
                if (c.id !== finalId) return c;
                return { ...c, messages: [...c.messages, assistantMsg], updatedAt: Date.now() };
              });
              saveConversationsLocal(next);
              return next;
            });
          } else if (!controller.signal.aborted) {
            // No content at all — show error as system message
            const errMsg: ChatMessage = {
              role: "assistant",
              content: `⚠️ ${error}`,
              timestamp: Date.now(),
            };
            setConversations((prevConvos) => {
              const next = prevConvos.map((c) => {
                if (c.id !== finalId) return c;
                return { ...c, messages: [...c.messages, errMsg], updatedAt: Date.now() };
              });
              saveConversationsLocal(next);
              return next;
            });
          }
          return "";
        });
        setIsStreaming(false);
        abortRef.current = null;
      },
    });
  }, [input, isStreaming, activeId, conversations, mode, contexts, messages.length, updateConversations, debouncedCloudSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ─── Render ─────────────────────────────────────────────────────

  const modeColor = MODE_COLORS[mode];
  const ModeIcon = MODE_ICONS[mode];
  const atLimit = messages.length >= MAX_CONVERSATION_MESSAGES;

  return (
    <div className="flex h-full flex-col" dir={isHe ? "rtl" : "ltr"} data-cc-id="aihub.root">
      <PageHeader pageKey="aiHub">
        {/* Live mode indicator */}
        <div className="mt-2 flex items-center gap-3">
          <div data-cc-id="aihub.livemode" className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-400">
            <Zap size={11} />
            {t.aiHub.liveMode}
          </div>
          <span className="text-[11px] text-slate-500">
            {t.aiHub.modelLabel}: {modelLabel}
          </span>
          {cloudStatus === "saving" && (
            <span className="text-[11px] text-slate-500">{t.aiHub.savingToCloud}</span>
          )}
          {cloudStatus === "saved" && (
            <span className="text-[11px] text-emerald-400">{t.aiHub.savedToCloud}</span>
          )}
          {cloudStatus === "offline" && (
            <span className="text-[11px] text-amber-400">{t.aiHub.offlineMode}</span>
          )}
        </div>
      </PageHeader>

      {/* Main 2-column layout */}
      <div className="mt-6 flex flex-1 gap-0 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30">
        {/* Left sidebar */}
        {sidebarOpen && (
          <div data-cc-id="aihub.sidebar" className="flex w-[280px] shrink-0 flex-col border-e border-slate-700/50 bg-slate-800/50">
            {/* Mode selector */}
            <div className="border-b border-slate-700/50 p-3">
              <ModeSelector mode={mode} onModeChange={handleModeChange} t={t} />
            </div>

            {/* Token usage bar */}
            <div className="border-b border-slate-700/50">
              <TokenUsageBar t={t} />
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto p-2">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-600">
                  {t.aiHub.conversations}
                </span>
              </div>
              <ConversationList
                conversations={conversations}
                activeId={activeId}
                onSelect={selectConversation}
                onDelete={handleDeleteConversation}
                t={t}
              />
            </div>

            {/* New chat button */}
            <div className="border-t border-slate-700/50 p-3">
              <button
                onClick={createNewChat}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-600 px-3 py-2 text-sm text-slate-400 transition-colors hover:border-slate-500 hover:bg-slate-700/30 hover:text-slate-300"
              >
                <Plus size={14} />
                {t.aiHub.newChat}
              </button>
            </div>
          </div>
        )}

        {/* Chat area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Mode tab bar + sidebar toggle */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="shrink-0 border-e border-slate-700/50 p-2.5 text-slate-500 transition-colors hover:bg-slate-700/30 hover:text-slate-400"
              title={sidebarOpen ? "Collapse" : "Expand"}
            >
              {sidebarOpen
                ? <PanelLeftClose size={16} />
                : <PanelLeftOpen size={16} />
              }
            </button>
            <div className="flex-1">
              <ModeTabBar mode={mode} onModeChange={handleModeChange} t={t} />
            </div>
          </div>

          {/* Context bar */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-700/50 px-4 py-2">
            <span className="text-[11px] font-medium text-slate-500">
              {t.aiHub.context}:
            </span>
            {contexts.map((ctx) => (
              <span
                key={ctx}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--cc-accent-600-20)] px-2 py-0.5 text-[11px] text-[var(--cc-accent-300)]"
              >
                {ctx}
                <button
                  type="button"
                  onClick={() => removeContext(ctx)}
                  className="ms-0.5 text-[var(--cc-accent-400)] hover:text-[var(--cc-accent-300)]"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={addContext}
              className="inline-flex items-center rounded-full border border-dashed border-slate-600 px-1.5 py-0.5 text-[11px] text-slate-500 transition-colors hover:border-slate-500 hover:text-slate-400"
              title={t.aiHub.addContext}
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
          </div>

          {/* Suggestions (when empty) */}
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-wrap gap-1.5 border-b border-slate-700/50 px-4 py-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="rounded-full border border-slate-600 px-2.5 py-1 text-[11px] text-slate-400 transition-colors hover:border-slate-500 hover:bg-slate-700/50 hover:text-slate-300"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div data-cc-id="aihub.messages" className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 && !isStreaming && (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${modeColor}-500/10`}>
                  <ModeIcon size={24} className={`text-${modeColor}-400`} />
                </div>
                <p className="text-sm text-slate-500">{t.aiHub.emptyChat}</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={`${msg.timestamp}-${i}`}
                className={`mb-4 ${msg.role === "user" ? "flex justify-end" : ""}`}
              >
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--cc-accent-600-30)] text-slate-100"
                      : "bg-slate-700/50 text-slate-300"
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Streaming content */}
            {isStreaming && streamingContent && (
              <div className="mb-4">
                <div
                  className="max-w-[75%] rounded-xl bg-slate-700/50 px-4 py-3 text-sm leading-relaxed text-slate-300"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {streamingContent}
                  <span className="inline-block w-0.5 h-4 bg-slate-300 animate-pulse ms-0.5 align-text-bottom" />
                </div>
              </div>
            )}

            {/* Typing indicator (before streaming starts) */}
            {isStreaming && !streamingContent && (
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 rounded-xl bg-slate-700/50 px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                  <span className="text-xs text-slate-500 ms-1">{t.aiHub.streaming}</span>
                </div>
              </div>
            )}

            {/* Conversation limit warning */}
            {atLimit && (
              <div className="mb-4 flex items-center justify-center">
                <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                  {t.aiHub.conversationLimit}
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div data-cc-id="aihub.input" className="border-t border-slate-700/50 px-4 py-3">
            <div className="flex items-end gap-2">
              {/* Mode badge */}
              <div className={`mb-1.5 flex shrink-0 items-center gap-1 rounded-md bg-${modeColor}-500/10 px-2 py-1`}>
                <ModeIcon size={12} className={`text-${modeColor}-400`} />
                <span className={`text-[10px] font-medium text-${modeColor}-400`}>
                  {t.aiHub[`mode${mode.charAt(0).toUpperCase() + mode.slice(1)}` as keyof typeof t.aiHub]}
                </span>
              </div>

              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={atLimit ? t.aiHub.conversationLimit : t.aiHub.typePlaceholder}
                  rows={1}
                  disabled={atLimit}
                  dir={isHe ? "rtl" : "ltr"}
                  className="w-full resize-none rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2.5 pe-10 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-[var(--cc-accent-500)] transition-colors disabled:opacity-40"
                  style={{ maxHeight: 120 }}
                />
                {input.length > 0 && (
                  <span className="absolute bottom-1 end-10 text-[10px] text-slate-600">
                    {input.length}
                  </span>
                )}
              </div>

              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white transition-colors hover:bg-red-500"
                  title={t.aiHub.stopGeneration}
                >
                  <Square size={13} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isOverBudget() || atLimit}
                  className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--cc-accent-600)] text-white transition-colors hover:bg-[var(--cc-accent-500)] disabled:opacity-40"
                  title={t.aiHub.sendMessage}
                >
                  <Send size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
