import { z } from "zod";

// ─── AI Chat ────────────────────────────────────────────────

const VALID_MODES = ["chat", "analyze", "write", "decompose"] as const;

const aiChatMessageSchema = z.object({
  role: z
    .enum(["user", "assistant"], {
      error: 'role must be "user" or "assistant" — "system" is not allowed',
    }),
  content: z.string().min(1, "Message content cannot be empty").max(10_000, "Message content exceeds 10,000 character limit"),
});

export const aiChatSchema = z.object({
  messages: z
    .array(aiChatMessageSchema)
    .min(1, "At least one message is required")
    .max(50, "Maximum 50 messages per request"),
  mode: z.enum(VALID_MODES, {
    error: `Invalid mode — must be one of: ${VALID_MODES.join(", ")}`,
  }),
  contexts: z.array(z.string()).optional().default([]),
});

export type AIChatInput = z.infer<typeof aiChatSchema>;

// ─── Embeddings: Generate ───────────────────────────────────

export const embeddingsGenerateSchema = z
  .object({
    document_id: z.string().uuid("document_id must be a valid UUID").optional(),
    batch: z.boolean().optional(),
  })
  .refine((data) => data.document_id || data.batch, {
    message: "Provide document_id or batch: true",
  });

export type EmbeddingsGenerateInput = z.infer<typeof embeddingsGenerateSchema>;

// ─── Embeddings: Search ─────────────────────────────────────

export const embeddingsSearchSchema = z.object({
  query: z.string().min(1, "query is required").max(2_000, "query exceeds 2,000 character limit"),
  max_results: z.number().int().min(1).max(100).optional().default(10),
  match_threshold: z.number().min(0).max(1).optional().default(0.3),
});

export type EmbeddingsSearchInput = z.infer<typeof embeddingsSearchSchema>;

// ─── Git Commit ─────────────────────────────────────────────

export const gitCommitSchema = z.object({
  message: z.string().min(1, "Commit message is required").max(500, "Commit message exceeds 500 character limit").transform((s) => s.trim()),
});

export type GitCommitInput = z.infer<typeof gitCommitSchema>;

// ─── Git Deploy ─────────────────────────────────────────────

export const gitDeploySchema = z.object({
  message: z.string().max(500, "Commit message exceeds 500 character limit").optional().transform((s) => s?.trim() || undefined),
});

export type GitDeployInput = z.infer<typeof gitDeploySchema>;

// ─── Push Subscribe ─────────────────────────────────────────

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url("endpoint must be a valid URL"),
  keys: z.object({
    p256dh: z.string().min(1, "p256dh key is required"),
    auth: z.string().min(1, "auth key is required"),
  }),
});

export type PushSubscribeInput = z.infer<typeof pushSubscribeSchema>;

// ─── Push Send ──────────────────────────────────────────────

export const pushSendSchema = z.object({
  title: z.string().min(1, "title is required").max(200),
  body: z.string().max(500).optional().default(""),
  url: z.string().optional().default("/dashboard"),
  tag: z.string().optional(),
  userId: z.string().uuid().optional(), // target specific user, or all if omitted
});

export type PushSendInput = z.infer<typeof pushSendSchema>;

// ─── Origami Sync ───────────────────────────────────────────
// The origami/sync POST handler takes no user-supplied body fields —
// it fetches directly from Origami using server-side env vars.
// No schema needed — there is no user input to validate.
