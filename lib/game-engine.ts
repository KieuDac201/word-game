// ──────────────────────────────────────────────────────────────
// Core game engine: physics loop, spawning, input handling,
// auto-target-lowest logic, and state management
// ──────────────────────────────────────────────────────────────

import type {
  FallingSentence,
  GameConfig,
  GameState,
} from './types';
import {
  DIFFICULTY_CONFIGS,
  SPEED_CONFIGS,
  LANE_COUNT,
} from './constants';
import {
  tokenizeSentence,
  buildSentenceQueue,
} from './sentence-pool';
import {
  calculateSentenceScore,
  incrementCombo,
  calculateWPM,
  calculateAccuracy,
  updatePeakWPM,
} from './scoring';

// ─── Factory ─────────────────────────────────────────────────

export function createInitialState(config: GameConfig): GameState {
  return {
    sessionId: Math.random().toString(36).slice(2, 9),
    nextSentenceId: 0,
    phase: 'playing',
    score: 0,
    combo: 1,
    maxCombo: 1,
    lives: config.lives,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    wordsCompleted: 0,
    sentencesCompleted: 0,
    sentencesDropped: 0,
    startTime: performance.now(),
    elapsedTime: 0,
    wpmSnapshots: [],
    peakWpm: 0,
    currentWpm: 0,
    accuracy: 100,
    activeSentences: [],
    sentenceHistory: [],
    sentenceQueue: buildSentenceQueue(config.sentences.length),
    totalSentences: config.sentences.length,
    sentencesUsed: 0,
    lastSpawnTime: performance.now(),
    mistypedKeys: {},
    hasRecycled: false,
    lastSentenceCompleteTime: 0,
  };
}

// ─── Effective fall speed ────────────────────────────────────

export function getEffectiveFallSpeed(config: GameConfig): number {
  const diffConfig = DIFFICULTY_CONFIGS[config.difficulty];
  if (config.speedPreset === 'custom') {
    return config.customSpeedPPS;
  }
  const speedMultiplier = SPEED_CONFIGS[config.speedPreset].multiplier;
  return diffConfig.baseFallSpeedPPS * speedMultiplier;
}

// ─── Spawning ────────────────────────────────────────────────

const SPAWN_Y = -60;
const MIN_VERTICAL_GAP_PX = 100;

/**
 * Determine which lane to place a new sentence in.
 * Avoids lanes that already have a sentence near the top.
 */
function pickLane(active: FallingSentence[]): number {
  const occupied = new Set(
    active.filter((s) => s.y < 120).map((s) => s.lane)
  );
  const available = Array.from({ length: LANE_COUNT }, (_, i) => i).filter(
    (l) => !occupied.has(l)
  );
  if (available.length === 0) {
    return Math.floor(Math.random() * LANE_COUNT);
  }
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Check that no active sentence is too close to the spawn point.
 * Prevents two sentences from appearing at the same vertical row.
 */
function hasVerticalClearance(active: FallingSentence[]): boolean {
  for (const s of active) {
    if (s.completed || s.dropped) continue;
    if (Math.abs(s.y - SPAWN_Y) < MIN_VERTICAL_GAP_PX) {
      return false;
    }
  }
  return true;
}

/**
 * Try to spawn a new sentence if conditions are met.
 * Returns the updated state (mutated in place for perf).
 */
export function trySpawnSentence(
  state: GameState,
  config: GameConfig,
  currentTime: number
): boolean {
  const diffConfig = DIFFICULTY_CONFIGS[config.difficulty];

  // Check max simultaneous
  if (state.activeSentences.length >= diffConfig.maxSimultaneous) return false;

  // Check spawn interval
  if (currentTime - state.lastSpawnTime < diffConfig.spawnIntervalMs) return false;

  // Check vertical clearance — prevent same-row overlap
  if (!hasVerticalClearance(state.activeSentences)) return false;

  // Check queue
  if (state.sentenceQueue.length === 0) {
    if (config.isCustomSource) {
      // Victory condition: pool exhausted for custom source
      return false;
    }
    // Recycle: reshuffle and refill the queue
    state.sentenceQueue = buildSentenceQueue(config.sentences.length);
    state.hasRecycled = true;
  }

  const sentenceIndex = state.sentenceQueue.pop()!;
  const text = config.sentences[sentenceIndex];
  const words = tokenizeSentence(text);

  state.nextSentenceId++;
  const sentence: FallingSentence = {
    id: `s-${state.sessionId}-${state.nextSentenceId}`,
    text,
    words,
    activeWordIndex: 0,
    y: SPAWN_Y, // start above screen
    lane: pickLane(state.activeSentences),
    spawnTime: currentTime,
    isTargeted: false,
    completed: false,
    dropped: false,
  };

  state.activeSentences.push(sentence);
  state.sentencesUsed++;
  state.lastSpawnTime = currentTime;
  return true;
}

// ─── Physics Update ──────────────────────────────────────────

/**
 * Update positions of all active sentences.
 * Returns IDs of sentences that hit the danger line.
 */
export function updatePhysics(
  state: GameState,
  config: GameConfig,
  deltaMs: number,
  dangerY: number
): string[] {
  const fallSpeed = getEffectiveFallSpeed(config);
  const deltaSec = deltaMs / 1000;
  const dropped: string[] = [];

  for (const sentence of state.activeSentences) {
    if (sentence.completed || sentence.dropped) continue;
    sentence.y += fallSpeed * deltaSec;

    if (sentence.y >= dangerY) {
      sentence.dropped = true;
      dropped.push(sentence.id);
    }
  }

  return dropped;
}

// ─── Target Management ──────────────────────────────────────

/**
 * Auto-target the lowest (closest to danger line) active sentence.
 * Returns the newly targeted sentence's ID, or null.
 */
export function updateTargeting(state: GameState): string | null {
  // Clear all targeting
  for (const s of state.activeSentences) {
    s.isTargeted = false;
  }

  // Find the lowest non-completed, non-dropped sentence
  let lowest: FallingSentence | null = null;
  for (const s of state.activeSentences) {
    if (s.completed || s.dropped) continue;
    if (!lowest || s.y > lowest.y) {
      lowest = s;
    }
  }

  if (lowest) {
    lowest.isTargeted = true;
    return lowest.id;
  }
  return null;
}

// ─── Input Handling ──────────────────────────────────────────

export interface KeystrokeResult {
  correct: boolean;
  wordCompleted: boolean;
  sentenceCompleted: boolean;
  /** For error flash position */
  targetSentenceId: string | null;
}

/**
 * Handle a single keystroke against the currently targeted sentence.
 */
export function handleKeystroke(
  state: GameState,
  config: GameConfig,
  key: string,
  currentTime: number
): KeystrokeResult {
  const result: KeystrokeResult = {
    correct: false,
    wordCompleted: false,
    sentenceCompleted: false,
    targetSentenceId: null,
  };

  // Find targeted sentence
  const target = state.activeSentences.find((s) => s.isTargeted);
  if (!target) return result;

  result.targetSentenceId = target.id;
  const activeWord = target.words[target.activeWordIndex];
  if (!activeWord) return result;

  const isLastWord = target.activeWordIndex >= target.words.length - 1;

  // Case 1: Active word's letters are all typed. Player must press Space to advance.
  if (activeWord.charIndex >= activeWord.clean.length) {
    if (key === ' ' && !isLastWord) {
      state.totalKeystrokes++;
      result.correct = true;
      state.correctKeystrokes++;
      activeWord.completed = true;
      result.wordCompleted = true;
      state.wordsCompleted++;
      target.activeWordIndex++;
      return result;
    }

    // Space after the last word is not needed; if pressed within grace period, ignore
    if (key === ' ' && isLastWord) {
      return result;
    }

    // Typed something else while waiting for space
    state.totalKeystrokes++;
    const displayKey = key.length === 1 ? key : key;
    state.mistypedKeys[displayKey] = (state.mistypedKeys[displayKey] || 0) + 1;
    return result;
  }

  // Case 2: Space pressed before word letters are finished
  if (key === ' ') {
    // Grace window: if previous sentence was completed within 300ms and activeWord is at char 0, ignore
    if (activeWord.charIndex === 0 && currentTime - state.lastSentenceCompleteTime < 300) {
      return result;
    }

    state.totalKeystrokes++;
    state.mistypedKeys['Space'] = (state.mistypedKeys['Space'] || 0) + 1;
    return result;
  }

  state.totalKeystrokes++;

  const expectedChar = activeWord.clean[activeWord.charIndex];
  const typedChar = key.toLowerCase();

  if (typedChar === expectedChar) {
    // Correct keystroke
    result.correct = true;
    state.correctKeystrokes++;
    activeWord.charIndex++;

    // Check if word characters are complete
    if (activeWord.charIndex >= activeWord.clean.length) {
      if (isLastWord) {
        // Last word in sentence: completed immediately on the final character!
        activeWord.completed = true;
        result.wordCompleted = true;
        result.sentenceCompleted = true;
        target.completed = true;
        state.wordsCompleted++;
        state.sentencesCompleted++;
        state.lastSentenceCompleteTime = currentTime;

        // Score
        const completionTime = currentTime - target.spawnTime;
        const lifetime =
          (DIFFICULTY_CONFIGS[config.difficulty].spawnIntervalMs *
            DIFFICULTY_CONFIGS[config.difficulty].maxSimultaneous) /
          1000;
        const score = calculateSentenceScore(
          target.words.length,
          lifetime * 1000,
          completionTime,
          state.combo
        );
        state.score += score;

        // Record to history
        state.sentenceHistory.push({
          id: target.id,
          text: target.text,
          status: 'success',
          wordCount: target.words.length,
          translationVi: config.translations?.[target.text] || null,
          completedAt: currentTime,
        });

        // Combo
        state.combo = incrementCombo(state.combo);
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;
      }
      // If NOT last word, do NOT advance yet! The next keystroke must be Space!
    }
  } else {
    // Incorrect keystroke
    const displayKey = key.length === 1 ? key : key;
    state.mistypedKeys[displayKey] = (state.mistypedKeys[displayKey] || 0) + 1;
  }

  return result;
}

// ─── Sentence Drop Handling ──────────────────────────────────

/**
 * Process a sentence that hit the danger line.
 * Returns true if game over (lives === 0).
 */
export function handleSentenceDrop(
  state: GameState,
  sentence?: FallingSentence,
  config?: GameConfig,
  currentTime?: number
): boolean {
  state.lives--;
  state.combo = 1; // Reset combo on drop
  state.sentencesDropped++;
  if (sentence) {
    state.sentenceHistory.push({
      id: sentence.id,
      text: sentence.text,
      status: 'failed',
      wordCount: sentence.words.length,
      translationVi: config?.translations?.[sentence.text] || null,
      completedAt: currentTime,
    });
  }
  return state.lives <= 0;
}

// ─── Cleanup ─────────────────────────────────────────────────

/**
 * Remove completed and dropped sentences from active list.
 */
export function cleanupSentences(state: GameState): void {
  state.activeSentences = state.activeSentences.filter(
    (s) => !s.completed && !s.dropped
  );
}

// ─── Telemetry Update ────────────────────────────────────────

/**
 * Update WPM, accuracy, and peak WPM.
 */
export function updateTelemetry(state: GameState, currentTime: number): void {
  const elapsed = currentTime - state.startTime;
  state.elapsedTime = elapsed;
  state.currentWpm = calculateWPM(state.correctKeystrokes, elapsed);
  state.accuracy = calculateAccuracy(
    state.correctKeystrokes,
    state.totalKeystrokes
  );

  const { snapshots, peakWpm } = updatePeakWPM(
    state.wpmSnapshots,
    currentTime,
    state.correctKeystrokes,
    state.peakWpm
  );
  state.wpmSnapshots = snapshots;
  state.peakWpm = peakWpm;
}

// ─── Victory Check ───────────────────────────────────────────

/**
 * Check if victory condition is met (custom source, pool exhausted,
 * no active sentences remaining).
 */
export function checkVictory(
  state: GameState,
  config: GameConfig
): boolean {
  if (!config.isCustomSource) return false;
  if (state.sentenceQueue.length > 0) return false;
  if (state.activeSentences.some((s) => !s.completed && !s.dropped)) return false;
  return true;
}
