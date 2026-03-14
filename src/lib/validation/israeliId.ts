/**
 * Israeli ID (Teudat Zehut) validation and formatting.
 *
 * Uses the Israeli variant of the Luhn algorithm:
 *  1. Pad the number to 9 digits with leading zeros.
 *  2. Multiply each digit alternately by 1 and 2.
 *  3. If the product is greater than 9, subtract 9.
 *  4. Sum all results.
 *  5. The ID is valid if the sum is divisible by 10.
 */

/** Pad an ID string to 9 digits with leading zeros. */
export function formatIsraeliId(id: string): string {
  return id.replace(/\D/g, "").padStart(9, "0");
}

/** Validate a 9-digit Israeli ID number. */
export function validateIsraeliId(id: string): boolean {
  const digits = id.replace(/\D/g, "");

  if (digits.length === 0 || digits.length > 9) return false;

  const padded = digits.padStart(9, "0");

  const sum = padded.split("").reduce((acc, char, i) => {
    let val = Number(char) * ((i % 2) + 1);
    if (val > 9) val -= 9;
    return acc + val;
  }, 0);

  return sum % 10 === 0;
}
