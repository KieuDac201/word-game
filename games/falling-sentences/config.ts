import type { Difficulty } from "@/lib/core/types";
import { DIFFICULTY_WORD_RANGES } from "@/lib/core/constants";

export interface DifficultyConfig {
  label: string;
  description: string;
  wordCountRange: [number, number];
  maxSimultaneous: number;
  spawnIntervalMs: number;
  baseFallSpeedPPS: number;
}

export interface SpeedConfig {
  label: string;
  multiplier: number;
}

export type SpeedPreset = "relaxed" | "standard" | "turbo" | "custom";

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "Easy",
    description: "Short sentences, generous pacing",
    wordCountRange: DIFFICULTY_WORD_RANGES.easy,
    maxSimultaneous: 2,
    spawnIntervalMs: 5000,
    baseFallSpeedPPS: 25,
  },
  normal: {
    label: "Normal",
    description: "Balanced challenge for most typists",
    wordCountRange: DIFFICULTY_WORD_RANGES.normal,
    maxSimultaneous: 3,
    spawnIntervalMs: 3500,
    baseFallSpeedPPS: 40,
  },
  hard: {
    label: "Hard",
    description: "Long sentences, frequent spawns",
    wordCountRange: DIFFICULTY_WORD_RANGES.hard,
    maxSimultaneous: 5,
    spawnIntervalMs: 2500,
    baseFallSpeedPPS: 55,
  },
};

export const SPEED_CONFIGS: Record<SpeedPreset, SpeedConfig> = {
  relaxed: { label: "Relaxed", multiplier: 0.6 },
  standard: { label: "Standard", multiplier: 1.0 },
  turbo: { label: "Turbo", multiplier: 1.6 },
  custom: { label: "Custom", multiplier: 1.0 }, // overridden by customSpeedPPS
};

export const DEFAULT_LIVES = 3;
export const LIVES_OPTIONS = [1, 3, 5];
export const DANGER_LINE_OFFSET_PX = 80; // px from bottom of game area
export const SENTENCE_HEIGHT_PX = 60;
export const LANE_COUNT = 3;
export const HUD_UPDATE_INTERVAL_MS = 250; // throttle HUD re-renders
export const LOCAL_STORAGE_HIGH_SCORE_KEY = "falling-words-high-score";
