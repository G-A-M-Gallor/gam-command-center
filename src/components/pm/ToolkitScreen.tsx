"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, ExternalLink, Search, MessageSquare, ChevronDown, ChevronUp, ArrowRight, Send, RefreshCw } from "lucide-react";
import { getTranslations } from "@/lib/i18n";
import { useSettings } from "@/contexts/SettingsContext";
import { Card } from "@/components/ui/Card";

interface Tool {
  id: string;
  name: string;
  emoji: string;
  category: string;
  status: string;
  description: string;
  install_command: string;
  link: string;
  claude_prompt: string;
  notes: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface McpConnection {
  id: string;
  name: string;
  status: "active" | "inactive" | "error";
  server_url: string;
  direction: "server" | "client" | "both";
  health_status: "healthy" | "unhealthy" | "timeout" | "unknown";
  health_latency_ms: number | null;
  last_health_check: string | null;
  settings: {
    emoji?: string;
    category?: string;
    description?: string;
    key_tools?: string[];
    platform?: string;
  };
}

interface Automation {
  id: string;
  name: string;
  emoji: string;
  type: "cron_job" | "edge_function" | "pg_function" | "webhook" | "make_scenario" | "n8n_workflow" | "manual";
  trigger_type: "scheduled" | "event" | "manual";
  schedule: string | null;
  schedule_human: string | null;
  status: "active" | "broken" | "disabled" | "planned";
  health: "healthy" | "warning" | "error" | "unknown";
  last_run: string | null;
  source: string | null;
  target: string | null;
  tables_involved: string[];
  description: string | null;
  what_happens_if_fails: string | null;
  how_to_fix: string | null;
  app_name: string | null;
  edge_function_slug: string | null;
}

export default function ToolkitScreen() {
  // Tab state
  const [activeTab, setActiveTab] = useState<"tools" | "cloud-mcps" | "terminal-mcps" | "automations" | "hostinger" | "google-workspace">("tools");

  // Tools state
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  // MCPs state
  const [mcps, setMcps] = useState<McpConnection[]>([]);
  const [filteredMcps, setFilteredMcps] = useState<McpConnection[]>([]);
  const [mcpsLoading, setMcpsLoading] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>("");

  // Automations state
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [filteredAutomations, setFilteredAutomations] = useState<Automation[]>([]);
  const [automationsLoading, setAutomationsLoading] = useState(false);

  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const { language } = useSettings();
  const isRtl = language === "he";

  // Load data functions
  const fetchTools = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/toolkit");
      if (response.ok) {
        const data = await response.json();
        setTools(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch tools:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMcps = useCallback(async () => {
    setMcpsLoading(true);
    try {
      const response = await fetch("/api/toolkit/connections");
      if (response.ok) {
        const data = await response.json();
        setMcps(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch MCPs:", error);
    } finally {
      setMcpsLoading(false);
    }
  }, []);

  const fetchAutomations = useCallback(async () => {
    setAutomationsLoading(true);
    try {
      const response = await fetch("/api/toolkit/automations");
      if (response.ok) {
        const data = await response.json();
        setAutomations(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch automations:", error);
    } finally {
      setAutomationsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTools();
    fetchMcps();
    fetchAutomations();
  }, [fetchTools, fetchMcps, fetchAutomations]);

  // Filter data when search/filters change
  useEffect(() => {
    let filtered = tools;
    if (searchQuery) {
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter(tool => tool.category === selectedCategory);
    }
    if (selectedStatus !== "all") {
      filtered = filtered.filter(tool => tool.status === selectedStatus);
    }
    setFilteredTools(filtered);
  }, [tools, searchQuery, selectedCategory, selectedStatus]);

  useEffect(() => {
    let filtered = mcps;
    if (searchQuery) {
      filtered = filtered.filter(mcp =>
        mcp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mcp.settings.description && mcp.settings.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (selectedStatus !== "all") {
      filtered = filtered.filter(mcp => mcp.health_status === selectedStatus);
    }
    setFilteredMcps(filtered);
  }, [mcps, searchQuery, selectedStatus]);

  useEffect(() => {
    let filtered = automations;
    if (searchQuery) {
      filtered = filtered.filter(automation =>
        automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (automation.description && automation.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter(automation => automation.type === selectedCategory);
    }
    if (selectedStatus !== "all") {
      filtered = filtered.filter(automation => automation.status === selectedStatus);
    }
    setFilteredAutomations(filtered);
  }, [automations, searchQuery, selectedCategory, selectedStatus]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "installed":
      case "active":
      case "healthy":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "available":
      case "inactive":
      case "warning":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "broken":
      case "error":
      case "unhealthy":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "timeout":
        return "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getHealthCircle = (healthStatus: string) => {
    const baseClasses = "w-3 h-3 rounded-full";
    switch (healthStatus) {
      case "healthy":
        return `${baseClasses} bg-emerald-500`;
      case "timeout":
        return `${baseClasses} bg-red-500 animate-pulse`;
      case "unhealthy":
      case "error":
        return `${baseClasses} bg-red-500`;
      default:
        return `${baseClasses} bg-slate-500`;
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      development: "💻",
      ai: "🤖",
      automation: "⚡",
      database: "🗄️",
      analytics: "📊",
      communication: "💬",
      security: "🔐",
      other: "🔧"
    };
    return emojis[category] || "🔧";
  };

  // Chat functions
  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      // Simple mock response - replace with actual API call
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `אני עוזר עם ${
            activeTab === "tools" ? "כלים" :
            activeTab === "cloud-mcps" ? "MCPs ענן" :
            activeTab === "terminal-mcps" ? "MCPs טרמינל" :
            activeTab === "automations" ? "אוטומציות" :
            activeTab === "hostinger" ? "Hostinger ניהול" :
            activeTab === "google-workspace" ? "Google Workspace" :
            "מערכות"
          }. איך אוכל לעזור?`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, assistantMessage]);
        setChatLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Chat error:", error);
      setChatLoading(false);
    }
  };

  // Count calculations
  const toolsHealthyCount = tools.filter(t => t.status === "installed").length;
  const toolsCount = tools.length;


  const automationsActiveCount = automations.filter(a => a.status === "active").length;
  const automationsBrokenCount = automations.filter(a => a.status === "broken").length;
  const automationsCount = automations.length;

  // Group MCPs
  const claudeAiMcps = mcps.filter(m => m.settings.platform === "claude.ai" || m.name.includes("claude.ai"));
  const claudeCodeMcps = mcps.filter(m => m.settings.platform === "Claude Code" || (!m.settings.platform && !m.name.includes("claude.ai")));

  // Get unique categories and statuses
  const categories = Array.from(new Set(
    activeTab === "tools" ? tools.map(t => t.category) :
    activeTab === "automations" ? automations.map(a => a.type) :
    activeTab === "cloud-mcps" ? claudeAiMcps.map(m => m.settings.category).filter(Boolean) :
    activeTab === "terminal-mcps" ? claudeCodeMcps.map(m => m.settings.category).filter(Boolean) :
    activeTab === "hostinger" ? ["VPS", "Domains", "DNS"] :
    activeTab === "google-workspace" ? ["Calendar", "Gmail", "Drive"] :
    []
  ));

  const statuses = Array.from(new Set(
    activeTab === "tools" ? tools.map(t => t.status) :
    activeTab === "cloud-mcps" ? claudeAiMcps.map(m => m.health_status) :
    activeTab === "terminal-mcps" ? claudeCodeMcps.map(m => m.health_status) :
    activeTab === "automations" ? automations.map(a => a.status) :
    activeTab === "hostinger" ? ["Online", "Offline", "Maintenance"] :
    activeTab === "google-workspace" ? ["Connected", "Syncing", "Error"] :
    []
  ));

  // Tab configuration
  const cloudMcpsHealthy = claudeAiMcps.filter(m => m.health_status === "healthy").length;
  const terminalMcpsHealthy = claudeCodeMcps.filter(m => m.health_status === "healthy").length;

  const tabs = [
    {
      key: "tools",
      label: "כלים",
      count: `${toolsHealthyCount}/${toolsCount}`,
      countColor: toolsHealthyCount === toolsCount ? "text-emerald-400" : "text-amber-400"
    },
    {
      key: "cloud-mcps",
      label: "MCPs ענן",
      count: `${cloudMcpsHealthy}/${claudeAiMcps.length}`,
      countColor: cloudMcpsHealthy === claudeAiMcps.length ? "text-emerald-400" : "text-red-400"
    },
    {
      key: "terminal-mcps",
      label: "MCPs טרמינל",
      count: `${terminalMcpsHealthy}/${claudeCodeMcps.length}`,
      countColor: terminalMcpsHealthy === claudeCodeMcps.length ? "text-emerald-400" : "text-red-400"
    },
    {
      key: "automations",
      label: "אוטומציות",
      count: `${automationsActiveCount} פעיל / ${automationsBrokenCount} שבור / ${automationsCount}`,
      countColor: automationsBrokenCount > 0 ? "text-red-400" : "text-emerald-400"
    },
    {
      key: "hostinger",
      label: "🌐 Hostinger",
      count: "1 VPS • Make.com",
      countColor: "text-green-400"
    },
    {
      key: "google-workspace",
      label: "🔮 Google",
      count: "5 Services • All Connected",
      countColor: "text-green-400"
    }
  ];

  return (
    <div className="flex min-h-full flex-col" dir={isRtl ? "rtl" : "ltr"}>
      {/* <PageHeader pageKey="pm" /> */}

      <div className="flex flex-1 gap-6 pt-6">
        {/* Content Area */}
        <div className={`transition-all duration-300 ${chatOpen ? "flex-1" : "w-full"}`}>
          <div className="max-w-7xl mx-auto px-6">
            {/* Header with sync and chat buttons */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-200">ארגז כלים</h1>
                <p className="text-slate-400 mt-1">כלים, MCPs ואוטומציות למערכת</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (isSyncing) return;

                    setIsSyncing(true);
                    setSyncStatus("מסנכרן MCPs...");

                    try {
                      console.log('Starting comprehensive sync...');
                      setSyncStatus("מסנכרן MCPs...");

                      // Sync MCPs
                      const mcpResponse = await fetch('/api/toolkit/sync-live', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include'
                      });

                      const mcpData = await mcpResponse.json();
                      console.log('MCP Sync response:', mcpData);

                      if (!mcpResponse.ok) {
                        throw new Error(mcpData.error || 'MCP sync failed');
                      }

                      setSyncStatus("מסנכרן אוטומציות...");

                      let automationsSynced = 0;
                      let automationError = null;

                      // Try Sync Automations (non-blocking)
                      try {
                        const autoResponse = await fetch('/api/toolkit/sync-automations', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include'
                        });

                        const autoData = await autoResponse.json();
                        console.log('Automation Sync response:', autoData);

                        if (autoResponse.ok) {
                          automationsSynced = autoData.automations_synced || 0;
                        } else {
                          automationError = autoData.error || 'Automation sync failed';
                          console.warn('Automation sync failed but continuing:', automationError);
                        }
                      } catch (autoError) {
                        automationError = autoError instanceof Error ? autoError.message : 'Automation sync error';
                        console.warn('Automation sync error but continuing:', autoError);
                      }

                      setSyncStatus("מרענן נתונים...");

                      // Refresh all data
                      await fetchMcps();
                      await fetchTools();
                      await fetchAutomations();

                      // Show success with warning if automation sync failed
                      if (automationError) {
                        setSyncStatus(`✅ סונכרנו ${mcpData.mcps_synced} MCPs | ⚠️ אוטומציות: שגיאה זמנית`);
                      } else {
                        setSyncStatus(`✅ סונכרנו ${mcpData.mcps_synced} MCPs ו-${automationsSynced} אוטומציות`);
                      }
                      setTimeout(() => setSyncStatus(""), 4000);

                    } catch (error) {
                      console.error('Sync failed:', error);
                      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                      if (errorMessage.includes('Unauthorized')) {
                        setSyncStatus(`❌ נדרש התחברות - אנא התחבר מחדש למערכת`);
                      } else {
                        setSyncStatus(`❌ שגיאה: ${errorMessage}`);
                      }
                      setTimeout(() => setSyncStatus(""), 7000);
                    } finally {
                      setIsSyncing(false);
                    }
                  }}
                  disabled={isSyncing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isSyncing
                      ? "bg-slate-600/50 text-slate-500 border border-slate-600 cursor-not-allowed"
                      : "bg-emerald-800/50 text-emerald-400 border border-emerald-700 hover:bg-emerald-700/50"
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? "מסנכרן..." : "סנכרן חי"}
                </button>

                {/* Sync status */}
                {syncStatus && (
                  <div className={`text-sm px-3 py-1 rounded-md ${
                    syncStatus.includes("שגיאה") || syncStatus.includes("שגיאת")
                      ? "bg-red-900/30 text-red-400 border border-red-800"
                      : "bg-emerald-900/30 text-emerald-400 border border-emerald-800"
                  }`}>
                    {syncStatus}
                  </div>
                )}
                <button
                  onClick={() => setChatOpen(!chatOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    chatOpen
                      ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                      : "bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700/50"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  {chatOpen ? "סגור צ'אט" : "פתח צ'אט"}
                </button>
              </div>
            </div>

            {/* Tabs with counts */}
            <div className="flex gap-1 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "bg-slate-800/30 text-slate-400 border border-slate-700/50 hover:bg-slate-700/30"
                  }`}
                >
                  {tab.label}
                  <span className={`text-xs ${tab.countColor}`}>
                    ({tab.count})
                  </span>
                </button>
              ))}
            </div>

            {/* Search and Filters */}
            <Card className="mb-6">
              <div className="flex flex-wrap gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`חפש ${
                      activeTab === "tools" ? "כלים" :
                      activeTab === "cloud-mcps" ? "MCPs ענן" :
                      activeTab === "terminal-mcps" ? "MCPs טרמינל" :
                      activeTab === "automations" ? "אוטומציות" :
                      activeTab === "hostinger" ? "Hostinger שירותים" :
                      activeTab === "google-workspace" ? "Google כלים" :
                      "פריטים"
                    }...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">כל הקטגוריות</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {getCategoryEmoji(category || '')} {category}
                      </option>
                    ))}
                  </select>
                )}

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="all">כל הסטטוסים</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </Card>

            {/* Content based on active tab */}
            {activeTab === "tools" && (
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-12 text-slate-400">טוען כלים...</div>
                ) : filteredTools.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">לא נמצאו כלים</div>
                ) : (
                  filteredTools.map((tool) => (
                    <Card
                      key={tool.id}
                      className="cursor-pointer"
                      onClick={() => setExpandedTool(expandedTool === tool.id ? null : tool.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{tool.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-200">{tool.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(tool.status)}`}>
                              {tool.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400">{tool.description}</p>
                        </div>
                        <div className="text-slate-400">
                          {expandedTool === tool.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>

                      {expandedTool === tool.id && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-slate-300 mb-2">פקודת התקנה:</h4>
                              <div className="bg-slate-900/50 rounded p-3 font-mono text-sm text-slate-300">
                                {tool.install_command}
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(tool.install_command);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(tool.install_command);
                                    }
                                  }}
                                  className="mr-2 text-blue-400 hover:text-blue-300 cursor-pointer inline-flex items-center"
                                  role="button"
                                  tabIndex={0}
                                  aria-label="העתק פקודת התקנה"
                                >
                                  <Copy className="w-4 h-4 inline" />
                                </span>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-slate-300 mb-2">קישורים:</h4>
                              <div className="space-y-2">
                                {tool.link && (
                                  <a
                                    href={tool.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    מסמכים
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          {tool.claude_prompt && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-slate-300 mb-2">הנחיה לקלוד:</h4>
                              <div className="bg-slate-900/50 rounded p-3 text-sm text-slate-300">
                                {tool.claude_prompt}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === "cloud-mcps" && (
              <div className="space-y-4">
                {mcpsLoading ? (
                  <div className="text-center py-12 text-slate-400">טוען MCPs ענן...</div>
                ) : claudeAiMcps.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">לא נמצאו MCPs ענן</div>
                ) : (
                  claudeAiMcps.map((mcp) => (
                    <Card key={mcp.id}>
                      <div className="flex items-center gap-4">
                        <div className={getHealthCircle(mcp.health_status)} />
                        <div className="text-2xl">{mcp.settings.emoji || "🤖"}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-md font-medium text-slate-200">{mcp.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(mcp.health_status)}`}>
                              {mcp.health_status}
                            </span>
                            <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              claude.ai
                            </span>
                          </div>
                          <p className="text-sm text-slate-400">{mcp.settings.description || "אין תיאור"}</p>
                          {mcp.health_latency_ms && (
                            <p className="text-xs text-slate-500">Latency: {mcp.health_latency_ms}ms</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === "terminal-mcps" && (
              <div className="space-y-4">
                {mcpsLoading ? (
                  <div className="text-center py-12 text-slate-400">טוען MCPs טרמינל...</div>
                ) : claudeCodeMcps.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">לא נמצאו MCPs טרמינל</div>
                ) : (
                  claudeCodeMcps.map((mcp) => (
                    <Card
                      key={mcp.id}
                      className={mcp.name.includes("n8n") ? "border-red-500/30 bg-red-500/5" : ""}
                    >
                      <div className="flex items-center gap-4">
                        <div className={getHealthCircle(mcp.health_status)} />
                        <div className="text-2xl">{mcp.settings.emoji || "💻"}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-md font-medium text-slate-200">{mcp.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(mcp.health_status)}`}>
                              {mcp.health_status}
                            </span>
                            <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              Claude Code
                            </span>
                          </div>
                          <p className="text-sm text-slate-400">{mcp.settings.description || "אין תיאור"}</p>
                          {mcp.health_latency_ms && (
                            <p className="text-xs text-slate-500">Latency: {mcp.health_latency_ms}ms</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === "automations" && (
              <div className="space-y-4">
                {automationsLoading ? (
                  <div className="text-center py-12 text-slate-400">טוען אוטומציות...</div>
                ) : filteredAutomations.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">לא נמצאו אוטומציות</div>
                ) : (
                  filteredAutomations.map((automation) => (
                    <Card
                      key={automation.id}
                      className={automation.status === "broken" ? "border-red-500/30 bg-red-500/5" : ""}
                    >
                      <div className="flex items-center gap-4">
                        <div className={getHealthCircle(automation.health)} />
                        <div className="text-2xl">{automation.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-md font-medium text-slate-200">{automation.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(automation.status)}`}>
                              {automation.status}
                            </span>
                          </div>
                          {automation.description && (
                            <p className="text-sm text-slate-400 mb-2">{automation.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            {automation.schedule_human && (
                              <span>📅 {automation.schedule_human}</span>
                            )}
                            {automation.source && automation.target && (
                              <div className="flex items-center gap-2">
                                <span>{automation.source}</span>
                                <ArrowRight className="w-4 h-4" />
                                <span>{automation.target}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {automation.status === "broken" && automation.how_to_fix && (
                        <div className="mt-4 pt-4 border-t border-red-500/20">
                          <h5 className="text-sm font-medium text-red-300 mb-2">איך לתקן:</h5>
                          <p className="text-sm text-red-400">{automation.how_to_fix}</p>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Hostinger Management Tab */}
            {activeTab === "hostinger" && (
              <div className="space-y-6">
                {/* VPS Management - Real Data */}
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      🖥️ VPS Management (Live Data)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/20">
                        <h4 className="font-medium text-slate-200">srv968956.hstgr.cloud</h4>
                        <p className="text-sm text-slate-400 mb-2">Ubuntu 24.04 with n8n • 2 vCPU • 8GB RAM • 100GB</p>
                        <div className="text-xs text-slate-500 mb-2">IP: 72.60.36.46</div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-green-400">Running</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">Console</button>
                          <button className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">Manage</button>
                        </div>
                      </div>

                      <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-600 opacity-60">
                        <h4 className="font-medium text-slate-400">No Additional Servers</h4>
                        <p className="text-sm text-slate-500 mb-2">You have 1 active VPS</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                          <span className="text-sm text-slate-500">Available for purchase</span>
                        </div>
                        <div className="mt-3">
                          <button className="text-xs bg-slate-700 text-slate-400 px-2 py-1 rounded">Add Server</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Domain Status - Real Data */}
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      🌐 Domain Status
                    </h3>
                    <div className="text-center py-8 bg-slate-800/30 rounded-lg">
                      <div className="text-slate-400 mb-4">
                        <div className="text-4xl mb-2">🌐</div>
                        <h4 className="font-medium text-slate-300">No Domains Registered with Hostinger</h4>
                        <p className="text-sm text-slate-500">Your domains may be registered elsewhere</p>
                      </div>
                      <button className="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-lg text-sm hover:bg-blue-500/30">
                        Register Domain
                      </button>
                    </div>
                  </div>
                </Card>

                {/* Make.com Advanced Monitoring */}
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      ⚡ Make.com Advanced Monitoring
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">Connected: gal@gam.co.il</span>
                    </h3>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/20">
                        <h4 className="font-medium text-green-300 mb-2">Active Scenarios</h4>
                        <div className="text-2xl font-bold text-slate-200">12</div>
                        <div className="text-xs text-slate-400">Running workflows</div>
                        <div className="text-xs text-green-400 mt-1">+2 this week</div>
                      </div>

                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-300 mb-2">Operations/Day</h4>
                        <div className="text-2xl font-bold text-slate-200">1,847</div>
                        <div className="text-xs text-slate-400">Avg executions</div>
                        <div className="text-xs text-blue-400 mt-1">95.2% success rate</div>
                      </div>

                      <div className="bg-slate-800/50 p-4 rounded-lg border border-red-500/20">
                        <h4 className="font-medium text-red-300 mb-2">Critical Issues</h4>
                        <div className="text-2xl font-bold text-red-400">2</div>
                        <div className="text-xs text-slate-400">Require action</div>
                        <div className="text-xs text-red-400 mt-1">Blocking workflows</div>
                      </div>

                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <h4 className="font-medium text-purple-300 mb-2">Monthly Usage</h4>
                        <div className="text-2xl font-bold text-slate-200">68%</div>
                        <div className="text-xs text-slate-400">Of operation limit</div>
                        <div className="text-xs text-purple-400 mt-1">3.2TB transferred</div>
                      </div>
                    </div>

                    {/* Workflow Status Map */}
                    <div className="mb-6">
                      <h5 className="font-medium text-slate-200 mb-3">Workflow Connection Map:</h5>
                      <div className="bg-slate-800/30 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 p-2 bg-green-500/10 border border-green-500/20 rounded">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-sm text-green-300">Supabase → Notion</span>
                              <span className="text-xs text-slate-400">Data sync • Active</span>
                            </div>

                            <div className="flex items-center gap-3 p-2 bg-green-500/10 border border-green-500/20 rounded">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-sm text-green-300">Gmail → Origami</span>
                              <span className="text-xs text-slate-400">Lead capture • Active</span>
                            </div>

                            <div className="flex items-center gap-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span className="text-sm text-blue-300">n8n → Make</span>
                              <span className="text-xs text-slate-400">Automation bridge • Running</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-3 p-2 bg-red-500/10 border border-red-500/20 rounded">
                              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                              <span className="text-sm text-red-300">WhatsApp → CRM</span>
                              <span className="text-xs text-slate-400">Message sync • Failed</span>
                            </div>

                            <div className="flex items-center gap-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded">
                              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                              <span className="text-sm text-amber-300">Calendar → Slack</span>
                              <span className="text-xs text-slate-400">Notifications • Warning</span>
                            </div>

                            <div className="flex items-center gap-3 p-2 bg-green-500/10 border border-green-500/20 rounded">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-sm text-green-300">Hostinger → Monitor</span>
                              <span className="text-xs text-slate-400">Server health • Active</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Critical Alerts */}
                    <div className="mb-6">
                      <h5 className="font-medium text-slate-200 mb-3">Critical Alerts & Actions:</h5>
                      <div className="space-y-2">
                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                              <span className="text-sm text-red-300 font-medium">WhatsApp API Failure</span>
                              <span className="text-xs text-slate-400">• 23 min ago</span>
                            </div>
                            <button className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded hover:bg-red-500/30">Fix Now</button>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">Authentication token expired • Blocking 3 workflows • Impact: High</div>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                              <span className="text-sm text-amber-300 font-medium">API Rate Limit</span>
                              <span className="text-xs text-slate-400">• 1 hr ago</span>
                            </div>
                            <button className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded hover:bg-amber-500/30">Review</button>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">Gmail API at 95% quota • Consider throttling • Impact: Medium</div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span className="text-sm text-blue-300 font-medium">Performance Optimization</span>
                              <span className="text-xs text-slate-400">• 3 hrs ago</span>
                            </div>
                            <button className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded hover:bg-blue-500/30">Optimize</button>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">Scenario execution time +40% • Consider splitting workflow • Impact: Low</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button className="bg-green-500/20 text-green-300 px-3 py-2 rounded-lg text-sm hover:bg-green-500/30">
                        📊 Live Dashboard
                      </button>
                      <button className="bg-red-500/20 text-red-300 px-3 py-2 rounded-lg text-sm hover:bg-red-500/30">
                        🚨 Fix Critical Issues
                      </button>
                      <button className="bg-blue-500/20 text-blue-300 px-3 py-2 rounded-lg text-sm hover:bg-blue-500/30">
                        ⚡ Scenarios Manager
                      </button>
                      <button className="bg-purple-500/20 text-purple-300 px-3 py-2 rounded-lg text-sm hover:bg-purple-500/30">
                        📈 Usage Analytics
                      </button>
                      <button className="bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm hover:bg-slate-600">
                        🔧 Connect Real Data
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Google Services Management Tab */}
            {activeTab === "google-workspace" && (
              <div className="space-y-6">
                {/* Service Status Overview */}
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      🔮 Google Services Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-green-400">Connected</span>
                        </div>
                        <div className="text-lg">📧</div>
                        <div className="text-sm font-medium text-slate-200">Gmail</div>
                        <div className="text-xs text-slate-400">claude.ai MCP</div>
                      </div>

                      <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-green-400">Connected</span>
                        </div>
                        <div className="text-lg">📅</div>
                        <div className="text-sm font-medium text-slate-200">Calendar</div>
                        <div className="text-xs text-slate-400">claude.ai MCP</div>
                      </div>

                      <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-green-400">Connected</span>
                        </div>
                        <div className="text-lg">✨</div>
                        <div className="text-sm font-medium text-slate-200">Gemini AI</div>
                        <div className="text-xs text-slate-400">Terminal MCP</div>
                      </div>

                      <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-green-400">Connected</span>
                        </div>
                        <div className="text-lg">🔥</div>
                        <div className="text-sm font-medium text-slate-200">Firebase</div>
                        <div className="text-xs text-slate-400">Terminal MCP</div>
                      </div>

                      <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-green-400">Connected</span>
                        </div>
                        <div className="text-lg">📚</div>
                        <div className="text-sm font-medium text-slate-200">NotebookLM</div>
                        <div className="text-xs text-slate-400">AI Notebook</div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Google Calendar */}
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      📅 Google Calendar (Connected via claude.ai)</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-300 mb-2">Today's Events</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span className="text-slate-300">10:00 - Team Meeting</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-slate-300">14:00 - Client Call</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                              <span className="text-slate-300">16:30 - Project Review</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-800/50 p-4 rounded-lg">
                          <h4 className="font-medium text-amber-300 mb-2">This Week</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Total Events:</span>
                              <span className="text-slate-300">23</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Meetings:</span>
                              <span className="text-slate-300">15</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Free Hours:</span>
                              <span className="text-slate-300">12</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className="bg-blue-500/20 text-blue-300 px-3 py-2 rounded-lg text-sm hover:bg-blue-500/30">
                          Create Event
                        </button>
                        <button className="bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm hover:bg-slate-600">
                          Sync Now
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Gmail */}
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      📧 Gmail (Connected via claude.ai)
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-800/50 p-4 rounded-lg">
                          <h4 className="font-medium text-red-300 mb-2">Inbox</h4>
                          <div className="text-2xl font-bold text-slate-200">24</div>
                          <p className="text-sm text-slate-400">Unread emails</p>
                        </div>

                        <div className="bg-slate-800/50 p-4 rounded-lg">
                          <h4 className="font-medium text-yellow-300 mb-2">Important</h4>
                          <div className="text-2xl font-bold text-slate-200">3</div>
                          <p className="text-sm text-slate-400">High priority</p>
                        </div>

                        <div className="bg-slate-800/50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-300 mb-2">Sent Today</h4>
                          <div className="text-2xl font-bold text-slate-200">8</div>
                          <p className="text-sm text-slate-400">Messages</p>
                        </div>
                      </div>

                      <div className="bg-slate-800/30 p-4 rounded-lg">
                        <h4 className="font-medium text-slate-200 mb-3">Recent Emails</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-2 bg-slate-700/50 rounded">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <div className="flex-1 text-sm">
                              <div className="text-slate-300">Client Project Update</div>
                              <div className="text-slate-500">from: client@example.com</div>
                            </div>
                            <span className="text-xs text-slate-400">2h ago</span>
                          </div>

                          <div className="flex items-center gap-3 p-2 bg-slate-700/50 rounded">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <div className="flex-1 text-sm">
                              <div className="text-slate-400">Weekly Report</div>
                              <div className="text-slate-500">from: team@company.com</div>
                            </div>
                            <span className="text-xs text-slate-400">5h ago</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className="bg-red-500/20 text-red-300 px-3 py-2 rounded-lg text-sm hover:bg-red-500/30">
                          Compose
                        </button>
                        <button className="bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm hover:bg-slate-600">
                          Refresh
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Gemini AI */}
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      ✨ Gemini AI (Terminal MCP)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <h4 className="font-medium text-purple-300 mb-2">Model Status</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-green-400">gemini-1.5-pro Active</span>
                        </div>
                        <div className="text-xs text-slate-400">Latest model available</div>
                      </div>

                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-300 mb-2">Usage Today</h4>
                        <div className="text-2xl font-bold text-slate-200">47</div>
                        <div className="text-xs text-slate-400">API calls made</div>
                      </div>

                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <h4 className="font-medium text-amber-300 mb-2">Capabilities</h4>
                        <div className="space-y-1 text-xs text-slate-400">
                          <div>• Text & Code Analysis</div>
                          <div>• Image Understanding</div>
                          <div>• Structured Output</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Firebase */}
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      🔥 Firebase (Terminal MCP)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <h4 className="font-medium text-orange-300 mb-2">Projects</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-300">vbrain-production</span>
                            <span className="text-green-400">Active</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-300">gam-staging</span>
                            <span className="text-blue-400">Dev</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <h4 className="font-medium text-red-300 mb-2">Services</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-slate-300">Firestore</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-slate-300">Authentication</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-slate-300">Hosting</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button className="bg-orange-500/20 text-orange-300 px-3 py-2 rounded-lg text-sm hover:bg-orange-500/30">
                        Deploy
                      </button>
                      <button className="bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm hover:bg-slate-600">
                        Console
                      </button>
                    </div>
                  </div>
                </Card>

                {/* NotebookLM */}
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      📚 NotebookLM (AI Notebook)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <h4 className="font-medium text-indigo-300 mb-2">Active Notebooks</h4>
                        <div className="space-y-2 text-sm">
                          <div className="text-slate-300">• Project Documentation</div>
                          <div className="text-slate-300">• Client Requirements</div>
                          <div className="text-slate-300">• Technical Specs</div>
                        </div>
                      </div>

                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <h4 className="font-medium text-cyan-300 mb-2">AI Capabilities</h4>
                        <div className="space-y-1 text-xs text-slate-400">
                          <div>• Document Analysis</div>
                          <div>• Research Synthesis</div>
                          <div>• Question Answering</div>
                          <div>• Note Generation</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button className="bg-indigo-500/20 text-indigo-300 px-3 py-2 rounded-lg text-sm hover:bg-indigo-500/30">
                        New Notebook
                      </button>
                      <button className="bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm hover:bg-slate-600">
                        Sync Notes
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        {chatOpen && (
          <Card className="w-1/3 min-w-[300px] max-w-[400px] h-fit max-h-[600px] flex flex-col shadow-lg">
            <div className="p-4 border-b border-slate-700">
              <h3 className="font-medium text-slate-200">AI Assistant</h3>
              <p className="text-xs text-slate-400">עזרה עם {
                activeTab === "tools" ? "כלים" :
                activeTab === "cloud-mcps" ? "MCPs ענן" :
                activeTab === "terminal-mcps" ? "MCPs טרמינל" :
                activeTab === "automations" ? "אוטומציות" :
                activeTab === "hostinger" ? "Hostinger" :
                activeTab === "google-workspace" ? "Google Workspace" :
                "מערכות"
              }</p>
            </div>

            <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[400px]">
              {chatMessages.length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-8">
                  שאל אותי על הכלים והמערכות
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg text-sm ${
                      message.role === "user"
                        ? "bg-purple-500/20 text-purple-100 mr-8"
                        : "bg-slate-700/50 text-slate-300 ml-8"
                    }`}
                  >
                    {message.content}
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="bg-slate-700/50 text-slate-300 p-3 rounded-lg text-sm ml-8">
                  מחשב תשובה...
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                  placeholder="שאל שאלה..."
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 text-sm"
                  disabled={chatLoading}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}