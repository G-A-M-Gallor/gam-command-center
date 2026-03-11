import type { AIMode } from "@/lib/ai/prompts";
import {
  MessageCircle, BarChart3, PenTool, GitBranch, Briefcase,
} from "lucide-react";

// ─── Message Types ──────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  agent?: string;
  images?: { base64: string; mediaType: string }[];
  replyTo?: { content: string; timestamp: number };
}

export interface ImageAttachment {
  file: File;
  preview: string;
  base64: string;
  mediaType: string;
}

export interface Conversation {
  id: string;
  mode: AIMode;
  messages: ChatMessage[];
  title: string;
  createdAt: number;
  updatedAt: number;
  totalTokensInput: number;
  totalTokensOutput: number;
}

// ─── Constants ──────────────────────────────────────────────────

export const STORAGE_KEY = "cc-ai-hub-conversations";

export const MODE_ICONS: Record<AIMode, typeof MessageCircle> = {
  chat: MessageCircle,
  analyze: BarChart3,
  write: PenTool,
  decompose: GitBranch,
  work: Briefcase,
};

export const MODE_COLORS: Record<AIMode, string> = {
  chat: "purple",
  analyze: "blue",
  write: "emerald",
  decompose: "amber",
  work: "amber",
};

export const MODEL_LABELS: Record<string, string> = {
  "claude-haiku-4-5-20251001": "Haiku 4.5",
  "claude-sonnet-4-6": "Sonnet 4.6",
};
