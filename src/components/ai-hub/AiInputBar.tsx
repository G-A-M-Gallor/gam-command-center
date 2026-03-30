"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Send, Square, _X, Image as ImageIcon, Reply,
} from "lucide-react";
import { _getTranslations } from "@/lib/i18n";
import { isOverBudget } from "@/lib/ai/tokenTracker";
import { ChatToolbar } from "@/components/command-center/ChatToolbar";
import type { AIMode } from "@/lib/ai/prompts";
import type { ChatMessage, ImageAttachment } from "./types";
import { MODE_ICONS, MODE_COLORS } from "./types";

interface AiInputBarProps {
  input: string;
  onInputChange: (v: string) => void;
  onSend: (text?: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  mode: AIMode;
  atLimit: boolean;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
  attachments: ImageAttachment[];
  onAddAttachment: (att: ImageAttachment) => void;
  onRemoveAttachment: (index: number) => void;
  onAtTrigger: (caretPos: number) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  t: ReturnType<typeof getTranslations>;
  isRtl: boolean;
  language: "he" | "en" | "ru";
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

function fileToAttachment(file: File): Promise<ImageAttachment> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      reject(new Error("Unsupported image type"));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      reject(new Error("Image too large (max 5MB)"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve({
        file,
        preview: dataUrl,
        base64,
        mediaType: file.type,
      });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function AiInputBar({
  input, onInputChange, onSend, onStop, isStreaming, mode, atLimit,
  replyingTo, onCancelReply, attachments, onAddAttachment, onRemoveAttachment,
  onAtTrigger, textareaRef, _t, isRtl, language,
}: AiInputBarProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modeColor = MODE_COLORS[mode];
  const ModeIcon = MODE_ICONS[mode];

  const { toolbar, onKeyDown: toolbarKeyDown } = ChatToolbar({
    textareaRef, value: input, onChange: onInputChange, lang: language,
  });

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    toolbarKeyDown(e);
    if (e.defaultPrevented) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }

    // Detect @ trigger
    if (e.key === "@" || (e.key === "2" && e.shiftKey)) {
      const ta = textareaRef.current;
      if (ta) {
        setTimeout(() => onAtTrigger(ta.selectionStart), 0);
      }
    }
  }, [toolbarKeyDown, onSend, onAtTrigger, textareaRef]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 168) + "px"; // max ~6 lines
  }, [input, textareaRef]);

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    for (const file of files) {
      try {
        const att = await fileToAttachment(file);
        onAddAttachment(att);
      } catch {
        // skip invalid files
      }
    }
  }, [onAddAttachment]);

  // Paste handler for images
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        try {
          const att = await fileToAttachment(file);
          onAddAttachment(att);
        } catch {
          // skip
        }
      }
    }
  }, [onAddAttachment]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try {
        const att = await fileToAttachment(file);
        onAddAttachment(att);
      } catch {
        // skip
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [onAddAttachment]);

  return (
    <div
      data-cc-id="aihub.input"
      className={`border-_t border-slate-700/50 px-4 py-3 transition-colors ${isDragOver ? "bg-[var(--cc-accent-600-10)]" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Reply preview */}
      {replyingTo && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-s-2 border-[var(--cc-accent-500)] bg-slate-800/60 px-3 py-2">
          <Reply size={12} className="shrink-0 text-[var(--cc-accent-400)]" />
          <span className="flex-1 truncate text-[12px] text-slate-400">
            {replyingTo.content.slice(0, 200)}
          </span>
          <button onClick={onCancelReply} className="shrink-0 text-slate-500 hover:text-slate-400">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Image attachment previews */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <div key={i} className="group/img relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- dynamic data URL */}
              <img
                src={att.preview}
                alt=""
                className="h-16 w-16 rounded-lg object-cover border border-slate-600"
              />
              <button
                onClick={() => onRemoveAttachment(i)}
                className="absolute -end-1 -top-1 rounded-full bg-slate-800 p-0.5 text-slate-400 opacity-0 transition-opacity hover:text-red-400 group-hover/img:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drag overlay hint */}
      {isDragOver && (
        <div className="mb-2 flex items-center justify-center rounded-lg border-2 border-dashed border-[var(--cc-accent-500)] bg-[var(--cc-accent-600-10)] py-4">
          <span className="text-sm text-[var(--cc-accent-400)]">{t.aiHub.dropImageHere}</span>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Mode badge */}
        <div className={`mb-1.5 flex shrink-0 items-center gap-1 rounded-md bg-${modeColor}-500/10 px-2 py-1`}>
          <ModeIcon size={12} className={`text-${modeColor}-400`} />
          <span className={`text-[10px] font-medium text-${modeColor}-400`}>
            {t.aiHub[`mode${mode.charAt(0).toUpperCase() + mode.slice(1)}` as keyof typeof t.aiHub]}
          </span>
        </div>

        <div className="relative flex-1">
          {toolbar}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={atLimit ? t.aiHub.conversationLimit : t.aiHub.typePlaceholder}
            rows={1}
            disabled={atLimit}
            dir={isRtl ? "rtl" : "ltr"}
            className={`w-full resize-none rounded-b-lg rounded-t-none border border-slate-600 border-t-0 bg-slate-700/50 px-3 py-2.5 pe-10 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors disabled:opacity-40 ${
              input ? "focus:border-[var(--cc-accent-500)] focus:shadow-sm focus:shadow-[var(--cc-accent-500)]/10" : "focus:border-slate-500"
            }`}
            style={{ maxHeight: 168, minHeight: 38 }}
          />
          {input.length > 0 && (
            <span className="absolute bottom-1.5 end-10 text-[10px] text-slate-600">
              {input.length}
            </span>
          )}
        </div>

        {/* Image button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mb-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
          title={t.aiHub.attachImage}
        >
          <ImageIcon size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Send / Stop button */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white transition-colors hover:bg-red-500"
            title={_t.aiHub.stopGeneration}
          >
            <Square size={13} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSend()}
            disabled={!input.trim() && attachments.length === 0 || isOverBudget() || atLimit}
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--cc-accent-600)] text-white transition-colors hover:bg-[var(--cc-accent-500)] disabled:opacity-40"
            title={t.aiHub.sendMessage}
          >
            <Send size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
