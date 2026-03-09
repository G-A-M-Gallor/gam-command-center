// ===================================================
// Action Button Registry — Built-in Action Definitions
// ===================================================
// Following the WidgetRegistry pattern: static definitions
// that entity types reference via template_config.action_buttons.

import type { ActionButton } from './types';

export const BUILTIN_ACTIONS: Record<string, ActionButton> = {
  deactivate: {
    id: 'deactivate',
    label: { he: 'השבת', en: 'Deactivate', ru: 'Деактивировать' },
    icon: 'Archive',
    variant: 'destructive',
    scope: 'single',
    show_when: { is_active: true },
    confirm: true,
    sort_order: 90,
  },
  reactivate: {
    id: 'reactivate',
    label: { he: 'הפעל מחדש', en: 'Reactivate', ru: 'Активировать' },
    icon: 'ArchiveRestore',
    variant: 'outline',
    scope: 'single',
    show_when: { is_active: false },
    sort_order: 91,
  },
  change_status: {
    id: 'change_status',
    label: { he: 'שנה סטטוס', en: 'Change Status', ru: 'Изменить статус' },
    icon: 'ArrowRightLeft',
    variant: 'default',
    scope: 'single',
    sort_order: 10,
  },
  export_csv: {
    id: 'export_csv',
    label: { he: 'ייצוא CSV', en: 'Export CSV', ru: 'Экспорт CSV' },
    icon: 'Download',
    variant: 'outline',
    scope: 'global',
    sort_order: 80,
  },
  open_in_ai: {
    id: 'open_in_ai',
    label: { he: 'פתח ב-AI', en: 'Open in AI', ru: 'Открыть в AI' },
    icon: 'Bot',
    variant: 'ghost',
    scope: 'single',
    sort_order: 50,
  },
  send_notification: {
    id: 'send_notification',
    label: { he: 'שלח התראה', en: 'Send Notification', ru: 'Отправить уведомление' },
    icon: 'Bell',
    variant: 'outline',
    scope: 'single',
    sort_order: 60,
  },
  call_log: {
    id: 'call_log',
    label: { he: 'תיעוד שיחה', en: 'Call Log', ru: 'Журнал звонков' },
    icon: 'Phone',
    variant: 'default',
    scope: 'single',
    sort_order: 30,
  },
  send_whatsapp: {
    id: 'send_whatsapp',
    label: { he: 'שלח WhatsApp', en: 'Send WhatsApp', ru: 'Отправить WhatsApp' },
    icon: 'MessageSquare',
    variant: 'default',
    scope: 'single',
    show_when: { field_exists: 'phone' },
    sort_order: 40,
  },
  bulk_field_update: {
    id: 'bulk_field_update',
    label: { he: 'עדכון שדה', en: 'Update Field', ru: 'Обновить поле' },
    icon: 'Pencil',
    variant: 'default',
    scope: 'bulk',
    sort_order: 5,
  },
  bulk_status_change: {
    id: 'bulk_status_change',
    label: { he: 'שינוי סטטוס', en: 'Change Status', ru: 'Изменить статус' },
    icon: 'ArrowRightLeft',
    variant: 'default',
    scope: 'bulk',
    sort_order: 6,
  },
  bulk_assign: {
    id: 'bulk_assign',
    label: { he: 'הקצאה', en: 'Assign', ru: 'Назначить' },
    icon: 'UserPlus',
    variant: 'default',
    scope: 'bulk',
    sort_order: 7,
  },
};

/** Get a built-in action by ID, returns undefined if not found */
export function getBuiltinAction(id: string): ActionButton | undefined {
  return BUILTIN_ACTIONS[id];
}
