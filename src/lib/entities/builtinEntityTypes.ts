// ===================================================
// Built-in Entity Types — Seed Data
// ===================================================
// An entity type is just a lens on a note.
// It defines which fields to show, not what the note IS.
// A note can wear multiple lenses.

import type { EntityTypeInsert, EntityConnectionInsert, TemplateConfig, ActionButton, PriorityAlias } from './types';
import { BUILTIN_ACTIONS } from './actionRegistry';

// ─── Helpers ─────────────────────────────────────────

function pickActions(...ids: string[]): ActionButton[] {
  return ids
    .map(id => BUILTIN_ACTIONS[id])
    .filter((a): a is ActionButton => !!a);
}

// ─── Priority Aliases ──────────────────────────────────

const devTaskPriorities: PriorityAlias[] = [
  {
    value: 'p0',
    label: { he: 'P0 Blocker', en: 'P0 Blocker', ru: 'P0 Блокер' },
    color: '#dc2626',
    description: { he: 'חוסם את כל הפיתוח', en: 'Blocks all development', ru: 'Блокирует разработку' },
    icon: 'AlertTriangle',
    sort_order: 1,
  },
  {
    value: 'p1',
    label: { he: 'P1 Critical', en: 'P1 Critical', ru: 'P1 Критичный' },
    color: '#ea580c',
    description: { he: 'קריטי לשחרור', en: 'Critical for release', ru: 'Критично для релиза' },
    icon: 'AlertCircle',
    sort_order: 2,
  },
  {
    value: 'p2',
    label: { he: 'P2 High', en: 'P2 High', ru: 'P2 Высокий' },
    color: '#ca8a04',
    description: { he: 'עדיפות גבוהה', en: 'High priority', ru: 'Высокий приоритет' },
    icon: 'ArrowUp',
    sort_order: 3,
  },
  {
    value: 'p3',
    label: { he: 'P3 Medium', en: 'P3 Medium', ru: 'P3 Средний' },
    color: '#65a30d',
    description: { he: 'עדיפות בינונית', en: 'Medium priority', ru: 'Средний приоритет' },
    icon: 'Minus',
    sort_order: 4,
  },
  {
    value: 'p4',
    label: { he: 'P4 Low', en: 'P4 Low', ru: 'P4 Низкий' },
    color: '#6b7280',
    description: { he: 'עדיפות נמוכה', en: 'Low priority', ru: 'Низкий приоритет' },
    icon: 'ArrowDown',
    sort_order: 5,
  },
];

const dealPriorities: PriorityAlias[] = [
  {
    value: 'hot',
    label: { he: 'לידים חמים 🔥', en: 'Hot Leads 🔥', ru: 'Горячие лиды 🔥' },
    color: '#dc2626',
    description: { he: 'מוכנים לסגירה עכשיו', en: 'Ready to close now', ru: 'Готовы к закрытию' },
    icon: 'Flame',
    sort_order: 1,
  },
  {
    value: 'warm',
    label: { he: 'לידים חמימים', en: 'Warm Leads', ru: 'Теплые лиды' },
    color: '#ea580c',
    description: { he: 'מעוניינים וצריכים טיפוח', en: 'Interested and need nurturing', ru: 'Заинтересованы' },
    icon: 'Zap',
    sort_order: 2,
  },
  {
    value: 'qualified',
    label: { he: 'מוכשרים', en: 'Qualified', ru: 'Квалифицированы' },
    color: '#ca8a04',
    description: { he: 'עברו את הכשרת הליד', en: 'Passed lead qualification', ru: 'Прошли квалификацию' },
    icon: 'CheckCircle',
    sort_order: 3,
  },
  {
    value: 'cold',
    label: { he: 'לידים קרים', en: 'Cold Leads', ru: 'Холодные лиды' },
    color: '#0891b2',
    description: { he: 'דורשים טיפוח ארוך טווח', en: 'Require long-term nurturing', ru: 'Требуют долгосрочного развития' },
    icon: 'Snowflake',
    sort_order: 4,
  },
  {
    value: 'unqualified',
    label: { he: 'לא מתאימים', en: 'Unqualified', ru: 'Неквалифицированы' },
    color: '#6b7280',
    description: { he: 'לא עומדים בקריטריונים', en: 'Do not meet criteria', ru: 'Не соответствуют критериям' },
    icon: 'X',
    sort_order: 5,
  },
];

const supportTicketPriorities: PriorityAlias[] = [
  {
    value: 'emergency',
    label: { he: 'חירום', en: 'Emergency', ru: 'Экстренная' },
    color: '#dc2626',
    description: { he: 'מערכת לא פועלת', en: 'System is down', ru: 'Система не работает' },
    icon: 'Siren',
    sort_order: 1,
  },
  {
    value: 'urgent',
    label: { he: 'דחוף', en: 'Urgent', ru: 'Срочная' },
    color: '#ea580c',
    description: { he: 'פונקציה קריטית לא עובדת', en: 'Critical function not working', ru: 'Критическая функция не работает' },
    icon: 'AlertTriangle',
    sort_order: 2,
  },
  {
    value: 'high',
    label: { he: 'גבוה', en: 'High', ru: 'Высокая' },
    color: '#ca8a04',
    description: { he: 'בעיה משמעותית', en: 'Significant issue', ru: 'Значительная проблема' },
    icon: 'ArrowUp',
    sort_order: 3,
  },
  {
    value: 'normal',
    label: { he: 'רגיל', en: 'Normal', ru: 'Обычная' },
    color: '#65a30d',
    description: { he: 'בעיה סטנדרטית', en: 'Standard issue', ru: 'Стандартная проблема' },
    icon: 'Minus',
    sort_order: 4,
  },
  {
    value: 'low',
    label: { he: 'נמוך', en: 'Low', ru: 'Низкая' },
    color: '#6b7280',
    description: { he: 'שאלה או בקשת פיצ׳ר', en: 'Question or feature request', ru: 'Вопрос или запрос функции' },
    icon: 'HelpCircle',
    sort_order: 5,
  },
];

const supportTicketTemplate: TemplateConfig = {
  layout: {
    meta_columns: 2,
    field_order: ['status', 'priority', 'assignee', 'severity', 'category', 'reporter', 'due_date', 'resolution_time', 'tags'],
    sections: [
      { key: 'triage', label: { he: 'טריאז׳', en: 'Triage', ru: 'Сортировка' }, field_refs: ['status', 'priority', 'assignee', 'severity'] },
      { key: 'details', label: { he: 'פרטים', en: 'Details', ru: 'Детали' }, field_refs: ['category', 'reporter', 'due_date', 'resolution_time'] },
    ],
  },
  available_views: ['board', 'table', 'list'],
  board_config: { group_field: 'status', card_fields: ['priority', 'assignee', 'severity', 'due_date'] },
  track_activity: true,
  track_kpi_events: true,
  kpi_triggers: [
    { event_type: 'status_change', field_key: 'status' },
    { event_type: 'field_change', field_key: 'priority' },
  ],
  action_buttons: pickActions('change_status', 'deactivate', 'reactivate', 'export_csv', 'bulk_field_update', 'bulk_status_change', 'bulk_assign'),
  priority_aliases: supportTicketPriorities,
};

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
  action_buttons: pickActions('change_status', 'deactivate', 'reactivate', 'open_in_ai', 'export_csv', 'bulk_field_update', 'bulk_status_change', 'bulk_assign'),
  priority_aliases: devTaskPriorities,
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
  action_buttons: pickActions('change_status', 'deactivate', 'reactivate', 'send_whatsapp', 'call_log', 'export_csv', 'bulk_field_update', 'bulk_status_change', 'bulk_assign'),
  priority_aliases: dealPriorities,
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
  action_buttons: pickActions('change_status', 'send_whatsapp', 'call_log', 'open_in_ai', 'bulk_field_update', 'bulk_status_change', 'bulk_assign'),
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
  action_buttons: pickActions('deactivate', 'reactivate', 'send_notification', 'export_csv', 'bulk_field_update', 'bulk_status_change', 'bulk_assign'),
};

// ─── Phase 3 Templates ──────────────────────────────

const employeeTemplate: TemplateConfig = {
  layout: {
    meta_columns: 2,
    field_order: ['full_name', 'role', 'department', 'employee_status', 'manager', 'hire_date', 'phone', 'email', 'id_number', 'salary', 'vacation_days', 'gender', 'tags'],
    sections: [
      { key: 'identity', label: { he: 'פרטים אישיים', en: 'Personal Details', ru: 'Личные данные' }, field_refs: ['full_name', 'id_number', 'gender', 'phone', 'email'] },
      { key: 'employment', label: { he: 'תעסוקה', en: 'Employment', ru: 'Занятость' }, field_refs: ['role', 'department', 'employee_status', 'manager', 'hire_date'] },
      { key: 'compensation', label: { he: 'תגמול', en: 'Compensation', ru: 'Компенсация' }, field_refs: ['salary', 'vacation_days'] },
    ],
  },
  available_views: ['table', 'board', 'list'],
  board_config: { group_field: 'department', card_fields: ['role', 'employee_status', 'phone'] },
  track_activity: true,
  track_kpi_events: true,
  kpi_triggers: [
    { event_type: 'status_change', field_key: 'employee_status' },
  ],
  action_buttons: pickActions('change_status', 'deactivate', 'reactivate', 'send_whatsapp', 'call_log', 'export_csv', 'bulk_field_update', 'bulk_status_change'),
};

const vendorTemplate: TemplateConfig = {
  layout: {
    meta_columns: 2,
    field_order: ['business', 'business_type', 'industry', 'service_area', 'phone', 'email', 'address', 'status', 'tags'],
    sections: [
      { key: 'business', label: { he: 'פרטי עסק', en: 'Business Details', ru: 'Данные о бизнесе' }, field_refs: ['business', 'business_type', 'industry', 'company_size'] },
      { key: 'contact', label: { he: 'פרטי קשר', en: 'Contact Info', ru: 'Контактные данные' }, field_refs: ['phone', 'email', 'address'] },
      { key: 'service', label: { he: 'שירות', en: 'Service', ru: 'Услуги' }, field_refs: ['service_area', 'status'] },
    ],
  },
  available_views: ['table', 'board', 'list'],
  board_config: { group_field: 'industry', card_fields: ['business', 'service_area', 'phone'] },
  track_activity: true,
  track_kpi_events: false,
  action_buttons: pickActions('change_status', 'send_whatsapp', 'call_log', 'deactivate', 'reactivate', 'export_csv', 'bulk_field_update', 'bulk_status_change'),
};

const propertyTemplate: TemplateConfig = {
  layout: {
    meta_columns: 2,
    field_order: ['address', 'project_type', 'construction_stage', 'completion_pct', 'project_budget', 'lot_number', 'permit_number', 'floor_count', 'total_area_sqm', 'main_contractor', 'subcontractors', 'start_date', 'due_date', 'status', 'tags'],
    sections: [
      { key: 'location', label: { he: 'מיקום', en: 'Location', ru: 'Расположение' }, field_refs: ['address', 'lot_number', 'permit_number'] },
      { key: 'construction', label: { he: 'בנייה', en: 'Construction', ru: 'Строительство' }, field_refs: ['project_type', 'construction_stage', 'completion_pct', 'floor_count', 'total_area_sqm'] },
      { key: 'budget', label: { he: 'תקציב וקבלנים', en: 'Budget & Contractors', ru: 'Бюджет и подрядчики' }, field_refs: ['project_budget', 'main_contractor', 'subcontractors'] },
      { key: 'dates', label: { he: 'תאריכים', en: 'Dates', ru: 'Даты' }, field_refs: ['start_date', 'due_date'] },
    ],
  },
  available_views: ['table', 'board', 'list', 'gantt'],
  board_config: { group_field: 'construction_stage', card_fields: ['address', 'completion_pct', 'project_budget'] },
  gantt_config: { start_field: 'start_date', end_field: 'due_date', group_field: 'construction_stage' },
  track_activity: true,
  track_kpi_events: true,
  kpi_triggers: [
    { event_type: 'status_change', field_key: 'construction_stage' },
    { event_type: 'field_change', field_key: 'completion_pct' },
  ],
  action_buttons: pickActions('change_status', 'deactivate', 'reactivate', 'export_csv', 'bulk_field_update', 'bulk_status_change'),
};

const invoiceTemplate: TemplateConfig = {
  layout: {
    meta_columns: 2,
    field_order: ['invoice_number', 'invoice_date', 'invoice_amount', 'currency', 'payment_status', 'payment_method', 'assignee', 'tags'],
    sections: [
      { key: 'invoice', label: { he: 'חשבונית', en: 'Invoice', ru: 'Счёт' }, field_refs: ['invoice_number', 'invoice_date', 'invoice_amount', 'currency'] },
      { key: 'payment', label: { he: 'תשלום', en: 'Payment', ru: 'Оплата' }, field_refs: ['payment_status', 'payment_method', 'assignee'] },
    ],
  },
  available_views: ['table', 'list', 'timeline'],
  timeline_config: { date_field: 'invoice_date', milestone_statuses: ['paid', 'overdue'] },
  track_activity: true,
  track_kpi_events: true,
  kpi_triggers: [
    { event_type: 'status_change', field_key: 'payment_status' },
    { event_type: 'field_change', field_key: 'invoice_amount' },
  ],
  action_buttons: pickActions('change_status', 'deactivate', 'reactivate', 'export_csv', 'bulk_field_update', 'bulk_status_change'),
};

const caseTemplate: TemplateConfig = {
  layout: {
    meta_columns: 2,
    field_order: ['case_status', 'service_type', 'assignee', 'total_price', 'paid_amount', 'payment_status', 'agreement_ref', 'start_date', 'due_date', 'tags'],
    sections: [
      { key: 'pipeline', label: { he: 'צינור עבודה', en: 'Pipeline', ru: 'Воронка' }, field_refs: ['case_status', 'service_type', 'assignee'] },
      { key: 'finance', label: { he: 'כספים', en: 'Finance', ru: 'Финансы' }, field_refs: ['total_price', 'paid_amount', 'payment_status'] },
      { key: 'dates_docs', label: { he: 'תאריכים ומסמכים', en: 'Dates & Documents', ru: 'Даты и документы' }, field_refs: ['start_date', 'due_date', 'agreement_ref'] },
    ],
  },
  available_views: ['board', 'table', 'list', 'timeline'],
  board_config: { group_field: 'case_status', card_fields: ['service_type', 'total_price', 'assignee', 'due_date'] },
  timeline_config: { date_field: 'due_date', milestone_statuses: ['completed', 'cancelled'] },
  track_activity: true,
  track_kpi_events: true,
  kpi_triggers: [
    { event_type: 'status_change', field_key: 'case_status' },
    { event_type: 'field_change', field_key: 'total_price' },
  ],
  action_buttons: pickActions('change_status', 'deactivate', 'reactivate', 'send_whatsapp', 'call_log', 'export_csv', 'bulk_field_update', 'bulk_status_change', 'bulk_assign'),
};

const contractorTemplate: TemplateConfig = {
  layout: {
    meta_columns: 2,
    field_order: ['business', 'phone', 'email', 'address', 'contractor_license_number', 'contractor_classification', 'classification_category', 'license_expiry_date', 'insurance_expiry_date', 'registration_status', 'service_area', 'tags'],
    sections: [
      { key: 'business_info', label: { he: 'פרטי עסק', en: 'Business Info', ru: 'Данные о бизнесе' }, field_refs: ['business', 'phone', 'email', 'address'] },
      { key: 'license', label: { he: 'רישיון וסיווג', en: 'License & Classification', ru: 'Лицензия и классификация' }, field_refs: ['contractor_license_number', 'contractor_classification', 'classification_category'] },
      { key: 'insurance', label: { he: 'ביטוח ומסמכים', en: 'Insurance & Documents', ru: 'Страховка и документы' }, field_refs: ['license_expiry_date', 'insurance_expiry_date'] },
      { key: 'service', label: { he: 'אזור שירות', en: 'Service Area', ru: 'Зона обслуживания' }, field_refs: ['service_area', 'registration_status'] },
    ],
  },
  available_views: ['board', 'table', 'list'],
  board_config: { group_field: 'registration_status', card_fields: ['business', 'contractor_classification', 'contractor_license_number', 'phone'] },
  track_activity: true,
  track_kpi_events: true,
  kpi_triggers: [
    { event_type: 'status_change', field_key: 'registration_status' },
  ],
  action_buttons: pickActions('change_status', 'send_whatsapp', 'call_log', 'deactivate', 'reactivate', 'export_csv', 'bulk_field_update', 'bulk_status_change'),
};

// ─── Minimal Action-only Configs (base entity types) ──

const taskActions: TemplateConfig = {
  layout: { meta_columns: 2, field_order: [], sections: [] },
  available_views: ['board', 'table', 'list'],
  track_activity: false,
  track_kpi_events: false,
  action_buttons: pickActions('change_status', 'deactivate', 'reactivate', 'export_csv', 'bulk_field_update', 'bulk_status_change', 'bulk_assign'),
};

const contactActions: TemplateConfig = {
  layout: { meta_columns: 2, field_order: [], sections: [] },
  available_views: ['table', 'list'],
  track_activity: false,
  track_kpi_events: false,
  action_buttons: pickActions('change_status', 'send_whatsapp', 'call_log', 'deactivate', 'reactivate', 'export_csv', 'bulk_field_update', 'bulk_status_change', 'bulk_assign'),
};

const clientActions: TemplateConfig = {
  layout: { meta_columns: 2, field_order: [], sections: [] },
  available_views: ['table', 'list'],
  track_activity: false,
  track_kpi_events: false,
  action_buttons: pickActions('change_status', 'send_whatsapp', 'call_log', 'deactivate', 'reactivate', 'export_csv', 'bulk_field_update', 'bulk_status_change', 'bulk_assign'),
};

const projectActions: TemplateConfig = {
  layout: { meta_columns: 2, field_order: [], sections: [] },
  available_views: ['board', 'table', 'list'],
  track_activity: false,
  track_kpi_events: false,
  action_buttons: pickActions('change_status', 'deactivate', 'reactivate', 'export_csv', 'bulk_field_update', 'bulk_status_change', 'bulk_assign'),
};

const documentActions: TemplateConfig = {
  layout: { meta_columns: 2, field_order: [], sections: [] },
  available_views: ['list', 'table'],
  track_activity: false,
  track_kpi_events: false,
  action_buttons: pickActions('change_status', 'deactivate', 'reactivate', 'export_csv', 'bulk_field_update', 'bulk_status_change', 'bulk_assign'),
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
    template_config: taskActions,
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
    template_config: contactActions,
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
    template_config: clientActions,
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
    template_config: projectActions,
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
    template_config: documentActions,
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
  // ─── Phase 3 Entity Types ─────────────────────────
  {
    slug: 'employee',
    label: { he: 'עובד', en: 'Employee', ru: 'Сотрудник' },
    icon: '👷',
    color: '#f59e0b',
    field_refs: ['full_name', 'role', 'department', 'employee_status', 'manager', 'hire_date', 'phone', 'email', 'id_number', 'salary', 'vacation_days', 'gender', 'tags'],
    group_refs: ['work_experience', 'education'],
    default_view: 'table',
    template_config: employeeTemplate,
    sort_order: 9,
  },
  {
    slug: 'vendor',
    label: { he: 'ספק / קבלן', en: 'Vendor', ru: 'Поставщик' },
    icon: '🏗️',
    color: '#ec4899',
    field_refs: ['business', 'business_type', 'industry', 'company_size', 'service_area', 'phone', 'email', 'address', 'status', 'tags'],
    group_refs: ['call_log', 'payment_log'],
    default_view: 'table',
    template_config: vendorTemplate,
    sort_order: 10,
  },
  {
    slug: 'property',
    label: { he: 'נכס / אתר בנייה', en: 'Property / Site', ru: 'Объект / Стройка' },
    icon: '🏠',
    color: '#06b6d4',
    field_refs: ['address', 'project_type', 'construction_stage', 'completion_pct', 'project_budget', 'lot_number', 'permit_number', 'floor_count', 'total_area_sqm', 'main_contractor', 'subcontractors', 'start_date', 'due_date', 'status', 'tags'],
    group_refs: ['document_log', 'meeting_log'],
    default_view: 'board',
    template_config: propertyTemplate,
    sort_order: 11,
  },
  {
    slug: 'invoice',
    label: { he: 'חשבונית', en: 'Invoice', ru: 'Счёт' },
    icon: '🧾',
    color: '#10b981',
    field_refs: ['invoice_number', 'invoice_date', 'invoice_amount', 'currency', 'payment_status', 'payment_method', 'assignee', 'tags'],
    group_refs: ['payment_log'],
    default_view: 'table',
    template_config: invoiceTemplate,
    sort_order: 12,
  },
  // ─── Phase 4 Entity Types ─────────────────────────
  {
    slug: 'case',
    label: { he: 'תיק שירות', en: 'Case', ru: 'Дело' },
    icon: '💼',
    color: '#8b5cf6',
    field_refs: ['case_status', 'service_type', 'assignee', 'total_price', 'paid_amount', 'payment_status', 'agreement_ref', 'start_date', 'due_date', 'tags'],
    group_refs: ['call_log'],
    default_view: 'board',
    template_config: caseTemplate,
    sort_order: 13,
  },
  // ─── Contractor Registration Entity Type ──────────
  {
    slug: 'contractor',
    label: { he: 'קבלן רשום', en: 'Contractor', ru: 'Подрядчик' },
    icon: '🏗️',
    color: '#f97316',
    field_refs: ['business', 'phone', 'email', 'address', 'contractor_license_number', 'contractor_classification', 'classification_category', 'license_expiry_date', 'insurance_expiry_date', 'registration_status', 'service_area', 'tags'],
    group_refs: ['document_log'],
    default_view: 'board',
    template_config: contractorTemplate,
    sort_order: 14,
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
  // ─── Phase 3 Connections ──────────────────────────
  {
    source_type: 'client',
    target_type: 'property',
    relation_label: { he: 'נכסים', en: 'Properties', ru: 'Объекты' },
    reverse_label: { he: 'שייך ללקוח', en: 'Belongs to Client', ru: 'Принадлежит клиенту' },
    relation_kind: 'one-to-many',
  },
  {
    source_type: 'property',
    target_type: 'vendor',
    relation_label: { he: 'קבלנים', en: 'Vendors', ru: 'Подрядчики' },
    reverse_label: { he: 'עובד באתר', en: 'Works at Site', ru: 'Работает на объекте' },
    relation_kind: 'many-to-many',
  },
  {
    source_type: 'property',
    target_type: 'document',
    relation_label: { he: 'מסמכים', en: 'Documents', ru: 'Документы' },
    reverse_label: { he: 'שייך לנכס', en: 'Belongs to Property', ru: 'Принадлежит объекту' },
    relation_kind: 'one-to-many',
  },
  {
    source_type: 'client',
    target_type: 'invoice',
    relation_label: { he: 'חשבוניות', en: 'Invoices', ru: 'Счета' },
    reverse_label: { he: 'שייך ללקוח', en: 'Belongs to Client', ru: 'Принадлежит клиенту' },
    relation_kind: 'one-to-many',
  },
  {
    source_type: 'deal',
    target_type: 'invoice',
    relation_label: { he: 'חשבוניות', en: 'Invoices', ru: 'Счета' },
    reverse_label: { he: 'שייך לעסקה', en: 'Belongs to Deal', ru: 'Принадлежит сделке' },
    relation_kind: 'one-to-many',
  },
  {
    source_type: 'vendor',
    target_type: 'invoice',
    relation_label: { he: 'חשבוניות', en: 'Invoices', ru: 'Счета' },
    reverse_label: { he: 'שייך לספק', en: 'Belongs to Vendor', ru: 'Принадлежит поставщику' },
    relation_kind: 'one-to-many',
  },
  {
    source_type: 'project',
    target_type: 'property',
    relation_label: { he: 'אתרי בנייה', en: 'Sites', ru: 'Стройки' },
    reverse_label: { he: 'שייך לפרויקט', en: 'Belongs to Project', ru: 'Принадлежит проекту' },
    relation_kind: 'one-to-many',
  },
  {
    source_type: 'property',
    target_type: 'employee',
    relation_label: { he: 'צוות', en: 'Team', ru: 'Команда' },
    reverse_label: { he: 'עובד באתר', en: 'Works at Site', ru: 'Работает на объекте' },
    relation_kind: 'many-to-many',
  },
  {
    source_type: 'vendor',
    target_type: 'agreement',
    relation_label: { he: 'הסכמים', en: 'Agreements', ru: 'Соглашения' },
    reverse_label: { he: 'שייך לספק', en: 'Belongs to Vendor', ru: 'Принадлежит поставщику' },
    relation_kind: 'one-to-many',
  },
  // ─── Phase 4 Connections ──────────────────────────
  {
    source_type: 'client',
    target_type: 'case',
    relation_label: { he: 'תיקי שירות', en: 'Cases', ru: 'Дела' },
    reverse_label: { he: 'שייך ללקוח', en: 'Belongs to Client', ru: 'Принадлежит клиенту' },
    relation_kind: 'one-to-many',
  },
  {
    source_type: 'case',
    target_type: 'contact',
    relation_label: { he: 'אנשי קשר', en: 'Contacts', ru: 'Контакты' },
    reverse_label: { he: 'קשור לתיק', en: 'Related to Case', ru: 'Связан с делом' },
    relation_kind: 'many-to-many',
  },
  {
    source_type: 'case',
    target_type: 'project',
    relation_label: { he: 'פרויקטים', en: 'Projects', ru: 'Проекты' },
    reverse_label: { he: 'שייך לתיק', en: 'Belongs to Case', ru: 'Принадлежит делу' },
    relation_kind: 'one-to-many',
  },
  {
    source_type: 'case',
    target_type: 'invoice',
    relation_label: { he: 'חשבוניות', en: 'Invoices', ru: 'Счета' },
    reverse_label: { he: 'שייך לתיק', en: 'Belongs to Case', ru: 'Принадлежит делу' },
    relation_kind: 'one-to-many',
  },
  {
    source_type: 'case',
    target_type: 'agreement',
    relation_label: { he: 'הסכמים', en: 'Agreements', ru: 'Соглашения' },
    reverse_label: { he: 'שייך לתיק', en: 'Belongs to Case', ru: 'Принадлежит делу' },
    relation_kind: 'one-to-many',
  },
  // ─── Contractor Connections ─────────────────────────
  {
    source_type: 'contractor',
    target_type: 'project',
    relation_label: { he: 'פרויקטים', en: 'Projects', ru: 'Проекты' },
    reverse_label: { he: 'קבלן', en: 'Contractor', ru: 'Подрядчик' },
    relation_kind: 'many-to-many',
  },
  {
    source_type: 'contractor',
    target_type: 'property',
    relation_label: { he: 'נכסים / אתרים', en: 'Properties / Sites', ru: 'Объекты / Стройки' },
    reverse_label: { he: 'קבלן', en: 'Contractor', ru: 'Подрядчик' },
    relation_kind: 'many-to-many',
  },
  {
    source_type: 'case',
    target_type: 'contractor',
    relation_label: { he: 'קבלנים', en: 'Contractors', ru: 'Подрядчики' },
    reverse_label: { he: 'תיקי שירות', en: 'Cases', ru: 'Дела' },
    relation_kind: 'many-to-many',
  },
];
