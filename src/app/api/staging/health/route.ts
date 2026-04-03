// Staging Environment Health Check API
// GET /api/staging/health - Returns staging environment status

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const STAGING_MODE = process.env.STAGING_MODE === 'true';
const NODE_ENV = process.env.NODE_ENV;

export async function GET(_request: NextRequest) {
  try {
    const startTime = Date.now();

    // Basic environment check
    const envCheck = {
      staging_mode: STAGING_MODE,
      node_env: NODE_ENV,
      app_url: process.env.NEXT_PUBLIC_APP_URL,
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    };

    // Database connectivity check
    let dbStatus = 'unknown';
    let dbError = null;

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const { error } = await supabase
          .from('pm_system_index')
          .select('count')
          .limit(1)
          .single();

        if (error) {
          dbStatus = 'error';
          dbError = error.message;
        } else {
          dbStatus = 'connected';
        }
      } else {
        dbStatus = 'not_configured';
      }
    } catch (error) {
      dbStatus = 'error';
      dbError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Function endpoint checks
    const functionChecks = {
      notion_sync: await checkFunctionEndpoint('/api/notion/sync'),
      backup: await checkFunctionEndpoint('/api/backup/status'),
    };

    // System info
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      response_time: Date.now() - startTime,
    };

    const healthData = {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      environment: envCheck,
      database: {
        status: dbStatus,
        error: dbError,
      },
      functions: functionChecks,
      system: systemInfo,
    };

    return NextResponse.json(healthData, {
      status: healthData.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Staging-Environment': 'true',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
      headers: {
        'X-Staging-Environment': 'true',
      }
    });
  }
}

// Helper function to check function endpoints
async function checkFunctionEndpoint(path: string): Promise<{status: string, response_time?: number}> {
  try {
    const startTime = Date.now();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'StagingHealthCheck/1.0',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    return {
      status: response.ok ? 'healthy' : 'error',
      response_time: Date.now() - startTime,
    };
  } catch (_error) {
    return {
      status: 'error',
      response_time: undefined,
    };
  }
}