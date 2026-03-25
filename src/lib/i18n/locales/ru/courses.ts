const courses = {
  title: "Библиотека курсов",
  subtitle: "Персональные курсы с транскрипциями и резюме",

  // Status
  status: {
    active: "Активный",
    completed: "Завершен",
    paused: "Приостановлен",
    planned: "Запланирован"
  },

  // Platforms
  platforms: {
    udemy: "Udemy",
    youtube: "YouTube",
    coursera: "Coursera",
    vimeo: "Vimeo",
    local: "Локальный",
    other: "Другое"
  },

  // Actions
  actions: {
    addCourse: "Добавить курс",
    openCourse: "Открыть курс",
    backToCourses: "Назад к курсам",
    viewTranscription: "Посмотреть транскрипцию",
    downloadVideo: "Скачать видео",
    generateSummary: "Создать резюме",
    createFlashcards: "Создать карточки",
    markCompleted: "Отметить завершенным",
    markInProgress: "Отметить в процессе",
    pause: "Приостановить",
    resume: "Продолжить"
  },

  // Progress
  progress: {
    completed: "Завершено",
    remaining: "Осталось",
    totalLessons: "Всего уроков",
    completedLessons: "Завершенные уроки"
  },

  // Filters
  filters: {
    search: "Поиск курсов...",
    allStatuses: "Все статусы",
    allPlatforms: "Все платформы",
    filterByStatus: "Фильтр по статусу",
    filterByPlatform: "Фильтр по платформе"
  },

  // Lessons
  lessons: {
    title: "Уроки",
    duration: "Продолжительность",
    status: "Статус",
    transcription: "Транскрипция",
    summary: "Резюме",
    flashcards: "Карточки",
    downloadStatus: {
      pending: "Ожидание",
      downloading: "Скачивание",
      downloaded: "Скачано",
      transcribing: "Транскрибирование",
      transcribed: "Транскрибировано",
      summarizing: "Создание резюме",
      summarized: "Резюме создано",
      reviewed: "Проверено"
    }
  },

  // Messages
  messages: {
    noCourses: "Курсы не найдены",
    noResults: "Результаты не найдены",
    addFirstCourse: "Добавьте ваш первый курс",
    loadingCourses: "Загрузка курсов...",
    errorLoading: "Ошибка загрузки курсов",
    courseNotFound: "Курс не найден",
    noLessons: "Нет уроков в этом курсе",
    noTranscriptions: "Транскрипции недоступны"
  },

  // Stats
  stats: {
    totalCourses: "Всего курсов",
    totalLessons: "Всего уроков",
    totalHours: "Всего часов",
    completedCourses: "Завершенные курсы",
    activeCourses: "Активные курсы",
    progress: "Общий прогресс"
  },

  // Course Details
  details: {
    description: "Описание",
    platform: "Платформа",
    language: "Язык",
    totalDuration: "Общая продолжительность",
    tags: "Теги",
    sourceUrl: "URL источника",
    driveFolder: "Папка Drive",
    created: "Создано",
    lastUpdated: "Последнее обновление"
  },

  // Transcription
  transcription: {
    title: "Транскрипция",
    engine: "Движок транскрипции",
    wordCount: "Количество слов",
    summary: "Резюме",
    keyPoints: "Ключевые моменты",
    flashcards: "Карточки для запоминания",
    confidence: "Уровень уверенности",
    language: "Обнаруженный язык"
  }
} as const;

export default courses;