import type { Difficulty } from "@/lib/core/types";

export interface ScrambleConfig {
  categorySlug: string;
  categoryName: string;
  difficulty: Difficulty;
  roundCount: number; // 5, 10, 15, or 0 for endless
  hintsEnabled: boolean;
  soundEnabled: boolean;
}

export interface ScrambleSentenceHistoryItem {
  id: string;
  text: string;
  translationVi?: string | null;
  timeSeconds: number;
  wordCount: number;
}

export interface ScrambleCompletionData {
  config: ScrambleConfig;
  stats: {
    score: number;
    maxCombo: number;
    totalTime: number;
    hintsUsed: number;
    sentencesCompleted: number;
  };
  sentences: ScrambleSentenceHistoryItem[];
}

/** A word carriage that moves between the depot and the rail. */
export interface WordToken {
  id: string;
  text: string;
  /** Correct position in the unscrambled sentence. */
  originalIndex: number;
  /** Fixed slot position in the depot. */
  depotIndex: number;
}

export interface DragPayload {
  token: WordToken;
  source: "depot" | "rail";
  sourceIndex: number;
}
