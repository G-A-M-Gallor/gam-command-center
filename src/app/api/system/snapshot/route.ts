import { NextResponse } from 'next/server';
import { execFileSync, execSync } from 'child_process';
import { getHatScore, getOverallScore } from '@/lib/audit/checks';
import type { AuditHat } from '@/lib/audit/checks';
import { requireAuth } from '@/lib/api/auth';

/** Shell-free execution for simple commands (no pipes) */
function runSafe(cmd: string, args: string[]): string {
  try {
    return execFileSync(cmd, args, { cwd: process.cwd(), timeout: 10000 }).toString().trim();
  } catch {
    return '';
  }
}

/** Shell execution for piped commands — only used with hardcoded paths, never user input */
function runShell(cmd: string): string {
  try {
    return execSync(cmd, { cwd: process.cwd(), timeout: 10000 }).toString().trim();
  } catch {
    return '';
  }
}

function getGitInfo() {
  const branch = runSafe('git', ['branch', '--show-current']);
  const statusRaw = runSafe('git', ['status', '--porcelain']);
  const lastLogLine = runSafe('git', ['log', '--oneline', '-1']);

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

  const lastCommit = lastLogLine
    ? { hash: lastLogLine.substring(0, 7), message: lastLogLine.substring(8) }
    : null;

  return {
    branch,
    isDirty: modified.length > 0 || untracked.length > 0,
    modified,
    untracked,
    lastCommit,
  };
}

function getCodebaseStats() {
  const srcDir = 'src';

  // Count files by type using find
  const allFiles = runShell(`find ${srcDir} -type f -name '*.ts' -o -name '*.tsx' | wc -l`);
  const pageFiles = runShell(`find ${srcDir}/app -name 'page.tsx' | wc -l`);
  const componentFiles = runShell(`find ${srcDir}/components -type f -name '*.tsx' | wc -l`);
  const contextFiles = runShell(`find ${srcDir}/contexts -type f -name '*.tsx' | wc -l`);
  const widgetFiles = runShell(`find ${srcDir}/components/command-center/widgets -type f -name '*.tsx' | wc -l`);
  const testFiles = runShell(`find ${srcDir} -type f -name '*.test.*' -o -name '*.spec.*' | wc -l`);

  // Total lines
  const totalLines = runShell(`find ${srcDir} -type f \\( -name '*.ts' -o -name '*.tsx' \\) -exec cat {} + | wc -l`);

  return {
    totalFiles: parseInt(allFiles) || 0,
    totalLines: parseInt(totalLines) || 0,
    pages: parseInt(pageFiles) || 0,
    components: parseInt(componentFiles) || 0,
    contexts: parseInt(contextFiles) || 0,
    widgets: parseInt(widgetFiles) || 0,
    testFiles: parseInt(testFiles) || 0,
  };
}

function getAuditInfo() {
  const hats: AuditHat[] = ['plan', 'reality', 'quality', 'integrity'];
  const hatScores: Record<string, { pct: number; pass: number; warn: number; fail: number }> = {};

  for (const hat of hats) {
    const score = getHatScore(hat);
    hatScores[hat] = { pct: score.pct, pass: score.pass, warn: score.warn, fail: score.fail };
  }

  return {
    overall: getOverallScore(),
    ...hatScores,
  };
}

function getLargeFiles() {
  // Find files with most lines in src/
  const result = runShell(
    `find src -type f \\( -name '*.ts' -o -name '*.tsx' \\) -exec wc -l {} + | sort -rn | head -11`
  );

  return result
    .split('\n')
    .filter(Boolean)
    .slice(0, 10) // skip "total" line
    .filter(line => !line.includes(' total'))
    .map(line => {
      const match = line.trim().match(/^(\d+)\s+(.+)$/);
      if (!match) return null;
      return { file: match[2].replace('src/', ''), lines: parseInt(match[1]) };
    })
    .filter((f): f is { file: string; lines: number } => f !== null && f.lines > 200);
}

export async function GET(_request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Blocked in production' }, { status: 403 });
  }

  const { error: authError } = await requireAuth(_request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  const timestamp = new Date().toISOString();
  const git = getGitInfo();
  const codebase = getCodebaseStats();
  const audit = getAuditInfo();
  const largeFiles = getLargeFiles();

  return NextResponse.json({
    timestamp,
    git,
    codebase,
    audit,
    largeFiles,
  });
}
