import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getContacts, getMessages } from '@/lib/wati/client';
import { syncWatiMessages } from '@/lib/wati/sync';
import { watiHealthChecker } from '@/lib/wati/resilience';

/**
 * WATI Automation Endpoint — /api/automations/wati-sync
 *
 * Runs automatically via cron every 2 hours
 * Syncs WhatsApp messages and contacts from WATI to Supabase
 *
 * Can be triggered manually or by external cron services
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let status = 'success';
  const errors: string[] = [];
  let synced = 0;

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Health check first
    const healthStatus = await watiHealthChecker.check(async () => {
      const contacts = await getContacts(1, 1);
      return contacts;
    });

    if (!healthStatus.isHealthy) {
      status = 'failed';
      errors.push('WATI API health check failed');
      throw new Error('WATI API not healthy');
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get contacts from WATI (limit to 10 for efficiency)
    const contacts = await getContacts(50, 1);

    // Sync messages for each contact (limit to recent ones)
    for (const contact of contacts.slice(0, 10)) {
      try {
        if (contact.phone) {
          // Get recent messages (limit 20 per contact)
          const messages = await getMessages(contact.phone, 20);

          if (messages.length > 0) {
            // Convert to CommMessage format
            const commMessages = await syncWatiMessages(supabase, messages, contact.phone);

            // Insert only new messages (ignore duplicates)
            for (const msg of commMessages) {
              const { error } = await supabase
                .from('comm_messages')
                .insert(msg);

              if (!error) {
                synced++;
              }
              // If error due to duplicate, that's fine - we ignore it
            }
          }
        }
      } catch (err) {
        const errorMsg = `Failed to sync contact ${contact.fullName || contact.phone}: ${err}`;
        errors.push(errorMsg);
        console.warn(errorMsg);
      }
    }

    const duration = Date.now() - startTime;

    // Log automation run to Supabase for monitoring (ignore errors if table doesn't exist)
    try {
      await supabase
        .from('automation_logs')
        .insert({
          automation_id: 'wati-sync',
          status,
          duration_ms: duration,
          records_processed: contacts.length,
          records_synced: synced,
          errors: errors.length > 0 ? errors : null,
        });
    } catch {
      // Ignore if automation_logs table doesn't exist
    }

    return Response.json({
      success: status === 'success',
      status,
      synced,
      contacts: contacts.length,
      errors: errors.length > 0 ? errors : undefined,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    status = 'failed';
    const duration = Date.now() - startTime;

    console.error('WATI automation failed:', error);

    return Response.json({
      success: false,
      status: 'failed',
      error: String(error),
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  try {
    const healthStatus = await watiHealthChecker.check(async () => {
      const contacts = await getContacts(1, 1);
      return { contacts: contacts.length };
    });

    return Response.json({
      healthy: healthStatus.isHealthy,
      last_check: new Date(healthStatus.lastCheck).toISOString(),
      consecutive_failures: healthStatus.consecutiveFailures,
      details: healthStatus.details,
    });
  } catch (error) {
    return Response.json({
      healthy: false,
      error: String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}