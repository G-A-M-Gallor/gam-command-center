import { NextResponse } from 'next/server';
import { execFileSync } from 'child_process';
import { requireAuth } from '@/lib/api/auth';

function run(cmd: string, args: string[]): string {
  try {
    return execFileSync(cmd, args, { cwd: process.cwd(), timeout: 5000 }).toString().trim();
  } catch {
    return '';
  }
}

export async function GET(_request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Blocked in production' }, { status: 403 });
  }

  const { error: authError } = await requireAuth(_request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  const branch = run('git', ['branch', '--show-current']);
  const statusRaw = run('git', ['status', '--porcelain']);
  const logRaw = run('git', ['log', '--oneline', '-10']);

  const modified: string[] = [];
  const untracked: string[] = [];
  for (const line of statusRaw.split('\n').filter(Boolean)) {
    const code = line.substring(0, 2);
    const file = line.substring(3);
    if (code === '??') {
      untracked.push(file);
    } else {
      modified.push(file);
    }
  }

  const commits = logRaw
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const hash = line.substring(0, 7);
      const message = line.substring(8);
      return { hash, message };
    });

  return NextResponse.json({
    branch,
    modified,
    untracked,
    commits,
    isDirty: modified.length > 0 || untracked.length > 0,
  });
}
