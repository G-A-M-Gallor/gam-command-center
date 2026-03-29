import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

/**
 * Manual WATI Sync Trigger — /api/automations/trigger-wati
 *
 * Allows authenticated users to manually trigger WATI sync
 * Used by the Automation UI for immediate sync
 */

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request);

    // Trigger the automation endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/automations/wati-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Manual sync failed: ${result.error}`);
    }

    return Response.json({
      success: true,
      message: 'Manual WATI sync completed',
      triggered_by: 'manual',
      ...result,
    });

  } catch (error) {
    console.error('Manual WATI trigger failed:', error);

    return Response.json({
      success: false,
      error: String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}