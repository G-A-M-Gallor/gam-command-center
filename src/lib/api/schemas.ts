import { z } from "zod";

// ─── AI Chat ────────────────────────────────────────────────

const VALID_MODES = ["chat", "analyze", "write", "decompose", "work"] as const;

const aiImageSchema = z.object({
  base64: z.string().min(1, "Image base64 data is required"),
  mediaType: z.enum(["image/png", "image/jpeg", "image/gif", "image/webp"], {
    error: "Image must be PNG, JPEG, GIF, or WebP",
  }),
});

const aiChatMessageSchema = z.object({
  role: z
    .enum(["user", "assistant"], {
      error: 'role must be "user" or "assistant" — "system" is not allowed',
    }),
  content: z.string().min(1, "Message content cannot be empty").max(10_000, "Message content exceeds 10,000 character limit"),
  images: z.array(aiImageSchema).max(5, "Maximum 5 images per message").optional(),
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

// ─── Push Subscribers Delete ────────────────────────────────

export const pushSubscribersDeleteSchema = z.object({
  mode: z.enum(["expired"], {
    error: 'mode must be "expired"',
  }),
});

export type PushSubscribersDeleteInput = z.infer<typeof pushSubscribersDeleteSchema>;

// ─── Push Preferences ──────────────────────────────────────

export const pushPreferencesSchema = z.object({
  whatsapp: z.boolean().optional(),
  phone: z.boolean().optional(),
  sms: z.boolean().optional(),
  email: z.boolean().optional(),
  note: z.boolean().optional(),
  reminder: z.boolean().optional(),
  sync_summary: z.boolean().optional(),
}).strict();

export type PushPreferencesInput = z.infer<typeof pushPreferencesSchema>;

// ─── Email Send ─────────────────────────────────────────────

export const emailSendSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email()).min(1)]),
  subject: z.string().min(1).max(500).optional(),
  template_id: z.string().uuid().optional(),
  template_name: z.string().optional(),
  variables: z.record(z.string(), z.string()).optional(),
  tenant_id: z.string().uuid().optional(),
  entity_id: z.string().uuid().optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
});

export type EmailSendInput = z.infer<typeof emailSendSchema>;

// ─── Email Template ─────────────────────────────────────────

export const emailTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(500),
  category: z.enum(["system", "transactional", "marketing"]),
  engine: z.enum(["react", "unlayer"]).optional().default("react"),
  react_component: z.string().optional(),
  unlayer_json: z.record(z.string(), z.unknown()).optional(),
  html_compiled: z.string().optional(),
  variables: z.array(z.string()).optional(),
  tenant_id: z.string().uuid().optional(),
});

export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>;

// ─── Email Tenant ───────────────────────────────────────────

export const emailTenantSchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().min(1).max(200),
  from_name: z.string().min(1).max(200),
  from_email: z.string().email(),
  reply_to: z.string().email().optional(),
  logo_url: z.string().url().optional(),
  signature_html: z.string().max(5000).optional(),
  brand_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export type EmailTenantInput = z.infer<typeof emailTenantSchema>;

// ─── Work Manager ──────────────────────────────────────────

export const workManagerSchema = z.object({
  messages: z
    .array(aiChatMessageSchema)
    .min(1, "At least one message is required")
    .max(50, "Maximum 50 messages per request"),
  session_id: z.string().min(1, "session_id is required"),
  user_id: z.string().uuid("user_id must be a valid UUID"),
  current_view: z
    .object({
      page: z.string(),
      open_tasks: z.array(z.string()).optional(),
      time_in_view: z.string().optional(),
    })
    .optional(),
});

export type WorkManagerInput = z.infer<typeof workManagerSchema>;

// ─── Work Manager Execute ──────────────────────────────────

export const workManagerExecuteSchema = z.object({
  action_type: z.enum(["create_task", "update_status", "add_note", "invoke_persona", "create_notion_task", "create_entity"], {
    error: 'action_type must be one of: create_task, update_status, add_note, invoke_persona, create_notion_task, create_entity',
  }),
  title: z.string().min(1, "title is required"),
  details: z.record(z.string(), z.string()),
  session_id: z.string().min(1, "session_id is required"),
});

export type WorkManagerExecuteInput = z.infer<typeof workManagerExecuteSchema>;

// ─── Entity CRUD ───────────────────────────────────────────

export const entityCreateSchema = z.object({
  title: z.string().min(1, "title is required").max(500, "title exceeds 500 character limit"),
  meta: z.record(z.string(), z.unknown()).optional().default({}),
});

export type EntityCreateInput = z.infer<typeof entityCreateSchema>;

export const entityUpdateSchema = z.object({
  id: z.string().uuid("id must be a valid UUID").optional(),
  title: z.string().min(1, "title is required").max(500, "title exceeds 500 character limit").optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  status: z.string().optional(),
});

export type EntityUpdateInput = z.infer<typeof entityUpdateSchema>;

export const entityDeleteSchema = z.union([
  z.object({ id: z.string().uuid("id must be a valid UUID") }),
  z.object({ ids: z.array(z.string().uuid("each id must be a valid UUID")).min(1, "at least one id is required").max(100, "maximum 100 ids per request") }),
]);

export type EntityDeleteInput = z.infer<typeof entityDeleteSchema>;

// ─── Entity Comments ────────────────────────────────────────

export const commentCreateSchema = z.object({
  content: z.string().min(1, "content is required").max(5000, "content exceeds 5,000 character limit"),
  parentId: z.string().uuid("parentId must be a valid UUID").optional(),
  mentions: z.array(z.string()).optional().default([]),
});

export type CommentCreateInput = z.infer<typeof commentCreateSchema>;

export const commentUpdateSchema = z.object({
  content: z.string().min(1, "content is required").max(5000, "content exceeds 5,000 character limit"),
});

export type CommentUpdateInput = z.infer<typeof commentUpdateSchema>;

export const reactionSchema = z.object({
  emoji: z.enum(["thumbs_up", "heart", "fire", "eyes", "check"]),
  action: z.enum(["add", "remove"]),
});

export type ReactionInput = z.infer<typeof reactionSchema>;

// ─── OTP Auth ──────────────────────────────────────────────

export const sendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  shouldCreateUser: z.boolean().optional().default(false),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d{6}$/, "OTP must contain only digits"),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const profileSetupSchema = z.object({
  display_name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name exceeds 100 characters").transform((s) => s.trim()),
  role: z.enum(["internal", "client", "talent", "admin", "contractor"]).optional().default("client"),
});

export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;

// ─── Contractor Submission ─────────────────────────────────

export const contractorSubmitSchema = z.object({
  business_name: z.string().min(2, "Business name is required").max(200),
  business_id: z.string().min(5, "Business ID (ח.פ) is required").max(20),
  phone: z.string().min(9, "Phone number is required").max(15),
  email: z.string().email("Invalid email address"),
  address: z.string().min(5, "Address is required").max(300),
  contractor_license_number: z.string().min(1, "License number is required").max(20),
  contractor_classification: z.string().min(1, "Classification is required"),
  classification_category: z.array(z.string()).min(1, "At least one category is required"),
  license_expiry_date: z.string().min(1, "License expiry date is required"),
  insurance_expiry_date: z.string().min(1, "Insurance expiry date is required"),
  service_area: z.array(z.string()).min(1, "At least one service area is required"),
  insurance_file_url: z.string().optional(),
  license_file_url: z.string().optional(),
});

export type ContractorSubmitInput = z.infer<typeof contractorSubmitSchema>;

// ─── Board Room ─────────────────────────────────────────────

const VALID_PERSONAS = [
  "legal", "hr", "construction", "ux", "automation", "fullstack", "strategy", "pm",
] as const;

export const boardRoomSchema = z.object({
  question: z.string().min(1, "Question is required").max(5_000, "Question exceeds 5,000 character limit"),
  personaId: z.enum(VALID_PERSONAS, {
    error: `Invalid persona — must be one of: ${VALID_PERSONAS.join(", ")}`,
  }),
});

export type BoardRoomInput = z.infer<typeof boardRoomSchema>;

// ─── Automation Run Job ─────────────────────────────────────

const VALID_JOBS = ["origami-sync", "health-check", "test-notification", "rss-sync"] as const;

export const automationRunJobSchema = z.object({
  job: z.enum(VALID_JOBS, {
    error: `Invalid job — must be one of: ${VALID_JOBS.join(", ")}`,
  }),
});

export type AutomationRunJobInput = z.infer<typeof automationRunJobSchema>;

// ─── RSS Feed ───────────────────────────────────────────────

export const rssFeedCreateSchema = z.object({
  url: z.string().url("url must be a valid URL"),
  title: z.string().min(1, "title is required").max(200, "title exceeds 200 characters"),
  keywords: z.array(z.string().max(100)).max(20, "maximum 20 keywords").optional().default([]),
});

export type RssFeedCreateInput = z.infer<typeof rssFeedCreateSchema>;

export const rssFeedUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  is_active: z.boolean().optional(),
  keywords: z.array(z.string().max(100)).max(20).optional(),
});

export type RssFeedUpdateInput = z.infer<typeof rssFeedUpdateSchema>;

// ─── Matching Engine ────────────────────────────────────────

export const matchingScoreSchema = z.object({
  source_id: z.string().uuid("source_id must be a valid UUID"),
  target_type: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  force_refresh: z.boolean().optional().default(false),
});
export type MatchingScoreInput = z.infer<typeof matchingScoreSchema>;

export const matchingBatchSchema = z.object({
  source_ids: z.array(z.string().uuid()).min(1).max(20, "Maximum 20 sources per batch"),
  target_type: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});
export type MatchingBatchInput = z.infer<typeof matchingBatchSchema>;

// ─── Import Engine ─────────────────────────────────────────

export const importExecuteSchema = z.object({
  entity_type: z.string().min(1, "entity_type is required"),
  mappings: z.array(z.object({
    sourceIndex: z.number().int().min(0),
    sourceHeader: z.string(),
    targetField: z.string().min(1),
    confidence: z.number().min(0).max(1).optional(),
  })).min(1, "At least one column mapping is required"),
  rows: z.array(z.array(z.string())).min(1).max(5000, "Maximum 5,000 rows per import"),
  file_name: z.string().min(1),
  file_size: z.number().int().min(0),
});
export type ImportExecuteInput = z.infer<typeof importExecuteSchema>;

// ─── Roadmap Layers ─────────────────────────────────────────

const VALID_LAYERS = ["goals", "portfolios", "projects", "sprints", "tasks", "subtasks"] as const;

export const roadmapLayersSchema = z.object({
  layer: z.enum(VALID_LAYERS, {
    error: `Invalid layer — must be one of: ${VALID_LAYERS.join(", ")}`,
  }),
  parentId: z.string().optional(),
});

export type RoadmapLayersInput = z.infer<typeof roadmapLayersSchema>;

// ─── Communication: Send ────────────────────────────────────

export const commSendSchema = z.object({
  phone: z.string().min(9, "phone is required").max(20),
  message: z.string().max(5000).optional(),
  template_name: z.string().max(200).optional(),
  template_params: z.array(z.object({
    name: z.string(),
    value: z.string(),
  })).optional(),
  entity_id: z.string().uuid("entity_id must be a valid UUID").optional(),
}).refine((data) => data.message || data.template_name, {
  message: "Provide message text or template_name",
});

export type CommSendInput = z.infer<typeof commSendSchema>;

// ─── Google Account Toggle ──────────────────────────────────

export const googleAccountToggleSchema = z.object({
  accountId: z.string().uuid("accountId must be a valid UUID"),
  isActive: z.boolean(),
});

export type GoogleAccountToggleInput = z.infer<typeof googleAccountToggleSchema>;

// ─── Google Account Delete ──────────────────────────────────

export const googleAccountDeleteSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
});

export type GoogleAccountDeleteInput = z.infer<typeof googleAccountDeleteSchema>;

// ─── Document Send ──────────────────────────────────────────

export const documentSendSchema = z.object({
  submission_id: z.string().uuid("submission_id must be a valid UUID"),
  expires_in_days: z.number().int().min(1).max(365).optional().default(30),
});

export type DocumentSendInput = z.infer<typeof documentSendSchema>;

// ─── Document PDF ───────────────────────────────────────────

export const documentPdfSchema = z.object({
  submission_id: z.string().uuid("submission_id must be a valid UUID"),
  store: z.boolean().optional().default(false),
});

export type DocumentPdfInput = z.infer<typeof documentPdfSchema>;

// ─── Document Resend ────────────────────────────────────────

export const documentResendSchema = z.object({
  submission_id: z.string().uuid("submission_id must be a valid UUID"),
  expires_in_days: z.number().int().min(1).max(365).optional().default(30),
});

export type DocumentResendInput = z.infer<typeof documentResendSchema>;

// ─── Document Revoke ────────────────────────────────────────

export const documentRevokeSchema = z.object({
  submission_id: z.string().uuid("submission_id must be a valid UUID"),
  reason: z.string().max(500).optional(),
});

export type DocumentRevokeInput = z.infer<typeof documentRevokeSchema>;

// ─── Document Reminder ──────────────────────────────────────

export const documentReminderSchema = z.object({
  submission_id: z.string().uuid("submission_id must be a valid UUID"),
  message: z.string().max(1000).optional(),
});

export type DocumentReminderInput = z.infer<typeof documentReminderSchema>;

// ─── Origami Sync ───────────────────────────────────────────
// The origami/sync POST handler takes no user-supplied body fields —
// it fetches directly from Origami using server-side env vars.
// No schema needed — there is no user input to validate.
