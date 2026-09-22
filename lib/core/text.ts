// ──────────────────────────────────────────────────────────────
// Pure text helpers: word cleaning, custom pool parsing, shuffling
// ──────────────────────────────────────────────────────────────

import { MIN_CUSTOM_SENTENCES, MAX_WORDS_PER_SENTENCE } from "./constants";

/**
 * Strip punctuation from a word for lenient matching.
 * Keeps apostrophes inside words (e.g. "don't" → "don't") but
 * removes leading/trailing punctuation.
 */
export function cleanWord(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^[^a-z0-9]+/, "")
    .replace(/[^a-z0-9']+$/, "")
    .replace(/'+$/, ""); // trailing apostrophe
}

/**
 * Parse a custom text blob into individual sentences.
 * - Splits by newline
 * - Removes empty lines and duplicate sentences
 * - Truncates sentences longer than MAX_WORDS_PER_SENTENCE
 */
export function parseCustomText(text: string): string[] {
  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Deduplicate (case-insensitive)
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const line of lines) {
    const key = line.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(line);
    }
  }

  // Truncate long sentences
  return unique.map((line) => {
    const words = line.split(/\s+/);
    if (words.length > MAX_WORDS_PER_SENTENCE) {
      return words.slice(0, MAX_WORDS_PER_SENTENCE).join(" ");
    }
    return line;
  });
}

/**
 * Validate that a custom sentence pool meets minimum requirements.
 */
export function validateCustomPool(sentences: string[]): {
  valid: boolean;
  error?: string;
  count: number;
} {
  if (sentences.length < MIN_CUSTOM_SENTENCES) {
    return {
      valid: false,
      error: `Need at least ${MIN_CUSTOM_SENTENCES} unique sentences. Currently have ${sentences.length}.`,
      count: sentences.length,
    };
  }
  return { valid: true, count: sentences.length };
}

/**
 * Fisher-Yates shuffle (in-place).
 */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build the initial sentence queue as an array of shuffled indices.
 */
export function buildSentenceQueue(totalSentences: number): number[] {
  const indices = Array.from({ length: totalSentences }, (_, i) => i);
  return shuffle(indices);
}
