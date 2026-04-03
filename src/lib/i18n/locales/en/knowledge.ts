export default {
  title: "Knowledge Base",
  description: "Manage and search knowledge items",

  // Search
  searchPlaceholder: "Search content and titles...",
  searchResults: "Search results",
  noResults: "No results found",
  resultsCount: "{count} results",

  // Filters
  filters: "Filters",
  filterByType: "Filter by type",
  filterByStatus: "Filter by status",
  filterByDepartment: "Filter by department",
  filterByStream: "Filter by stream",
  filterByOwner: "Filter by owner",
  allTypes: "All types",
  allStatuses: "All statuses",
  allDepartments: "All departments",
  allStreams: "All streams",
  allOwners: "All owners",
  resetFilters: "Reset filters",

  // Sorting
  sortBy: "Sort by",
  sortNewest: "Newest",
  sortOldest: "Oldest",
  sortPriority: "Priority",
  sortConfidence: "Confidence",
  sortTitle: "Title",

  // Card display
  showMore: "Show more",
  showLess: "Show less",
  createdAt: "Created",
  updatedAt: "Updated",
  author: "Author",
  confidence: "Confidence",
  priority: "Priority",
  type: "Type",
  departments: "Departments",
  streams: "Streams",
  tags: "Tags",

  // Status badges
  draft: "Draft",
  classified: "Classified",
  reviewed: "Reviewed",
  approved: "Approved",
  locked_to_sot: "Locked SOT",
  deprecated: "Deprecated",
  archived: "Archived",
  rejected: "Rejected",

  // Confidence badges
  low: "Low",
  medium: "Medium",
  high: "High",
  verified: "Verified",

  // Priority badges
  critical: "Critical",
  priorityHigh: "High",
  normal: "Normal",

  // Owner domains
  case_preparation: "Case Preparation",
  sales: "Sales",
  recruitment: "Recruitment",
  finance: "Finance",
  systems: "Systems",
  management: "Management",

  // Actions
  addNew: "Add new item",
  edit: "Edit",
  delete: "Delete",
  export: "Export",
  refresh: "Refresh",
  viewDetails: "View details",

  // Detail view
  fullContent: "Full content",
  metadata: "Metadata",
  lifecycle: "Lifecycle",
  sourceInfo: "Source info",
  relations: "Relations",
  linkedItems: "Linked items",
  useCases: "Use cases",
  lenses: "Lenses",
  reviewInfo: "Review info",
  needsResolution: "Needs resolution",
  validUntil: "Valid until",
  reviewDue: "Review due",
  sotLevel: "SOT Level",
  visibility: "Visibility",

  // Add new form
  newKnowledgeItem: "New knowledge item",
  titleRequired: "Title required",
  contentRequired: "Content required",
  selectType: "Select type",
  selectDepartments: "Select departments",
  selectStreams: "Select streams",
  selectUseCases: "Select use cases",
  selectLenses: "Select lenses",
  selectOwner: "Select owner",
  tagsPlaceholder: "Add comma-separated tags...",
  save: "Save",
  cancel: "Cancel",
  saving: "Saving...",

  // Visibility options
  internal: "Internal",
  ai_internal: "AI Internal",
  ai_external: "AI External",
  published: "Published",

  // Stats
  totalItems: "Total items",
  draftCount: "Drafts",
  approvedCount: "Approved",
  needsReview: "Needs review",
  expiringSoon: "Expiring soon",

  // Messages
  loadingItems: "Loading knowledge items...",
  errorLoading: "Error loading items",
  itemSaved: "Item saved successfully",
  itemDeleted: "Item deleted successfully",
  errorSaving: "Error saving item",
  confirmDelete: "Are you sure you want to delete this item?"
} as const;