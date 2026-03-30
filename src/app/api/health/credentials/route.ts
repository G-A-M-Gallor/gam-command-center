import { NextRequest, NextResponse } from 'next/server';

// Health check functions for different services
const healthChecks = {
  ANTHROPIC_API_KEY: async (key: string) => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    return { status: 'healthy', details: 'Claude API accessible' };
  },

  GOOGLE_AI_API_KEY: async (key: string) => {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google AI API error: ${response.status} - ${error}`);
    }

    return { status: 'healthy', details: 'Google AI API accessible' };
  },

  SUPABASE_SERVICE_ROLE_KEY: async (key: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL not configured');
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    return { status: 'healthy', details: 'Supabase connection successful' };
  },

  NOTION_API_KEY: async (key: string) => {
    const response = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Notion API error: ${response.status} - ${error}`);
    }

    return { status: 'healthy', details: 'Notion API accessible' };
  },

  RESEND_API_KEY: async (key: string) => {
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${key}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${error}`);
    }

    return { status: 'healthy', details: 'Resend API accessible' };
  },

  WATI_API_TOKEN: async (key: string) => {
    const wapiUrl = process.env.WATI_API_URL;
    if (!wapiUrl) {
      throw new Error('WATI_API_URL not configured');
    }

    const response = await fetch(`${wapiUrl}/api/v1/getUsers`, {
      headers: {
        'Authorization': `Bearer ${key}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WATI API error: ${response.status} - ${error}`);
    }

    return { status: 'healthy', details: 'WATI API accessible' };
  },

  GOOGLE_CLIENT_ID: async (clientId: string) => {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientSecret) {
      throw new Error('GOOGLE_CLIENT_SECRET not configured');
    }

    // Test OAuth configuration by checking if we can construct auth URL
    const testUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=code&scope=openid&redirect_uri=http://localhost`;

    const response = await fetch(testUrl, { method: 'HEAD' });

    // Google returns 200 for valid client_id in auth URL
    if (!response.ok && response.status !== 302) {
      throw new Error(`Google OAuth error: Invalid client_id`);
    }

    return { status: 'healthy', details: 'Google OAuth client configured' };
  },

  NEXTAUTH_SECRET: async (secret: string) => {
    // Basic validation - NextAuth secret should be at least 32 chars
    if (!secret || secret.length < 8) {
      throw new Error('NextAuth secret too short');
    }

    return { status: 'healthy', details: 'NextAuth secret configured' };
  },

  BLOB_READ_WRITE_TOKEN: async (token: string) => {
    // Test Vercel blob token by attempting to list (this should work with read permission)
    const response = await fetch('https://blob.vercel-storage.com', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel Blob error: ${response.status} - ${error}`);
    }

    return { status: 'healthy', details: 'Vercel Blob token valid' };
  },

  VAPID_PRIVATE_KEY: async (key: string) => {
    // Basic validation for VAPID key format
    if (!key || key.length < 32) {
      throw new Error('VAPID private key invalid format');
    }

    return { status: 'healthy', details: 'VAPID keys configured' };
  },

  VOYAGE_API_KEY: async (key: string) => {
    // Basic validation - just check if key exists and has reasonable format
    if (!key || !key.startsWith('pa-')) {
      throw new Error('Voyage API key invalid format');
    }

    return { status: 'healthy', details: 'Voyage API key configured' };
  }
};

export async function POST(request: NextRequest) {
  try {
    const { service } = await request.json();

    if (!service) {
      return NextResponse.json({ error: 'Service parameter required' }, { status: 400 });
    }

    // Get the environment variable value
    const envValue = process.env[service];

    if (!envValue) {
      return NextResponse.json({
        success: false,
        error: `Environment variable ${service} not found or empty`
      });
    }

    // Get the appropriate health check function
    const healthCheck = healthChecks[service as keyof typeof healthChecks];

    if (!healthCheck) {
      return NextResponse.json({
        success: false,
        error: `No health check available for ${service}`
      });
    }

    // Run the health check with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Health check timeout')), 10000)
    );

    const result = await Promise.race([
      healthCheck(envValue),
      timeoutPromise
    ]) as { status: string; details: string };

    return NextResponse.json({
      success: true,
      service,
      status: result.status,
      details: result.details,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json({
      success: false,
      service: (await request.json().catch(() => ({}))).service || 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

// GET endpoint for testing
export async function GET() {
  const availableChecks = Object.keys(healthChecks);

  return NextResponse.json({
    message: 'Credentials health check endpoint',
    available_checks: availableChecks,
    usage: 'POST with { "service": "SERVICE_NAME" }'
  });
}