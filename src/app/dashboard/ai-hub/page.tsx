"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import { streamChat, streamWorkManager } from "@/lib/ai/client";
import { addUsage, isOverBudget } from "@/lib/ai/tokenTracker";
import { getPersonaById } from "@/lib/ai/personas";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { fetchNote } from "@/lib/supabase/entityQueries";
import { MODE_MODELS, MAX_CONVERSATION_MESSAGES, type AIMode } from "@/lib/ai/prompts";
import { usePageContext } from "@/lib/ai/usePageContext";
import {
  saveConversation as saveToSupabase,
  loadConversations as loadFromSupabase,
  deleteConversation as deleteFromSupabase,
} from "@/lib/supabase/aiConversationQueries";

import { AiSidebar } from "@/components/ai-hub/AiSidebar";
import { AiChatArea } from "@/components/ai-hub/AiChatArea";
import { AiDocPanel } from "@/components/ai-hub/AiDocPanel";
import { AiKnowledgeDialog, getKnowledgeUrlsForMode } from "@/components/ai-hub/AiKnowledgeDialog";
import type { ChatMessage, Conversation, ImageAttachment } from "@/components/ai-hub/types";
import { STORAGE_KEY, MODEL_LABELS } from "@/components/ai-hub/types";

// ─── localStorage helpers ───────────────────────────────────────

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

// ─── Page key helpers ───────────────────────────────────────────

const pageKeys: Record<string, string> = {
  "/dashboard/layers": "layers",
  "/dashboard/editor": "editor",
  "/dashboard/story-map": "storyMap",
  "/dashboard/functional-map": "functionalMap",
  "/dashboard/ai-hub": "aiHub",
  "/dashboard/design-system": "designSystem",
  "/dashboard/architecture": "architecture",
  "/dashboard/plan": "plan",
};

function getPageLabel(pathname: string, t: ReturnType<typeof getTranslations>): string {
  const key = pageKeys[pathname];
  if (key && key in t.tabs) return t.tabs[key as keyof typeof t.tabs];
  return pathname.split("/").pop() || "Dashboard";
}

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

// ─── Main Page ──────────────────────────────────────────────────

export default function AIHubPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const pathname = usePathname();
  const isRtl = language === "he";

  // ─── State ──────────────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<AIMode>("chat");
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [contexts, setContexts] = useState<string[]>([]);
  const { buildRichContexts } = usePageContext();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<"idle" | "saving" | "saved" | "offline">("idle");
  const [dismissedActions, setDismissedActions] = useState<Set<string>>(() => new Set());
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const agentRef = useRef<string | null>(null);

  // New feature state
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionEntities, setMentionEntities] = useState<{ id: string; title: string; entity_type: string | null }[]>([]);
  const [docPanelOpen, setDocPanelOpen] = useState(false);
  const [docContext, setDocContext] = useState<{ id: string; title: string; content: string; entityType: string | null } | null>(null);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Effects ────────────────────────────────────────────────

  useEffect(() => {
    if (!isMobile) setSidebarOpen(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  // Load conversations on mount
  useEffect(() => {
    const loaded = loadConversationsLocal();
    setConversations(loaded);
    if (loaded.length > 0) {
      setActiveId(loaded[0].id);
      setMode(loaded[0].mode);
    }
    setContexts([getPageLabel(pathname, t)]);

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

  useEffect(() => {
    textareaRef.current?.focus();
  }, [activeId]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // ─── Derived ────────────────────────────────────────────────

  const activeConvo = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );
  const messages = activeConvo?.messages ?? [];
  const currentPageLabel = getPageLabel(pathname, t);
  const currentModel = MODE_MODELS[mode];
  const modelLabel = MODEL_LABELS[currentModel] || currentModel;

  // ─── Helpers ────────────────────────────────────────────────

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
      if (ok) setTimeout(() => setCloudStatus("idle"), 2000);
    }, 1500);
  }, []);

  const updateConversations = useCallback((updated: Conversation[]) => {
    setConversations(updated);
    saveConversationsLocal(updated);
  }, []);

  // ─── Actions ────────────────────────────────────────────────

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
    updateConversations([newConvo, ...conversations]);
    setActiveId(newConvo.id);
    setInput("");
    setReplyingTo(null);
    setAttachments([]);
    setMentionEntities([]);
  }, [mode, conversations, updateConversations]);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    const convo = conversations.find((c) => c.id === id);
    if (convo) setMode(convo.mode);
    setInput("");
    setReplyingTo(null);
    setAttachments([]);
    if (isMobile) setSidebarOpen(false);
  }, [conversations, isMobile]);

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

  // ─── Entity Mention ─────────────────────────────────────────

  const handleMentionSelect = useCallback(async (entity: { id: string; title: string; entity_type: string | null }) => {
    setMentionOpen(false);
    setMentionEntities((prev) => [...prev, entity]);

    // Insert @[Title] token into input
    const token = `@[${entity.title}] `;
    setInput((prev) => prev + token);
    textareaRef.current?.focus();
  }, []);

  // ─── Send Message ───────────────────────────────────────────

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg && attachments.length === 0) return;
    if (isStreaming) return;
    if (isOverBudget()) return;
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

    // Build user message
    let messageContent = msg;

    // Prepend reply context
    if (replyingTo) {
      messageContent = `> In reply to: "${replyingTo.content.slice(0, 200)}"\n\n${messageContent}`;
    }

    // Extract entity mention IDs and fetch context
    const entityContexts: string[] = [];
    if (mentionEntities.length > 0) {
      for (const entity of mentionEntities) {
        try {
          const note = await fetchNote(entity.id);
          if (note) {
            const metaSummary = note.meta
              ? Object.entries(note.meta as Record<string, unknown>)
                  .filter(([k]) => !k.startsWith("__"))
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ")
                  .slice(0, 500)
              : "";
            entityContexts.push(
              `@Entity: ${note.title} (${note.entity_type || "note"}) — ${metaSummary}`
            );
          }
        } catch {
          // skip
        }
      }
    }

    const userMsg: ChatMessage = {
      role: "user",
      content: messageContent,
      timestamp: Date.now(),
      ...(attachments.length > 0 ? {
        images: attachments.map((a) => ({ base64: a.base64, mediaType: a.mediaType })),
      } : {}),
      ...(replyingTo ? { replyTo: { content: replyingTo.content, timestamp: replyingTo.timestamp } } : {}),
    };

    const updated = currentConvos.map((c) => {
      if (c.id !== targetId) return c;
      return {
        ...c,
        messages: [...c.messages, userMsg],
        title: c.title || (msg || "Image").slice(0, 50),
        updatedAt: Date.now(),
      };
    });
    updateConversations(updated);
    setInput("");
    setReplyingTo(null);
    setAttachments([]);
    setMentionEntities([]);
    setIsStreaming(true);
    setStreamingContent("");

    // Prepare messages for API
    const convo = updated.find((c) => c.id === targetId)!;
    const apiMessages = convo.messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.images ? { images: m.images } : {}),
    }));

    const controller = new AbortController();
    abortRef.current = controller;
    const finalId = targetId;

    // Build rich contexts
    const richContexts = await buildRichContexts(contexts);

    // Add doc panel context
    if (docContext) {
      richContexts.push(`📄 Document: ${docContext.title}\n${docContext.content.slice(0, 2000)}`);
    }

    // Add entity contexts
    richContexts.push(...entityContexts);

    // Add persona context
    if (selectedPersona) {
      const persona = getPersonaById(selectedPersona);
      if (persona) {
        richContexts.unshift(`🎭 Active Persona: ${persona.name.he}\n${persona.instructions}`);
      }
    }

    // Add knowledge URL contexts (parallel fetch)
    const knowledgeUrls = getKnowledgeUrlsForMode(mode);
    if (knowledgeUrls.length > 0) {
      const results = await Promise.allSettled(
        knowledgeUrls.map(async (url) => {
          const res = await fetch("/api/ai/fetch-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return `📎 Knowledge (${url}): ${data.content?.slice(0, 1500) || ""}`;
        })
      );
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          richContexts.push(r.value);
        }
      }
    }

    // Get auth token
    const supabase = createBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const authToken = sessionData?.session?.access_token;

    // Stream callbacks
    const streamCallbacks = {
      token: authToken,
      signal: controller.signal,
      onToken: (token: string) => {
        setStreamingContent((prev) => prev + token);
      },
      onDone: (usage: { input_tokens: number; output_tokens: number }) => {
        addUsage(usage.input_tokens, usage.output_tokens);
        setStreamingContent((prev) => {
          const assistantMsg: ChatMessage = {
            role: "assistant",
            content: prev,
            timestamp: Date.now(),
            ...(agentRef.current ? { agent: agentRef.current } : {}),
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
      onError: (error: string) => {
        setStreamingContent((prev) => {
          if (prev) {
            const assistantMsg: ChatMessage = {
              role: "assistant",
              content: prev + (controller.signal.aborted ? "" : `\n\n⚠️ ${error}`),
              timestamp: Date.now(),
              ...(agentRef.current ? { agent: agentRef.current } : {}),
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
            const errMsg: ChatMessage = {
              role: "assistant",
              content: `⚠️ ${error}`,
              timestamp: Date.now(),
              ...(agentRef.current ? { agent: agentRef.current } : {}),
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
    };

    if (mode === "work") {
      setCurrentAgent(null);
      agentRef.current = null;
      streamWorkManager({
        messages: apiMessages,
        session_id: targetId!,
        user_id: convo.id,
        current_view: { page: pathname },
        onAgent: (a) => { setCurrentAgent(a); agentRef.current = a; },
        ...streamCallbacks,
      });
    } else {
      streamChat({
        messages: apiMessages,
        mode,
        contexts: richContexts,
        ...streamCallbacks,
      });
    }
  }, [input, isStreaming, activeId, conversations, mode, contexts, messages.length,
      updateConversations, debouncedCloudSave, pathname, buildRichContexts,
      replyingTo, attachments, mentionEntities, docContext, selectedPersona]);

  // ─── Regenerate last message ────────────────────────────────

  const handleRegenerate = useCallback(() => {
    if (isStreaming || messages.length < 2) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;

    // Remove last assistant message
    const updated = conversations.map((c) => {
      if (c.id !== activeId) return c;
      const newMsgs = [...c.messages];
      if (newMsgs[newMsgs.length - 1]?.role === "assistant") {
        newMsgs.pop();
      }
      return { ...c, messages: newMsgs, updatedAt: Date.now() };
    });
    updateConversations(updated);

    // Re-send last user message
    handleSend(lastUser.content);
  }, [isStreaming, messages, conversations, activeId, updateConversations, handleSend]);

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-48px)] flex-col" dir={isRtl ? "rtl" : "ltr"} data-cc-id="aihub.root">
      <PageHeader pageKey="aiHub">
        <div className="mt-2 flex items-center gap-3">
          <div data-cc-id="aihub.livemode" className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-400">
            <Zap size={11} />
            {t.aiHub.liveMode}
          </div>
          <span className="text-[11px] text-slate-500">
            {t.aiHub.modelLabel}: {modelLabel}
          </span>
        </div>
      </PageHeader>

      {/* Main layout */}
      <div className="mt-6 flex flex-1 min-h-0 gap-0 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30">
        {/* Mobile overlay */}
        {sidebarOpen && isMobile && (
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        {sidebarOpen && (
          <AiSidebar
            mode={mode}
            onModeChange={handleModeChange}
            conversations={conversations}
            activeId={activeId}
            onSelect={selectConversation}
            onDelete={handleDeleteConversation}
            onNewChat={createNewChat}
            onKnowledgeOpen={() => setKnowledgeOpen(true)}
            isMobile={isMobile}
            t={t}
          />
        )}

        {/* Chat area */}
        <AiChatArea
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          docPanelOpen={docPanelOpen}
          onToggleDocPanel={() => setDocPanelOpen(!docPanelOpen)}
          docTitle={docContext?.title ?? null}
          mode={mode}
          onModeChange={handleModeChange}
          activeConvo={activeConvo}
          activeId={activeId}
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          currentAgent={currentAgent}
          contexts={contexts}
          onAddContext={addContext}
          onRemoveContext={removeContext}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          onStop={stopGeneration}
          replyingTo={replyingTo}
          onReply={setReplyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onRegenerate={handleRegenerate}
          attachments={attachments}
          onAddAttachment={(att) => setAttachments((prev) => [...prev, att])}
          onRemoveAttachment={(idx) => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
          mentionOpen={mentionOpen}
          onMentionOpen={() => setMentionOpen(true)}
          onMentionClose={() => setMentionOpen(false)}
          onMentionSelect={handleMentionSelect}
          selectedPersona={selectedPersona}
          onPersonaChange={setSelectedPersona}
          dismissedActions={dismissedActions}
          onDismissAction={(key) => setDismissedActions((prev) => new Set(prev).add(key))}
          onNewChat={createNewChat}
          cloudStatus={cloudStatus}
          textareaRef={textareaRef}
          t={t}
          isRtl={isRtl}
          language={language}
        />

        {/* Document panel */}
        <AiDocPanel
          isOpen={docPanelOpen}
          onClose={() => { setDocPanelOpen(false); setDocContext(null); }}
          onDocChange={setDocContext}
          t={t}
        />
      </div>

      {/* Knowledge dialog */}
      <AiKnowledgeDialog
        isOpen={knowledgeOpen}
        onClose={() => setKnowledgeOpen(false)}
        mode={mode}
        t={t}
      />
    </div>
  );
}
