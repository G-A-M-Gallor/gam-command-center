import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

function sanitizeMessage(msg: string): string {
  // Strip shell metacharacters, keep safe chars
  return msg.replace(/[`$\\!;|&<>(){}[\]'"]/g, '').trim();
}

function run(cmd: string): string {
  return execSync(cmd, { cwd: process.cwd(), timeout: 15000 }).toString().trim();
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Blocked in production' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const rawMessage = body.message;

    if (!rawMessage || typeof rawMessage !== 'string' || rawMessage.trim().length === 0) {
      return NextResponse.json({ error: 'Commit message is required' }, { status: 400 });
    }

    const message = sanitizeMessage(rawMessage);
    if (message.length === 0) {
      return NextResponse.json({ error: 'Commit message contains only invalid characters' }, { status: 400 });
    }

    run('git add -A');
    const result = run(`git commit -m "${message}"`);

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
