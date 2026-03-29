import { colLabelToIndex, colIndexToLabel, buildCellAddress } from "./gridHelpers";

type GetCellValue = (addr: string) => number | string;

// ─── Range Expansion ────────────────────────────────────────

/** Expand "A1:C3" into individual cell addresses */
function expandRange(range: string): string[] {
  const [startAddr, endAddr] = range.split(":");
  if (!endAddr) return [startAddr];

  const startMatch = startAddr.match(/^([A-Z]+)(\d+)$/);
  const endMatch = endAddr.match(/^([A-Z]+)(\d+)$/);
  if (!startMatch || !endMatch) return [startAddr];

  const startCol = colLabelToIndex(startMatch[1]);
  const endCol = colLabelToIndex(endMatch[1]);
  const startRow = parseInt(startMatch[2]);
  const endRow = parseInt(endMatch[2]);

  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);

  const addresses: string[] = [];
  for (let c = minCol; c <= maxCol; c++) {
    for (let r = minRow; r <= maxRow; r++) {
      addresses.push(buildCellAddress(colIndexToLabel(c), r));
    }
  }
  return addresses;
}

/** Resolve a list of args (which may contain ranges) into numeric values */
function resolveArgs(args: string[], getCellValue: GetCellValue): number[] {
  const values: number[] = [];
  for (const arg of args) {
    const trimmed = arg.trim();
    if (trimmed.includes(":")) {
      // Range
      const addrs = expandRange(trimmed);
      for (const addr of addrs) {
        const v = getCellValue(addr);
        const n = typeof v === "number" ? v : parseFloat(String(v));
        if (!isNaN(n)) values.push(n);
      }
    } else if (/^[A-Z]+\d+$/.test(trimmed)) {
      // Cell reference
      const v = getCellValue(trimmed);
      const n = typeof v === "number" ? v : parseFloat(String(v));
      if (!isNaN(n)) values.push(n);
    } else {
      // Literal number
      const n = parseFloat(trimmed);
      if (!isNaN(n)) values.push(n);
    }
  }
  return values;
}

// ─── Formula Functions ──────────────────────────────────────

const FUNCTIONS: Record<string, (vals: number[]) => number> = {
  SUM: (vals) => vals.reduce((a, b) => a + b, 0),
  COUNT: (vals) => vals.length,
  AVERAGE: (vals) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0),
  MIN: (vals) => (vals.length ? Math.min(...vals) : 0),
  MAX: (vals) => (vals.length ? Math.max(...vals) : 0),
};

// ─── Formula Evaluator ─────────────────────────────────────

/** Track cells being evaluated to detect circular references */
const evaluationStack = new Set<string>();

// Safe math evaluator that only allows basic arithmetic operations
function safeMathEval(expr: string): number {
  // Remove spaces and validate expression contains only safe characters
  const clean = expr.replace(/\s+/g, '');
  if (!/^[\d+\-*/().]+$/.test(clean)) {
    throw new Error('Invalid expression');
  }

  // Simple recursive descent parser for basic math
  let pos = 0;

  function parseNumber(): number {
    let num = '';
    while (pos < clean.length && /[\d.]/.test(clean[pos])) {
      num += clean[pos++];
    }
    return parseFloat(num);
  }

  function parseFactor(): number {
    if (clean[pos] === '(') {
      pos++; // skip '('
      const result = parseExpression();
      pos++; // skip ')'
      return result;
    }
    return parseNumber();
  }

  function parseTerm(): number {
    let result = parseFactor();
    while (pos < clean.length && /[*/]/.test(clean[pos])) {
      const op = clean[pos++];
      if (op === '*') {
        result *= parseFactor();
      } else {
        result /= parseFactor();
      }
    }
    return result;
  }

  function parseExpression(): number {
    let result = parseTerm();
    while (pos < clean.length && /[+-]/.test(clean[pos])) {
      const op = clean[pos++];
      if (op === '+') {
        result += parseTerm();
      } else {
        result -= parseTerm();
      }
    }
    return result;
  }

  return parseExpression();
}

/**
 * Evaluate a formula string (starts with "=").
 * Supports: =SUM(A1:A5), =A1+B2, =42, cell refs, basic arithmetic.
 * Returns computed value or "#ERROR" / "#CIRCULAR".
 */
export function evaluateFormula(
  formula: string,
  getCellValue: GetCellValue,
  cellAddr?: string
): string | number {
  if (!formula.startsWith("=")) return formula;

  // Circular reference check
  if (cellAddr) {
    if (evaluationStack.has(cellAddr)) return "#CIRCULAR";
    evaluationStack.add(cellAddr);
  }

  try {
    const expr = formula.slice(1).trim().toUpperCase();

    // Function call pattern: FUNC(args)
    const fnMatch = expr.match(/^([A-Z]+)\((.+)\)$/);
    if (fnMatch) {
      const fnName = fnMatch[1];
      const fn = FUNCTIONS[fnName];
      if (!fn) return "#ERROR";
      const args = splitArgs(fnMatch[2]);
      const values = resolveArgs(args, getCellValue);
      return fn(values);
    }

    // Simple cell reference: A1
    if (/^[A-Z]+\d+$/.test(expr)) {
      const v = getCellValue(expr);
      return v;
    }

    // Simple arithmetic: A1+B2, A1*2, etc.
    // Replace cell references with their values, then evaluate
    const resolved = expr.replace(/[A-Z]+\d+/g, (match) => {
      const v = getCellValue(match);
      const n = typeof v === "number" ? v : parseFloat(String(v));
      return isNaN(n) ? "0" : String(n);
    });

    // Safe eval for basic arithmetic only (+-*/)
    if (/^[\d\s+\-*/().]+$/.test(resolved)) {
      const result = safeMathEval(resolved);
      return typeof result === "number" && isFinite(result) ? result : "#ERROR";
    }

    return "#ERROR";
  } catch {
    return "#ERROR";
  } finally {
    if (cellAddr) evaluationStack.delete(cellAddr);
  }
}

/** Split function arguments respecting nested parens */
function splitArgs(str: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of str) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      args.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) args.push(current);
  return args;
}
