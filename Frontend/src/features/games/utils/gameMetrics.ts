/**
 * Shared score and accuracy calculation utilities for game components.
 */

/**
 * Compute accuracy as a percentage (0–100) based on correct vs total attempts.
 */
export function computeAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((correct / total) * 100)));
}

/**
 * Compute a score in range 0–100 based on accuracy percentage,
 * time taken (seconds), and target time.
 * Penalizes overtime, rewards faster completion.
 */
export function computeTimedScore(
  accuracy: number,
  timeTakenSeconds: number,
  targetSeconds: number,
): number {
  const timeBonus = Math.max(0, 1 - timeTakenSeconds / (targetSeconds * 2));
  const raw = accuracy * 0.7 + timeBonus * 30;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

/**
 * Simple score from level and accuracy percentage.
 * Base = level * 10, scaled by accuracy.
 */
export function computeLevelScore(level: number, accuracyPercent: number): number {
  return Math.round((level * 10 * accuracyPercent) / 100);
}

/**
 * Format seconds as MM:SS string.
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
