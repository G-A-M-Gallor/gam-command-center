import type { EntityCardConfig } from "./entityCard.types";

const CALL_ACTION = {
  type: "call" as const,
  icon: "📞",
  label: { he: "התקשר", en: "Call", ru: "Позвонить" },
};

const WHATSAPP_ACTION = {
  type: "whatsapp" as const,
  icon: "💬",
  label: { he: "WhatsApp", en: "WhatsApp", ru: "WhatsApp" },
};

const EMAIL_ACTION = {
  type: "email" as const,
  icon: "📧",
  label: { he: "שלח מייל", en: "Email", ru: "Письмо" },
};

const COPY_ACTION = {
  type: "copy" as const,
  icon: "📋",
  label: { he: "העתק", en: "Copy", ru: "Копировать" },
};

export const ENTITY_CARD_TEMPLATES: Record<string, EntityCardConfig> = {
  contact: {
    entityType: "contact",
    titleField: "title",
    subtitleField: "company",
    avatarField: "avatar_url",
    statusField: "status",
    frontFields: [
      {
        metaKey: "phone",
        label: { he: "טלפון", en: "Phone", ru: "Телефон" },
        fieldType: "phone",
        displayType: "phone",
        icon: "📱",
        actions: [CALL_ACTION, WHATSAPP_ACTION, COPY_ACTION],
        priority: 1,
      },
      {
        metaKey: "email",
        label: { he: "אימייל", en: "Email", ru: "Почта" },
        fieldType: "email",
        displayType: "email",
        icon: "📧",
        actions: [EMAIL_ACTION, COPY_ACTION],
        priority: 2,
      },
      {
        metaKey: "company",
        label: { he: "חברה", en: "Company", ru: "Компания" },
        fieldType: "text",
        displayType: "text",
        icon: "🏢",
        priority: 3,
      },
      {
        metaKey: "role",
        label: { he: "תפקיד", en: "Role", ru: "Должность" },
        fieldType: "text",
        displayType: "text",
        icon: "💼",
        priority: 4,
      },
    ],
    backFields: [
      {
        metaKey: "address",
        label: { he: "כתובת", en: "Address", ru: "Адрес" },
        fieldType: "text",
        displayType: "text",
        icon: "📍",
        actions: [COPY_ACTION],
        priority: 1,
      },
      {
        metaKey: "notes",
        label: { he: "הערות", en: "Notes", ru: "Заметки" },
        fieldType: "rich_text",
        displayType: "text",
        icon: "📝",
        priority: 2,
      },
      {
        metaKey: "created_at",
        label: { he: "נוצר", en: "Created", ru: "Создан" },
        fieldType: "date",
        displayType: "date",
        icon: "📅",
        priority: 3,
      },
    ],
  },

  client: {
    entityType: "client",
    titleField: "title",
    subtitleField: "industry",
    statusField: "status",
    frontFields: [
      {
        metaKey: "phone",
        label: { he: "טלפון", en: "Phone", ru: "Телефон" },
        fieldType: "phone",
        displayType: "phone",
        icon: "📱",
        actions: [CALL_ACTION, WHATSAPP_ACTION, COPY_ACTION],
        priority: 1,
      },
      {
        metaKey: "email",
        label: { he: "אימייל", en: "Email", ru: "Почта" },
        fieldType: "email",
        displayType: "email",
        icon: "📧",
        actions: [EMAIL_ACTION, COPY_ACTION],
        priority: 2,
      },
      {
        metaKey: "industry",
        label: { he: "תעשייה", en: "Industry", ru: "Отрасль" },
        fieldType: "text",
        displayType: "badge",
        icon: "🏭",
        priority: 3,
      },
      {
        metaKey: "contact_person",
        label: { he: "איש קשר", en: "Contact Person", ru: "Контактное лицо" },
        fieldType: "text",
        displayType: "text",
        icon: "👤",
        priority: 4,
      },
    ],
    backFields: [
      {
        metaKey: "address",
        label: { he: "כתובת", en: "Address", ru: "Адрес" },
        fieldType: "text",
        displayType: "text",
        icon: "📍",
        actions: [COPY_ACTION],
        priority: 1,
      },
      {
        metaKey: "website",
        label: { he: "אתר", en: "Website", ru: "Сайт" },
        fieldType: "url",
        displayType: "link",
        icon: "🌐",
        priority: 2,
      },
      {
        metaKey: "notes",
        label: { he: "הערות", en: "Notes", ru: "Заметки" },
        fieldType: "rich_text",
        displayType: "text",
        icon: "📝",
        priority: 3,
      },
    ],
  },

  deal: {
    entityType: "deal",
    titleField: "title",
    subtitleField: "client_name",
    statusField: "status",
    frontFields: [
      {
        metaKey: "value",
        label: { he: "שווי", en: "Value", ru: "Стоимость" },
        fieldType: "currency",
        displayType: "currency",
        icon: "💰",
        priority: 1,
      },
      {
        metaKey: "status",
        label: { he: "סטטוס", en: "Status", ru: "Статус" },
        fieldType: "select",
        displayType: "badge",
        icon: "📊",
        priority: 2,
      },
      {
        metaKey: "client_name",
        label: { he: "לקוח", en: "Client", ru: "Клиент" },
        fieldType: "text",
        displayType: "text",
        icon: "🏢",
        priority: 3,
      },
      {
        metaKey: "close_date",
        label: { he: "תאריך סגירה", en: "Close Date", ru: "Дата закрытия" },
        fieldType: "date",
        displayType: "date",
        icon: "📅",
        priority: 4,
      },
    ],
    backFields: [
      {
        metaKey: "description",
        label: { he: "תיאור", en: "Description", ru: "Описание" },
        fieldType: "rich_text",
        displayType: "text",
        icon: "📝",
        priority: 1,
      },
      {
        metaKey: "probability",
        label: { he: "הסתברות", en: "Probability", ru: "Вероятность" },
        fieldType: "number",
        displayType: "progress",
        icon: "📈",
        priority: 2,
      },
    ],
  },

  project: {
    entityType: "project",
    titleField: "title",
    subtitleField: "client_name",
    statusField: "status",
    frontFields: [
      {
        metaKey: "status",
        label: { he: "סטטוס", en: "Status", ru: "Статус" },
        fieldType: "select",
        displayType: "badge",
        icon: "📊",
        priority: 1,
      },
      {
        metaKey: "client_name",
        label: { he: "לקוח", en: "Client", ru: "Клиент" },
        fieldType: "text",
        displayType: "text",
        icon: "🏢",
        priority: 2,
      },
      {
        metaKey: "start_date",
        label: { he: "תאריך התחלה", en: "Start Date", ru: "Дата начала" },
        fieldType: "date",
        displayType: "date",
        icon: "📅",
        priority: 3,
      },
      {
        metaKey: "end_date",
        label: { he: "תאריך סיום", en: "End Date", ru: "Дата окончания" },
        fieldType: "date",
        displayType: "date",
        icon: "🏁",
        priority: 4,
      },
    ],
    backFields: [
      {
        metaKey: "description",
        label: { he: "תיאור", en: "Description", ru: "Описание" },
        fieldType: "rich_text",
        displayType: "text",
        icon: "📝",
        priority: 1,
      },
      {
        metaKey: "budget",
        label: { he: "תקציב", en: "Budget", ru: "Бюджет" },
        fieldType: "currency",
        displayType: "currency",
        icon: "💰",
        priority: 2,
      },
    ],
  },

  lead: {
    entityType: "lead",
    titleField: "title",
    subtitleField: "company",
    statusField: "status",
    frontFields: [
      {
        metaKey: "phone",
        label: { he: "טלפון", en: "Phone", ru: "Телефон" },
        fieldType: "phone",
        displayType: "phone",
        icon: "📱",
        actions: [CALL_ACTION, WHATSAPP_ACTION, COPY_ACTION],
        priority: 1,
      },
      {
        metaKey: "email",
        label: { he: "אימייל", en: "Email", ru: "Почта" },
        fieldType: "email",
        displayType: "email",
        icon: "📧",
        actions: [EMAIL_ACTION, COPY_ACTION],
        priority: 2,
      },
      {
        metaKey: "source",
        label: { he: "מקור", en: "Source", ru: "Источник" },
        fieldType: "select",
        displayType: "badge",
        icon: "🔗",
        priority: 3,
      },
      {
        metaKey: "score",
        label: { he: "ציון", en: "Score", ru: "Оценка" },
        fieldType: "rating",
        displayType: "rating",
        icon: "⭐",
        priority: 4,
      },
    ],
    backFields: [
      {
        metaKey: "company",
        label: { he: "חברה", en: "Company", ru: "Компания" },
        fieldType: "text",
        displayType: "text",
        icon: "🏢",
        priority: 1,
      },
      {
        metaKey: "notes",
        label: { he: "הערות", en: "Notes", ru: "Заметки" },
        fieldType: "rich_text",
        displayType: "text",
        icon: "📝",
        priority: 2,
      },
      {
        metaKey: "next_action",
        label: { he: "פעולה הבאה", en: "Next Action", ru: "Следующее действие" },
        fieldType: "text",
        displayType: "text",
        icon: "➡️",
        priority: 3,
      },
    ],
  },

  task: {
    entityType: "task",
    titleField: "title",
    subtitleField: "assignee",
    statusField: "status",
    frontFields: [
      {
        metaKey: "status",
        label: { he: "סטטוס", en: "Status", ru: "Статус" },
        fieldType: "select",
        displayType: "badge",
        icon: "📊",
        priority: 1,
      },
      {
        metaKey: "priority",
        label: { he: "עדיפות", en: "Priority", ru: "Приоритет" },
        fieldType: "select",
        displayType: "badge",
        icon: "🔥",
        priority: 2,
      },
      {
        metaKey: "due_date",
        label: { he: "תאריך יעד", en: "Due Date", ru: "Срок" },
        fieldType: "date",
        displayType: "date",
        icon: "📅",
        priority: 3,
      },
      {
        metaKey: "assignee",
        label: { he: "אחראי", en: "Assignee", ru: "Ответственный" },
        fieldType: "person",
        displayType: "text",
        icon: "👤",
        priority: 4,
      },
    ],
    backFields: [
      {
        metaKey: "description",
        label: { he: "תיאור", en: "Description", ru: "Описание" },
        fieldType: "rich_text",
        displayType: "text",
        icon: "📝",
        priority: 1,
      },
      {
        metaKey: "progress",
        label: { he: "התקדמות", en: "Progress", ru: "Прогресс" },
        fieldType: "number",
        displayType: "progress",
        icon: "📈",
        priority: 2,
      },
    ],
  },
};

export function getEntityCardConfig(entityType: string): EntityCardConfig {
  return (
    ENTITY_CARD_TEMPLATES[entityType] ?? {
      entityType,
      titleField: "title",
      frontFields: [],
      backFields: [],
    }
  );
}
