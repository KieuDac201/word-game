'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Difficulty } from '@/lib/types';
import type { ScrambleConfig } from '../page';
import {
  playKeypressClick,
  playMistypeThud,
  playWordComplete,
  playSentenceDestroy,
  playVictory,
  playGameOver,
  setEnabled as setAudioEnabled,
} from '@/lib/audio-engine';

interface WordToken {
  id: string;
  text: string;
  originalIndex: number;
}

interface DragPayload {
  token: WordToken;
  source: 'depot' | 'rail';
  sourceIndex: number;
}

export default function ScramblePlayPage() {
  const router = useRouter();

  // Config & Sentence loading
  const [config, setConfig] = useState<ScrambleConfig>({
    categorySlug: 'casual',
    categoryName: 'Casual Daily',
    difficulty: 'easy',
    roundCount: 5,
    hintsEnabled: true,
    soundEnabled: true,
  });

  const [sentences, setSentences] = useState<{ id: string; text: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Active Sentence State
  const [targetSentence, setTargetSentence] = useState('');
  const [allTokens, setAllTokens] = useState<WordToken[]>([]);
  const [depotTokens, setDepotTokens] = useState<WordToken[]>([]);
  const [railSlots, setRailSlots] = useState<(WordToken | null)[]>([]);

  // Drag & drop interaction state
  const [draggingPayload, setDraggingPayload] = useState<DragPayload | null>(null);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);
  const [isDepotDragOver, setIsDepotDragOver] = useState(false);

  // Gameplay state
  const [validationState, setValidationState] = useState<'idle' | 'success' | 'error'>('idle');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Timer state
  const [sentenceTime, setSentenceTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load config from sessionStorage on mount
  useEffect(() => {
    const raw = sessionStorage.getItem('scramble-config');
    let loadedConfig = config;
    if (raw) {
      try {
        loadedConfig = JSON.parse(raw);
        setConfig(loadedConfig);
      } catch (e) {
        console.error('Failed to parse scramble-config:', e);
      }
    }

    setAudioEnabled(loadedConfig.soundEnabled);

    // Fetch sentences for this category & difficulty
    async function loadSentences() {
      try {
        const res = await fetch(
          `/api/sentences?categoryId=${encodeURIComponent(
            loadedConfig.categorySlug
          )}&difficulty=${encodeURIComponent(loadedConfig.difficulty)}&limit=35`
        );
        if (!res.ok) throw new Error('API fetch failed');
        const data = await res.json();
        if (data.sentences && data.sentences.length > 0) {
          // Shuffle sentences so every game feels fresh
          const shuffled = [...data.sentences].sort(() => Math.random() - 0.5);
          const finalCount =
            loadedConfig.roundCount > 0
              ? Math.min(loadedConfig.roundCount, shuffled.length)
              : shuffled.length;
          setSentences(shuffled.slice(0, finalCount));
        } else {
          // Fallback sentences if database is empty
          setSentences([
            { id: 'fb-1', text: 'Practice makes perfect.' },
            { id: 'fb-2', text: 'Knowledge is power.' },
            { id: 'fb-3', text: 'Time flies like an arrow.' },
            { id: 'fb-4', text: 'Actions speak louder than words.' },
            { id: 'fb-5', text: 'The journey of a thousand miles begins with a single step.' },
          ]);
        }
      } catch (err) {
        console.error('Sentence fetch failed:', err);
        setSentences([
          { id: 'fb-1', text: 'Practice makes perfect.' },
          { id: 'fb-2', text: 'Knowledge is power.' },
          { id: 'fb-3', text: 'Time flies like an arrow.' },
          { id: 'fb-4', text: 'Actions speak louder than words.' },
          { id: 'fb-5', text: 'Better late than never.' },
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadSentences();
  }, []);

  // Timer loop
  useEffect(() => {
    if (loading || isPaused || isCompleted) return;

    timerRef.current = setInterval(() => {
      setSentenceTime((prev) => prev + 1);
      setTotalTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, isPaused, isCompleted]);

  // Setup current sentence
  const initSentence = useCallback(
    (sentenceObj: { id: string; text: string }) => {
      const rawText = sentenceObj.text.trim();
      setTargetSentence(rawText);

      // Split into words, preserving punctuation attached to words
      const words = rawText.split(/\s+/).filter(Boolean);
      const tokens: WordToken[] = words.map((word, i) => ({
        id: `token-${i}-${Math.random().toString(36).substr(2, 5)}`,
        text: word,
        originalIndex: i,
      }));

      setAllTokens(tokens);

      // Fisher-Yates scramble ensuring it doesn't match original order if > 1 word
      let scrambled = [...tokens];
      if (tokens.length > 1) {
        let attempts = 0;
        let isIdentical = true;
        while (isIdentical && attempts < 10) {
          attempts++;
          for (let i = scrambled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
          }
          isIdentical = scrambled.every((tok, idx) => tok.originalIndex === idx);
        }
      }

      setDepotTokens(scrambled);
      setRailSlots(new Array(tokens.length).fill(null));
      setValidationState('idle');
      setSentenceTime(0);
    },
    []
  );

  // Initialize first or next sentence
  useEffect(() => {
    if (sentences.length > 0 && currentIndex < sentences.length) {
      initSentence(sentences[currentIndex]);
    } else if (sentences.length > 0 && currentIndex >= sentences.length) {
      setIsCompleted(true);
      playVictory();
    }
  }, [sentences, currentIndex, initSentence]);

  // ─────────────────────────────────────────────────────────────
  // Interaction Handlers (Click-to-dock & Drag-and-drop)
  // ─────────────────────────────────────────────────────────────

  // Click on word in Depot -> moves to first available rail slot
  const handleDepotWordClick = (token: WordToken, index: number) => {
    if (validationState === 'success') return;
    const firstEmpty = railSlots.findIndex((s) => s === null);
    if (firstEmpty === -1) return; // Rail is full

    playKeypressClick();
    const newRail = [...railSlots];
    newRail[firstEmpty] = token;
    setRailSlots(newRail);

    const newDepot = [...depotTokens];
    newDepot.splice(index, 1);
    setDepotTokens(newDepot);

    setValidationState('idle');
  };

  // Click on word in Rail -> returns to Depot
  const handleRailWordClick = (slotIndex: number) => {
    if (validationState === 'success') return;
    const token = railSlots[slotIndex];
    if (!token) return;

    playKeypressClick();
    const newRail = [...railSlots];
    newRail[slotIndex] = null;
    setRailSlots(newRail);

    setDepotTokens((prev) => [...prev, token]);
    setValidationState('idle');
  };

  // Clear all rail slots back to depot
  const handleClearRail = () => {
    if (validationState === 'success') return;
    const placedTokens = railSlots.filter((t): t is WordToken => t !== null);
    if (placedTokens.length === 0) return;

    playKeypressClick();
    setRailSlots(new Array(allTokens.length).fill(null));
    setDepotTokens((prev) => [...prev, ...placedTokens]);
    setValidationState('idle');
  };

  // Magnet Hint: place the next correct word
  const handleMagnetHint = () => {
    if (!config.hintsEnabled || validationState === 'success') return;

    // Find the first slot that is empty or incorrect
    let targetSlot = -1;
    for (let i = 0; i < railSlots.length; i++) {
      if (railSlots[i] === null || railSlots[i]?.originalIndex !== i) {
        targetSlot = i;
        break;
      }
    }

    if (targetSlot === -1) return; // Already completely correct!

    // Find token with originalIndex === targetSlot
    const correctToken = allTokens.find((t) => t.originalIndex === targetSlot);
    if (!correctToken) return;

    playWordComplete();
    setHintsUsed((h) => h + 1);
    setCombo(1); // Reset combo multiplier on hint

    // If targetSlot already had a wrong word, return it to depot
    const displacedWord = railSlots[targetSlot];

    // Remove correct token from depot or another rail slot
    let newDepot = depotTokens.filter((t) => t.originalIndex !== targetSlot);
    if (displacedWord) {
      newDepot.push(displacedWord);
    }

    const newRail = railSlots.map((tok, idx) => {
      if (idx === targetSlot) return correctToken;
      if (tok && tok.originalIndex === targetSlot) return null; // evacuated from old position
      return tok;
    });

    setDepotTokens(newDepot);
    setRailSlots(newRail);
    setValidationState('idle');
  };

  // ─────────────────────────────────────────────────────────────
  // HTML5 Drag & Drop Logic
  // ─────────────────────────────────────────────────────────────

  const handleDragStart = (
    e: React.DragEvent,
    token: WordToken,
    source: 'depot' | 'rail',
    sourceIndex: number
  ) => {
    const payload: DragPayload = { token, source, sourceIndex };
    setDraggingPayload(payload);
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverSlot = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlotIndex !== slotIndex) {
      setDragOverSlotIndex(slotIndex);
    }
  };

  const handleDropOnSlot = (e: React.DragEvent, targetSlotIndex: number) => {
    e.preventDefault();
    setDragOverSlotIndex(null);
    if (!draggingPayload) return;

    const { token, source, sourceIndex } = draggingPayload;
    playKeypressClick();

    const newRail = [...railSlots];
    const existingInTarget = newRail[targetSlotIndex];

    if (source === 'depot') {
      // Depot -> Rail Slot
      newRail[targetSlotIndex] = token;
      const newDepot = [...depotTokens];
      newDepot.splice(sourceIndex, 1);
      if (existingInTarget) {
        // Swap displaced word to depot
        newDepot.push(existingInTarget);
      }
      setDepotTokens(newDepot);
      setRailSlots(newRail);
    } else {
      // Rail Slot -> Rail Slot (Swap or move)
      newRail[sourceIndex] = existingInTarget; // swap or null
      newRail[targetSlotIndex] = token;
      setRailSlots(newRail);
    }

    setDraggingPayload(null);
    setValidationState('idle');
  };

  const handleDragOverDepot = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDepotDragOver(true);
  };

  const handleDropOnDepot = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDepotDragOver(false);
    if (!draggingPayload) return;

    const { token, source, sourceIndex } = draggingPayload;
    if (source === 'rail') {
      playKeypressClick();
      const newRail = [...railSlots];
      newRail[sourceIndex] = null;
      setRailSlots(newRail);
      setDepotTokens((prev) => [...prev, token]);
    }

    setDraggingPayload(null);
    setValidationState('idle');
  };

  // ─────────────────────────────────────────────────────────────
  // Verification & Train Launch
  // ─────────────────────────────────────────────────────────────

  const verifySentence = useCallback(() => {
    if (railSlots.includes(null)) {
      // Incomplete rail
      playMistypeThud();
      setValidationState('error');
      setTimeout(() => setValidationState('idle'), 600);
      return;
    }

    // Check if every slot matches original token index
    const isMatched = railSlots.every((tok, idx) => tok?.originalIndex === idx);

    if (isMatched) {
      // Success!
      playSentenceDestroy();
      setValidationState('success');

      // Score calculation
      const basePoints = 200;
      const wordBonus = allTokens.length * 20;
      const speedBonus = Math.max(0, 150 - sentenceTime * 8);
      const points = Math.round((basePoints + wordBonus + speedBonus) * combo);

      setScore((s) => s + points);
      setCombo((c) => {
        const next = Math.min(5, c + 0.5);
        setMaxCombo((m) => Math.max(m, next));
        return next;
      });

      // Advance after victory animation
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
      }, 1000);
    } else {
      // Mistake
      playMistypeThud();
      setValidationState('error');
      setCombo(1); // Reset streak
      setTimeout(() => setValidationState('idle'), 600);
    }
  }, [railSlots, allTokens.length, sentenceTime, combo]);

  // Auto-verify when last word placed
  useEffect(() => {
    if (railSlots.length > 0 && !railSlots.includes(null) && validationState === 'idle') {
      verifySentence();
    }
  }, [railSlots, validationState, verifySentence]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isPaused || isCompleted) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        verifySentence();
      } else if (e.key === 'Backspace' && (e.metaKey || e.ctrlKey || railSlots.some(Boolean))) {
        // Find the rightmost occupied rail slot and clear it
        for (let i = railSlots.length - 1; i >= 0; i--) {
          if (railSlots[i] !== null) {
            handleRailWordClick(i);
            break;
          }
        }
      } else if (e.key === 'Escape') {
        handleClearRail();
      } else if (e.key.toLowerCase() === 'h') {
        handleMagnetHint();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, isCompleted, railSlots, verifySentence]);

  // Format time (MM:SS)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-0)] text-white flex flex-col items-center justify-center">
        <div className="text-4xl animate-bounce mb-4">🚊</div>
        <div className="text-sm font-[family-name:var(--font-mono)] text-white/60 animate-pulse">
          Loading {config.categoryName} Rail Tracks...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-white flex flex-col items-center relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[var(--neon-cyan)]/5 rounded-full blur-3xl pointer-events-none" />

      {/* ─── Top HUD ─────────────────────────────────────────── */}
      <header className="w-full max-w-5xl px-6 py-4 flex items-center justify-between border-b border-white/10 z-20">
        <div className="flex items-center gap-4">
          <Link
            href="/scramble"
            className="text-xs font-[family-name:var(--font-mono)] text-white/50 hover:text-white transition-colors flex items-center gap-1"
          >
            <span>←</span> Exit
          </Link>
          <div className="h-4 w-[1px] bg-white/15" />
          <div className="flex items-center gap-2">
            <span className="text-base">🚊</span>
            <span className="text-xs font-bold font-[family-name:var(--font-mono)] text-[var(--neon-cyan)] uppercase tracking-wider">
              {config.categoryName}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-[family-name:var(--font-mono)]">
              {config.difficulty.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-6 font-[family-name:var(--font-mono)]">
          <div className="text-center">
            <div className="text-[10px] text-white/40 uppercase">Train</div>
            <div className="text-sm font-bold text-white">
              {currentIndex + 1}
              {config.roundCount > 0 && (
                <span className="text-white/40 text-xs font-normal"> / {config.roundCount}</span>
              )}
            </div>
          </div>

          <div className="text-center">
            <div className="text-[10px] text-white/40 uppercase">Score</div>
            <div className="text-sm font-bold text-[var(--neon-yellow)]">
              {score.toLocaleString()}
            </div>
          </div>

          <div className="text-center">
            <div className="text-[10px] text-white/40 uppercase">Streak</div>
            <div
              className={`text-sm font-bold ${
                combo > 1 ? 'text-[var(--neon-pink)] animate-pulse' : 'text-white/70'
              }`}
            >
              x{combo.toFixed(1)}
            </div>
          </div>

          <div className="text-center">
            <div className="text-[10px] text-white/40 uppercase">Time</div>
            <div className="text-sm font-bold text-white/90">
              {formatTime(totalTime)}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Game Rail Area ──────────────────────────────── */}
      <main className="flex-1 w-full max-w-5xl px-6 py-8 flex flex-col justify-between z-10">
        {/* Rail Header Instruction */}
        <div className="flex items-center justify-between text-xs text-white/50 mb-4 font-[family-name:var(--font-mono)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--neon-cyan)] animate-ping" />
            <span>Assemble sentence along the magnetic rail in correct order:</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Click card to dock / undock</span>
            <span>•</span>
            <span>Drag to reorder</span>
          </div>
        </div>

        {/* ─── THE MAGNETIC RAIL TRACK ─── */}
        <div
          className={`rail-track-container p-6 sm:p-8 relative min-h-[160px] flex flex-col justify-center transition-all ${
            validationState === 'success'
              ? 'rail-success-glow'
              : validationState === 'error'
              ? 'rail-error-shake'
              : ''
          }`}
        >
          {/* Neon track center line */}
          <div className="rail-track-lines" />

          {/* Slots along the rail */}
          <div className="flex flex-wrap items-center justify-center gap-3 z-10">
            {railSlots.map((slotWord, idx) => (
              <div
                key={`slot-${idx}`}
                onDragOver={(e) => handleDragOverSlot(e, idx)}
                onDragLeave={() => setDragOverSlotIndex(null)}
                onDrop={(e) => handleDropOnSlot(e, idx)}
                className={`rail-slot px-3 py-2 ${
                  dragOverSlotIndex === idx ? 'drag-over' : ''
                }`}
              >
                {slotWord ? (
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, slotWord, 'rail', idx)}
                    onClick={() => handleRailWordClick(idx)}
                    className="rail-carriage px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--neon-cyan)]/60 text-white font-semibold text-sm sm:text-base shadow-lg hover:border-[var(--neon-pink)] flex items-center gap-2"
                  >
                    <span>{slotWord.text}</span>
                    <span className="text-[10px] text-white/30 hover:text-white">✕</span>
                  </div>
                ) : (
                  <span className="text-[11px] font-[family-name:var(--font-mono)] text-white/20 select-none">
                    #{idx + 1}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Success / Error Overlay Banner */}
          {validationState === 'success' && (
            <div className="absolute inset-0 bg-[var(--neon-green)]/15 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-20 animate-scale-in">
              <div className="text-center">
                <span className="text-3xl">⚡</span>
                <div className="text-lg font-extrabold font-[family-name:var(--font-mono)] text-[var(--neon-green)] tracking-wider">
                  TRAIN COUPLED! +{(200 * combo).toFixed(0)} PTS
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── CONTROLS TOOLBAR ─── */}
        <div className="flex items-center justify-between py-4 my-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearRail}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-[family-name:var(--font-mono)] text-white/70 hover:text-white transition-all"
            >
              ↺ Clear Rail (Esc)
            </button>
            {config.hintsEnabled && (
              <button
                type="button"
                onClick={handleMagnetHint}
                className="px-3 py-1.5 rounded-lg bg-[var(--neon-purple)]/15 hover:bg-[var(--neon-purple)]/25 border border-[var(--neon-purple)]/40 text-xs font-[family-name:var(--font-mono)] text-[var(--neon-purple)] transition-all flex items-center gap-1.5"
              >
                <span>🧲 Magnet Hint (H)</span>
                {hintsUsed > 0 && (
                  <span className="text-[10px] px-1.5 rounded-full bg-[var(--neon-purple)]/30 text-white">
                    {hintsUsed}
                  </span>
                )}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={verifySentence}
            className="px-6 py-2 rounded-xl font-bold font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-black bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-green)] hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(0,240,255,0.2)] cursor-pointer flex items-center gap-2"
          >
            <span>Launch Train</span>
            <span>🚀</span>
          </button>
        </div>

        {/* ─── THE DEPOT YARD (Scrambled Words) ─── */}
        <div
          onDragOver={handleDragOverDepot}
          onDragLeave={() => setIsDepotDragOver(false)}
          onDrop={handleDropOnDepot}
          className={`p-6 rounded-2xl bg-[var(--surface-1)] border transition-all ${
            isDepotDragOver
              ? 'border-[var(--neon-purple)] bg-[var(--neon-purple)]/10 shadow-[0_0_20px_rgba(180,77,255,0.2)]'
              : 'border-white/10'
          }`}
        >
          <div className="text-[11px] font-[family-name:var(--font-mono)] text-white/40 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Scramble Depot ({depotTokens.length} unplaced words)</span>
            <span className="text-white/30">Drag card up or click to place</span>
          </div>

          {depotTokens.length === 0 ? (
            <div className="py-6 text-center text-xs text-white/30 font-[family-name:var(--font-mono)]">
              All words currently docked on the rail. Press Launch Train 🚀 or Enter to verify!
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-3 min-h-[60px]">
              {depotTokens.map((token, idx) => (
                <div
                  key={token.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, token, 'depot', idx)}
                  onClick={() => handleDepotWordClick(token, idx)}
                  className="rail-carriage px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-white/20 text-white font-medium text-sm sm:text-base hover:border-[var(--neon-cyan)] shadow-md active:scale-95"
                >
                  {token.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ─── GAME OVER / VICTORY MODAL ───────────────────────── */}
      {isCompleted && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fade-in">
          <div className="glass-card max-w-md w-full p-8 text-center space-y-6 border border-[var(--neon-green)]/40 shadow-[0_0_50px_rgba(0,255,136,0.2)]">
            <div className="w-16 h-16 rounded-2xl bg-[var(--neon-green)]/15 border border-[var(--neon-green)]/40 flex items-center justify-center text-3xl mx-auto">
              🏆
            </div>

            <div>
              <h2
                className="text-2xl font-extrabold font-[family-name:var(--font-mono)]"
                style={{
                  background:
                    'linear-gradient(135deg, #ffffff 0%, var(--neon-green) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                RAILWAY COMPLETE!
              </h2>
              <p className="text-xs text-white/50 mt-1">
                Successfully assembled all trains in {config.categoryName} ({config.difficulty.toUpperCase()}).
              </p>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 gap-3 py-2 font-[family-name:var(--font-mono)] text-left">
              <div className="p-3 rounded-xl bg-[var(--surface-1)] border border-white/10">
                <div className="text-[10px] text-white/40 uppercase">Total Score</div>
                <div className="text-lg font-bold text-[var(--neon-yellow)]">
                  {score.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-1)] border border-white/10">
                <div className="text-[10px] text-white/40 uppercase">Total Time</div>
                <div className="text-lg font-bold text-white">
                  {formatTime(totalTime)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-1)] border border-white/10">
                <div className="text-[10px] text-white/40 uppercase">Max Streak</div>
                <div className="text-lg font-bold text-[var(--neon-pink)]">
                  x{maxCombo.toFixed(1)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-1)] border border-white/10">
                <div className="text-[10px] text-white/40 uppercase">Hints Used</div>
                <div className="text-lg font-bold text-white/80">
                  {hintsUsed}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCompleted(false);
                  setCurrentIndex(0);
                  setScore(0);
                  setCombo(1);
                  setTotalTime(0);
                  setHintsUsed(0);
                }}
                className="w-full py-3.5 rounded-xl font-bold font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-black bg-[var(--neon-green)] hover:opacity-90 transition-opacity cursor-pointer shadow-[0_0_20px_rgba(0,255,136,0.3)]"
              >
                Play Again ↺
              </button>
              <Link
                href="/scramble"
                className="block w-full py-3 rounded-xl font-semibold font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white/80 border border-white/15 transition-all text-center"
              >
                Change Category / Difficulty
              </Link>
              <Link
                href="/"
                className="block text-xs font-[family-name:var(--font-mono)] text-white/40 hover:text-white transition-colors"
              >
                Back to Arcade Hub
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
