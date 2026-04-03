export default {
  title: "База знаний",
  description: "Управление и поиск элементов знаний",

  // Search
  searchPlaceholder: "Поиск по содержанию и заголовкам...",
  searchResults: "Результаты поиска",
  noResults: "Результаты не найдены",
  resultsCount: "{count} результатов",

  // Filters
  filters: "Фильтры",
  filterByType: "Фильтр по типу",
  filterByStatus: "Фильтр по статусу",
  filterByDepartment: "Фильтр по отделу",
  filterByStream: "Фильтр по потоку",
  filterByOwner: "Фильтр по владельцу",
  allTypes: "Все типы",
  allStatuses: "Все статусы",
  allDepartments: "Все отделы",
  allStreams: "Все потоки",
  allOwners: "Все владельцы",
  resetFilters: "Сбросить фильтры",

  // Sorting
  sortBy: "Сортировать по",
  sortNewest: "Новейшие",
  sortOldest: "Старейшие",
  sortPriority: "Приоритет",
  sortConfidence: "Достоверность",
  sortTitle: "Название",

  // Card display
  showMore: "Показать больше",
  showLess: "Показать меньше",
  createdAt: "Создано",
  updatedAt: "Обновлено",
  author: "Автор",
  confidence: "Достоверность",
  priority: "Приоритет",
  type: "Тип",
  departments: "Отделы",
  streams: "Потоки",
  tags: "Теги",

  // Status badges
  draft: "Черновик",
  classified: "Классифицированный",
  reviewed: "Проверенный",
  approved: "Утвержденный",
  locked_to_sot: "Заблокированный SOT",
  deprecated: "Устаревший",
  archived: "В архиве",
  rejected: "Отклоненный",

  // Confidence badges
  low: "Низкая",
  medium: "Средняя",
  high: "Высокая",
  verified: "Проверенная",

  // Priority badges
  critical: "Критический",
  priorityHigh: "Высокий",
  normal: "Обычный",

  // Owner domains
  case_preparation: "Подготовка дел",
  sales: "Продажи",
  recruitment: "Рекрутинг",
  finance: "Финансы",
  systems: "Системы",
  management: "Управление",

  // Actions
  addNew: "Добавить новый элемент",
  edit: "Редактировать",
  delete: "Удалить",
  export: "Экспорт",
  refresh: "Обновить",
  viewDetails: "Посмотреть детали",

  // Detail view
  fullContent: "Полное содержание",
  metadata: "Метаданные",
  lifecycle: "Жизненный цикл",
  sourceInfo: "Информация об источнике",
  relations: "Связи",
  linkedItems: "Связанные элементы",
  useCases: "Случаи использования",
  lenses: "Линзы",
  reviewInfo: "Информация о проверке",
  needsResolution: "Требует решения",
  validUntil: "Действительно до",
  reviewDue: "Срок проверки",
  sotLevel: "Уровень SOT",
  visibility: "Видимость",

  // Add new form
  newKnowledgeItem: "Новый элемент знаний",
  titleRequired: "Название обязательно",
  contentRequired: "Содержание обязательно",
  selectType: "Выберите тип",
  selectDepartments: "Выберите отделы",
  selectStreams: "Выберите потоки",
  selectUseCases: "Выберите случаи использования",
  selectLenses: "Выберите линзы",
  selectOwner: "Выберите владельца",
  tagsPlaceholder: "Добавьте теги через запятую...",
  save: "Сохранить",
  cancel: "Отмена",
  saving: "Сохранение...",

  // Visibility options
  internal: "Внутренний",
  ai_internal: "AI Внутренний",
  ai_external: "AI Внешний",
  published: "Опубликованный",

  // Stats
  totalItems: "Всего элементов",
  draftCount: "Черновики",
  approvedCount: "Утвержденные",
  needsReview: "Требуют проверки",
  expiringSoon: "Истекают скоро",

  // Messages
  loadingItems: "Загрузка элементов знаний...",
  errorLoading: "Ошибка загрузки элементов",
  itemSaved: "Элемент успешно сохранен",
  itemDeleted: "Элемент успешно удален",
  errorSaving: "Ошибка сохранения элемента",
  confirmDelete: "Вы уверены, что хотите удалить этот элемент?"
} as const;