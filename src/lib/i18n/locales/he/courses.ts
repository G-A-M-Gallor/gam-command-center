const courses = {
  title: "ספריית קורסים",
  subtitle: "קורסים אישיים עם תמלולים וסיכומים",

  // Status
  status: {
    active: "פעיל",
    completed: "הושלם",
    paused: "מושהה",
    planned: "מתוכנן"
  },

  // Platforms
  platforms: {
    udemy: "Udemy",
    youtube: "YouTube",
    coursera: "Coursera",
    vimeo: "Vimeo",
    local: "מקומי",
    other: "אחר"
  },

  // Actions
  actions: {
    addCourse: "הוסף קורס",
    openCourse: "פתח קורס",
    backToCourses: "חזרה לקורסים",
    viewTranscription: "צפה בתמלול",
    downloadVideo: "הורד וידאו",
    generateSummary: "צור סיכום",
    createFlashcards: "צור כרטיסיות",
    markCompleted: "סמן כהושלם",
    markInProgress: "סמן כבתהליך",
    pause: "השהה",
    resume: "המשך"
  },

  // Progress
  progress: {
    completed: "הושלם",
    remaining: "נותר",
    totalLessons: "סה\"כ שיעורים",
    completedLessons: "שיעורים שהושלמו"
  },

  // Filters
  filters: {
    search: "חיפוש קורסים...",
    allStatuses: "כל הסטטוסים",
    allPlatforms: "כל הפלטפורמות",
    filterByStatus: "סנן לפי סטטוס",
    filterByPlatform: "סנן לפי פלטפורמה"
  },

  // Lessons
  lessons: {
    title: "שיעורים",
    duration: "משך זמן",
    status: "סטטוס",
    transcription: "תמלול",
    summary: "סיכום",
    flashcards: "כרטיסיות",
    downloadStatus: {
      pending: "ממתין",
      downloading: "מוריד",
      downloaded: "הורד",
      transcribing: "מתמלל",
      transcribed: "תומלל",
      summarizing: "מסכם",
      summarized: "סוכם",
      reviewed: "נבדק"
    }
  },

  // Messages
  messages: {
    noCourses: "אין קורסים",
    noResults: "לא נמצאו תוצאות",
    addFirstCourse: "הוסף את הקורס הראשון שלך",
    loadingCourses: "טוען קורסים...",
    errorLoading: "שגיאה בטעינת קורסים",
    courseNotFound: "קורס לא נמצא",
    noLessons: "אין שיעורים בקורס זה",
    noTranscriptions: "אין תמלולים זמינים"
  },

  // Stats
  stats: {
    totalCourses: "סה\"כ קורסים",
    totalLessons: "סה\"כ שיעורים",
    totalHours: "סה\"כ שעות",
    completedCourses: "קורסים שהושלמו",
    activeCourses: "קורסים פעילים",
    progress: "התקדמות כללית"
  },

  // Course Details
  details: {
    description: "תיאור",
    platform: "פלטפורמה",
    language: "שפה",
    totalDuration: "משך זמן כולל",
    tags: "תגיות",
    sourceUrl: "URL מקור",
    driveFolder: "תיקיית Drive",
    created: "נוצר",
    lastUpdated: "עודכן לאחרונה"
  },

  // Transcription
  transcription: {
    title: "תמלול",
    engine: "מנוע תמלול",
    wordCount: "מספר מילים",
    summary: "סיכום",
    keyPoints: "נקודות מפתח",
    flashcards: "כרטיסיות למידה",
    confidence: "רמת ביטחון",
    language: "שפה מזוהה"
  }
} as const;

export default courses;