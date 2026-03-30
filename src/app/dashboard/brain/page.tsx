"use client";

import { useState, useEffect, useCallback } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Brain, Activity, AlertTriangle, TrendingUp, Database, Clock, ExternalLink } from "lucide-react";

interface BrainStats {
  total_chunks: number;
  active_chunks: number;
  total_memories: number;
  latest_summary_date: string;
  avg_similarity: number;
  total_searches: number;
  chunks_last_24h: number;
  memories_last_24h: number;
}

interface BrainSearchResult {
  id: string;
  content: string;
  source_type: string;
  source_id: string;
  source_url?: string;
  domain: string;
  memory_type: string;
  importance: number;
  freshness: number;
  vec_similarity: number;
  keyword_rank: number;
  smart_score: number;
}

interface ProjectMemory {
  id: string;
  title: string;
  content: string;
  memory_type: string;
  created_at: string;
  updated_at: string;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  created_at: string;
}

export default function BrainHealthDashboard() {
  const { language } = useSettings();
  const isRtl = language === 'he';
  const [stats, setStats] = useState<BrainStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BrainSearchResult[]>([]);
  const [recentMemories, setRecentMemories] = useState<ProjectMemory[]>([]);
  const [latestSummary, setLatestSummary] = useState<ProjectMemory | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const loadBrainStats = useCallback(async () => {
    try {
      // Get total chunks and active chunks
      const { data: chunksData } = await supabase
        .from('semantic_memory')
        .select('id, created_at')
        .eq('is_active', true);

      // Get total project memories
      const { data: memoriesData } = await supabase
        .from('project_memory')
        .select('id, created_at, memory_type');

      // Get latest summary date
      const { data: latestSummaryData } = await supabase
        .from('project_memory')
        .select('created_at')
        .eq('memory_type', 'daily_summary')
        .order('created_at', { ascending: false })
        .limit(1);

      // Calculate 24h stats
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const chunksLast24h = chunksData?.filter(chunk =>
        new Date(chunk.created_at) > yesterday
      ).length || 0;

      const memoriesLast24h = memoriesData?.filter(memory =>
        new Date(memory.created_at) > yesterday
      ).length || 0;

      const stats: BrainStats = {
        total_chunks: chunksData?.length || 0,
        active_chunks: chunksData?.length || 0,
        total_memories: memoriesData?.length || 0,
        latest_summary_date: latestSummaryData?.[0]?.created_at || '',
        avg_similarity: 0.75, // This would need to be calculated from actual search data
        total_searches: 0, // This would need to be tracked in a separate table
        chunks_last_24h: chunksLast24h,
        memories_last_24h: memoriesLast24h,
      };

      setStats(stats);
    } catch (error) {
      console.error('Error loading brain stats:', error);
    }
  }, []);

  const loadRecentMemories = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('project_memory')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentMemories(data || []);
    } catch (error) {
      console.error('Error loading recent memories:', error);
    }
  }, []);

  const loadLatestSummary = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('project_memory')
        .select('*')
        .eq('memory_type', 'daily_summary')
        .order('created_at', { ascending: false })
        .limit(1);

      setLatestSummary(data?.[0] || null);
    } catch (error) {
      console.error('Error loading latest summary:', error);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    const alertsList: Alert[] = [];

    // Check for stale summaries (older than 2 days)
    if (stats?.latest_summary_date) {
      const summaryDate = new Date(stats.latest_summary_date);
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      if (summaryDate < twoDaysAgo) {
        alertsList.push({
          id: 'stale-summary',
          type: 'warning',
          message: 'הסיכום היומי לא עודכן במשך יותר מיומיים',
          created_at: new Date().toISOString(),
        });
      }
    }

    // Check for low chunk activity (less than 5 chunks in 24h)
    if (stats && stats.chunks_last_24h < 5) {
      alertsList.push({
        id: 'low-activity',
        type: 'info',
        message: 'פעילות נמוכה של chunks ב-24 השעות האחרונות',
        created_at: new Date().toISOString(),
      });
    }

    setAlerts(alertsList);
    setLoading(false);
  }, [stats]);

  const searchBrain = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      // Get session token for API authentication
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Use semantic-query v3 via brain search API
      const response = await fetch('/api/brain/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: searchQuery,
          max_results: 20,
          match_threshold: 0.3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Error searching brain:', error);
    } finally {
      setSearching(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  // Load brain statistics
  useEffect(() => {
    loadBrainStats();
    loadRecentMemories();
    loadLatestSummary();
  }, [loadBrainStats, loadRecentMemories, loadLatestSummary]);

  // Load alerts when stats change
  useEffect(() => {
    if (stats) {
      loadAlerts();
    }
  }, [stats, loadAlerts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6" dir={isRtl ? "rtl" : "ltr"}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-slate-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Brain className="h-8 w-8 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">
            דשבורד בריאות המוח
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                סה&quot;כ Chunks
              </CardTitle>
              <Database className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.total_chunks || 0}</div>
              <p className="text-xs text-slate-400">
                +{stats?.chunks_last_24h || 0} ב-24 השעות האחרונות
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                זיכרונות פרויקט
              </CardTitle>
              <Brain className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.total_memories || 0}</div>
              <p className="text-xs text-slate-400">
                +{stats?.memories_last_24h || 0} ב-24 השעות האחרונות
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                דיוק ממוצע
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {((stats?.avg_similarity || 0) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-slate-400">
                דיוק חיפוש סמנטי
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                סיכום אחרון
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-white">
                {stats?.latest_summary_date
                  ? formatDate(stats.latest_summary_date)
                  : 'אין סיכום'
                }
              </div>
              <p className="text-xs text-slate-400">
                סיכום יומי אוטומטי
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="bg-slate-800 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                התראות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center gap-2 p-3 rounded-md bg-slate-700">
                    {getAlertIcon(alert.type)}
                    <span className="text-sm text-slate-300">{alert.message}</span>
                    <span className="text-xs text-slate-500 mr-auto">
                      {formatDate(alert.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="search" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="search" className="text-slate-300 data-[state=active]:text-white">
              חיפוש במוח
            </TabsTrigger>
            <TabsTrigger value="memories" className="text-slate-300 data-[state=active]:text-white">
              זיכרונות אחרונים
            </TabsTrigger>
            <TabsTrigger value="summary" className="text-slate-300 data-[state=active]:text-white">
              סיכום יומי
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className={`text-white ${isRtl ? 'text-right' : 'text-left'}`}>חיפוש סמנטי</CardTitle>
                <CardDescription className={`text-slate-400 ${isRtl ? 'text-right' : 'text-left'}`}>
                  חפש במאגר הידע הסמנטי של הפרויקט
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 mb-4 w-full">
                  <Input
                    placeholder="הכנס שאלה או מושג לחיפוש..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchBrain()}
                    className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 ${isRtl ? 'text-right' : 'text-left'} flex-1`}
                    dir={isRtl ? "rtl" : "ltr"}
                  />
                  <Button
                    onClick={searchBrain}
                    disabled={searching}
                    className="bg-purple-600 hover:bg-purple-700 shrink-0 cursor-pointer"
                  >
                    {searching ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold text-white ${isRtl ? 'text-right' : 'text-left'}`}>
                      נמצאו {searchResults.length} תוצאות
                    </h3>
                    <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto">
                      {searchResults.map((result) => (
                        <div key={result.id} className="p-4 bg-slate-700 rounded-md" dir={isRtl ? "rtl" : "ltr"}>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge intent="outline" className="text-xs">
                              ציון: {(result.smart_score * 100).toFixed(1)}%
                            </Badge>
                            <Badge intent="outline" className="text-xs bg-blue-600">
                              {result.source_type}
                            </Badge>
                            <Badge intent="outline" className="text-xs bg-purple-600">
                              {result.domain}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              חשיבות: {result.importance}
                            </span>
                            {result.source_url && (
                              <a
                                href={result.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer ${isRtl ? 'me-auto' : 'ms-auto'}`}
                              >
                                <ExternalLink className="h-3 w-3" />
                                מקור
                              </a>
                            )}
                          </div>
                          <p className={`text-sm text-slate-300 leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
                            {result.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Memories Tab */}
          <TabsContent value="memories">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">זיכרונות פרויקט אחרונים</CardTitle>
                <CardDescription className="text-slate-400">
                  העדכונים האחרונים במאגר הזיכרונות
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentMemories.map((memory) => (
                    <div key={memory.id} className="p-4 bg-slate-700 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-white">{memory.title}</h3>
                        <Badge intent="outline">{memory.memory_type}</Badge>
                        <span className="text-xs text-slate-400 mr-auto">
                          {formatDate(memory.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-3">
                        {memory.content}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily Summary Tab */}
          <TabsContent value="summary">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">סיכום יומי אחרון</CardTitle>
                <CardDescription className="text-slate-400">
                  סיכום אוטומטי של הפעילות ב-24 השעות האחרונות
                </CardDescription>
              </CardHeader>
              <CardContent>
                {latestSummary ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{latestSummary.title}</h3>
                      <span className="text-xs text-slate-400">
                        {formatDate(latestSummary.created_at)}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-700 rounded-md">
                      <div className="prose prose-sm prose-slate max-w-none">
                        <div className="text-slate-300 whitespace-pre-line">
                          {latestSummary.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">אין סיכום יומי זמין כרגע</p>
                    <p className="text-sm text-slate-500 mt-2">
                      הסיכום היומי רץ אוטומטית ב-4:00 בבוקר
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}