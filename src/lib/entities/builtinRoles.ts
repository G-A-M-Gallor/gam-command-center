// ===================================================
// Built-in Stakeholder Roles
// ===================================================
// Every deal/project can have multiple stakeholders.
// Each stakeholder has a role that defines their default access and notifications.

import type { StakeholderRole, AccessLevel, NotifyLevel, I18nLabel } from './types';

export interface RoleDefinition {
  role: StakeholderRole;
  label: I18nLabel;
  icon: string;
  color: string;
  defaultAccess: AccessLevel;
  defaultNotify: NotifyLevel;
  description: I18nLabel;
}

export const BUILTIN_ROLES: RoleDefinition[] = [
  {
    role: 'owner',
    label: { he: 'בעלים', en: 'Owner', ru: 'Владелец' },
    icon: 'Crown',
    color: '#fbbf24',
    defaultAccess: 'full',
    defaultNotify: 'all',
    description: { he: 'בעל הפתק — שליטה מלאה', en: 'Note owner — full control', ru: 'Владелец записки — полный контроль' },
  },
  {
    role: 'client',
    label: { he: 'לקוח', en: 'Client', ru: 'Клиент' },
    icon: 'Building2',
    color: '#34d399',
    defaultAccess: 'partial',
    defaultNotify: 'milestones',
    description: { he: 'הלקוח — מקבל עדכוני אבני דרך', en: 'The client — receives milestone updates', ru: 'Клиент — получает обновления вех' },
  },
  {
    role: 'broker',
    label: { he: 'מתווך', en: 'Broker', ru: 'Брокер' },
    icon: 'Handshake',
    color: '#a78bfa',
    defaultAccess: 'partial',
    defaultNotify: 'milestones',
    description: { he: 'מתווך חיצוני — רואה סטטוס ואבני דרך', en: 'External broker — sees status and milestones', ru: 'Внешний брокер — видит статус и вехи' },
  },
  {
    role: 'lawyer',
    label: { he: 'עו"ד', en: 'Lawyer', ru: 'Юрист' },
    icon: 'Scale',
    color: '#60a5fa',
    defaultAccess: 'partial',
    defaultNotify: 'mentions',
    description: { he: 'עורך דין — מעודכן כשמוזכר', en: 'Lawyer — notified when mentioned', ru: 'Юрист — уведомление при упоминании' },
  },
  {
    role: 'accountant',
    label: { he: 'רו"ח', en: 'Accountant', ru: 'Бухгалтер' },
    icon: 'Calculator',
    color: '#fb923c',
    defaultAccess: 'minimal',
    defaultNotify: 'mentions',
    description: { he: 'רואה חשבון — גישה מינימלית, מעודכן כשמוזכר', en: 'Accountant — minimal access, notified when mentioned', ru: 'Бухгалтер — минимальный доступ' },
  },
  {
    role: 'contractor',
    label: { he: 'קבלן', en: 'Contractor', ru: 'Подрядчик' },
    icon: 'HardHat',
    color: '#f472b6',
    defaultAccess: 'partial',
    defaultNotify: 'all',
    description: { he: 'קבלן — מעודכן בכל השינויים הרלוונטיים', en: 'Contractor — all relevant updates', ru: 'Подрядчик — все соответствующие обновления' },
  },
  {
    role: 'consultant',
    label: { he: 'יועץ', en: 'Consultant', ru: 'Консультант' },
    icon: 'GraduationCap',
    color: '#38bdf8',
    defaultAccess: 'partial',
    defaultNotify: 'mentions',
    description: { he: 'יועץ חיצוני — גישה חלקית', en: 'External consultant — partial access', ru: 'Внешний консультант — частичный доступ' },
  },
  {
    role: 'approver',
    label: { he: 'מאשר', en: 'Approver', ru: 'Утверждающий' },
    icon: 'ShieldCheck',
    color: '#22d3ee',
    defaultAccess: 'partial',
    defaultNotify: 'milestones',
    description: { he: 'מאשר — מקבל עדכונים לאישור', en: 'Approver — receives items for approval', ru: 'Утверждающий — получает пункты для утверждения' },
  },
  {
    role: 'observer',
    label: { he: 'צופה', en: 'Observer', ru: 'Наблюдатель' },
    icon: 'Eye',
    color: '#94a3b8',
    defaultAccess: 'minimal',
    defaultNotify: 'none',
    description: { he: 'צופה — קריאה בלבד, ללא עדכונים', en: 'Observer — read-only, no notifications', ru: 'Наблюдатель — только чтение, без уведомлений' },
  },
  {
    role: 'participant',
    label: { he: 'משתתף', en: 'Participant', ru: 'Участник' },
    icon: 'User',
    color: '#cbd5e1',
    defaultAccess: 'partial',
    defaultNotify: 'milestones',
    description: { he: 'משתתף כללי', en: 'General participant', ru: 'Общий участник' },
  },
];

// ─── Access Level Descriptions ──────────────────────
export const ACCESS_LEVELS: { level: AccessLevel; label: I18nLabel; description: I18nLabel }[] = [
  {
    level: 'full',
    label: { he: 'מלאה', en: 'Full', ru: 'Полный' },
    description: { he: 'רואה הכל + עורך', en: 'Sees everything + can edit', ru: 'Видит всё + редактирование' },
  },
  {
    level: 'partial',
    label: { he: 'חלקית', en: 'Partial', ru: 'Частичный' },
    description: { he: 'רואה שדות מורשים בלבד', en: 'Sees allowed fields only', ru: 'Видит только разрешённые поля' },
  },
  {
    level: 'minimal',
    label: { he: 'מינימלית', en: 'Minimal', ru: 'Минимальный' },
    description: { he: 'רואה כותרת + סטטוס בלבד', en: 'Sees title + status only', ru: 'Видит только заголовок + статус' },
  },
  {
    level: 'external',
    label: { he: 'חיצונית', en: 'External', ru: 'Внешний' },
    description: { he: 'גישה דרך טופס/קישור חיצוני בלבד', en: 'Access via external form/link only', ru: 'Доступ только через внешнюю форму/ссылку' },
  },
];
