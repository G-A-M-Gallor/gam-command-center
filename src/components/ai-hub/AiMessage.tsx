"use client";

import { useState } from "react";
import { Copy, Check, Reply, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { parseAction, parseConfidence, type ConfidenceLevel } from "@/lib/work-manager/parseAction";
import { AGENT_LABELS, AGENT_ICONS, type AgentType } from "@/lib/work-manager/agentPrompts";
import { ActionPreview } from "@/components/work-manager/ActionPreview";
import { Workflow, ClipboardList, Code2, Palette, ShieldCheck, TrendingUp } from "lucide-react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { getTranslations } from "@/lib/i18n";
import type { ChatMessage } from "./types";
import type { AIMode } from "@/lib/ai/prompts";

const AGENT_ICON_COMPONENTS: Record<string, typeof Workflow> = {
  Workflow, ClipboardList, Code2, Palette, ShieldCheck, TrendingUp,
};

interface AiMessageProps {
  message: ChatMessage;
  index: number;
  isWorkMode: boolean;
  language: "he" | "en" | "ru";
  currentAgent: string | null;
  mode: AIMode;
  activeId: string | null;
  isDismissed: boolean;
  onDismiss: (key: string) => void;
  onReply: (msg: ChatMessage) => void;
  onRegenerate?: () => void;
  isLast: boolean;
  t: ReturnType<typeof getTranslations>;
}

export function AiMessage({
  message, index, isWorkMode, language, currentAgent, activeId,
  isDismissed, onDismiss, onReply, onRegenerate, isLast, t,
}: AiMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(false);
  const isAssistant = message.role === "assistant";

  const parsed = isAssistant ? parseAction(message.content) : null;
  const afterAction = parsed ? parsed.text : message.content;
  const action = parsed?.action ?? null;
  const confidenceParsed = isAssistant ? parseConfidence(afterAction) : null;
  const displayText = confidenceParsed ? confidenceParsed.text : afterAction;
  const confidence: ConfidenceLevel = confidenceParsed?.confidence ?? null;

  const confidenceConfig: Record<"high" | "medium" | "low", { dot: string; label: string }> = {
    high: { dot: "bg-emerald-400", label: t.aiHub.confidenceHigh },
    medium: { dot: "bg-amber-400", label: t.aiHub.confidenceMedium },
    low: { dot: "bg-red-400", label: t.aiHub.confidenceLow },
  };

  const msgAgent = message.agent || (isAssistant && isWorkMode ? currentAgent : null);
  const agentKey = msgAgent ? (msgAgent as AgentType) : null;
  const iconName = agentKey ? AGENT_ICONS[agentKey] : undefined;
  const AgentIconComponent = iconName && iconName in AGENT_ICON_COMPONENTS ? AGENT_ICON_COMPONENTS[iconName] : null;
  const agentLabel = agentKey
    ? AGENT_LABELS[agentKey]?.[language] ?? AGENT_LABELS[agentKey]?.en
    : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dismissKey = `${message.timestamp}-${index}`;

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`group mb-4 ${message.role === "user" ? "flex justify-end" : ""}`}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      <div className={`${isAssistant ? "max-w-[80%]" : "max-w-[75%]"}`}>
        {/* Reply quote */}
        {message.replyTo && (
          <div className="mb-1.5 rounded-lg border-s-2 border-[var(--cc-accent-500)] bg-slate-800/60 px-3 py-1.5 text-[11px] text-slate-500">
            {message.replyTo.content.slice(0, 200)}
          </div>
        )}

        {/* Agent label */}
        {isAssistant && agentLabel && AgentIconComponent && (
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <AgentIconComponent className="h-3 w-3" />
            <span>{agentLabel}</span>
          </div>
        )}

        {/* Image thumbnails */}
        {message.images && message.images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {message.images.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- dynamic data URL
              <img
                key={i}
                src={`data:${img.mediaType};base64,${img.base64}`}
                alt=""
                className="h-20 w-20 rounded-lg object-cover border border-slate-600"
              />
            ))}
          </div>
        )}

        {/* Message bubble */}
        {isAssistant ? (
          <div className="rounded-xl px-4 py-3 text-sm leading-relaxed bg-slate-700/50 text-slate-300 prose prose-sm prose-invert max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:mb-1 prose-headings:mt-2 prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-600 prose-code:text-amber-300 prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown>{displayText}</ReactMarkdown>
          </div>
        ) : (
          <div className="rounded-xl px-4 py-3 text-sm leading-relaxed bg-[var(--cc-accent-600-30)] text-slate-100 border border-[var(--cc-accent-500)]/10 prose prose-sm prose-invert max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:mb-1 prose-headings:mt-2 prose-code:text-amber-300 prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown>{displayText}</ReactMarkdown>
          </div>
        )}

        {/* Confidence + hover actions */}
        <div className="mt-1 flex items-center gap-2">
          {confidence && (
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${confidenceConfig[confidence].dot}`} />
              <span className="text-[11px] text-slate-500">
                {confidenceConfig[confidence].label}
              </span>
            </div>
          )}

          {/* Timestamp on hover */}
          <span className={`text-[10px] text-slate-600 transition-opacity ${showTimestamp ? "opacity-100" : "opacity-0"}`}>
            {formattedTime}
          </span>

          {/* Hover actions */}
          <div className="ms-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {isAssistant && (
              <button
                onClick={handleCopy}
                className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors"
                title={t.aiHub.copyMessage}
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            )}
            <button
              onClick={() => onReply(message)}
              className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors"
              title={t.aiHub.replyTo}
            >
              <Reply size={12} />
            </button>
            {isAssistant && isLast && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors"
                title={t.aiHub.regenerate}
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Action preview (Work Manager) */}
        {action && !isDismissed && (
          <ActionPreview
            action={action}
            lang={language}
            onConfirm={async () => {
              try {
                const supabase = createBrowserClient();
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;
                const res = await fetch("/api/work-manager/execute", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify({
                    action_type: action.type,
                    title: action.title,
                    details: action.details,
                    session_id: activeId || "unknown",
                  }),
                });
                const data = await res.json();
                if (data.success) {
                  return { success: true, message: data.result?.url || data.result?.project_name || data.result?.title || "Done" };
                }
                return { success: false, message: data.error || "Failed" };
              } catch (err) {
                return { success: false, message: err instanceof Error ? err.message : "Network error" };
              }
            }}
            onCancel={() => onDismiss(dismissKey)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Streaming Message ──────────────────────────────────────────

interface StreamingMessageProps {
  content: string;
  mode: AIMode;
  currentAgent: string | null;
  language: "he" | "en" | "ru";
}

export function StreamingMessage({ content, mode, currentAgent, language }: StreamingMessageProps) {
  const streamAgentKey = (mode === "work" && currentAgent) ? (currentAgent as AgentType) : null;
  const StreamAgentIcon = streamAgentKey ? AGENT_ICON_COMPONENTS[AGENT_ICONS[streamAgentKey]] : null;
  const streamAgentLabel = streamAgentKey
    ? AGENT_LABELS[streamAgentKey]?.[language] ?? AGENT_LABELS[streamAgentKey]?.en
    : null;

  return (
    <div className="mb-4">
      {streamAgentLabel && StreamAgentIcon && (
        <div className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-500">
          <StreamAgentIcon className="h-3 w-3" />
          <span>{streamAgentLabel}</span>
        </div>
      )}
      <div className="max-w-[80%] rounded-xl bg-slate-700/50 px-4 py-3 text-sm leading-relaxed text-slate-300 prose prose-sm prose-invert max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:mb-1 prose-headings:mt-2 prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-600 prose-code:text-amber-300 prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown>{content}</ReactMarkdown>
        <span className="inline-block w-0.5 h-4 bg-slate-300 animate-pulse ms-0.5 align-text-bottom" />
      </div>
    </div>
  );
}

// ─── Typing Indicator ───────────────────────────────────────────

export function TypingIndicator({ t }: { t: ReturnType<typeof getTranslations> }) {
  return (
    <div className="mb-4">
      <div className="inline-flex items-center gap-2 rounded-xl bg-slate-700/50 px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
        <span className="text-xs text-slate-500 ms-1">{t.aiHub.streaming}</span>
      </div>
    </div>
  );
}
