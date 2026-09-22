'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ScrambleConfig } from '../page';
import type { ScrambleCompletionData, ScrambleSentenceHistoryItem } from '../completion/page';
import {
  playKeypressClick,
  playMistypeThud,
  playWordComplete,
  playSentenceDestroy,
  playVictory,
  setEnabled as setAudioEnabled,
} from '@/lib/audio-engine';

interface WordToken {
  id: string;
  text: string;
  originalIndex: number;
  depotIndex: number;
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

  const [sentences, setSentences] = useState<{ id: string; text: string; translationVi?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedHistory, setCompletedHistory] = useState<ScrambleSentenceHistoryItem[]>([]);

  // Active Sentence State
  const [allTokens, setAllTokens] = useState<WordToken[]>([]);
  const [depotSlots, setDepotSlots] = useState<(WordToken | null)[]>([]);
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
  const [isPaused] = useState(false);
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
        const rawList = data.items || data.sentences || [];
        const normalized: { id: string; text: string; translationVi?: string }[] = rawList.map((item: any, idx: number) => {
          if (typeof item === 'string') {
            return { id: `sen-${idx}`, text: item, translationVi: undefined };
          }
          return {
            id: String(item.id || `sen-${idx}`),
            text: item.text,
            translationVi: item.translationVi || item.translation_vi || undefined,
          };
        });

        if (normalized.length > 0) {
          // Shuffle sentences so every game feels fresh
          const shuffled = [...normalized].sort(() => Math.random() - 0.5);
          const finalCount =
            loadedConfig.roundCount > 0
              ? Math.min(loadedConfig.roundCount, shuffled.length)
              : shuffled.length;
          setSentences(shuffled.slice(0, finalCount));
        } else {
          setSentences([
            { id: 'fb-1', text: 'Practice makes perfect.' },
            { id: 'fb-2', text: 'Knowledge is power.' },
            { id: 'fb-3', text: 'Time flies like an arrow.' },
            { id: 'fb-4', text: 'Actions speak louder than words.' },
            { id: 'fb-5', text: 'The journey begins with a step.' },
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

  // Setup current sentence with fixed depot slots
  const initSentence = useCallback(
    (sentenceObj: { id: string; text: string } | string) => {
      const rawText = (typeof sentenceObj === 'string' ? sentenceObj : sentenceObj?.text || '').trim();

      // Split into words
      const words = rawText.split(/\s+/).filter(Boolean);
      const tokens: WordToken[] = words.map((word, i) => ({
        id: `token-${i}-${Math.random().toString(36).substr(2, 5)}`,
        text: word,
        originalIndex: i,
        depotIndex: i,
      }));

      // Scramble order
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

      // Assign fixed depotIndex to match their initial position in Depot
      scrambled.forEach((tok, idx) => {
        tok.depotIndex = idx;
      });

      setAllTokens(tokens);
      setDepotSlots(scrambled);
      setRailSlots(new Array(tokens.length).fill(null));
      setValidationState('idle');
      setSentenceTime(0);
    },
    []
  );

  // Initialize first or next sentence ONLY when currentIndex or sentences change
  useEffect(() => {
    if (sentences.length > 0 && currentIndex < sentences.length) {
      initSentence(sentences[currentIndex]);
    }
  }, [sentences, currentIndex, initSentence]);

  // Handle game completion when all sentences are completed
  useEffect(() => {
    if (sentences.length > 0 && currentIndex >= sentences.length && !isCompleted) {
      setIsCompleted(true);
      playVictory();

      try {
        const completionData: ScrambleCompletionData = {
          config,
          stats: {
            score,
            maxCombo,
            totalTime,
            hintsUsed,
            sentencesCompleted: sentences.length,
          },
          sentences: completedHistory,
        };
        sessionStorage.setItem('scramble-completion', JSON.stringify(completionData));
      } catch (err) {
        console.error('Failed to save scramble-completion:', err);
      }
    }
  }, [sentences.length, currentIndex, isCompleted, config, score, maxCombo, totalTime, hintsUsed, completedHistory]);

  // ─────────────────────────────────────────────────────────────
  // Interaction Handlers (Click-to-dock & Drag-and-drop)
  // ─────────────────────────────────────────────────────────────

  // Click on word in Depot -> moves to first available rail slot, keeps slot in Depot as placeholder
  const handleDepotWordClick = (token: WordToken, depotIndex: number) => {
    if (validationState === 'success') return;
    const firstEmpty = railSlots.findIndex((s) => s === null);
    if (firstEmpty === -1) return; // Rail is full

    playKeypressClick();
    const newRail = [...railSlots];
    newRail[firstEmpty] = token;
    setRailSlots(newRail);

    // Keep placeholder in depot so other words stay in their exact positions!
    const newDepot = [...depotSlots];
    newDepot[depotIndex] = null;
    setDepotSlots(newDepot);

    setValidationState('idle');
  };

  // Click on word in Rail -> returns to its original position in Depot
  const handleRailWordClick = (slotIndex: number) => {
    if (validationState === 'success') return;
    const token = railSlots[slotIndex];
    if (!token) return;

    playKeypressClick();
    const newRail = [...railSlots];
    newRail[slotIndex] = null;
    setRailSlots(newRail);

    const newDepot = [...depotSlots];
    if (newDepot[token.depotIndex] === null) {
      newDepot[token.depotIndex] = token;
    } else {
      const firstEmpty = newDepot.findIndex((s) => s === null);
      if (firstEmpty !== -1) {
        newDepot[firstEmpty] = token;
      } else {
        newDepot.push(token);
      }
    }
    setDepotSlots(newDepot);
    setValidationState('idle');
  };

  // Clear all rail slots back to their depot positions
  const handleClearRail = () => {
    if (validationState === 'success') return;
    const placedTokens = railSlots.filter((t): t is WordToken => t !== null);
    if (placedTokens.length === 0) return;

    playKeypressClick();
    const newDepot = [...depotSlots];
    for (const token of placedTokens) {
      if (token.depotIndex < newDepot.length) {
        newDepot[token.depotIndex] = token;
      }
    }

    setRailSlots(new Array(allTokens.length).fill(null));
    setDepotSlots(newDepot);
    setValidationState('idle');
  };

  // Magnet Hint: place the next correct word
  const handleMagnetHint = () => {
    if (!config.hintsEnabled || validationState === 'success') return;

    let targetSlot = -1;
    for (let i = 0; i < railSlots.length; i++) {
      if (railSlots[i] === null || railSlots[i]?.originalIndex !== i) {
        targetSlot = i;
        break;
      }
    }

    if (targetSlot === -1) return; // Already completely correct!

    const correctToken = allTokens.find((t) => t.originalIndex === targetSlot);
    if (!correctToken) return;

    playWordComplete();
    setHintsUsed((h) => h + 1);
    setCombo(1);

    const displacedWord = railSlots[targetSlot];
    const newDepot = [...depotSlots];

    // Remove correct token from its depot slot if present
    const inDepotIdx = newDepot.findIndex((t) => t?.id === correctToken.id);
    if (inDepotIdx !== -1) {
      newDepot[inDepotIdx] = null;
    }

    // If displaced word existed, return to its depot index
    if (displacedWord) {
      if (displacedWord.depotIndex < newDepot.length) {
        newDepot[displacedWord.depotIndex] = displacedWord;
      }
    }

    const newRail = railSlots.map((tok, idx) => {
      if (idx === targetSlot) return correctToken;
      if (tok && tok.id === correctToken.id) return null;
      return tok;
    });

    setDepotSlots(newDepot);
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
    const newDepot = [...depotSlots];

    if (source === 'depot') {
      newRail[targetSlotIndex] = token;
      newDepot[sourceIndex] = null;
      if (existingInTarget) {
        newDepot[existingInTarget.depotIndex] = existingInTarget;
      }
      setDepotSlots(newDepot);
      setRailSlots(newRail);
    } else {
      newRail[sourceIndex] = existingInTarget;
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

      const newDepot = [...depotSlots];
      if (newDepot[token.depotIndex] === null) {
        newDepot[token.depotIndex] = token;
      } else {
        const firstEmpty = newDepot.findIndex((s) => s === null);
        if (firstEmpty !== -1) newDepot[firstEmpty] = token;
        else newDepot.push(token);
      }
      setDepotSlots(newDepot);
    }

    setDraggingPayload(null);
    setValidationState('idle');
  };

  const sentenceTimeRef = useRef(sentenceTime);
  sentenceTimeRef.current = sentenceTime;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const sentencesRef = useRef(sentences);
  sentencesRef.current = sentences;
  const comboRef = useRef(combo);
  comboRef.current = combo;

  // ─────────────────────────────────────────────────────────────
  // Verification & Train Launch
  // ─────────────────────────────────────────────────────────────

  const verifySentence = useCallback(() => {
    if (railSlots.includes(null)) {
      playMistypeThud();
      setValidationState('error');
      setTimeout(() => setValidationState('idle'), 600);
      return;
    }

    const isMatched = railSlots.every((tok, idx) => tok?.originalIndex === idx);

    if (isMatched) {
      playSentenceDestroy();
      setValidationState('success');

      const currentSentenceTime = sentenceTimeRef.current;
      const currentCombo = comboRef.current;
      const basePoints = 200;
      const wordBonus = allTokens.length * 20;
      const speedBonus = Math.max(0, 150 - currentSentenceTime * 8);
      const points = Math.round((basePoints + wordBonus + speedBonus) * currentCombo);

      setScore((s) => s + points);
      setCombo((c) => {
        const next = Math.min(5, c + 0.5);
        setMaxCombo((m) => Math.max(m, next));
        return next;
      });

      // Record to completion history
      const currentIdx = currentIndexRef.current;
      const currentSen = sentencesRef.current[currentIdx];
      if (currentSen) {
        setCompletedHistory((prev) => [
          ...prev,
          {
            id: currentSen.id,
            text: currentSen.text,
            translationVi: currentSen.translationVi || null,
            timeSeconds: currentSentenceTime,
            wordCount: allTokens.length,
          },
        ]);
      }

      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
      }, 900);
    } else {
      playMistypeThud();
      setValidationState('error');
      setCombo(1);
      setTimeout(() => setValidationState('idle'), 600);
    }
  }, [railSlots, allTokens.length]);

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

  const placedCount = railSlots.filter(Boolean).length;

  // Loading Screen
  if (loading) {
    return (
      <div className="h-[100dvh] bg-[var(--surface-0)] text-white flex flex-col items-center justify-center">
        <div className="text-4xl animate-bounce mb-3">🚊</div>
        <div className="text-xs font-[family-name:var(--font-mono)] text-white/60 animate-pulse">
          Loading {config.categoryName} Rail Tracks...
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[var(--surface-0)] text-white flex flex-col justify-between p-2 sm:p-4 relative overflow-hidden select-none">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[180px] bg-[var(--neon-cyan)]/5 rounded-full blur-3xl pointer-events-none" />

      {/* ─── Top Compact HUD ─────────────────────────────────── */}
      <header className="w-full max-w-4xl mx-auto px-2 py-1.5 flex items-center justify-between border-b border-white/10 shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/scramble"
            className="text-xs font-[family-name:var(--font-mono)] text-white/50 hover:text-white transition-colors flex items-center gap-1 py-1 pr-1"
          >
            <span>←</span> Exit
          </Link>
          <div className="h-3 w-[1px] bg-white/15" />
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🚊</span>
            <span className="text-[11px] font-bold font-[family-name:var(--font-mono)] text-[var(--neon-cyan)] uppercase tracking-wider hidden sm:inline">
              {config.categoryName}
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/10 text-white/60 font-[family-name:var(--font-mono)]">
              {config.difficulty.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-3 sm:gap-6 font-[family-name:var(--font-mono)] text-center">
          <div>
            <div className="text-[9px] text-white/40 uppercase leading-none">Train</div>
            <div className="text-xs sm:text-sm font-bold text-white">
              {currentIndex + 1}
              {config.roundCount > 0 && (
                <span className="text-white/40 text-[10px] font-normal">/{config.roundCount}</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-[9px] text-white/40 uppercase leading-none">Score</div>
            <div className="text-xs sm:text-sm font-bold text-[var(--neon-yellow)]">
              {score.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-[9px] text-white/40 uppercase leading-none">Streak</div>
            <div
              className={`text-xs sm:text-sm font-bold ${
                combo > 1 ? 'text-[var(--neon-pink)]' : 'text-white/70'
              }`}
            >
              x{combo.toFixed(1)}
            </div>
          </div>

          <div>
            <div className="text-[9px] text-white/40 uppercase leading-none">Time</div>
            <div className="text-xs sm:text-sm font-bold text-white/90">
              {formatTime(totalTime)}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content Area (No Scroll, Flexible Layout) ──── */}
      <main className="flex-1 w-full max-w-4xl mx-auto flex flex-col justify-between min-h-0 py-2 sm:py-3 z-10">
        
        {/* ─── THE MAGNETIC RAIL TRACK ─── */}
        <div
          className={`flex-1 flex flex-col justify-center items-center relative p-3 sm:p-5 rounded-2xl bg-[var(--surface-1)]/80 border border-[var(--neon-cyan)]/25 shadow-inner transition-all min-h-0 overflow-hidden ${
            validationState === 'success'
              ? 'rail-success-glow'
              : validationState === 'error'
              ? 'rail-error-shake'
              : ''
          }`}
        >
          {/* Subtle rail track lines */}
          <div className="rail-track-lines opacity-40" />

          {/* Rail Header Tag */}
          <div className="absolute top-2.5 left-3 text-[10px] font-[family-name:var(--font-mono)] text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--neon-cyan)] animate-ping" />
            <span>Magnetic Rail ({placedCount}/{allTokens.length})</span>
          </div>

          {/* Slots along the rail */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 z-10 max-h-full overflow-y-auto py-4 px-1 w-full">
            {railSlots.map((slotWord, idx) => (
              <div
                key={`slot-${idx}`}
                onDragOver={(e) => handleDragOverSlot(e, idx)}
                onDragLeave={() => setDragOverSlotIndex(null)}
                onDrop={(e) => handleDropOnSlot(e, idx)}
                className={`rail-slot px-2.5 py-1.5 sm:px-3 sm:py-2 min-h-[44px] sm:min-h-[48px] min-w-[65px] sm:min-w-[76px] ${
                  dragOverSlotIndex === idx ? 'drag-over' : ''
                }`}
              >
                {slotWord ? (
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, slotWord, 'rail', idx)}
                    onClick={() => handleRailWordClick(idx)}
                    className="rail-carriage px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--neon-cyan)]/60 text-white font-semibold text-xs sm:text-sm shadow-md hover:border-[var(--neon-pink)] flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95 transition-transform"
                  >
                    <span>{slotWord.text}</span>
                    <span className="text-[10px] text-white/30 hover:text-white">✕</span>
                  </div>
                ) : (
                  <span className="text-[10px] font-[family-name:var(--font-mono)] text-white/20 select-none">
                    #{idx + 1}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Success Overlay Banner */}
          {validationState === 'success' && (
            <div className="absolute inset-0 bg-[var(--neon-green)]/15 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-20 animate-scale-in">
              <div className="text-center">
                <span className="text-2xl sm:text-3xl">⚡</span>
                <div className="text-base sm:text-lg font-extrabold font-[family-name:var(--font-mono)] text-[var(--neon-green)] tracking-wider">
                  TRAIN COUPLED! +{(200 * combo).toFixed(0)} PTS
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── CONTROLS TOOLBAR ─── */}
        <div className="flex items-center justify-between gap-2 py-1.5 my-1 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleClearRail}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-[family-name:var(--font-mono)] text-white/70 hover:text-white transition-all flex items-center gap-1"
            >
              <span>↺ Clear</span>
            </button>
            {config.hintsEnabled && (
              <button
                type="button"
                onClick={handleMagnetHint}
                className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-[var(--neon-purple)]/15 hover:bg-[var(--neon-purple)]/25 border border-[var(--neon-purple)]/40 text-xs font-[family-name:var(--font-mono)] text-[var(--neon-purple)] transition-all flex items-center gap-1"
              >
                <span>🧲 Hint</span>
                {hintsUsed > 0 && (
                  <span className="text-[9px] px-1 rounded-full bg-[var(--neon-purple)]/30 text-white">
                    {hintsUsed}
                  </span>
                )}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={verifySentence}
            className="px-4 py-2 sm:px-5 sm:py-2 rounded-xl font-bold font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-black bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-green)] hover:opacity-90 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] cursor-pointer flex items-center gap-1.5"
          >
            <span>Launch Train</span>
            <span>🚀</span>
          </button>
        </div>

        {/* ─── THE DEPOT YARD (Fixed Placeholder Positions) ─── */}
        <div
          onDragOver={handleDragOverDepot}
          onDragLeave={() => setIsDepotDragOver(false)}
          onDrop={handleDropOnDepot}
          className={`p-3 sm:p-4 rounded-2xl bg-[var(--surface-1)] border transition-all shrink-0 ${
            isDepotDragOver
              ? 'border-[var(--neon-purple)] bg-[var(--neon-purple)]/10 shadow-[0_0_20px_rgba(180,77,255,0.2)]'
              : 'border-white/10'
          }`}
        >
          <div className="text-[10px] font-[family-name:var(--font-mono)] text-white/40 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Scramble Depot ({depotSlots.filter(Boolean).length} left)</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 min-h-[48px]">
            {depotSlots.map((token, idx) => {
              if (!token) {
                // Fixed placeholder: keeps exact slot size so words never jump!
                const ghostText = allTokens.find((t) => t.depotIndex === idx)?.text || '···';
                return (
                  <div
                    key={`depot-slot-empty-${idx}`}
                    className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-transparent select-none text-xs sm:text-sm font-medium opacity-20 pointer-events-none"
                  >
                    {ghostText}
                  </div>
                );
              }

              return (
                <div
                  key={token.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, token, 'depot', idx)}
                  onClick={() => handleDepotWordClick(token, idx)}
                  className="rail-carriage px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[var(--surface-2)] border border-white/20 text-white font-medium text-xs sm:text-sm hover:border-[var(--neon-cyan)] shadow-md active:scale-95 cursor-pointer touch-manipulation transition-transform"
                >
                  {token.text}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ─── GAME OVER / VICTORY MODAL ─── */}
      {isCompleted && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card max-w-sm w-full p-6 text-center space-y-4 border border-[var(--neon-green)]/40 shadow-[0_0_50px_rgba(0,255,136,0.2)]">
            <div className="w-14 h-14 rounded-2xl bg-[var(--neon-green)]/15 border border-[var(--neon-green)]/40 flex items-center justify-center text-2xl mx-auto">
              🏆
            </div>

            <div>
              <h2
                className="text-xl font-extrabold font-[family-name:var(--font-mono)]"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, var(--neon-green) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                RAILWAY COMPLETE!
              </h2>
              <p className="text-[11px] text-white/50 mt-0.5">
                Completed {config.categoryName} ({config.difficulty.toUpperCase()}).
              </p>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 gap-2 py-1 font-[family-name:var(--font-mono)] text-left">
              <div className="p-2.5 rounded-xl bg-[var(--surface-1)] border border-white/10">
                <div className="text-[9px] text-white/40 uppercase">Total Score</div>
                <div className="text-base font-bold text-[var(--neon-yellow)]">
                  {score.toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--surface-1)] border border-white/10">
                <div className="text-[9px] text-white/40 uppercase">Total Time</div>
                <div className="text-base font-bold text-white">
                  {formatTime(totalTime)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--surface-1)] border border-white/10">
                <div className="text-[9px] text-white/40 uppercase">Max Streak</div>
                <div className="text-base font-bold text-[var(--neon-pink)]">
                  x{maxCombo.toFixed(1)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--surface-1)] border border-white/10">
                <div className="text-[9px] text-white/40 uppercase">Hints Used</div>
                <div className="text-base font-bold text-white/80">
                  {hintsUsed}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => router.push('/scramble/completion')}
                className="w-full py-3 rounded-xl font-bold font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-black bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-green)] hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center justify-center gap-1.5"
              >
                <span>📜 Review All Sentences & Translations</span>
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCompleted(false);
                    setCurrentIndex(0);
                    setScore(0);
                    setCombo(1);
                    setTotalTime(0);
                    setHintsUsed(0);
                    setCompletedHistory([]);
                  }}
                  className="flex-1 py-2.5 rounded-xl font-bold font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-white bg-white/10 hover:bg-white/15 border border-white/20 active:scale-95 transition-all cursor-pointer"
                >
                  Play Again ↺
                </button>
                <Link
                  href="/scramble"
                  className="flex-1 py-2.5 rounded-xl font-semibold font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white/80 border border-white/15 transition-all text-center flex items-center justify-center"
                >
                  Change Setup
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
