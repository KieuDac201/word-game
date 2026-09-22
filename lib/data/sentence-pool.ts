import type { Difficulty, LibraryCategory } from "@/lib/core/types";
import {
  MIN_CUSTOM_SENTENCES,
  DIFFICULTY_WORD_RANGES,
} from "@/lib/core/constants";
import { SENTENCE_LIBRARIES } from "./fallback";

/** Sentences from a category, filtered to the difficulty's word-count band. */
export function getLibrarySentences(
  category: LibraryCategory,
  difficulty: Difficulty,
  customLibrary?: Record<string, string[]>,
): string[] {
  const all = customLibrary?.[category] ?? SENTENCE_LIBRARIES[category] ?? [];
  const [minWords, maxWords] = DIFFICULTY_WORD_RANGES[difficulty];

  return all.filter((s) => {
    const wordCount = s.split(/\s+/).length;
    return wordCount >= minWords && wordCount <= maxWords;
  });
}

/**
 * Build the sentence pool for a session, widening to the whole category when
 * the difficulty filter leaves too few sentences to play with.
 */
export function buildSentencePool(
  source: "library" | "custom",
  category: LibraryCategory,
  difficulty: Difficulty,
  customSentences: string[],
  customLibrary?: Record<string, string[]>,
): string[] {
  if (source === "custom") return customSentences;

  const filtered = getLibrarySentences(category, difficulty, customLibrary);
  if (filtered.length >= MIN_CUSTOM_SENTENCES) return filtered;

  return [...(customLibrary?.[category] ?? SENTENCE_LIBRARIES[category] ?? [])];
}
