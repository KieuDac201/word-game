import type { Difficulty } from "./types";

export const MIN_CUSTOM_SENTENCES = 5;
export const MAX_WORDS_PER_SENTENCE = 20;

export const MAX_COMBO_MULTIPLIER = 10;
export const WPM_ROLLING_WINDOW_MS = 10_000;

/** Sentence-length bands backing every game's difficulty selector. */
export const DIFFICULTY_WORD_RANGES: Record<Difficulty, [number, number]> = {
  easy: [3, 5],
  normal: [6, 10],
  hard: [11, 20],
};
