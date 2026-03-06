/**
 * Health Score Calculator
 *
 * Computes a 0-100 health score for a project based on:
 * - Staleness (days since last activity)
 * - Status (active/inactive)
 * - Activity (has documents, story cards)
 */

export interface HealthInputs {
  lastModified: string; // ISO date string from Origami
  status: string; // "active" | "inactive"
  hasDocuments?: boolean;
  hasStoryCards?: boolean;
}

export function calculateHealthScore(inputs: HealthInputs): number {
  let score = 100;

  // Staleness penalty: -5 per day since last modification (max -40)
  const lastMod = new Date(inputs.lastModified);
  const now = new Date();
  const daysSinceActivity = Math.floor(
    (now.getTime() - lastMod.getTime()) / (1000 * 60 * 60 * 24)
  );
  score -= Math.min(daysSinceActivity * 5, 40);

  // Status penalty
  if (inputs.status === "inactive") score -= 30;

  // Activity bonuses
  if (inputs.hasDocuments) score += 5;
  if (inputs.hasStoryCards) score += 5;

  return Math.max(0, Math.min(100, score));
}
