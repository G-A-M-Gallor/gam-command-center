"use client";

import { useEffect, useRef } from "react";
import { Plus, X, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, FileText, Sparkles } from "lucide-react";
import { getTranslations } from "@/lib/i18n";
import { MAX_CONVERSATION_MESSAGES, MODE_MODELS, type AIMode } from "@/lib/ai/prompts";
import { AiMessage, StreamingMessage, TypingIndicator } from "./AiMessage";
import { AiInputBar } from "./AiInputBar";
import { AiEntityMention } from "./AiEntityMention";
import type { ChatMessage, Conversation, ImageAttachment } from "./types";
import { MODE_ICONS, MODE_COLORS, MODEL_LABELS } from "./types";

interface AiChatAreaProps {
  // Sidebar toggle
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  // Doc panel toggle
  docPanelOpen: boolean;
  onToggleDocPanel: () => void;
  // Doc context chip
  docTitle: string | null;
  // Mode
  mode: AIMode;
  onModeChange: (m: AIMode) => void;
  // Conversation
  activeConvo: Conversation | null;
  activeId: string | null;
  // Messages
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  currentAgent: string | null;
  // Context
  contexts: string[];
  onAddContext: () => void;
  onRemoveContext: (ctx: string) => void;
  // Input
  input: string;
  onInputChange: (v: string) => void;
  onSend: (text?: string) => void;
  onStop: () => void;
  // Reply
  replyingTo: ChatMessage | null;
  onReply: (msg: ChatMessage) => void;
  onCancelReply: () => void;
  // Regenerate
  onRegenerate: () => void;
  // Images
  attachments: ImageAttachment[];
  onAddAttachment: (att: ImageAttachment) => void;
  onRemoveAttachment: (idx: number) => void;
  // Entity mention
  mentionOpen: boolean;
  onMentionOpen: (caretPos: number) => void;
  onMentionClose: () => void;
  onMentionSelect: (entity: { id: string; title: string; entity_type: string | null }) => void;
  // Actions
  dismissedActions: Set<string>;
  onDismissAction: (key: string) => void;
  // New chat
  onNewChat: () => void;
  // Cloud status
  cloudStatus: "idle" | "saving" | "saved" | "offline";
  // Misc
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  t: ReturnType<typeof getTranslations>;
  isHe: boolean;
  language: "he" | "en" | "ru";
}

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
    case "work":
      return [t.aiHub.workSuggestStatus, t.aiHub.workSuggestNext, t.aiHub.workSuggestDecisions, t.aiHub.workSuggestPriority];
  }
}

// Mode Tab Bar
function ModeTabBar({
  mode, onModeChange, onNewChat, t,
}: {
  mode: AIMode;
  onModeChange: (m: AIMode) => void;
  onNewChat: () => void;
  t: ReturnType<typeof getTranslations>;
}) {
  const modes: { key: AIMode; label: string }[] = [
    { key: "chat", label: t.aiHub.modeChat },
    { key: "analyze", label: t.aiHub.modeAnalyze },
    { key: "write", label: t.aiHub.modeWrite },
    { key: "decompose", label: t.aiHub.modeDecompose },
    { key: "work", label: t.aiHub.modeWork },
  ];

  return (
    <div className="flex items-center gap-1">
      {modes.map((m) => {
        const Icon = MODE_ICONS[m.key];
        const active = mode === m.key;
        const color = MODE_COLORS[m.key];
        return (
          <button
            key={m.key}
            onClick={() => onModeChange(m.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              active
                ? `bg-${color}-500/15 text-${color}-300 shadow-sm shadow-${color}-500/5`
                : "text-slate-500 hover:bg-slate-700/50 hover:text-slate-400"
            }`}
          >
            <Icon size={13} />
            {m.label}
          </button>
        );
      })}

      {/* New chat button in header */}
      <div className="ms-auto">
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-700/50 hover:text-slate-400"
          title={`${t.aiHub.newChat} (Cmd+Shift+N)`}
        >
          <Sparkles size={13} />
          {t.aiHub.newChat}
        </button>
      </div>
    </div>
  );
}

export function AiChatArea(props: AiChatAreaProps) {
  const {
    sidebarOpen, onToggleSidebar, docPanelOpen, onToggleDocPanel, docTitle,
    mode, onModeChange, activeConvo, activeId,
    messages, isStreaming, streamingContent, currentAgent,
    contexts, onAddContext, onRemoveContext,
    input, onInputChange, onSend, onStop,
    replyingTo, onReply, onCancelReply, onRegenerate,
    attachments, onAddAttachment, onRemoveAttachment,
    mentionOpen, onMentionOpen, onMentionClose, onMentionSelect,
    dismissedActions, onDismissAction, onNewChat, cloudStatus,
    textareaRef, t, isHe, language,
  } = props;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modeColor = MODE_COLORS[mode];
  const ModeIcon = MODE_ICONS[mode];
  const currentModel = MODE_MODELS[mode];
  const modelLabel = MODEL_LABELS[currentModel] || currentModel;
  const atLimit = messages.length >= MAX_CONVERSATION_MESSAGES;
  const suggestions = getSuggestions(mode, t);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming, streamingContent]);

  // Keyboard shortcut: Cmd+Shift+N
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "N") {
        e.preventDefault();
        onNewChat();
      }
    }
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [onNewChat]);

  return (
    <div className="flex flex-1 flex-col min-w-0">
      {/* Header bar */}
      <div className="flex items-center border-b border-slate-700/50">
        <button
          onClick={onToggleSidebar}
          className="shrink-0 border-e border-slate-700/50 p-2.5 text-slate-500 transition-colors hover:bg-slate-700/30 hover:text-slate-400"
        >
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
        <div className="flex-1 px-3 py-2">
          <ModeTabBar mode={mode} onModeChange={onModeChange} onNewChat={onNewChat} t={t} />
        </div>
        <button
          onClick={onToggleDocPanel}
          className={`shrink-0 border-s border-slate-700/50 p-2.5 transition-colors ${
            docPanelOpen ? "text-[var(--cc-accent-400)] bg-[var(--cc-accent-600-10)]" : "text-slate-500 hover:bg-slate-700/30 hover:text-slate-400"
          }`}
          title={t.aiHub.docPanel}
        >
          {docPanelOpen ? <PanelRightClose size={16} /> : <FileText size={16} />}
        </button>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 border-b border-slate-700/50 px-4 py-1.5">
        <span className="text-[10px] text-slate-500">
          {modelLabel}
        </span>
        {mode === "work" && (
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            {t.aiHub.workConnected}
          </span>
        )}
        {cloudStatus === "saving" && <span className="text-[10px] text-slate-500">{t.aiHub.savingToCloud}</span>}
        {cloudStatus === "saved" && <span className="text-[10px] text-emerald-400">{t.aiHub.savedToCloud}</span>}
        {cloudStatus === "offline" && <span className="text-[10px] text-amber-400">{t.aiHub.offlineMode}</span>}
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
              onClick={() => onRemoveContext(ctx)}
              className="ms-0.5 text-[var(--cc-accent-400)] hover:text-[var(--cc-accent-300)]"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        {docTitle && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] text-blue-300">
            <FileText className="h-2.5 w-2.5" />
            {docTitle}
          </span>
        )}
        <button
          type="button"
          onClick={onAddContext}
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
              onClick={() => onSend(s)}
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
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-${modeColor}-500/10 shadow-lg shadow-${modeColor}-500/5`}>
              <ModeIcon size={28} className={`text-${modeColor}-400`} />
            </div>
            <p className="text-sm text-slate-500">{t.aiHub.emptyChat}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <AiMessage
            key={`${msg.timestamp}-${i}`}
            message={msg}
            index={i}
            isWorkMode={activeConvo?.mode === "work"}
            language={language}
            currentAgent={currentAgent}
            mode={mode}
            activeId={activeId}
            isDismissed={dismissedActions.has(`${msg.timestamp}-${i}`)}
            onDismiss={onDismissAction}
            onReply={onReply}
            onRegenerate={i === messages.length - 1 && msg.role === "assistant" ? onRegenerate : undefined}
            isLast={i === messages.length - 1}
            t={t}
          />
        ))}

        {/* Streaming content */}
        {isStreaming && streamingContent && (
          <StreamingMessage
            content={streamingContent}
            mode={mode}
            currentAgent={currentAgent}
            language={language}
          />
        )}

        {/* Typing indicator */}
        {isStreaming && !streamingContent && (
          <TypingIndicator t={t} />
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

      {/* Entity mention dropdown */}
      <div className="relative px-4">
        <AiEntityMention
          isOpen={mentionOpen}
          onClose={onMentionClose}
          onSelect={onMentionSelect}
          t={t}
        />
      </div>

      {/* Input area */}
      <AiInputBar
        input={input}
        onInputChange={onInputChange}
        onSend={onSend}
        onStop={onStop}
        isStreaming={isStreaming}
        mode={mode}
        atLimit={atLimit}
        replyingTo={replyingTo}
        onCancelReply={onCancelReply}
        attachments={attachments}
        onAddAttachment={onAddAttachment}
        onRemoveAttachment={onRemoveAttachment}
        onAtTrigger={onMentionOpen}
        textareaRef={textareaRef}
        t={t}
        isHe={isHe}
        language={language}
      />
    </div>
  );
}
