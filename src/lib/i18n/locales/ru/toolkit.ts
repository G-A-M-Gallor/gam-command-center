const toolkit = {
  title: "Инструменты",
  subtitle: "Разработка, ИИ и программные инструменты",

  // Tabs
  tabs: {
    tools: "Инструменты",
    mcps: "MCP и соединения",
    automations: "Автоматизация"
  },

  // Categories
  categories: {
    all: "Все",
    download: "Загрузки",
    transcription: "Транскрипция",
    ai: "Искусственный интеллект",
    dev: "Разработка",
    media: "Медиа",
    general: "Общие"
  },

  // Status
  status: {
    installed: "Установлено",
    recommended: "Рекомендовано",
    optional: "Опционально"
  },

  // Actions
  actions: {
    copyInstall: "Скопировать команду установки",
    copyPrompt: "Скопировать промпт",
    openLink: "Открыть ссылку",
    viewDetails: "Подробности",
    markInstalled: "Отметить как установленное",
    markRecommended: "Отметить как рекомендованное",
    markOptional: "Отметить как опциональное"
  },

  // Table headers
  table: {
    name: "Название инструмента",
    category: "Категория",
    status: "Статус",
    description: "Описание",
    actions: "Действия"
  },

  // AI Chat
  chat: {
    title: "ИИ менеджер инструментов",
    placeholder: "Спросите меня об инструментах, добавьте новый инструмент или обновите статус...",
    examples: {
      add: "Добавить новый инструмент",
      update: "Обновить статус",
      recommend: "Рекомендовать инструменты для разработки",
      install: "Как установить"
    }
  },

  // Messages
  messages: {
    copied: "Скопировано в буфер",
    noTools: "Инструменты не найдены",
    loading: "Загрузка инструментов...",
    error: "Ошибка загрузки инструментов"
  },

  // Filters
  filters: {
    search: "Поиск инструментов...",
    category: "Фильтр по категории",
    status: "Фильтр по статусу"
  },

  // MCP Connections
  mcps: {
    title: "MCP соединения",
    subtitle: "Model Context Protocol - внешние соединения",
    healthSummary: "исправно из", // "16 исправно из 17"
    direction: {
      server: "Сервер",
      client: "Клиент",
      both: "Двунаправленный"
    },
    health: {
      healthy: "Исправно",
      unhealthy: "Неисправно",
      timeout: "Таймаут",
      unknown: "Неизвестно"
    },
    details: {
      server_url: "URL сервера:",
      direction: "Направление:",
      last_check: "Последняя проверка:",
      latency: "Задержка:",
      key_tools: "Основные инструменты:",
      never_checked: "Никогда не проверялось"
    }
  },

  // Automations
  automations: {
    title: "Автоматизация",
    subtitle: "Автоматические задачи и рабочие процессы",
    statusSummary: "активно / сломано / всего", // "16 активно / 2 сломано / 22 всего"
    types: {
      cron_job: "Cron Job",
      edge_function: "Edge Function",
      pg_function: "PG Function",
      webhook: "Webhook",
      make_scenario: "Make Scenario",
      n8n_workflow: "n8n Workflow",
      manual: "Вручную"
    },
    status: {
      active: "Активно",
      broken: "Сломано",
      disabled: "Отключено",
      planned: "Запланировано"
    },
    health: {
      healthy: "Исправно",
      warning: "Предупреждение",
      error: "Ошибка",
      unknown: "Неизвестно"
    },
    trigger: {
      scheduled: "По расписанию",
      event: "По событию",
      manual: "Вручную"
    },
    details: {
      source: "Источник:",
      target: "Цель:",
      schedule: "Расписание:",
      last_run: "Последний запуск:",
      tables_involved: "Задействованные таблицы:",
      what_happens_if_fails: "Что происходит при сбое:",
      how_to_fix: "Как исправить:",
      never_run: "Никогда не запускался"
    }
  }
} as const;

export default toolkit;