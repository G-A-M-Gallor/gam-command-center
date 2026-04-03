export default {
  title: "מאגר ידע",
  description: "ניהול וחיפוש פריטי ידע",

  // Search
  searchPlaceholder: "חיפוש בתוכן ובכותרות...",
  searchResults: "תוצאות חיפוש",
  noResults: "לא נמצאו תוצאות",
  resultsCount: "{count} תוצאות",

  // Filters
  filters: "מסננים",
  filterByType: "סינון לפי סוג",
  filterByStatus: "סינון לפי סטטוס",
  filterByDepartment: "סינון לפי מחלקה",
  filterByStream: "סינון לפי זרם",
  filterByOwner: "סינון לפי בעלים",
  allTypes: "כל הסוגים",
  allStatuses: "כל הסטטוסים",
  allDepartments: "כל המחלקות",
  allStreams: "כל הזרמים",
  allOwners: "כל הבעלים",
  resetFilters: "איפוס מסננים",

  // Sorting
  sortBy: "מיון לפי",
  sortNewest: "חדש ביותר",
  sortOldest: "ישן ביותר",
  sortPriority: "עדיפות",
  sortConfidence: "רמת ביטחון",
  sortTitle: "כותרת",

  // Card display
  showMore: "הצג עוד",
  showLess: "הצג פחות",
  createdAt: "נוצר בתאריך",
  updatedAt: "עודכן בתאריך",
  author: "מחבר",
  confidence: "רמת ביטחון",
  priority: "עדיפות",
  type: "סוג",
  departments: "מחלקות",
  streams: "זרמים",
  tags: "תגיות",

  // Status badges
  draft: "טיוטה",
  classified: "מסווג",
  reviewed: "נבדק",
  approved: "מאושר",
  locked_to_sot: "נעול למקור אמת",
  deprecated: "מיושן",
  archived: "בארכיון",
  rejected: "נדחה",

  // Confidence badges
  low: "נמוך",
  medium: "בינוני",
  high: "גבוה",
  verified: "מאומת",

  // Priority badges
  critical: "קריטי",
  priorityHigh: "גבוה",
  normal: "רגיל",

  // Owner domains
  case_preparation: "הכנת תיקים",
  sales: "מכירות",
  recruitment: "גיוס",
  finance: "כספים",
  systems: "מערכות",
  management: "הנהלה",

  // Actions
  addNew: "הוסף פריט חדש",
  edit: "עריכה",
  delete: "מחיקה",
  export: "יצוא",
  refresh: "רענון",
  viewDetails: "צפייה בפרטים",

  // Detail view
  fullContent: "תוכן מלא",
  metadata: "מטא-דאטה",
  lifecycle: "מחזור חיים",
  sourceInfo: "מידע מקור",
  relations: "קשרים",
  linkedItems: "פריטים קשורים",
  useCases: "מקרי שימוש",
  lenses: "עדשות",
  reviewInfo: "מידע בדיקה",
  needsResolution: "דרושה פתרון",
  validUntil: "תקף עד",
  reviewDue: "מועד בדיקה",
  sotLevel: "רמת מקור אמת",
  visibility: "נראות",

  // Add new form
  newKnowledgeItem: "פריט ידע חדש",
  titleRequired: "כותרת נדרשת",
  contentRequired: "תוכן נדרש",
  selectType: "בחר סוג",
  selectDepartments: "בחר מחלקות",
  selectStreams: "בחר זרמים",
  selectUseCases: "בחר מקרי שימוש",
  selectLenses: "בחר עדשות",
  selectOwner: "בחר בעלים",
  tagsPlaceholder: "הוסף תגיות מופרדות בפסיק...",
  save: "שמור",
  cancel: "ביטול",
  saving: "שומר...",

  // Visibility options
  internal: "פנימי",
  ai_internal: "AI פנימי",
  ai_external: "AI חיצוני",
  published: "מפורסם",

  // Stats
  totalItems: "סה\"כ פריטים",
  draftCount: "טיוטות",
  approvedCount: "מאושרים",
  needsReview: "דורש בדיקה",
  expiringSoon: "פג תוקף בקרוב",

  // Messages
  loadingItems: "טוען פריטי ידע...",
  errorLoading: "שגיאה בטעינת פריטים",
  itemSaved: "פריט נשמר בהצלחה",
  itemDeleted: "פריט נמחק בהצלחה",
  errorSaving: "שגיאה בשמירת פריט",
  confirmDelete: "האם אתה בטוח שברצונך למחוק פריט זה?"
} as const;