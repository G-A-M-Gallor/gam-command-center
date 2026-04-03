import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface CronJobStatus {
  jobname: string;
  last_run_time: string | null;
  last_run_status: string | null;
  error_message: string | null;
}

serve(async (req) => {
  // Skip JWT verification for cron calls (internal calls)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Get cron job health status using stored procedure
    const { data: jobStatuses, error: cronError } = await supabase
      .rpc('get_cron_health');

    if (cronError) {
      throw new Error(`Failed to fetch cron jobs: ${cronError.message}`);
    }

    const jobs = jobStatuses as CronJobStatus[];
    const failures: string[] = [];
    const healthStatus: Record<string, any> = {};

    // 2. Check each job for failures in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const job of jobs) {
      const { jobname, last_run_time, last_run_status, error_message } = job;

      // Determine if job is healthy
      let isHealthy = true;
      let reason = 'OK';

      if (!last_run_time) {
        isHealthy = false;
        reason = 'Never ran';
      } else {
        const lastRun = new Date(last_run_time);
        if (lastRun < twentyFourHoursAgo) {
          isHealthy = false;
          reason = `Last run over 24h ago: ${lastRun.toISOString()}`;
        } else if (last_run_status === 'failed') {
          isHealthy = false;
          reason = `Failed: ${error_message || 'Unknown error'}`;
        }
      }

      healthStatus[jobname] = {
        last_run_time,
        last_run_status,
        healthy: isHealthy,
        reason
      };

      if (!isHealthy) {
        failures.push(`${jobname}: ${reason}`);
      }

      // 3. Log to project_memory for each job status
      await supabase
        .from('project_memory')
        .insert({
          source: 'cron-health',
          content: `${jobname}: ${isHealthy ? 'OK' : reason}`,
          type: 'cron_status'
        });
    }

    // 4. If there are failures, create alert entry
    if (failures.length > 0) {
      const alertContent = `🚨 CRON FAILURES: ${failures.join(', ')}`;

      await supabase
        .from('project_memory')
        .insert({
          source: 'alert',
          content: alertContent,
          type: 'cron_failures'
        });
    }

    // 5. Return summary
    const response = {
      success: true,
      checked_at: new Date().toISOString(),
      total_jobs: jobs.length,
      healthy_jobs: jobs.length - failures.length,
      failed_jobs: failures.length,
      failures: failures,
      health_status: healthStatus
    };

    console.log(`[cron-health-monitor] Checked ${jobs.length} jobs, ${failures.length} failures`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error('[cron-health-monitor] Error:', error);

    // Log error to project_memory
    await supabase
      .from('project_memory')
      .insert({
        source: 'cron-health',
        content: `Monitor error: ${error.message}`,
        type: 'error'
      });

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      checked_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});