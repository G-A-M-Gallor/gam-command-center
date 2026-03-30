// QA Types - Better type definitions for common use cases

// Common utility types
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject { [key: string]: JSONValue; }
export interface JSONArray extends Array<JSONValue> {}

// Database row types
export type DatabaseRow = Record<string, JSONValue>;
export type DatabaseRows = DatabaseRow[];

// API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  status?: number;
}

// Supabase realtime payload types
export interface RealtimePayload<T = DatabaseRow> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: T;
  old?: T;
  errors?: string[];
}

// Google Drive / OAuth types
export interface GoogleCredentials {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime?: string;
  webViewLink?: string;
}

// Email template types
export interface EmailTemplateProps {
  recipientName?: string;
  senderName?: string;
  companyName?: string;
  customData?: Record<string, JSONValue>;
}

export type EmailTemplateComponent = (props: EmailTemplateProps) => React.ReactElement;

// Workflow/automation types
export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  data?: Record<string, JSONValue>;
  error?: string;
}

// Export data types
export interface ExportRow {
  [key: string]: string | number | boolean | null;
}

export interface ExportConfig {
  format: 'csv' | 'xlsx' | 'json';
  filename: string;
  headers?: string[];
}

// MCP (Model Context Protocol) types
export interface McpResource {
  name: string;
  description?: string;
  type: string;
  data?: JSONValue;
}

export interface McpServerInfo {
  name: string;
  resources: McpResource[];
  isHealthy: boolean;
  latency?: number;
}

// Wiki/team types
export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  isOnline?: boolean;
}

export interface WikiPage {
  id: string;
  title: string;
  content?: string;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

// Component event types
export interface BlockUpdateEvent {
  type: 'block.content.updated';
  blockId: string;
  data?: Record<string, JSONValue>;
}

// Error handling types
export type ErrorWithCode = Error & {
  code?: string;
  statusCode?: number;
};

// Generic handler types
export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;
export type AsyncHandler<T = unknown, R = unknown> = (data: T) => Promise<R>;

// Form and validation types
export type ValidationError = {
  field: string;
  message: string;
  code?: string;
};

export type FormErrors = Record<string, string | string[]>;

// Common UI types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  children?: MenuItem[];
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Search and filter types
export interface SearchParams {
  query?: string;
  filters?: Record<string, JSONValue>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

// Health check types
export interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  responseTime?: number;
  message?: string;
}

// Environment and config types
export interface AppConfig {
  environment: 'development' | 'staging' | 'production';
  apiUrl: string;
  databaseUrl: string;
  features: Record<string, boolean>;
}

// File upload types
export interface FileUpload {
  file: File;
  progress?: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  url?: string;
  error?: string;
}