// Automations (אוטומציות) TypeScript Types

export interface Automation {
  id: string
  name: string
  description?: string
  status: 'active' | 'draft' | 'disabled'
  triggerType: 'webhook' | 'cron' | 'manual' | 'email'
  trigger: AutomationTrigger
  steps: AutomationStep[]
  tags: string[]
  folderId?: string
  createdAt: Date
  updatedAt: Date
  lastRunAt?: Date
  createdBy: string
  version: number
}

export interface AutomationTrigger {
  type: 'webhook' | 'cron' | 'manual' | 'email'
  config: Record<string, any>
  enabled: boolean
}

export interface AutomationStep {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'delay'
  name: string
  description?: string
  config: Record<string, any>
  position: { x: number; y: number }
  connections: string[] // IDs של steps מחוברים
  enabled: boolean
  timeout?: number
  retryConfig?: {
    maxRetries: number
    backoffType: 'fixed' | 'exponential'
    backoffValue: number
  }
}

export interface AutomationRun {
  id: string
  automationId: string
  status: 'success' | 'failed' | 'running' | 'cancelled' | 'paused'
  startedAt: Date
  completedAt?: Date
  duration?: number // in milliseconds
  triggerSource: string
  triggeredBy?: string
  steps: AutomationRunStep[]
  error?: string
  metadata: Record<string, any>
}

export interface AutomationRunStep {
  stepId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startedAt?: Date
  completedAt?: Date
  duration?: number
  input?: any
  output?: any
  error?: string
  logs: AutomationLogEntry[]
}

export interface AutomationLogEntry {
  id: string
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  data?: Record<string, any>
  source: string
}

export interface AutomationFolder {
  id: string
  name: string
  description?: string
  parentId?: string
  color?: string
  createdAt: Date
  updatedAt: Date
}

export interface AutomationTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  steps: Omit<AutomationStep, 'id'>[]
  trigger: Omit<AutomationTrigger, 'enabled'>
  variables: AutomationVariable[]
  documentation?: string
  version: string
  createdBy: string
  isPublic: boolean
}

export interface AutomationVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
  description: string
  defaultValue?: any
  required: boolean
  validation?: {
    pattern?: string
    min?: number
    max?: number
    enum?: any[]
  }
}

export interface AutomationConnection {
  id: string
  name: string
  type: 'api' | 'database' | 'webhook' | 'email' | 'file'
  config: Record<string, any>
  credentials: Record<string, any>
  lastTested?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AutomationStats {
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  averageDuration: number
  runningNow: number
  runsToday: number
  successRate: number
  lastRunAt?: Date
}

export interface AutomationFilters {
  status: string[]
  triggerType: string[]
  tags: string[]
  folderId?: string
  createdBy?: string
  dateRange?: {
    from: Date
    to: Date
  }
}

export interface AutomationListResponse {
  automations: Automation[]
  total: number
  page: number
  pageSize: number
  filters: AutomationFilters
}

// Node types for the workflow builder
export type AutomationNodeType = 'trigger' | 'action' | 'condition' | 'delay'

export interface AutomationNode {
  id: string
  type: AutomationNodeType
  data: {
    label: string
    config: Record<string, any>
    stepId?: string
  }
  position: { x: number; y: number }
}

export interface AutomationEdge {
  id: string
  source: string
  target: string
  type?: string
  data?: Record<string, any>
}

// Webhook specific types
export interface WebhookTrigger extends AutomationTrigger {
  type: 'webhook'
  config: {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: Record<string, string>
    authentication?: {
      type: 'none' | 'bearer' | 'basic' | 'apikey'
      config: Record<string, any>
    }
  }
}

// Cron specific types
export interface CronTrigger extends AutomationTrigger {
  type: 'cron'
  config: {
    expression: string
    timezone: string
    description: string
  }
}

// Email specific types
export interface EmailTrigger extends AutomationTrigger {
  type: 'email'
  config: {
    conditions: {
      from?: string
      subject?: string
      body?: string
    }
    folders: string[]
  }
}