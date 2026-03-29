import { NextResponse } from "next/server";

/**
 * Automation List API — /api/toolkit/automations
 * Returns current automation list for display in UI
 */

export async function GET() {
  try {
    // Mock automation data that matches UI expectations
    const automations = [
      {
        id: "1",
        name: "Vercel Deploy Pipeline",
        emoji: "🚀",
        type: "webhook" as const,
        trigger_type: "event" as const,
        schedule: null,
        schedule_human: null,
        status: "active" as const,
        health: "healthy" as const,
        last_run: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        source: "GitHub",
        target: "Vercel",
        tables_involved: [],
        description: "Automated deployment pipeline for production releases via Vercel",
        what_happens_if_fails: "Deployment stops, manual intervention required",
        how_to_fix: "Check Vercel dashboard and GitHub webhook settings",
        app_name: "vbrain-production",
        edge_function_slug: null
      },
      {
        id: "2",
        name: "Daily Database Backup",
        emoji: "💾",
        type: "cron_job" as const,
        trigger_type: "scheduled" as const,
        schedule: "0 2 * * *",
        schedule_human: "Daily at 2:00 AM",
        status: "active" as const,
        health: "healthy" as const,
        last_run: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
        source: "Supabase",
        target: "Cloud Storage",
        tables_involved: ["all"],
        description: "Automated Supabase database backup to cloud storage",
        what_happens_if_fails: "Data not backed up, potential data loss risk",
        how_to_fix: "Check Supabase backup settings and cloud storage permissions",
        app_name: null,
        edge_function_slug: "daily-backup"
      },
      {
        id: "3",
        name: "RSS Feed Sync",
        emoji: "📰",
        type: "cron_job" as const,
        trigger_type: "scheduled" as const,
        schedule: "*/30 * * * *",
        schedule_human: "Every 30 minutes",
        status: "active" as const,
        health: "healthy" as const,
        last_run: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        source: "RSS Feeds",
        target: "Supabase",
        tables_involved: ["news_articles", "rss_feeds"],
        description: "Sync Israeli construction & real estate news from multiple RSS sources",
        what_happens_if_fails: "News not updated, stale content",
        how_to_fix: "Check RSS feed URLs and network connectivity",
        app_name: null,
        edge_function_slug: "rss-sync"
      },
      {
        id: "4",
        name: "Security Scanner",
        emoji: "🔒",
        type: "cron_job" as const,
        trigger_type: "scheduled" as const,
        schedule: "0 3 * * 0",
        schedule_human: "Weekly on Sunday at 3:00 AM",
        status: "active" as const,
        health: "healthy" as const,
        last_run: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        source: "Codebase",
        target: "Sentry",
        tables_involved: [],
        description: "Weekly security audit of dependencies and codebase",
        what_happens_if_fails: "Security vulnerabilities not detected",
        how_to_fix: "Check GitHub Actions and security scanning tools",
        app_name: null,
        edge_function_slug: "security-scan"
      },
      {
        id: "5",
        name: "Performance Monitor",
        emoji: "📊",
        type: "edge_function" as const,
        trigger_type: "event" as const,
        schedule: null,
        schedule_human: null,
        status: "broken" as const,
        health: "error" as const,
        last_run: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        source: "Application",
        target: "Monitoring Dashboard",
        tables_involved: ["performance_metrics"],
        description: "Continuous monitoring of application performance and alerts",
        what_happens_if_fails: "Performance issues not detected, alerts not sent",
        how_to_fix: "Check monitoring service configuration and alert thresholds",
        app_name: "performance-monitor",
        edge_function_slug: "perf-monitor"
      },
      {
        id: "6",
        name: "Email Notifications",
        emoji: "📧",
        type: "webhook" as const,
        trigger_type: "event" as const,
        schedule: null,
        schedule_human: null,
        status: "active" as const,
        health: "healthy" as const,
        last_run: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
        source: "Origami CRM",
        target: "Email Service",
        tables_involved: ["clients", "projects"],
        description: "Automated email sequences for client onboarding and follow-ups",
        what_happens_if_fails: "Clients not notified, manual follow-up required",
        how_to_fix: "Check email service API and Origami webhook configuration",
        app_name: null,
        edge_function_slug: "email-automation"
      },
      {
        id: "7",
        name: "Document Generator",
        emoji: "📄",
        type: "n8n_workflow" as const,
        trigger_type: "event" as const,
        schedule: null,
        schedule_human: null,
        status: "active" as const,
        health: "healthy" as const,
        last_run: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        source: "Document Templates",
        target: "PDF Generator",
        tables_involved: ["documents", "templates"],
        description: "Automated contract and agreement generation from templates",
        what_happens_if_fails: "Documents not generated, manual creation required",
        how_to_fix: "Check n8n workflow and document template service",
        app_name: null,
        edge_function_slug: null
      },
      {
        id: "8",
        name: "Notion Sync",
        emoji: "📝",
        type: "webhook" as const,
        trigger_type: "event" as const,
        schedule: null,
        schedule_human: null,
        status: "disabled" as const,
        health: "unknown" as const,
        last_run: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        source: "Supabase",
        target: "Notion",
        tables_involved: ["projects", "clients", "tasks"],
        description: "Bidirectional sync between Supabase and Notion databases",
        what_happens_if_fails: "Data not synchronized between systems",
        how_to_fix: "Check Notion API connection and webhook configuration",
        app_name: null,
        edge_function_slug: "notion-sync"
      },
      {
        id: "9",
        name: "WATI WhatsApp Sync",
        emoji: "💬",
        type: "cron_job" as const,
        trigger_type: "scheduled" as const,
        schedule: "0 */2 * * *",
        schedule_human: "Every 2 hours",
        status: "active" as const,
        health: "healthy" as const,
        last_run: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
        source: "WATI API",
        target: "Supabase",
        tables_involved: ["comm_messages"],
        description: "Sync WhatsApp messages and contacts from WATI to communication timeline",
        what_happens_if_fails: "WhatsApp messages not synced, manual sync required",
        how_to_fix: "Check WATI API credentials and network connectivity at /api/wati/health",
        app_name: null,
        edge_function_slug: "wati-sync"
      }
    ];

    console.log(`📋 Returning ${automations.length} automations for UI`);

    return NextResponse.json(automations);

  } catch (error) {
    console.error("Automation list error:", error);
    return NextResponse.json({ error: "Failed to fetch automations" }, { status: 500 });
  }
}
