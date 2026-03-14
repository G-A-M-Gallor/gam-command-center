/**
 * Validates an Israeli ID number using the Luhn algorithm.
 * Works for 5–9 digit IDs (left-padded to 9 digits).
 *
 * Usage:
 *   validateIsraeliID("123456782") // true
 *   validateIsraeliID("000000000") // false
 *
 * For real-time validation during typing, call on every keystroke
 * and only show error once length >= 5.
 */
export function validateIsraeliID(id: string): boolean {
  // Strip whitespace and dashes
  const cleaned = id.replace(/[\s-]/g, "");

  // Must be 5–9 digits
  if (!/^\d{5,9}$/.test(cleaned)) return false;

  // Pad to 9 digits
  const padded = cleaned.padStart(9, "0");

  // All zeros is not valid
  if (padded === "000000000") return false;

  // Luhn checksum
  const sum = padded.split("").reduce((acc, digit, i) => {
    let n = parseInt(digit, 10) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    return acc + n;
  }, 0);

  return sum % 10 === 0;
}
