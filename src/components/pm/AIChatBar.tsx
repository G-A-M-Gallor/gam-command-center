"use client";
// ===================================================
// GAM Command Center — AI Chat Bar
// Bottom fixed chat bar with modal and quick chips
// ===================================================

import { useState, useRef, useEffect, useMemo } from "react";
import { MessageCircle, Send, _X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { chatWithAI } from "@/lib/ai-chat";
import { buildPMContext } from "@/lib/pm-utils";
import { useActiveSprints, useAllTasks } from "@/lib/pm-queries";

interface AIChatBarProps {
  className?: string;
}

const QUICK_CHIPS = [
  "מה דחוף?",
  "סטטוס Sprint",
  "סיכונים",
  "צור ספרינט חדש",
] as const;

export function AIChatBar({ className }: AIChatBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Data for AI context
  const { data: activeSprints = [] } = useActiveSprints();
  const { data: allTasks = [] } = useAllTasks();

  const _context = useMemo(() => buildPMContext(allTasks, activeSprints), [allTasks, activeSprints]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: messageText };
    setChatHistory((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await chatWithAI(messageText, _context);
      const assistantMessage = { role: "assistant" as const, content: response };
      setChatHistory((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        role: "assistant" as const,
        content: "מצטער, יש לי בעיה בתקשורת. נסה שוב בעוד רגע.",
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(message);
  };

  const handleQuickChip = (chip: string) => {
    handleSend(chip);
  };

  const handleNewChat = () => {
    setChatHistory([]);
  };

  // Bottom bar
  if (!isOpen) {
    return (
      <div className={cn("fixed bottom-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-sm border-_t border-slate-800", className)}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <button
            onClick={() => setIsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-right bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800/70 transition-colors group"
          >
            <MessageCircle className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
            <span className="text-slate-400 group-hover:text-slate-300">
              שאל את Claude על הפרויקטים שלך...
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Full modal
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-medium text-white">Claude — עוזר AI</h3>
          {context.openTasks.length > 0 && (
            <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">
              {_context.openTasks.length} משימות פתוחות
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {chatHistory.length > 0 && (
            <button
              onClick={handleNewChat}
              className="px-3 py-1 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800/50"
            >
              שיחה חדשה
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick chips */}
      {chatHistory.length === 0 && (
        <div className="p-4 border-b border-slate-800">
          <div className="flex flex-wrap gap-2">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleQuickChip(chip)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors"
              >
                <Zap className="w-3 h-3" />
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="text-center text-slate-400 mt-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p>בחר שאלה מהירה או כתוב שאלה</p>
          </div>
        ) : (
          chatHistory.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                msg.role === "_user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] px-4 py-2 rounded-lg whitespace-pre-wrap",
                  msg.role === "_user"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-800 text-slate-200"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-400 px-4 py-2 rounded-lg">
              Claude כותב...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/90">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="שאל על הפרויקטים, המשימות, הסיכונים..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            dir="rtl"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}