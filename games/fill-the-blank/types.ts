import type { Difficulty } from "@/lib/core/types";

export interface FillBlankConfig {
  categorySlug: string;
  categoryName: string;
  difficulty: Difficulty;
  roundCount: number;
  soundEnabled: boolean;
}

/** A single sentence with one word hidden behind a blank. */
export interface BlankRound {
  id: string;
  text: string;
  translationVi?: string | null;
  words: string[];
  blankIndex: number;
  /** Cleaned form of the hidden word; matches one of `options`. */
  answer: string;
  options: string[];
}

export interface FillBlankRoundResult {
  id: string;
  text: string;
  translationVi?: string | null;
  answer: string;
  chosen: string;
  correct: boolean;
  wordCount: number;
}

export interface FillBlankCompletionData {
  config: FillBlankConfig;
  stats: {
    score: number;
    correct: number;
    total: number;
    maxStreak: number;
    totalTime: number;
  };
  rounds: FillBlankRoundResult[];
}
