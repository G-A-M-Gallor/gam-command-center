// Widget-specific types for better type safety
import type { ComponentType, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

// Base widget component props
export interface BaseWidgetProps {
  isExpanded?: boolean;
  onToggle?: () => void;
  className?: string;
  children?: ReactNode;
}

// Widget panel component type
export type WidgetPanelComponent = ComponentType<BaseWidgetProps>;

// Widget bar content component type
export type WidgetBarComponent = ComponentType<BaseWidgetProps>;

// Widget configuration
export interface WidgetConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  panel: WidgetPanelComponent;
  barContent?: WidgetBarComponent;
  isDisabled?: boolean;
  requiresAuth?: boolean;
  category?: 'core' | 'productivity' | 'communication' | 'analytics' | 'settings';
}

// Specific widget prop types for better type safety

export interface SearchWidgetProps extends BaseWidgetProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  results?: SearchResult[];
}

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  url?: string;
  type: 'page' | 'document' | 'entity' | 'contact';
}

export interface AIWidgetProps extends BaseWidgetProps {
  mode?: 'chat' | 'analyze' | 'write' | 'decompose';
  onModeChange?: (mode: string) => void;
  conversation?: AIMessage[];
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface QuickCreateProps extends BaseWidgetProps {
  entityTypes?: EntityCreateOption[];
  onEntityCreate?: (type: string, data: Record<string, unknown>) => void;
}

export interface EntityCreateOption {
  type: string;
  label: string;
  icon: string;
  fields: CreateField[];
}

export interface CreateField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required?: boolean;
  options?: Array<{ value: string; label: string; }>;
}

export interface CalendarWidgetProps extends BaseWidgetProps {
  view?: 'today' | 'week' | 'month';
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  description?: string;
  location?: string;
  attendees?: string[];
}

export interface NotificationWidgetProps extends BaseWidgetProps {
  notifications?: NotificationItem[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  isRead: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface TimerWidgetProps extends BaseWidgetProps {
  duration?: number; // in seconds
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onComplete?: () => void;
}

export interface ClipboardWidgetProps extends BaseWidgetProps {
  items?: ClipboardItem[];
  maxItems?: number;
  onCopy?: (text: string) => void;
  onClear?: () => void;
}

export interface ClipboardItem {
  id: string;
  text: string;
  timestamp: string;
  type?: 'text' | 'url' | 'code';
}

export interface KPIWidgetProps extends BaseWidgetProps {
  metrics?: KPIMetric[];
  timeRange?: 'day' | 'week' | 'month' | 'year';
  onTimeRangeChange?: (range: string) => void;
}

export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  unit?: string;
  change?: number; // percentage change
  trend: 'up' | 'down' | 'stable';
  target?: number;
}

export interface TeamWidgetProps extends BaseWidgetProps {
  members?: TeamMember[];
  onMemberClick?: (member: TeamMember) => void;
  showOnlineStatus?: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  isOnline?: boolean;
  status?: 'available' | 'busy' | 'away' | 'offline';
}

export interface WATIWidgetProps extends BaseWidgetProps {
  conversations?: WATIConversation[];
  onConversationSelect?: (conversation: WATIConversation) => void;
  unreadCount?: number;
}

export interface WATIConversation {
  id: string;
  contactName: string;
  lastMessage: string;
  timestamp: string;
  isRead: boolean;
  phoneNumber: string;
}

// Widget registry types
export interface WidgetRegistry {
  [widgetId: string]: WidgetConfig;
}

export type WidgetId = string;
export type WidgetCategory = 'core' | 'productivity' | 'communication' | 'analytics' | 'settings';