const courses = {
  title: "Course Library",
  subtitle: "Personal courses with transcriptions and summaries",

  // Status
  status: {
    active: "Active",
    completed: "Completed",
    paused: "Paused",
    planned: "Planned"
  },

  // Platforms
  platforms: {
    udemy: "Udemy",
    youtube: "YouTube",
    coursera: "Coursera",
    vimeo: "Vimeo",
    local: "Local",
    other: "Other"
  },

  // Actions
  actions: {
    addCourse: "Add Course",
    openCourse: "Open Course",
    backToCourses: "Back to Courses",
    viewTranscription: "View Transcription",
    downloadVideo: "Download Video",
    generateSummary: "Generate Summary",
    createFlashcards: "Create Flashcards",
    markCompleted: "Mark Completed",
    markInProgress: "Mark In Progress",
    pause: "Pause",
    resume: "Resume"
  },

  // Progress
  progress: {
    completed: "Completed",
    remaining: "Remaining",
    totalLessons: "Total Lessons",
    completedLessons: "Completed Lessons"
  },

  // Filters
  filters: {
    search: "Search courses...",
    allStatuses: "All Statuses",
    allPlatforms: "All Platforms",
    filterByStatus: "Filter by Status",
    filterByPlatform: "Filter by Platform"
  },

  // Lessons
  lessons: {
    title: "Lessons",
    duration: "Duration",
    status: "Status",
    transcription: "Transcription",
    summary: "Summary",
    flashcards: "Flashcards",
    downloadStatus: {
      pending: "Pending",
      downloading: "Downloading",
      downloaded: "Downloaded",
      transcribing: "Transcribing",
      transcribed: "Transcribed",
      summarizing: "Summarizing",
      summarized: "Summarized",
      reviewed: "Reviewed"
    }
  },

  // Messages
  messages: {
    noCourses: "No courses found",
    noResults: "No results found",
    addFirstCourse: "Add your first course",
    loadingCourses: "Loading courses...",
    errorLoading: "Error loading courses",
    courseNotFound: "Course not found",
    noLessons: "No lessons in this course",
    noTranscriptions: "No transcriptions available"
  },

  // Stats
  stats: {
    totalCourses: "Total Courses",
    totalLessons: "Total Lessons",
    totalHours: "Total Hours",
    completedCourses: "Completed Courses",
    activeCourses: "Active Courses",
    progress: "Overall Progress"
  },

  // Course Details
  details: {
    description: "Description",
    platform: "Platform",
    language: "Language",
    totalDuration: "Total Duration",
    tags: "Tags",
    sourceUrl: "Source URL",
    driveFolder: "Drive Folder",
    created: "Created",
    lastUpdated: "Last Updated"
  },

  // Transcription
  transcription: {
    title: "Transcription",
    engine: "Transcription Engine",
    wordCount: "Word Count",
    summary: "Summary",
    keyPoints: "Key Points",
    flashcards: "Flashcards",
    confidence: "Confidence Level",
    language: "Detected Language"
  }
} as const;

export default courses;