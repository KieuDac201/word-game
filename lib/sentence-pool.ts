// ──────────────────────────────────────────────────────────────
// Sentence pool: parsing, filtering, shuffling, and queue
// management for the falling-sentence game
// ──────────────────────────────────────────────────────────────

import type { Difficulty, LibraryCategory, WordToken } from './types';
import {
  SENTENCE_LIBRARIES,
  DIFFICULTY_CONFIGS,
  MIN_CUSTOM_SENTENCES,
  MAX_WORDS_PER_SENTENCE,
} from './constants';

/**
 * Strip punctuation from a word for lenient matching.
 * Keeps apostrophes inside words (e.g. "don't" → "don't") but
 * removes leading/trailing punctuation.
 */
export function cleanWord(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^[^a-z0-9]+/, '')
    .replace(/[^a-z0-9']+$/, '')
    .replace(/'+$/, ''); // trailing apostrophe
}

/**
 * Tokenize a sentence into WordToken objects.
 */
export function tokenizeSentence(sentence: string): WordToken[] {
  return sentence
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((raw) => ({
      raw,
      clean: cleanWord(raw),
      completed: false,
      charIndex: 0,
    }));
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
      return words.slice(0, MAX_WORDS_PER_SENTENCE).join(' ');
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
 * Get sentences from a built-in library, optionally filtered by
 * difficulty word-count range.
 */
export function getLibrarySentences(
  category: LibraryCategory,
  difficulty: Difficulty
): string[] {
  const all = SENTENCE_LIBRARIES[category];
  const [minWords, maxWords] = DIFFICULTY_CONFIGS[difficulty].wordCountRange;

  return all.filter((s) => {
    const wordCount = s.split(/\s+/).length;
    return wordCount >= minWords && wordCount <= maxWords;
  });
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

/**
 * Build the final sentence pool based on game config.
 * Returns an array of sentences ready for gameplay.
 * Falls back to all sentences in category if difficulty filter is too strict.
 */
export function buildSentencePool(
  source: 'library' | 'custom',
  category: LibraryCategory,
  difficulty: Difficulty,
  customSentences: string[]
): string[] {
  if (source === 'custom') {
    return customSentences;
  }

  let sentences = getLibrarySentences(category, difficulty);

  // Fallback: if difficulty filter leaves too few, use all from category
  if (sentences.length < MIN_CUSTOM_SENTENCES) {
    sentences = [...SENTENCE_LIBRARIES[category]];
  }

  return sentences;
}
