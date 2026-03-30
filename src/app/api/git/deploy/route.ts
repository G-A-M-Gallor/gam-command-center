import { NextResponse } from 'next/server';
import { execFileSync } from 'child_process';
import { requireAuth } from '@/lib/api/auth';
import { gitDeploySchema } from '@/lib/api/schemas';

function run(cmd: string, args: string[]): string {
  return execFileSync(cmd, args, { cwd: process.cwd(), timeout: 30000 }).toString().trim();
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
    const parsed = gitDeploySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const rawMessage = parsed.data.message || 'deploy: push to production';

    // Check if there are changes to commit
    const status = run('git', ['status', '--porcelain']);
    let commitHash = 'no-changes';

    if (status.length > 0) {
      run('git', ['add', '-A']);
      const commitResult = run('git', ['commit', '-m', rawMessage]);
      const hashMatch = commitResult.match(/\[[\w/.-]+ ([a-f0-9]+)\]/);
      commitHash = hashMatch ? hashMatch[1] : 'unknown';
    } else {
      commitHash = run('git', ['rev-parse', '--short', 'HEAD']);
    }

    const branch = run('git', ['branch', '--show-current']);

    // Validate branch name — only allow alphanumeric, -, _, /, .
    if (!/^[\w./-]+$/.test(branch)) {
      return NextResponse.json({ success: false, error: 'Invalid branch name' }, { status: 400 });
    }

    const pushResult = run('git', ['push', 'origin', branch]);

    return NextResponse.json({
      success: true,
      commitHash,
      branch,
      pushResult: pushResult || 'Pushed successfully',
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
