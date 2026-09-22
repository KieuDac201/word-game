// ──────────────────────────────────────────────────────────────
// Scoring, WPM, accuracy, and combo calculations
// ──────────────────────────────────────────────────────────────

import { MAX_COMBO_MULTIPLIER, WPM_ROLLING_WINDOW_MS } from './constants';

/**
 * Calculate score for a completed sentence.
 *
 * Formula:
 *   base_points = wordCount × 10
 *   speed_bonus = max(0, (lifetime_seconds - completion_seconds) × 2)
 *   total = (base_points + speed_bonus) × combo_multiplier
 */
export function calculateSentenceScore(
  wordCount: number,
  lifetimeMs: number,
  completionMs: number,
  comboMultiplier: number
): number {
  const basePoints = wordCount * 10;
  const lifetimeSec = lifetimeMs / 1000;
  const completionSec = completionMs / 1000;
  const speedBonus = Math.max(0, Math.round((lifetimeSec - completionSec) * 2));
  return Math.round((basePoints + speedBonus) * comboMultiplier);
}

/**
 * Increment combo, capped at MAX_COMBO_MULTIPLIER.
 */
export function incrementCombo(current: number): number {
  return Math.min(current + 1, MAX_COMBO_MULTIPLIER);
}

/**
 * Calculate WPM from total correctly typed characters and elapsed time.
 * Standard: 1 word = 5 characters
 */
export function calculateWPM(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60_000;
  const words = correctChars / 5;
  return Math.round(words / minutes);
}

/**
 * Calculate accuracy percentage.
 */
export function calculateAccuracy(correct: number, total: number): number {
  if (total <= 0) return 100;
  return Math.round((correct / total) * 100);
}

/**
 * Track peak WPM over a rolling window.
 * Call this periodically (e.g. every 250ms) with current correct char count.
 * Returns the peak WPM observed across all windows.
 */
export function updatePeakWPM(
  snapshots: { time: number; chars: number }[],
  currentTime: number,
  currentChars: number,
  previousPeak: number
): { snapshots: { time: number; chars: number }[]; peakWpm: number } {
  // Add current snapshot
  snapshots.push({ time: currentTime, chars: currentChars });

  // Prune snapshots older than 2× the window (keep some history)
  const cutoff = currentTime - WPM_ROLLING_WINDOW_MS * 2;
  const pruned = snapshots.filter((s) => s.time > cutoff);

  // Find the best WPM across any window-length slice
  let peak = previousPeak;
  for (const start of pruned) {
    const elapsed = currentTime - start.time;
    if (elapsed >= WPM_ROLLING_WINDOW_MS * 0.5) {
      // At least half window
      const charsDelta = currentChars - start.chars;
      const wpm = calculateWPM(charsDelta, elapsed);
      if (wpm > peak) peak = wpm;
    }
  }

  return { snapshots: pruned, peakWpm: peak };
}

/**
 * Get the top N most mistyped keys from the frequency map.
 */
export function getTopMistypedKeys(
  mistypedKeys: Record<string, number>,
  topN: number = 5
): [string, number][] {
  return Object.entries(mistypedKeys)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);
}
