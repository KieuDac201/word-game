// ──────────────────────────────────────────────────────────────
// Type definitions for the Falling Sentences typing game
// ──────────────────────────────────────────────────────────────

import type { Difficulty, LibraryCategory } from "@/lib/core/types";
import type { SpeedPreset } from "./config";

/** Sentence source type */
export type SentenceSource = "library" | "custom";

/** Game state machine */
export type GamePhase = "idle" | "playing" | "paused" | "gameover" | "victory";

/** Individual word token within a falling sentence */
export interface WordToken {
  /** The raw word text (with original punctuation) */
  raw: string;
  /** The cleaned text used for matching (lowercase, stripped punctuation) */
  clean: string;
  /** Whether this word has been completed */
  completed: boolean;
  /** Index of the next character to match within `clean` */
  charIndex: number;
}

/** A falling sentence on screen */
export interface FallingSentence {
  /** Unique ID */
  id: string;
  /** The full original sentence text */
  text: string;
  /** Tokenized words */
  words: WordToken[];
  /** Index of the currently active word */
  activeWordIndex: number;
  /** Current Y position in pixels (from top) */
  y: number;
  /** Lane assignment (0-based column index) */
  lane: number;
  /** Timestamp when this sentence spawned (ms) */
  spawnTime: number;
  /** Whether this is the auto-targeted (lowest) sentence */
  isTargeted: boolean;
  /** Whether the sentence has been fully completed */
  completed: boolean;
  /** Whether the sentence hit the bottom and was destroyed */
  dropped: boolean;
}

/** Game configuration passed from Setup → Game */
export interface GameConfig {
  source: SentenceSource;
  libraryCategory: LibraryCategory;
  difficulty: Difficulty;
  speedPreset: SpeedPreset;
  customSpeedPPS: number; // pixels per second (for custom speed)
  lives: number;
  soundEnabled: boolean;
  soundVolume: number; // 0-1
  sentences: string[];
  isCustomSource: boolean; // true if using custom text, affects pool exhaustion behavior
  translations?: Record<string, string>; // english text -> vietnamese translation
}

/** Record of a sentence that went through the game session */
export interface SentenceHistoryItem {
  id: string;
  text: string;
  status: "success" | "failed";
  wordCount: number;
  translationVi?: string | null;
  completedAt?: number;
}

/** Live game state (mutable via useRef for performance) */
export interface GameState {
  sessionId: string;
  nextSentenceId: number;
  phase: GamePhase;
  score: number;
  combo: number;
  maxCombo: number;
  lives: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  wordsCompleted: number;
  sentencesCompleted: number;
  sentencesDropped: number;
  startTime: number;
  elapsedTime: number;
  /** Rolling WPM windows for peak WPM tracking */
  wpmSnapshots: { time: number; chars: number }[];
  peakWpm: number;
  currentWpm: number;
  accuracy: number;
  /** Active falling sentences on screen */
  activeSentences: FallingSentence[];
  /** Track record of all sentences that completed or dropped */
  sentenceHistory: SentenceHistoryItem[];
  /** Remaining sentence pool (indices into the original array) */
  sentenceQueue: number[];
  /** Total sentences available */
  totalSentences: number;
  /** Total sentences used so far */
  sentencesUsed: number;
  /** Spawn cooldown timer (ms) */
  lastSpawnTime: number;
  /** Mistyped key frequency map */
  mistypedKeys: Record<string, number>;
  /** Whether the pool has been recycled at least once */
  hasRecycled: boolean;
  /** Timestamp when the last sentence was completed */
  lastSentenceCompleteTime: number;
}

/** Game over statistics */
export interface GameOverStats {
  finalScore: number;
  highScore: number;
  averageWpm: number;
  peakWpm: number;
  accuracy: number;
  combo: number;
  maxCombo: number;
  sentencesCompleted: number;
  sentencesDropped: number;
  wordsCompleted: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  elapsedTime: number;
  mistypedKeys: [string, number][]; // sorted by frequency desc
  isVictory: boolean;
  sentenceHistory?: SentenceHistoryItem[];
}

/** Complete session data stored when navigating to completion page */
export interface WordGameCompletionData {
  stats: GameOverStats;
  config: GameConfig;
  sentences: SentenceHistoryItem[];
}

/** Particle effect type */
export type ParticleType = "explosion" | "impact" | "sparkle";

/** Individual particle */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: ParticleType;
  opacity: number;
}
