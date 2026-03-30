import { NextResponse } from 'next/server';
import { execFileSync } from 'child_process';
import { requireAuth } from '@/lib/api/auth';
import { gitCommitSchema } from '@/lib/api/schemas';

function run(cmd: string, args: string[]): string {
  return execFileSync(cmd, args, { cwd: process.cwd(), timeout: 15000 }).toString().trim();
}

export async function POST(_request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Blocked in production' }, { status: 403 });
  }

  const { error: authError } = await requireAuth(_request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = gitCommitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const message = parsed.data.message;

    run('git', ['add', '-A']);
    const result = run('git', ['commit', '-m', message]);

    // Extract commit hash from output
    const hashMatch = result.match(/\[[\w/.-]+ ([a-f0-9]+)\]/);
    const hash = hashMatch ? hashMatch[1] : 'unknown';

    return NextResponse.json({ success: true, hash, message });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    // "nothing to commit" is not really an error
    if (errMsg.includes('nothing to commit')) {
      return NextResponse.json({ success: false, error: 'Nothing to commit' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
