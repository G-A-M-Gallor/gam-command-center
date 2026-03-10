// ===================================================
// Entity Platform — Core TypeScript Types
// ===================================================
// The note (vb_records) is the universal atom.
// Entity types are just lenses — they define which fields to show.
// Everything is many-to-many, no limits.

export type FieldType =
  | 'text' | 'number' | 'select' | 'multi-select' | 'date'
  | 'person' | 'url' | 'email' | 'phone' | 'checkbox'
  | 'relation' | 'formula' | 'composite';

export type ViewType = 'table' | 'board' | 'list' | 'calendar' | 'gantt' | 'timeline';

export type FieldCategory =
  | 'system' | 'general' | 'contact' | 'business' | 'project' | 'hr' | 'finance' | 'construction';

export type RelationKind = 'one-to-one' | 'one-to-many' | 'many-to-many';

// ─── i18n label ─────────────────────────────────────
export interface I18nLabel {
  he: string;
  en: string;
  ru: string;
}

// ─── Global Field ───────────────────────────────────
export interface SubField {
  meta_key: string;
  label: I18nLabel;
  field_type: FieldType;
}

export interface FieldOption {
  value: string;
  label: I18nLabel;
  color?: string;
}

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  unique?: boolean;
}

// ─── Visibility Rules ──────────────────────────────
// Show/hide a field based on another field's value
export type VisibilityOperator = 'eq' | 'neq' | 'empty' | 'not_empty' | 'contains' | 'gt' | 'lt';

export interface VisibilityRule {
  field_ref: string;        // the field to check (meta_key)
  operator: VisibilityOperator;
  value?: string;           // not needed for empty/not_empty
}

// ─── Color Rules ───────────────────────────────────
// Dynamic field coloring based on conditions
export type ColorOperator = 'empty' | 'not_empty' | 'eq' | 'neq' | 'contains' | 'length_lt' | 'length_gt' | 'gt' | 'lt';

export interface ColorRule {
  operator: ColorOperator;
  value?: string;
  color: string;            // hex color, e.g. "#ef4444"
}

export interface GlobalField {
  id: string;
  meta_key: string;
  label: I18nLabel;
  description: I18nLabel;
  field_type: FieldType;
  is_composite: boolean;
  sub_fields: SubField[];
  display_template: string | null;
  options: FieldOption[];
  validation: FieldValidation;
  default_value: unknown;
  icon: string | null;
  category: FieldCategory;
  aliases: string[];
  sort_order: number;
  read_only: boolean;
  visibility_rules: VisibilityRule[];
  color_rules: ColorRule[];
  created_at: string;
}

export type GlobalFieldInsert = Omit<GlobalField, 'id' | 'created_at' | 'aliases' | 'read_only' | 'visibility_rules' | 'color_rules'> & {
  aliases?: string[];
  read_only?: boolean;
  visibility_rules?: VisibilityRule[];
  color_rules?: ColorRule[];
};

// ─── Field Group (repeating) ────────────────────────
export interface FieldGroup {
  id: string;
  meta_key: string;
  label: I18nLabel;
  description: I18nLabel;
  field_refs: string[];
  icon: string | null;
  category: string;
  sort_order: number;
  created_at: string;
}

export type FieldGroupInsert = Omit<FieldGroup, 'id' | 'created_at'>;

// ─── Entity Type ────────────────────────────────────
export interface EntityType {
  id: string;
  slug: string;
  label: I18nLabel;
  icon: string;
  color: string | null;
  field_refs: string[];
  group_refs: string[];
  default_view: ViewType;
  template_config: TemplateConfig | null;
  sort_order: number;
  created_at: string;
}

export type EntityTypeInsert = Omit<EntityType, 'id' | 'created_at'>;

// ─── Entity Connection ──────────────────────────────
export interface EntityConnection {
  id: string;
  source_type: string;
  target_type: string;
  relation_label: I18nLabel;
  reverse_label: I18nLabel;
  relation_kind: RelationKind;
  created_at: string;
}

export type EntityConnectionInsert = Omit<EntityConnection, 'id' | 'created_at'>;

// ─── Note Relations (actual links between notes) ────
export interface NoteRelation {
  id: string;
  source_id: string;
  target_id: string;
  relation_type: string;
  created_at: string;
}

// ─── Stakeholders ───────────────────────────────────
// A stakeholder is a person connected to a note/deal with a specific role.
// Each stakeholder has their own access level and notification preferences.

export type StakeholderRole =
  | 'client' | 'broker' | 'lawyer' | 'accountant'
  | 'contractor' | 'consultant' | 'observer'
  | 'approver' | 'owner' | 'participant';

export type AccessLevel = 'full' | 'partial' | 'minimal' | 'external';
export type NotifyLevel = 'all' | 'milestones' | 'mentions' | 'none';
export type NotifyChannel = 'app' | 'email' | 'whatsapp' | 'sms';

export interface NoteStakeholder {
  id: string;
  note_id: string;
  contact_note_id: string;
  role: StakeholderRole;
  role_label: I18nLabel;
  access_level: AccessLevel;
  is_primary: boolean;
  visible_fields: string[];
  notify: NotifyLevel;
  notify_channels: NotifyChannel[];
  notes: string | null;
  added_at: string;
  // Joined from contact note (optional)
  contact_title?: string;
  contact_meta?: Record<string, unknown>;
  contact_entity_type?: string | null;
}

export type NoteStakeholderInsert = Omit<NoteStakeholder, 'id' | 'added_at' | 'contact_title' | 'contact_meta' | 'contact_entity_type'>;

// ─── Note Record (vb_records with entity extensions) ─
export interface NoteRecord {
  id: string;
  title: string;
  content: Record<string, unknown> | null;
  record_type: string;
  entity_type: string | null;
  meta: Record<string, unknown>;
  status: string;
  source: string;
  is_deleted: boolean;
  created_by: string | null;
  created_at: string;
  last_edited_at: string;
}

// ─── View Filters & Sort ────────────────────────────
export interface ViewFilter {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'in' | 'is_empty' | 'is_not_empty';
  value: unknown;
}

export interface ViewSort {
  field: string;
  direction: 'asc' | 'desc';
}

// ─── Saved Views ────────────────────────────────────
export interface SavedView {
  id: string;
  name: string;
  view: ViewType;
  filters: ViewFilter[];
  sort?: ViewSort;
  showInactive: boolean;
}

// ─── Action Buttons ──────────────────────────────────
// Per-entity-type configurable actions for toolbar + note sidebar.

export interface ActionButton {
  id: string;
  label: I18nLabel;
  icon: string;
  variant: 'default' | 'destructive' | 'outline' | 'ghost';
  scope: 'single' | 'bulk' | 'global';
  show_when?: {
    status_in?: string[];
    status_not_in?: string[];
    field_exists?: string;
    is_active?: boolean;
  };
  confirm?: boolean;
  sort_order: number;
}

// ─── Template Config ───────────────────────────────
// Templates transform an entity type into a specific experience.
// Same underlying note, different layout and behavior.

export interface TemplateSection {
  key: string;
  label: I18nLabel;
  field_refs: string[];
  collapsed?: boolean;
}

export interface KPITrigger {
  event_type: string;
  field_key?: string;
  from_value?: string;
  to_value?: string;
}

export interface TemplateConfig {
  layout: {
    meta_columns: 1 | 2 | 3;
    field_order: string[];
    sections: TemplateSection[];
  };
  available_views: ViewType[];
  board_config?: {
    group_field: string;
    card_fields: string[];
  };
  gantt_config?: {
    start_field: string;
    end_field: string;
    group_field?: string;
  };
  timeline_config?: {
    date_field: string;
    milestone_statuses: string[];
  };
  track_activity: boolean;
  track_kpi_events: boolean;
  kpi_triggers?: KPITrigger[];
  action_buttons?: ActionButton[];
}

export function defaultTemplateConfig(views: ViewType[] = ['table', 'board', 'list']): TemplateConfig {
  return {
    layout: { meta_columns: 2, field_order: [], sections: [] },
    available_views: views,
    track_activity: false,
    track_kpi_events: false,
  };
}

// ─── Activity Log ──────────────────────────────────

export type ActivityType =
  | 'field_change' | 'status_change' | 'comment' | 'call_log'
  | 'relation_added' | 'relation_removed'
  | 'stakeholder_added' | 'stakeholder_removed'
  | 'created' | 'deactivated' | 'reactivated';

export interface ActivityLogEntry {
  id: string;
  note_id: string;
  actor_id: string | null;
  activity_type: ActivityType;
  field_key: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown> | null;
  note_text: string | null;
  created_at: string;
}

// ─── KPI / Note Events ────────────────────────────

export interface NoteEvent {
  id: string;
  note_id: string;
  entity_type: string;
  event_type: string;
  event_key: string | null;
  event_value: string | null;
  actor_id: string | null;
  created_at: string;
}
