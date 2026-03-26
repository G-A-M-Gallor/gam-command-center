import { NextResponse } from "next/server";

/**
 * Automation Sync API — /api/toolkit/sync-automations
 * Simple mock response since automations table has constraint issues
 */

export async function POST() {
  try {
    console.log("🔄 Syncing automations (mock mode)...");

    // Mock automation data for demo purposes
    const mockAutomations = [
      { name: 'Vercel Deploy Pipeline', type: 'deployment', status: 'active' },
      { name: 'Daily Database Backup', type: 'backup', status: 'active' },
      { name: 'RSS Feed Sync', type: 'sync', status: 'active' },
      { name: 'Security Scanner', type: 'security', status: 'active' },
      { name: 'Performance Monitor', type: 'monitoring', status: 'active' },
      { name: 'Email Notifications', type: 'webhook', status: 'active' },
      { name: 'Document Generator', type: 'webhook', status: 'active' },
      { name: 'Notion Sync', type: 'sync', status: 'paused' }
    ];

    // Generate summary
    const summary = {
      total: mockAutomations.length,
      active: mockAutomations.filter(a => a.status === 'active').length,
      broken: mockAutomations.filter(a => a.status === 'broken').length,
      paused: mockAutomations.filter(a => a.status === 'paused').length,
      types: {
        deployment: mockAutomations.filter(a => a.type === 'deployment').length,
        backup: mockAutomations.filter(a => a.type === 'backup').length,
        sync: mockAutomations.filter(a => a.type === 'sync').length,
        security: mockAutomations.filter(a => a.type === 'security').length,
        monitoring: mockAutomations.filter(a => a.type === 'monitoring').length,
        webhook: mockAutomations.filter(a => a.type === 'webhook').length
      },
      sync_time: new Date().toISOString()
    };

    console.log('✅ Mock automations synchronized successfully');

    return NextResponse.json({
      message: "Automations synchronized successfully (mock mode)",
      summary,
      automations_synced: mockAutomations.length,
      synced_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("Automation sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}