const toolkit = {
  title: "Toolkit",
  subtitle: "Development, AI & Software Tools",

  // Tabs
  tabs: {
    tools: "Tools",
    mcps: "MCPs & Connections",
    automations: "Automations"
  },

  // Categories
  categories: {
    all: "All",
    download: "Downloads",
    transcription: "Transcription",
    ai: "Artificial Intelligence",
    dev: "Development",
    media: "Media",
    general: "General"
  },

  // Status
  status: {
    installed: "Installed",
    recommended: "Recommended",
    optional: "Optional"
  },

  // Actions
  actions: {
    copyInstall: "Copy Install Command",
    copyPrompt: "Copy Prompt",
    openLink: "Open Link",
    viewDetails: "View Details",
    markInstalled: "Mark as Installed",
    markRecommended: "Mark as Recommended",
    markOptional: "Mark as Optional"
  },

  // Table headers
  table: {
    name: "Tool Name",
    category: "Category",
    status: "Status",
    description: "Description",
    actions: "Actions"
  },

  // AI Chat
  chat: {
    title: "AI Tool Manager",
    placeholder: "Ask me about tools, request new tools, or update status...",
    examples: {
      add: "Add a new tool",
      update: "Update status of",
      recommend: "Recommend tools for development",
      install: "How to install"
    }
  },

  // Messages
  messages: {
    copied: "Copied to clipboard",
    noTools: "No tools found",
    loading: "Loading tools...",
    error: "Error loading tools"
  },

  // Filters
  filters: {
    search: "Search tools...",
    category: "Filter by category",
    status: "Filter by status"
  },

  // MCP Connections
  mcps: {
    title: "MCP Connections",
    subtitle: "Model Context Protocol - External Connections",
    healthSummary: "healthy out of", // "16 healthy out of 17"
    direction: {
      server: "Server",
      client: "Client",
      both: "Bidirectional"
    },
    health: {
      healthy: "Healthy",
      unhealthy: "Unhealthy",
      timeout: "Timeout",
      unknown: "Unknown"
    },
    details: {
      server_url: "Server URL:",
      direction: "Direction:",
      last_check: "Last Check:",
      latency: "Latency:",
      key_tools: "Key Tools:",
      never_checked: "Never checked"
    }
  },

  // Automations
  automations: {
    title: "Automations",
    subtitle: "Automated tasks and workflows",
    statusSummary: "active / broken / total", // "16 active / 2 broken / 22 total"
    types: {
      cron_job: "Cron Job",
      edge_function: "Edge Function",
      pg_function: "PG Function",
      webhook: "Webhook",
      make_scenario: "Make Scenario",
      n8n_workflow: "n8n Workflow",
      manual: "Manual"
    },
    status: {
      active: "Active",
      broken: "Broken",
      disabled: "Disabled",
      planned: "Planned"
    },
    health: {
      healthy: "Healthy",
      warning: "Warning",
      error: "Error",
      unknown: "Unknown"
    },
    trigger: {
      scheduled: "Scheduled",
      event: "Event-based",
      manual: "Manual"
    },
    details: {
      source: "Source:",
      target: "Target:",
      schedule: "Schedule:",
      last_run: "Last Run:",
      tables_involved: "Tables Involved:",
      what_happens_if_fails: "What happens if fails:",
      how_to_fix: "How to fix:",
      never_run: "Never run"
    }
  }
} as const;

export default toolkit;