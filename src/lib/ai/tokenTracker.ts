const STORAGE_KEY = "cc-ai-token-usage";
const DAILY_BUDGET = 100_000; // 100K tokens per day
const WARNING_THRESHOLD = 0.8; // 80%

interface DailyUsage {
  date: string; // YYYY-MM-DD
  inputTokens: number;
  outputTokens: number;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadUsage(): DailyUsage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: getTodayKey(), inputTokens: 0, outputTokens: 0 };
    const parsed: DailyUsage = JSON.parse(raw);
    // Auto-reset if it's a new day
    if (parsed.date !== getTodayKey()) {
      return { date: getTodayKey(), inputTokens: 0, outputTokens: 0 };
    }
    return parsed;
  } catch {
    return { date: getTodayKey(), inputTokens: 0, outputTokens: 0 };
  }
}

function saveUsage(usage: DailyUsage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

export function addUsage(inputTokens: number, outputTokens: number): void {
  const usage = loadUsage();
  usage.inputTokens += inputTokens;
  usage.outputTokens += outputTokens;
  saveUsage(usage);
}

export function getUsageToday(): { inputTokens: number; outputTokens: number; totalTokens: number } {
  const usage = loadUsage();
  return {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.inputTokens + usage.outputTokens,
  };
}

export function getUsagePercent(): number {
  const { totalTokens } = getUsageToday();
  return Math.min(100, Math.round((totalTokens / DAILY_BUDGET) * 100));
}

export function isOverBudget(): boolean {
  return getUsageToday().totalTokens >= DAILY_BUDGET;
}

export function isNearBudget(): boolean {
  return getUsageToday().totalTokens >= DAILY_BUDGET * WARNING_THRESHOLD;
}

export function getDailyBudget(): number {
  return DAILY_BUDGET;
}
