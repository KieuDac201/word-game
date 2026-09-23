import { BOT_VOCABULARY } from "./bot-vocabulary";
import { STARTER_WORDS } from "./config";
import type { BotDifficulty } from "./types";

/**
 * Returns the ending letter of a word in lowercase.
 */
export function getLastLetter(word: string): string {
  const clean = word.trim().toLowerCase();
  return clean[clean.length - 1] || "";
}

/**
 * Validates rule compliance (starting letter, duplicate check, length).
 */
export function checkMoveRules(
  word: string,
  requiredLetter: string,
  usedWords: Set<string>,
  minLength = 3
): { valid: boolean; reason?: string } {
  const normalized = word.trim().toLowerCase();

  if (normalized.length < minLength) {
    return { valid: false, reason: `Word must be at least ${minLength} letters.` };
  }

  if (requiredLetter && normalized[0] !== requiredLetter.toLowerCase()) {
    return {
      valid: false,
      reason: `Must start with the letter "${requiredLetter.toUpperCase()}".`,
    };
  }

  if (usedWords.has(normalized)) {
    return { valid: false, reason: `"${normalized}" has already been played in this match.` };
  }

  return { valid: true };
}

/**
 * Selects a starter word for the match.
 */
export function getRandomStarterWord(): string {
  const idx = Math.floor(Math.random() * STARTER_WORDS.length);
  return STARTER_WORDS[idx];
}

/**
 * Picks a realistic bot move from the vocabulary.
 */
export function pickBotWord(
  startingLetter: string,
  usedWords: Set<string>,
  difficulty: BotDifficulty
): string | null {
  const letter = startingLetter.toLowerCase();
  const pool = BOT_VOCABULARY[letter] || [];

  // Filter out already used words
  const available = pool.filter((w) => !usedWords.has(w.toLowerCase()));
  if (available.length === 0) {
    return null;
  }

  if (difficulty === "novice") {
    // Novice prefers shorter words (length 3-5)
    const shortWords = available.filter((w) => w.length <= 5);
    const candidateList = shortWords.length > 0 ? shortWords : available;
    const choice = candidateList[Math.floor(Math.random() * candidateList.length)];
    return choice;
  }

  if (difficulty === "scholar") {
    // Scholar plays medium-length natural words
    const choice = available[Math.floor(Math.random() * available.length)];
    return choice;
  }

  // Grandmaster prefers longer words or words ending in tough letters (e.g. x, y, w, k, j)
  const strategicWords = available.filter((w) => {
    const end = getLastLetter(w);
    return ["x", "y", "w", "k", "j", "z", "q"].includes(end) || w.length >= 7;
  });

  const candidates = strategicWords.length > 0 ? strategicWords : available;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
