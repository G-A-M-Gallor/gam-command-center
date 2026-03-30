"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageCircle, UserCircle, Send, Bot, StopCircle,
  RotateCcw, ChevronDown, Sparkles, Clock
} from "lucide-react";
import { getTranslations } from "@/lib/i18n";
import { useSettings } from "@/contexts/SettingsContext";
// Using dedicated advisor API route
import { PERSONAS, getPersonaById } from "@/lib/ai/personas";
import type { ChatMessage } from "./types";

interface AdvisorChatProps {
  selectedPersonaId?: string;
  className?: string;
  compact?: boolean;
}

export function AdvisorChat({
  selectedPersonaId,
  className,
  compact = false
}: AdvisorChatProps) {
  const { language } = useSettings();
  const t = getTranslations(language);

  const [selectedPersona, setSelectedPersona] = useState(
    selectedPersonaId ? getPersonaById(selectedPersonaId) : PERSONAS[0]
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [showPersonaSelect, setShowPersonaSelect] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Update selected persona when prop changes
  useEffect(() => {
    if (selectedPersonaId) {
      const persona = getPersonaById(selectedPersonaId);
      if (persona) {
        setSelectedPersona(persona);
      }
    }
  }, [selectedPersonaId]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    // Create abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          personaId: selectedPersona?.id,
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response reader');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'token') {
                setStreamingContent(prev => prev + data.content);
              } else if (data.type === 'done') {
                // Add assistant message with the accumulated content
                setStreamingContent(currentContent => {
                  const assistantMessage: ChatMessage = {
                    role: "assistant",
                    content: currentContent,
                    timestamp: Date.now(),
                  };
                  setMessages(prev => [...prev, assistantMessage]);
                  return "";
                });
                setIsStreaming(false);
              } else if (data.type === 'error') {
                console.error("Chat error:", data.error);
                setStreamingContent("");
                setIsStreaming(false);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Send message error:", error);
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setStreamingContent("");
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingContent("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const PersonaSelector = () => (
    <div className="relative">
      <button
        onClick={() => setShowPersonaSelect(!showPersonaSelect)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        <div className={`w-2 h-2 rounded-full bg-${selectedPersona?.color || 'slate'}-500`} />
        <span className="text-slate-200">{selectedPersona?.name.he}</span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {showPersonaSelect && (
        <div className="absolute top-full left-0 mt-1 w-80 max-h-96 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
          <div className="p-2">
            {PERSONAS.map((persona) => (
              <button
                key={persona.id}
                onClick={() => {
                  setSelectedPersona(persona);
                  setShowPersonaSelect(false);
                }}
                className={`w-full flex items-start gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors text-right ${
                  selectedPersona?.id === persona.id ? 'bg-slate-700/50' : ''
                }`}
              >
                <div className={`w-3 h-3 rounded-full bg-${persona.color}-500 mt-1 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-200 text-sm">{persona.name.he}</div>
                  <div className="text-xs text-slate-400 mt-1">{persona.domainLabel.he}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-700 rounded-lg ${className} ${
      compact ? 'h-96' : 'h-[500px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Bot className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-purple-400`} />
          <div>
            <h3 className={`font-medium text-slate-200 ${compact ? 'text-sm' : 'text-base'}`}>
              יועץ AI
            </h3>
            {selectedPersona && (
              <p className="text-xs text-slate-400">{selectedPersona.domainLabel.he}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PersonaSelector />
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-300 transition-colors"
              title="נקה שיחה"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-8">
            <Sparkles className="w-8 h-8 mx-auto mb-3 text-purple-400" />
            <p className={compact ? 'text-sm' : 'text-base'}>
              שאל את {selectedPersona?.name.he} כל שאלה
            </p>
            <p className="text-xs mt-1 text-slate-500">
              מומחה ב{selectedPersona?.domainLabel.he}
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className={`w-8 h-8 rounded-full bg-${selectedPersona?.color || 'purple'}-500/20 flex items-center justify-center flex-shrink-0`}>
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-200 border border-slate-700"
              }`}
            >
              <p className={`whitespace-pre-wrap ${compact ? 'text-sm' : 'text-base'}`}>
                {message.content}
              </p>
              <div className={`flex items-center gap-1 mt-2 ${
                message.role === "user" ? "text-blue-100" : "text-slate-400"
              }`}>
                <Clock className="w-3 h-3" />
                <span className="text-xs">{formatTime(message.timestamp)}</span>
              </div>
            </div>

            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <UserCircle className="w-4 h-4 text-blue-400" />
              </div>
            )}
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && (
          <div className="flex gap-3 justify-start">
            <div className={`w-8 h-8 rounded-full bg-${selectedPersona?.color || 'purple'}-500/20 flex items-center justify-center flex-shrink-0`}>
              <Bot className="w-4 h-4 text-purple-400 animate-pulse" />
            </div>
            <div className="max-w-[80%] rounded-lg p-3 bg-slate-800 text-slate-200 border border-slate-700">
              <p className={`whitespace-pre-wrap ${compact ? 'text-sm' : 'text-base'}`}>
                {streamingContent}
                <span className="animate-pulse">|</span>
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`שאל את ${selectedPersona?.name.he}...`}
            className={`flex-1 resize-none bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-purple-500 ${
              compact ? 'text-sm h-8' : 'text-base h-10'
            }`}
            rows={compact ? 1 : 2}
            disabled={isStreaming}
          />

          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              {!compact && "עצור"}
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {!compact && "שלח"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}