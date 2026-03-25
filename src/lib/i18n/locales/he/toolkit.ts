const toolkit = {
  title: "ארגז כלים",
  subtitle: "כלים לפיתוח, AI ותוכניות",

  // Tabs
  tabs: {
    tools: "כלים",
    mcps: "MCPs & חיבורים",
    automations: "אוטומציות"
  },

  // Categories
  categories: {
    all: "הכל",
    download: "הורדות",
    transcription: "תמלול",
    ai: "בינה מלאכותית",
    dev: "פיתוח",
    media: "מדיה",
    general: "כללי"
  },

  // Status
  status: {
    installed: "מותקן",
    recommended: "מומלץ",
    optional: "אופציונלי"
  },

  // Actions
  actions: {
    copyInstall: "העתק פקודת התקנה",
    copyPrompt: "העתק פרומפט",
    openLink: "פתח קישור",
    viewDetails: "פרטים נוספים",
    markInstalled: "סמן כמותקן",
    markRecommended: "סמן כמומלץ",
    markOptional: "סמן כאופציונלי"
  },

  // Table headers
  table: {
    name: "שם הכלי",
    category: "קטגוריה",
    status: "סטטוס",
    description: "תיאור",
    actions: "פעולות"
  },

  // AI Chat
  chat: {
    title: "עוזר AI לניהול כלים",
    placeholder: "שאל אותי על כלים, בקש ממני להוסיף כלי חדש או לעדכן סטטוס...",
    examples: {
      add: "הוסף כלי חדש",
      update: "עדכן סטטוס של",
      recommend: "המלץ לי על כלים לפיתוח",
      install: "איך מתקינים"
    }
  },

  // Messages
  messages: {
    copied: "הועתק ללוח",
    noTools: "לא נמצאו כלים",
    loading: "טוען כלים...",
    error: "שגיאה בטעינת הכלים"
  },

  // Filters
  filters: {
    search: "חפש כלי...",
    category: "סנן לפי קטגוריה",
    status: "סנן לפי סטטוס"
  },

  // MCP Connections
  mcps: {
    title: "חיבורי MCP",
    subtitle: "Model Context Protocol - חיבורים חיצוניים",
    healthSummary: "תקין מתוך", // "16 תקין מתוך 17"
    direction: {
      server: "שרת",
      client: "קליינט",
      both: "דו-כיווני"
    },
    health: {
      healthy: "תקין",
      unhealthy: "לא תקין",
      timeout: "זמן קצוב",
      unknown: "לא ידוע"
    },
    details: {
      server_url: "כתובת שרת:",
      direction: "כיוון:",
      last_check: "בדיקה אחרונה:",
      latency: "זמן תגובה:",
      key_tools: "כלי עיקריים:",
      never_checked: "מעולם לא נבדק"
    }
  },

  // Automations
  automations: {
    title: "אוטומציות",
    subtitle: "משימות אוטומטיות ו-workflows",
    statusSummary: "פעיל / שבור / סה\"כ", // "16 פעיל / 2 שבור / 22 סה\"כ"
    types: {
      cron_job: "Cron Job",
      edge_function: "Edge Function",
      pg_function: "PG Function",
      webhook: "Webhook",
      make_scenario: "Make Scenario",
      n8n_workflow: "n8n Workflow",
      manual: "ידני"
    },
    status: {
      active: "פעיל",
      broken: "שבור",
      disabled: "מבוטל",
      planned: "מתוכנן"
    },
    health: {
      healthy: "תקין",
      warning: "אזהרה",
      error: "שגיאה",
      unknown: "לא ידוע"
    },
    trigger: {
      scheduled: "מתוזמן",
      event: "על פי אירוע",
      manual: "ידני"
    },
    details: {
      source: "מקור:",
      target: "יעד:",
      schedule: "תזמון:",
      last_run: "הרצה אחרונה:",
      tables_involved: "טבלאות מעורבות:",
      what_happens_if_fails: "מה קורה אם נכשל:",
      how_to_fix: "איך לתקן:",
      never_run: "מעולם לא רץ"
    }
  }
} as const;

export default toolkit;