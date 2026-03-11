import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { automationRunJobSchema } from '@/lib/api/schemas';

export async function POST(request: Request) {
  const { user, error: authError } = await requireAuth(request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = automationRunJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid request' },
      { status: 400 },
    );
  }

  const { job } = parsed.data;

  try {
    switch (job) {
      case 'origami-sync': {
        // Proxy to existing /api/origami/sync
        const origin = new URL(request.url).origin;
        const res = await fetch(`${origin}/api/origami/sync`, {
          method: 'POST',
          headers: {
            Authorization: request.headers.get('authorization') || '',
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        return NextResponse.json({ success: res.ok, result: data });
      }

      case 'health-check': {
        const origin = new URL(request.url).origin;
        const res = await fetch(`${origin}/api/health`);
        const data = await res.json();
        return NextResponse.json({ success: res.ok, result: data });
      }

      case 'test-notification': {
        const origin = new URL(request.url).origin;
        const res = await fetch(`${origin}/api/push/send`, {
          method: 'POST',
          headers: {
            Authorization: request.headers.get('authorization') || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Notification',
            body: `Test from Automation Hub — ${new Date().toLocaleTimeString()}`,
            userId: user!.id,
          }),
        });
        const data = await res.json();
        return NextResponse.json({ success: res.ok, result: data });
      }
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
