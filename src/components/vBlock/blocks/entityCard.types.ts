import type { FieldType, I18nLabel } from "@/lib/entities/types";

export type FieldDisplayType =
  | "text"
  | "badge"
  | "avatar"
  | "link"
  | "phone"
  | "email"
  | "date"
  | "currency"
  | "rating"
  | "progress"
  | "hidden";

export type FieldActionType =
  | "call"
  | "whatsapp"
  | "email"
  | "navigate"
  | "copy";

export interface FieldAction {
  type: FieldActionType;
  icon: string;
  label: I18nLabel;
}

export interface FieldSlot {
  metaKey: string;
  label: I18nLabel;
  fieldType: FieldType;
  displayType: FieldDisplayType;
  icon?: string;
  actions?: FieldAction[];
  priority: number; // lower = shown first, hidden in compact if > threshold
}

export interface EntityCardConfig {
  entityType: string;
  titleField: string;
  subtitleField?: string;
  avatarField?: string;
  statusField?: string;
  frontFields: FieldSlot[];
  backFields: FieldSlot[];
  accentColor?: string;
}

export interface EntityCardProps {
  entityType: string;
  entityId: string;
  config?: EntityCardConfig;
  page: "front" | "back" | "both";
  mode: "compact" | "standard" | "expanded" | "fullscreen";
}
