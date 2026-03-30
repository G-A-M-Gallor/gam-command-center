import { _createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

type ServiceStatus = 'online' | 'offline' | 'configured' | 'unconfigured';

interface StatusResponse {
  supabase: { status: ServiceStatus; checks: Record<string, string> };
  n8n: { status: ServiceStatus };
  origami: { status: ServiceStatus };
  wati: { status: ServiceStatus };
  notion: { status: ServiceStatus };
  timestamp: string;
}

export async function GET(_request: Request) {
  const auth = await requireAuth(_request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
  const result: StatusResponse = {
    supabase: { status: 'offline', checks: {} },
    n8n: { status: 'unconfigured' },
    origami: { status: 'unconfigured' },
    wati: { status: 'unconfigured' },
    notion: { status: 'offline' },
    timestamp: new Date().toISOString(),
  };

  // 1. Supabase — ping DB + Auth
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && serviceKey) {
    try {
      const supabase = createClient(url, serviceKey);
      const { error: dbErr } = await supabase.from('projects').select('id').limit(1);
      result.supabase.checks.database = dbErr ? 'fail' : 'pass';

      const anonClient = createClient(url, anonKey || serviceKey);
      const { error: authErr } = await anonClient.auth.getSession();
      result.supabase.checks.auth = authErr ? 'fail' : 'pass';

      result.supabase.status =
        result.supabase.checks.database === 'pass' && result.supabase.checks.auth === 'pass'
          ? 'online'
          : 'offline';
    } catch {
      result.supabase.status = 'offline';
    }
  }

  // 2. n8n — check if URL is configured
  const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL;
  if (n8nUrl) {
    try {
      const res = await fetch(n8nUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      result.n8n.status = res.ok || res.status === 401 || res.status === 302 ? 'online' : 'offline';
    } catch {
      // URL configured but not reachable — still show as configured
      result.n8n.status = 'configured';
    }
  }

  // 3. Origami — check ENV vars
  if (process.env.ORIGAMI_USERNAME && process.env.ORIGAMI_API_SECRET) {
    result.origami.status = 'configured';
  }

  // 4. WATI — check ENV
  if (process.env.NEXT_PUBLIC_WATI_URL) {
    result.wati.status = 'configured';
  }

  // 5. Notion — try the tasks endpoint
  const notionKey = process.env.NOTION_API_KEY;
  if (notionKey) {
    try {
      const res = await fetch('https://api.notion.com/v1/users/me', {
        _headers: {
          Authorization: `Bearer ${notionKey}`,
          'Notion-Version': '2022-06-28',
        },
        signal: AbortSignal.timeout(5000),
      });
      result.notion.status = res.ok ? 'online' : 'offline';
    } catch {
      result.notion.status = 'offline';
    }
  }

  return NextResponse.json(result);
}
