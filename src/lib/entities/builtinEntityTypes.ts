// ===================================================
// Built-in Entity Types — Seed Data
// ===================================================
// An entity type is just a lens on a note.
// It defines which fields to show, not what the note IS.
// A note can wear multiple lenses.

import type { EntityTypeInsert, EntityConnectionInsert, TemplateConfig } from './types';

// ─── Template Configs ────────────────────────────────

const devTaskTemplate: TemplateConfig = {
  layout: {
    meta_columns: 2,
    field_order: ['status', 'priority', 'assignee', 'sprint', 'story_points', 'start_date', 'due_date', 'estimated_hours', 'actual_hours', 'environment', 'branch', 'reviewer', 'pr_link', 'acceptance_criteria', 'tags'],
    sections: [
      { key: 'core', label: { he: 'פרטי משימה', en: 'Task Details', ru: 'Детали задачи' }, field_refs: ['status', 'priority', 'assignee', 'sprint', 'story_points'] },
      { key: 'dates', label: { he: 'תאריכים ושעות', en: 'Dates & Hours', ru: 'Даты и часы' }, field_refs: ['start_date', 'due_date', 'estimated_hours', 'actual_hours'] },
      { key: 'dev', label: { he: 'פיתוח', en: 'Development', ru: 'Разработка' }, field_refs: ['environment', 'branch', 'reviewer', 'pr_link', 'acceptance_criteria'] },
    ],
  },
  available_views: ['board', 'table', 'list', 'gantt'],
  board_config: { group_field: 'status', card_fields: ['assignee', 'sprint', 'story_points', 'due_date'] },
  gantt_config: { start_field: 'start_date', end_field: 'due_date', group_field: 'sprint' },
  track_activity: true,
  track_kpi_events: true,
  kpi_triggers: [
    { event_type: 'status_change', field_key: 'status' },
    { event_type: 'field_change', field_key: 'story_points' },
  ],
};

const dealTemplate: TemplateConfig = {
  layout: {
    meta_columns: 2,
    field_order: ['pipeline_stage', 'deal_value', 'probability', 'expected_close', 'commission', 'assignee', 'lead_source', 'tags'],
    sections: [
      { key: 'pipeline', label: { he: 'צנרת', en: 'Pipeline', ru: 'Воронка' }, field_refs: ['pipeline_stage', 'deal_value', 'probability', 'expected_close'] },
      { key: 'details', label: { he: 'פרטים', en: 'Details', ru: 'Детали' }, field_refs: ['commission', 'assignee', 'lead_source'] },
    ],
  },
  available_views: ['board', 'table', 'list', 'timeline'],
  board_config: { group_field: 'pipeline_stage', card_fields: ['deal_value', 'expected_close', 'assignee'] },
  timeline_config: { date_field: 'expected_close', milestone_statuses: ['closed_won', 'closed_lost'] },
  track_activity: true,
  track_kpi_events: true,
  kpi_triggers: [
    { event_type: 'status_change', field_key: 'pipeline_stage' },
    { event_type: 'field_change', field_key: 'deal_value' },
  ],
};

const leadTemplate: TemplateConfig = {
  layout: {
    meta_columns: 2,
    field_order: ['pipeline_stage', 'lead_source', 'qualification_score', 'assignee', 'phone', 'email', 'conversion_date', 'tags'],
    sections: [
      { key: 'qualification', label: { he: 'כשירות', en: 'Qualification', ru: 'Квалификация' }, field_refs: ['pipeline_stage', 'lead_source', 'qualification_score'] },
      { key: 'contact', label: { he: 'פרטי קשר', en: 'Contact Info', ru: 'Контактные данные' }, field_refs: ['assignee', 'phone', 'email'] },
    ],
  },
  available_views: ['table', 'board', 'list'],
  board_config: { group_field: 'pipeline_stage', card_fields: ['lead_source', 'qualification_score', 'assignee'] },
  track_activity: true,
  track_kpi_events: true,
  kpi_triggers: [
    { event_type: 'status_change', field_key: 'pipeline_stage' },
  ],
};

const agreementTemplate: TemplateConfig = {
  layout: {
    meta_columns: 2,
    field_order: ['agreement_type', 'status', 'effective_date', 'expiry_date', 'deal_value', 'assignee', 'tags'],
    sections: [
      { key: 'agreement', label: { he: 'הסכם', en: 'Agreement', ru: 'Соглашение' }, field_refs: ['agreement_type', 'status', 'deal_value'] },
      { key: 'dates', label: { he: 'תקופה', en: 'Period', ru: 'Период' }, field_refs: ['effective_date', 'expiry_date'] },
    ],
  },
  available_views: ['table', 'gantt', 'list'],
  gantt_config: { start_field: 'effective_date', end_field: 'expiry_date' },
  track_activity: true,
  track_kpi_events: false,
};

// ─── Entity Types ────────────────────────────────────

export const BUILTIN_ENTITY_TYPES: EntityTypeInsert[] = [
  {
    slug: 'task',
    label: { he: 'משימה', en: 'Task', ru: 'Задача' },
    icon: '✅',
    color: '#60a5fa',
    field_refs: ['status', 'priority', 'assignee', 'due_date', 'tags'],
    group_refs: [],
    default_view: 'board',
    template_config: null,
    sort_order: 0,
  },
  {
    slug: 'contact',
    label: { he: 'איש קשר', en: 'Contact', ru: 'Контакт' },
    icon: '👤',
    color: '#a78bfa',
    field_refs: ['full_name', 'phone', 'email', 'tags'],
    group_refs: ['call_log'],
    default_view: 'table',
    template_config: null,
    sort_order: 1,
  },
  {
    slug: 'client',
    label: { he: 'לקוח', en: 'Client', ru: 'Клиент' },
    icon: '🏢',
    color: '#34d399',
    field_refs: ['business', 'phone', 'email', 'status', 'address', 'tags'],
    group_refs: ['call_log'],
    default_view: 'table',
    template_config: null,
    sort_order: 2,
  },
  {
    slug: 'project',
    label: { he: 'פרויקט', en: 'Project', ru: 'Проект' },
    icon: '📁',
    color: '#fbbf24',
    field_refs: ['status', 'priority', 'assignee', 'due_date', 'tags'],
    group_refs: [],
    default_view: 'board',
    template_config: null,
    sort_order: 3,
  },
  {
    slug: 'document',
    label: { he: 'מסמך', en: 'Document', ru: 'Документ' },
    icon: '📄',
    color: '#94a3b8',
    field_refs: ['status', 'tags'],
    group_refs: [],
    default_view: 'list',
    template_config: null,
    sort_order: 4,
  },
  // ─── Phase 2 Entity Types ─────────────────────────
  {
    slug: 'dev_task',
    label: { he: 'משימת פיתוח', en: 'Dev Task', ru: 'Задача разработки' },
    icon: '💻',
    color: '#818cf8',
    field_refs: ['status', 'priority', 'assignee', 'sprint', 'story_points', 'start_date', 'due_date', 'estimated_hours', 'actual_hours', 'environment', 'branch', 'reviewer', 'pr_link', 'acceptance_criteria', 'tags'],
    group_refs: [],
    default_view: 'board',
    template_config: devTaskTemplate,
    sort_order: 5,
  },
  {
    slug: 'deal',
    label: { he: 'עסקה', en: 'Deal', ru: 'Сделка' },
    icon: '💰',
    color: '#34d399',
    field_refs: ['pipeline_stage', 'deal_value', 'probability', 'expected_close', 'commission', 'assignee', 'lead_source', 'tags'],
    group_refs: ['call_log'],
    default_view: 'board',
    template_config: dealTemplate,
    sort_order: 6,
  },
  {
    slug: 'lead',
    label: { he: 'ליד', en: 'Lead', ru: 'Лид' },
    icon: '🎯',
    color: '#f472b6',
    field_refs: ['pipeline_stage', 'lead_source', 'qualification_score', 'assignee', 'phone', 'email', 'conversion_date', 'tags'],
    group_refs: ['call_log'],
    default_view: 'table',
    template_config: leadTemplate,
    sort_order: 7,
  },
  {
    slug: 'agreement',
    label: { he: 'הסכם', en: 'Agreement', ru: 'Соглашение' },
    icon: '📋',
    color: '#fbbf24',
    field_refs: ['agreement_type', 'status', 'effective_date', 'expiry_date', 'deal_value', 'assignee', 'tags'],
    group_refs: [],
    default_view: 'table',
    template_config: agreementTemplate,
    sort_order: 8,
  },
];

export const BUILTIN_CONNECTIONS: EntityConnectionInsert[] = [
  {
    source_type: 'client',
    target_type: 'project',
    relation_label: { he: 'מכיל פרויקטים', en: 'Has Projects', ru: 'Имеет проекты' },
    reverse_label: { he: 'שייך ללקוח', en: 'Belongs to Client', ru: 'Принадлежит клиенту' },
    relation_kind: 'one-to-many',
  },
  {
    source_type: 'project',
    target_type: 'task',
    relation_label: { he: 'מכיל משימות', en: 'Has Tasks', ru: 'Имеет задачи' },
    reverse_label: { he: 'שייך לפרויקט', en: 'Belongs to Project', ru: 'Принадлежит проекту' },
    relation_kind: 'one-to-many',
  },
  {
    source_type: 'task',
    target_type: 'contact',
    relation_label: { he: 'מוקצה ל', en: 'Assigned to', ru: 'Назначена' },
    reverse_label: { he: 'אחראי על', en: 'Responsible for', ru: 'Ответственный за' },
    relation_kind: 'many-to-many',
  },
  {
    source_type: 'client',
    target_type: 'contact',
    relation_label: { he: 'אנשי קשר', en: 'Contacts', ru: 'Контакты' },
    reverse_label: { he: 'קשור ללקוח', en: 'Related to Client', ru: 'Связан с клиентом' },
    relation_kind: 'many-to-many',
  },
  {
    source_type: 'project',
    target_type: 'document',
    relation_label: { he: 'מסמכים', en: 'Documents', ru: 'Документы' },
    reverse_label: { he: 'שייך לפרויקט', en: 'Belongs to Project', ru: 'Принадлежит проекту' },
    relation_kind: 'one-to-many',
  },
  // ─── Phase 2 Connections ──────────────────────────
  {
    source_type: 'lead',
    target_type: 'deal',
    relation_label: { he: 'הפך לעסקה', en: 'Converted to Deal', ru: 'Конвертирован в сделку' },
    reverse_label: { he: 'מקור ליד', en: 'From Lead', ru: 'Из лида' },
    relation_kind: 'one-to-many',
  },
  {
    source_type: 'deal',
    target_type: 'agreement',
    relation_label: { he: 'הסכמים', en: 'Agreements', ru: 'Соглашения' },
    reverse_label: { he: 'שייך לעסקה', en: 'Belongs to Deal', ru: 'Принадлежит сделке' },
    relation_kind: 'one-to-many',
  },
  {
    source_type: 'project',
    target_type: 'dev_task',
    relation_label: { he: 'משימות פיתוח', en: 'Dev Tasks', ru: 'Задачи разработки' },
    reverse_label: { he: 'שייך לפרויקט', en: 'Belongs to Project', ru: 'Принадлежит проекту' },
    relation_kind: 'one-to-many',
  },
  {
    source_type: 'client',
    target_type: 'deal',
    relation_label: { he: 'עסקאות', en: 'Deals', ru: 'Сделки' },
    reverse_label: { he: 'שייך ללקוח', en: 'Belongs to Client', ru: 'Принадлежит клиенту' },
    relation_kind: 'one-to-many',
  },
  {
    source_type: 'deal',
    target_type: 'contact',
    relation_label: { he: 'אנשי קשר', en: 'Contacts', ru: 'Контакты' },
    reverse_label: { he: 'קשור לעסקה', en: 'Related to Deal', ru: 'Связан со сделкой' },
    relation_kind: 'many-to-many',
  },
];
