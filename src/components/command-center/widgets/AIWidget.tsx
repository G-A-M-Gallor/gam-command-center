"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import {
  X,
  Send,
  Plus,
  Sparkles,
  PanelRight,
  Square,
  MessageCircle,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import { streamChat } from "@/lib/ai/client";
import { addUsage, isOverBudget } from "@/lib/ai/tokenTracker";
import type { WidgetSize } from "./WidgetRegistry";

const CONVERSATIONS_KEY = "cc-ai-conversations";
const PANEL_WIDTH_KEY = "cc-ai-panel-width";
const BUBBLE_POS_KEY = "cc-ai-bubble-pos";

const TOP_BAR_H = 48;
const DEFAULT_PANEL_W = 400;
const MIN_PANEL_W = 300;
const MAX_PANEL_W = 700;
const DROPDOWN_W = 320;
const DROPDOWN_H = 400;
const FLOATING_W = 350;
const FLOATING_H = 450;

export type AIViewMode = "side-panel" | "dropdown" | "floating";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// Page key from pathname
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

function getPageLabel(
  pathname: string,
  t: ReturnType<typeof getTranslations>
): string {
  const key = pageKeys[pathname];
  if (key && key in t.tabs) {
    return t.tabs[key as keyof typeof t.tabs];
  }
  return pathname.split("/").pop() || "Dashboard";
}

function getSuggestions(
  pathname: string,
  t: ReturnType<typeof getTranslations>
): string[] {
  const key = pageKeys[pathname];
  switch (key) {
    case "layers":
      return [t.widgets.suggestSummarize, t.widgets.suggestAttention];
    case "editor":
      return [
        t.widgets.suggestWrite,
        t.widgets.suggestFix,
        t.widgets.suggestSummarizeDoc,
      ];
    default:
      return [t.widgets.suggestToday, t.widgets.suggestNewProject];
  }
}

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]) {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(messages));
}

// ─── Shared Chat Content ─────────────────────────────────────────────

interface ChatContentProps {
  compact?: boolean;
}

function ChatContent({ compact = false }: ChatContentProps) {
  const { language } = useSettings();
  const t = getTranslations(language);
  const pathname = usePathname();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [contexts, setContexts] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMessages(loadMessages());
    const label = getPageLabel(pathname, t);
    setContexts([label]);
  }, [pathname, t]);

  // Listen for prefill events from other components (e.g. Library tab)
  useEffect(() => {
    const handlePrefill = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string }>).detail;
      if (detail?.message) {
        setInput(detail.message);
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    };
    window.addEventListener("cc-ai-prefill", handlePrefill);
    return () => window.removeEventListener("cc-ai-prefill", handlePrefill);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming, streamingContent]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const currentPageLabel = getPageLabel(pathname, t);
  const suggestions = getSuggestions(pathname, t);

  const addContext = useCallback(() => {
    if (!contexts.includes(currentPageLabel)) {
      setContexts((prev) => [...prev, currentPageLabel]);
    }
  }, [contexts, currentPageLabel]);

  const removeContext = useCallback((ctx: string) => {
    setContexts((prev) => prev.filter((c) => c !== ctx));
  }, []);

  const handleSend = useCallback(
    (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || isStreaming || isOverBudget()) return;

      const userMsg: ChatMessage = {
        role: "user",
        content: msg,
        timestamp: Date.now(),
      };

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      saveMessages(newMessages);
      setInput("");
      setIsStreaming(true);
      setStreamingContent("");

      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const controller = new AbortController();
      abortRef.current = controller;

      streamChat({
        messages: apiMessages,
        mode: "chat",
        contexts,
        signal: controller.signal,
        onToken: (token) => {
          setStreamingContent((prev) => prev + token);
        },
        onDone: (usage) => {
          addUsage(usage.input_tokens, usage.output_tokens);
          setStreamingContent((prev) => {
            const aiMsg: ChatMessage = {
              role: "assistant",
              content: prev,
              timestamp: Date.now(),
            };
            setMessages((prevMsgs) => {
              const updated = [...prevMsgs, aiMsg];
              saveMessages(updated);
              return updated;
            });
            return "";
          });
          setIsStreaming(false);
          abortRef.current = null;
        },
        onError: (error) => {
          setStreamingContent((prev) => {
            if (prev && !controller.signal.aborted) {
              const aiMsg: ChatMessage = {
                role: "assistant",
                content: prev + `\n\n⚠️ ${error}`,
                timestamp: Date.now(),
              };
              setMessages((prevMsgs) => {
                const updated = [...prevMsgs, aiMsg];
                saveMessages(updated);
                return updated;
              });
            } else if (!controller.signal.aborted) {
              const errMsg: ChatMessage = {
                role: "assistant",
                content: `⚠️ ${error}`,
                timestamp: Date.now(),
              };
              setMessages((prevMsgs) => {
                const updated = [...prevMsgs, errMsg];
                saveMessages(updated);
                return updated;
              });
            }
            return "";
          });
          setIsStreaming(false);
          abortRef.current = null;
        },
      });
    },
    [input, messages, isStreaming, contexts]
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const py = compact ? "py-1.5" : "py-2";
  const px = compact ? "px-3" : "px-4";

  return (
    <>
      {/* Context bar */}
      <div
        className={`flex flex-wrap items-center gap-1.5 border-b border-slate-700/50 ${px} ${py}`}
      >
        <span className="text-[11px] font-medium text-slate-500">
          {t.widgets.context}:
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
              className="ml-0.5 text-[var(--cc-accent-400)] hover:text-[var(--cc-accent-300)]"
              aria-label={`Remove ${ctx}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={addContext}
          className="inline-flex items-center rounded-full border border-dashed border-slate-600 px-1.5 py-0.5 text-[11px] text-slate-500 transition-colors hover:border-slate-500 hover:text-slate-400"
          title={t.widgets.addContext}
        >
          <Plus className="h-2.5 w-2.5" />
        </button>
      </div>

      {/* Quick suggestions — text labels serve as accessible names */}
      {messages.length === 0 && !isStreaming && (
        <div
          className={`flex flex-wrap gap-1.5 border-b border-slate-700/50 ${px} ${py}`}
        >
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
      <div className={`flex-1 overflow-y-auto ${px} py-3`}>
        {messages.length === 0 && !isStreaming && (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm text-slate-500">
              {t.widgets.typePlaceholder}
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={`${msg.timestamp}-${i}`}
            className={`mb-3 ${msg.role === "user" ? "flex justify-end" : ""}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
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
        {isStreaming && streamingContent && (
          <div className="mb-3">
            <div
              className="max-w-[85%] rounded-lg bg-slate-700/50 px-3 py-2 text-sm text-slate-300"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {streamingContent}
              <span className="inline-block w-0.5 h-3.5 bg-slate-300 animate-pulse ms-0.5 align-text-bottom" />
            </div>
          </div>
        )}
        {isStreaming && !streamingContent && (
          <div className="mb-3">
            <div className="inline-flex gap-1 rounded-lg bg-slate-700/50 px-3 py-2">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className={`border-t border-slate-700 ${px} py-3`}>
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.widgets.typePlaceholder}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-[var(--cc-accent-500)]"
            style={{ maxHeight: compact ? 80 : 120 }}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={stopGeneration}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white transition-colors hover:bg-red-500"
              aria-label="Stop generation"
            >
              <Square className="h-3 w-3" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || isOverBudget()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--cc-accent-600)] text-white transition-colors hover:bg-[var(--cc-accent-500)] disabled:opacity-40 disabled:hover:bg-[var(--cc-accent-600)]"
              aria-label={t.widgets.sendMessage}
              title={t.widgets.sendMessage}
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Panel Header ────────────────────────────────────────────────────

interface PanelHeaderProps {
  viewMode: AIViewMode;
  onViewModeChange: (mode: AIViewMode) => void;
  onClose: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}

function PanelHeader({
  viewMode,
  onViewModeChange,
  onClose,
  onMouseDown,
}: PanelHeaderProps) {
  const { language } = useSettings();
  const t = getTranslations(language);

  const modes: { mode: AIViewMode; icon: typeof PanelRight; title: string }[] =
    [
      { mode: "side-panel", icon: PanelRight, title: t.widgets.sidePanel },
      { mode: "dropdown", icon: Square, title: t.widgets.miniWindow },
      { mode: "floating", icon: MessageCircle, title: t.widgets.floatingChat },
    ];

  return (
    <div
      className="flex items-center justify-between border-b border-slate-700 px-4 py-2.5"
      onMouseDown={onMouseDown}
      style={onMouseDown ? { cursor: "move" } : undefined}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[var(--cc-accent-400)]" />
        <h3 className="text-sm font-semibold text-slate-100">
          {t.widgets.aiAssistant}
        </h3>
      </div>
      <div className="flex items-center gap-0.5">
        {modes.map(({ mode, icon: Icon, title }) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            className={`rounded p-1.5 transition-colors ${
              viewMode === mode
                ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
                : "text-slate-500 hover:bg-slate-700 hover:text-slate-300"
            }`}
            aria-label={title}
            title={title}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
        <div className="mx-1 h-4 w-px bg-slate-700" />
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Side Panel Container ────────────────────────────────────────────

function SidePanelContainer({
  viewMode,
  onViewModeChange,
  onClose,
}: {
  viewMode: AIViewMode;
  onViewModeChange: (mode: AIViewMode) => void;
  onClose: () => void;
}) {
  const { sidebarPosition } = useSettings();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const [visible, setVisible] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_W);
  const isDragging = useRef(false);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Panel opens on the OPPOSITE side of the sidebar
  const panelOnLeft = sidebarPosition === "right";
  const sidebarOffset = 0; // No offset needed — panel is on the opposite side

  // Load saved width
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PANEL_WIDTH_KEY);
      if (saved) {
        const w = parseInt(saved, 10);
        if (w >= MIN_PANEL_W && w <= MAX_PANEL_W) setPanelWidth(w);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Slide-in animation
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  // Drag resize handlers
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      setIsDraggingState(true);
      startX.current = e.clientX;
      startWidth.current = panelWidth;

      const handleMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = panelOnLeft
          ? ev.clientX - startX.current
          : startX.current - ev.clientX;
        const newW = Math.min(
          MAX_PANEL_W,
          Math.max(MIN_PANEL_W, startWidth.current + delta)
        );
        setPanelWidth(newW);
      };

      const handleUp = () => {
        isDragging.current = false;
        setIsDraggingState(false);
        localStorage.setItem(PANEL_WIDTH_KEY, String(panelWidth));
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [panelWidth, panelOnLeft]
  );

  // Save width on change (debounced via mouseup)
  useEffect(() => {
    if (!isDragging.current) {
      localStorage.setItem(PANEL_WIDTH_KEY, String(panelWidth));
    }
  }, [panelWidth]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label="AI Assistant"
      className={`fixed z-[55] flex flex-col bg-slate-800 shadow-2xl ${
        isMobile
          ? "inset-0 border-0"
          : panelOnLeft
            ? "border-r border-slate-700"
            : "border-l border-slate-700"
      }`}
      style={
        isMobile
          ? {
              transform: visible ? "translateY(0)" : "translateY(100%)",
              transition: "transform 300ms ease",
            }
          : {
              top: TOP_BAR_H,
              ...(panelOnLeft ? { left: 0 } : { right: sidebarOffset }),
              width: panelWidth,
              height: `calc(100vh - ${TOP_BAR_H}px)`,
              transform: visible
                ? "translateX(0)"
                : panelOnLeft
                  ? "translateX(-100%)"
                  : "translateX(100%)",
              transition: isDraggingState
                ? undefined
                : "transform 300ms ease",
            }
      }
    >
      {/* Drag handle on the outer edge (desktop only) */}
      {!isMobile && (
        <div
          className={`absolute top-0 z-10 h-full w-1 cursor-col-resize hover:bg-[var(--cc-accent-500-30)] active:bg-[var(--cc-accent-500-50)] ${
            panelOnLeft ? "right-0" : "left-0"
          }`}
          onMouseDown={handleDragStart}
        />
      )}

      <PanelHeader
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onClose={handleClose}
      />
      <ChatContent />
    </div>
  );
}

// ─── Dropdown Container ──────────────────────────────────────────────

function DropdownContainer({
  viewMode,
  onViewModeChange,
  onClose,
}: {
  viewMode: AIViewMode;
  onViewModeChange: (mode: AIViewMode) => void;
  onClose: () => void;
}) {
  const { sidebarPosition } = useSettings();

  // Dropdown opens on the opposite side of the sidebar
  const panelOnLeft = sidebarPosition === "right";

  // Click outside to close
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Delay to avoid catching the opening click
    const timer = setTimeout(
      () => window.addEventListener("mousedown", handleClick),
      100
    );
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="AI Assistant"
      className="fixed z-[60] flex flex-col rounded-lg border border-slate-700 bg-slate-800 shadow-xl"
      style={{
        top: TOP_BAR_H + 4,
        ...(panelOnLeft ? { left: 8 } : { right: 8 }),
        width: DROPDOWN_W,
        height: DROPDOWN_H,
        minWidth: 280,
        minHeight: 200,
        resize: "both",
        overflow: "hidden",
      }}
    >
      <PanelHeader
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onClose={onClose}
      />
      <ChatContent compact />
    </div>
  );
}

// ─── Floating Container ──────────────────────────────────────────────

function FloatingContainer({
  viewMode,
  onViewModeChange,
  onClose,
}: {
  viewMode: AIViewMode;
  onViewModeChange: (mode: AIViewMode) => void;
  onClose: () => void;
}) {
  const { sidebarPosition } = useSettings();

  // Floating defaults to the opposite side of the sidebar
  const panelOnLeft = sidebarPosition === "right";
  const defaultPos = {
    x: panelOnLeft ? 16 : window.innerWidth - FLOATING_W - 16,
    y: window.innerHeight - FLOATING_H - 16,
  };

  const [pos, setPos] = useState(defaultPos);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Load saved position
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BUBBLE_POS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPos(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      dragOffset.current = {
        x: e.clientX - pos.x,
        y: e.clientY - pos.y,
      };

      const handleMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        const newX = Math.max(
          0,
          Math.min(
            window.innerWidth - FLOATING_W,
            ev.clientX - dragOffset.current.x
          )
        );
        const newY = Math.max(
          TOP_BAR_H,
          Math.min(
            window.innerHeight - FLOATING_H,
            ev.clientY - dragOffset.current.y
          )
        );
        setPos({ x: newX, y: newY });
      };

      const handleUp = () => {
        isDragging.current = false;
        setPos((p) => {
          localStorage.setItem(BUBBLE_POS_KEY, JSON.stringify(p));
          return p;
        });
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [pos]
  );

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label="AI Assistant"
      className="fixed z-[60] flex flex-col rounded-xl border border-slate-700 bg-slate-800 shadow-2xl"
      style={{
        left: pos.x,
        top: pos.y,
        width: FLOATING_W,
        height: FLOATING_H,
        overflow: "hidden",
      }}
    >
      <PanelHeader
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onClose={onClose}
        onMouseDown={handleDragStart}
      />
      <ChatContent compact />
    </div>
  );
}

// ─── Main AIPanel Component ──────────────────────────────────────────

interface AIPanelProps {
  onClose: () => void;
  viewMode: AIViewMode;
  onViewModeChange: (mode: AIViewMode) => void;
}

export function AIPanel({ onClose, viewMode, onViewModeChange }: AIPanelProps) {
  const breakpoint = useBreakpoint();

  // On mobile, always use SidePanelContainer (renders fullscreen)
  if (breakpoint === "mobile") {
    return (
      <SidePanelContainer
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onClose={onClose}
      />
    );
  }

  switch (viewMode) {
    case "side-panel":
      return (
        <SidePanelContainer
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          onClose={onClose}
        />
      );
    case "dropdown":
      return (
        <DropdownContainer
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          onClose={onClose}
        />
      );
    case "floating":
      return (
        <FloatingContainer
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          onClose={onClose}
        />
      );
  }
}

// ─── Bar Content ─────────────────────────────────────────────────────

export function AIBarContent({ size }: { size: WidgetSize }) {
  const { language } = useSettings();
  const t = getTranslations(language);

  if (size < 2) return null;

  if (size === 2) {
    return (
      <span className="truncate text-xs text-slate-400">{t.widgets.ask}</span>
    );
  }

  const messages = loadMessages();
  if (messages.length === 0) {
    return (
      <span className="truncate text-xs text-slate-400">{t.widgets.ask}</span>
    );
  }

  if (size === 3) {
    const last = messages[messages.length - 1];
    return (
      <span className="truncate text-xs text-slate-400">
        {last.content.slice(0, 30)}
        {last.content.length > 30 ? "..." : ""}
      </span>
    );
  }

  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  return (
    <div className="flex min-w-0 flex-col">
      {lastUser && (
        <span className="truncate text-[10px] text-slate-500">
          Q: {lastUser.content.slice(0, 25)}
          {lastUser.content.length > 25 ? "..." : ""}
        </span>
      )}
      {lastAssistant && (
        <span className="truncate text-[10px] text-slate-400">
          A: {lastAssistant.content.slice(0, 25)}
          {lastAssistant.content.length > 25 ? "..." : ""}
        </span>
      )}
    </div>
  );
}
