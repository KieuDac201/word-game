'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { GameConfig, GameState, GameOverStats, Particle } from '@/lib/types';
import {
  createInitialState,
  trySpawnSentence,
  updatePhysics,
  updateTargeting,
  handleKeystroke,
  handleSentenceDrop,
  cleanupSentences,
  updateTelemetry,
  checkVictory,
} from '@/lib/game-engine';
import {
  DANGER_LINE_OFFSET_PX,
  LOCAL_STORAGE_HIGH_SCORE_KEY,
  HUD_UPDATE_INTERVAL_MS,
} from '@/lib/constants';
import {
  setVolume,
  setEnabled,
  playKeypressClick,
  playMistypeThud,
  playWordComplete,
  playSentenceDestroy,
  playSentenceDrop,
  playGameStart,
  playGameOver,
  playVictory,
} from '@/lib/audio-engine';
import { getTopMistypedKeys } from '@/lib/scoring';

// ═══════════════════════════════════════════════════════════════
// PLAY PAGE — Game Arena
// ═══════════════════════════════════════════════════════════════

export default function PlayPage() {
  const router = useRouter();

  // ─── Config from sessionStorage ────────────────────────────
  const [config] = useState<GameConfig | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem('game-config');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!config) {
      router.replace('/');
    }
  }, [config, router]);

  if (!config) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-white/30 font-[family-name:var(--font-mono)]">Loading...</div>
      </div>
    );
  }

  return <GameArena config={config} />;
}

// ═══════════════════════════════════════════════════════════════
// GAME ARENA COMPONENT
// ═══════════════════════════════════════════════════════════════

function GameArena({ config }: { config: GameConfig }) {
  const router = useRouter();
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const sentenceContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  if (stateRef.current == null) {
    stateRef.current = createInitialState(config);
  }
  const animFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const lastHudUpdateRef = useRef<number>(0);
  const lastSentenceUpdateRef = useRef<number>(0);
  const gameLoopRef = useRef<((timestamp: number) => void) | null>(null);
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // UI state (re-rendered at throttled rate)
  const [hudData, setHudData] = useState({
    wpm: 0,
    accuracy: 100,
    score: 0,
    combo: 1,
    lives: config.lives,
  });
  const [sentences, setSentences] = useState<GameState['activeSentences']>([]);
  const [gamePhase, setGamePhase] = useState<GameState['phase']>('playing');
  const [gameOverStats, setGameOverStats] = useState<GameOverStats | null>(null);
  const [shaking, setShaking] = useState(false);
  const [errorFlash, setErrorFlash] = useState<string | null>(null);
  const [pauseCountdown, setPauseCountdown] = useState<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // ─── Audio Setup ───────────────────────────────────────────
  useEffect(() => {
    setEnabled(config.soundEnabled);
    setVolume(config.soundVolume);
    playGameStart();
  }, [config.soundEnabled, config.soundVolume]);

  // ─── Particle System ──────────────────────────────────────
  const spawnParticles = useCallback(
    (x: number, y: number, count: number, color: string, type: 'explosion' | 'impact') => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = type === 'explosion' ? 80 + Math.random() * 120 : 40 + Math.random() * 80;
        newParticles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (type === 'explosion' ? 50 : 0),
          life: 1,
          maxLife: 0.6 + Math.random() * 0.4,
          size: type === 'explosion' ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
          color,
          type,
          opacity: 1,
        });
      }
      particlesRef.current = [...particlesRef.current, ...newParticles];
    },
    []
  );

  // ─── Particle Canvas Rendering ─────────────────────────────
  const renderParticles = useCallback((deltaMs: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match container
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const deltaSec = deltaMs / 1000;
    const alive: Particle[] = [];

    for (const p of particlesRef.current) {
      const nextX = p.x + p.vx * deltaSec;
      const nextVy = p.vy + 200 * deltaSec; // gravity
      const nextY = p.y + nextVy * deltaSec;
      const nextLife = p.life - deltaSec / p.maxLife;
      const opacity = Math.max(0, nextLife);

      if (nextLife > 0) {
        ctx.globalAlpha = opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(nextX, nextY, p.size * nextLife, 0, Math.PI * 2);
        ctx.fill();
        alive.push({
          ...p,
          x: nextX,
          y: nextY,
          vy: nextVy,
          life: nextLife,
          opacity,
        });
      }
    }

    ctx.globalAlpha = 1;
    particlesRef.current = alive;
  }, []);

  // ─── Get danger line Y position ────────────────────────────
  const getDangerY = useCallback(() => {
    if (!gameAreaRef.current) return 500;
    return gameAreaRef.current.clientHeight - DANGER_LINE_OFFSET_PX;
  }, []);

  // ─── Get lane center X position in canvas coordinates ───────
  const getLaneCenterX = useCallback((lane: number) => {
    const container = sentenceContainerRef.current;
    const area = gameAreaRef.current;
    if (!container || !area) return 0;
    const containerRect = container.getBoundingClientRect();
    const areaRect = area.getBoundingClientRect();
    const laneWidth = containerRect.width / 3;
    const offsetLeft = containerRect.left - areaRect.left;
    return offsetLeft + lane * laneWidth + laneWidth / 2;
  }, []);

  // ─── End Game ──────────────────────────────────────────────
  const endGame = useCallback(
    (isVictory: boolean) => {
      const state = stateRef.current;
      if (!state) return;
      state.phase = isVictory ? 'victory' : 'gameover';
      setGamePhase(state.phase);
      cancelAnimationFrame(animFrameRef.current);

      if (isVictory) {
        playVictory();
      } else {
        playGameOver();
      }

      // Persist high score
      const prevHigh = Number(
        localStorage.getItem(LOCAL_STORAGE_HIGH_SCORE_KEY) || '0'
      );
      const highScore = Math.max(prevHigh, state.score);
      localStorage.setItem(LOCAL_STORAGE_HIGH_SCORE_KEY, String(highScore));

      const stats: GameOverStats = {
        finalScore: state.score,
        highScore,
        averageWpm: state.currentWpm,
        peakWpm: state.peakWpm,
        accuracy: state.accuracy,
        combo: state.combo,
        maxCombo: state.maxCombo,
        sentencesCompleted: state.sentencesCompleted,
        sentencesDropped: state.sentencesDropped,
        wordsCompleted: state.wordsCompleted,
        totalKeystrokes: state.totalKeystrokes,
        correctKeystrokes: state.correctKeystrokes,
        elapsedTime: state.elapsedTime,
        mistypedKeys: getTopMistypedKeys(state.mistypedKeys),
        isVictory,
      };
      setGameOverStats(stats);
    },
    []
  );

  // ─── Resume with countdown ─────────────────────────────────
  const resumeWithCountdown = useCallback(() => {
    let count = 3;
    setPauseCountdown(count);

    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        setPauseCountdown(null);
        if (stateRef.current) {
          stateRef.current.phase = 'playing';
        }
        setGamePhase('playing');
        lastFrameTimeRef.current = 0;
        if (gameLoopRef.current) {
          animFrameRef.current = requestAnimationFrame(gameLoopRef.current);
        }
      } else {
        setPauseCountdown(count);
      }
    }, 800);
  }, []);

  // ─── Start Game Loop (runs ONCE on mount) ─────────────────
  useEffect(() => {
    const loop = (timestamp: number) => {
      const state = stateRef.current;
      if (!state || state.phase !== 'playing') return;

      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = timestamp;
      }

      const deltaMs = Math.min(timestamp - lastFrameTimeRef.current, 50); // Cap at 50ms
      lastFrameTimeRef.current = timestamp;

      const dangerY = getDangerY();
      const now = performance.now();
      const cfg = configRef.current;

      // Spawn
      trySpawnSentence(state, cfg, now);

      // Physics
      const droppedIds = updatePhysics(state, cfg, deltaMs, dangerY);

      // Handle drops
      for (const id of droppedIds) {
        const sentence = state.activeSentences.find((s) => s.id === id);
        if (sentence) {
          const isGameOver = handleSentenceDrop(state);
          playSentenceDrop();

          // Impact particles
          const x = getLaneCenterX(sentence.lane);
          spawnParticles(x, dangerY, 15, 'var(--neon-red)', 'impact');

          // Screen shake
          setShaking(true);
          setTimeout(() => setShaking(false), 400);

          if (isGameOver) {
            endGame(false);
            return;
          }
        }
      }

      // Cleanup
      cleanupSentences(state);

      // Targeting
      updateTargeting(state);

      // Victory check
      if (checkVictory(state, cfg)) {
        endGame(true);
        return;
      }

      // Telemetry
      updateTelemetry(state, now);

      // Render particles
      renderParticles(deltaMs);

      // ── Direct DOM position updates every frame (smooth 60fps) ──
      if (sentenceContainerRef.current) {
        const children = sentenceContainerRef.current.children;
        for (let i = 0; i < children.length; i++) {
          const el = children[i] as HTMLElement;
          const id = el.dataset.sentenceId;
          if (!id) continue;
          const s = state.activeSentences.find((s) => s.id === id);
          if (s && !s.dropped) {
            el.style.transform = `translateY(${s.y}px)`;
          }
        }
      }

      // Throttled HUD update (stats only)
      if (now - lastHudUpdateRef.current > HUD_UPDATE_INTERVAL_MS) {
        lastHudUpdateRef.current = now;
        setHudData({
          wpm: state.currentWpm,
          accuracy: state.accuracy,
          score: state.score,
          combo: state.combo,
          lives: state.lives,
        });
      }

      // Throttled sentence structure update (spawns, word state, removals)
      // Update more frequently than HUD (every 50ms) for responsive typing feedback
      if (now - lastSentenceUpdateRef.current > 50) {
        lastSentenceUpdateRef.current = now;
        setSentences(
          state.activeSentences
            .filter((s) => !s.dropped)
            .map((s) => ({
              ...s,
              words: s.words.map((w) => ({ ...w })),
            }))
        );
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = loop;
    lastFrameTimeRef.current = 0;
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [endGame, getDangerY, getLaneCenterX, renderParticles, spawnParticles]);

  // ─── Keystroke Handler ─────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const state = stateRef.current;
      if (!state) return;

      // Pause/Resume (Escape key only)
      if (e.key === 'Escape') {
        if (state.phase === 'playing') {
          e.preventDefault();
          state.phase = 'paused';
          setGamePhase('paused');
          cancelAnimationFrame(animFrameRef.current);
          return;
        }
        if (state.phase === 'paused') {
          e.preventDefault();
          resumeWithCountdown();
          return;
        }
        return;
      }

      if (state.phase !== 'playing') return;

      // Ignore modifier keys, function keys, etc.
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.key.length > 1 && e.key !== ' '
      ) {
        return;
      }

      e.preventDefault();

      const result = handleKeystroke(state, config, e.key, performance.now());

      if (result.correct) {
        playKeypressClick();

        if (result.sentenceCompleted) {
          playSentenceDestroy();
          // Explosion particles
          const target = state.activeSentences.find(
            (s) => s.id === result.targetSentenceId
          );
          if (target) {
            const x = getLaneCenterX(target.lane);
            spawnParticles(x, target.y, 25, '#00ff88', 'explosion');
          }
        } else if (result.wordCompleted) {
          playWordComplete();
        }
      } else {
        playMistypeThud();
        if (result.targetSentenceId) {
          setErrorFlash(result.targetSentenceId);
          setTimeout(() => setErrorFlash(null), 300);
        }
      }

      // Immediate UI update on keystroke for responsiveness
      const now = performance.now();
      updateTelemetry(state, now);
      setHudData({
        wpm: state.currentWpm,
        accuracy: state.accuracy,
        score: state.score,
        combo: state.combo,
        lives: state.lives,
      });
      setSentences(
        state.activeSentences
          .filter((s) => !s.dropped)
          .map((s) => ({
            ...s,
            words: s.words.map((w) => ({ ...w })),
          }))
      );
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [config, spawnParticles, resumeWithCountdown, getLaneCenterX]);

  // ─── Play Again ────────────────────────────────────────────
  const handlePlayAgain = useCallback(() => {
    stateRef.current = createInitialState(config);
    lastFrameTimeRef.current = 0;
    setGameOverStats(null);
    setGamePhase('playing');
    setHudData({
      wpm: 0,
      accuracy: 100,
      score: 0,
      combo: 1,
      lives: config.lives,
    });
    setSentences([]);
    particlesRef.current = [];
    playGameStart();
    animFrameRef.current = requestAnimationFrame(gameLoopRef.current!);
  }, [config]);

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* HUD Bar */}
      <div className="hud-bar flex-shrink-0">
        <div className="hud-stat">
          <span className="hud-stat-label">WPM</span>
          <span className="hud-stat-value">{hudData.wpm}</span>
        </div>
        <div className="hud-stat">
          <span className="hud-stat-label">Accuracy</span>
          <span className="hud-stat-value">{hudData.accuracy}%</span>
        </div>
        <div className="hud-stat">
          <span className="hud-stat-label">Score</span>
          <span className="hud-stat-value">{hudData.score.toLocaleString()}</span>
        </div>
        <div className="hud-stat">
          <span className="hud-stat-label">Combo</span>
          <span className="hud-stat-value combo">×{hudData.combo}</span>
        </div>
        <div className="flex-1" />
        <div className="hud-stat">
          <span className="hud-stat-label">Lives</span>
          <span className="hud-stat-value lives">
            {Array(hudData.lives).fill('❤️').join('')}
            {hudData.lives === 0 && '💀'}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => {
              const state = stateRef.current;
              if (state && state.phase === 'playing') {
                state.phase = 'paused';
                setGamePhase('paused');
                cancelAnimationFrame(animFrameRef.current);
              }
            }}
            className="px-3 py-1.5 text-xs rounded-md bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10 transition-all font-[family-name:var(--font-mono)]"
            title="Pause (Esc)"
          >
            ⏸ Pause
          </button>
          <button
            onClick={() => {
              cancelAnimationFrame(animFrameRef.current);
              router.push('/');
            }}
            className="px-3 py-1.5 text-xs rounded-md bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10 transition-all font-[family-name:var(--font-mono)]"
            title="Exit to Setup"
          >
            ✕ Exit
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        className={`flex-1 relative overflow-hidden ${shaking ? 'animate-shake' : ''}`}
      >
        {/* Particle Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />

        {/* Centered Lane Tracks */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] pointer-events-none px-4 grid grid-cols-3">
          <div className="border-x border-white/[0.04] bg-white/[0.01] h-full" />
          <div className="border-r border-white/[0.04] bg-white/[0.01] h-full" />
          <div className="border-r border-white/[0.04] bg-white/[0.01] h-full" />
        </div>

        {/* Sentence Container — centered and positions updated via direct DOM manipulation */}
        <div
          ref={sentenceContainerRef}
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] pointer-events-none px-4"
        >

        {/* Falling Sentences */}
        {sentences.map((sentence) => {
          return (
            <div
              key={sentence.id}
              data-sentence-id={sentence.id}
              className={`sentence-block ${sentence.isTargeted ? 'targeted' : ''} ${
                errorFlash === sentence.id ? 'animate-error-flash' : ''
              } ${sentence.completed ? 'animate-dissolve' : ''}`}
              style={{
                top: 0,
                left: `calc(${(sentence.lane / 3) * 100}% + 8px)`,
                maxWidth: 'calc(33.333% - 16px)',
                width: 'calc(33.333% - 16px)',
                whiteSpace: 'normal',
                lineHeight: '1.6',
                transform: `translateY(${sentence.y}px)`,
                willChange: 'transform',
              }}
            >
              {sentence.words.map((word, wIdx) => {
                const isTargeted = sentence.isTargeted;
                const isCurrentWord = wIdx === sentence.activeWordIndex && isTargeted;
                const isLastWord = wIdx === sentence.words.length - 1;
                const waitingForSpace = isCurrentWord && word.charIndex >= word.clean.length && !isLastWord;

                return (
                  <span key={wIdx} className="inline-block">
                    {word.completed ? (
                      <span className="word-completed">{word.raw}</span>
                    ) : isCurrentWord ? (
                      <>
                        {word.clean.split('').map((char, cIdx) => {
                          let cls = 'char-pending';
                          if (cIdx < word.charIndex) cls = 'char-correct';
                          else if (cIdx === word.charIndex) cls = 'char-current';
                          return (
                            <span key={cIdx} className={cls}>
                              {char}
                            </span>
                          );
                        })}
                        {word.raw.length > word.clean.length && (
                          <span className={word.completed ? 'char-correct' : 'char-pending'}>
                            {word.raw.slice(word.clean.length)}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="char-pending">{word.raw}</span>
                    )}
                    {!isLastWord && (
                      <span
                        className={
                          word.completed
                            ? 'char-correct'
                            : waitingForSpace
                            ? 'char-current font-bold'
                            : 'char-pending'
                        }
                      >
                        {waitingForSpace ? '␣' : '\u00A0'}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          );
        })}
        </div>

        {/* Danger Line */}
        <div
          className="danger-line"
          style={{ bottom: `${DANGER_LINE_OFFSET_PX}px` }}
        />
        <div
          className="danger-zone"
          style={{ height: `${DANGER_LINE_OFFSET_PX}px` }}
        />
      </div>

      {/* ─── Pause Overlay ────────────────────────────────── */}
      {gamePhase === 'paused' && (
        <div className="overlay-backdrop">
          <div className="glass-card p-10 text-center animate-pop-in max-w-sm">
            {pauseCountdown !== null ? (
              <div
                key={pauseCountdown}
                className="text-7xl font-bold font-[family-name:var(--font-mono)] animate-countdown"
                style={{ color: 'var(--neon-cyan)' }}
              >
                {pauseCountdown}
              </div>
            ) : (
              <>
                <div className="text-5xl mb-4">⏸</div>
                <h2 className="text-2xl font-bold font-[family-name:var(--font-mono)] mb-6">
                  PAUSED
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={resumeWithCountdown}
                    className="neon-button w-full"
                  >
                    <span>▶ Resume</span>
                  </button>
                  <button
                    onClick={() => {
                      cancelAnimationFrame(animFrameRef.current);
                      router.push('/');
                    }}
                    className="w-full py-3 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-all font-[family-name:var(--font-mono)] text-sm"
                  >
                    Exit to Setup
                  </button>
                </div>
                <p className="text-xs text-white/30 mt-4">
                  Press Esc to resume
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── Game Over Modal ──────────────────────────────── */}
      {(gamePhase === 'gameover' || gamePhase === 'victory') &&
        gameOverStats && (
          <div className="overlay-backdrop">
            <div className="glass-card p-8 max-w-lg w-full mx-4 animate-pop-in">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">
                  {gameOverStats.isVictory ? '🏆' : '💀'}
                </div>
                <h2
                  className="text-3xl font-extrabold font-[family-name:var(--font-mono)]"
                  style={{
                    background: gameOverStats.isVictory
                      ? 'linear-gradient(135deg, var(--neon-green), var(--neon-cyan))'
                      : 'linear-gradient(135deg, var(--neon-pink), var(--neon-red))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {gameOverStats.isVictory ? 'VICTORY!' : 'GAME OVER'}
                </h2>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <StatCard
                  label="Final Score"
                  value={gameOverStats.finalScore.toLocaleString()}
                  accent="cyan"
                />
                <StatCard
                  label="High Score"
                  value={gameOverStats.highScore.toLocaleString()}
                  accent={
                    gameOverStats.finalScore >= gameOverStats.highScore
                      ? 'yellow'
                      : 'white'
                  }
                  badge={
                    gameOverStats.finalScore >= gameOverStats.highScore
                      ? '🎉 NEW!'
                      : undefined
                  }
                />
                <StatCard
                  label="Max Combo"
                  value={`×${gameOverStats.maxCombo}`}
                  accent="yellow"
                />
                <StatCard
                  label="Avg WPM"
                  value={String(gameOverStats.averageWpm)}
                  accent="green"
                />
                <StatCard
                  label="Peak WPM"
                  value={String(gameOverStats.peakWpm)}
                  accent="green"
                />
                <StatCard
                  label="Accuracy"
                  value={`${gameOverStats.accuracy}%`}
                  accent="purple"
                />
                <StatCard
                  label="Sentences"
                  value={String(gameOverStats.sentencesCompleted)}
                  accent="cyan"
                />
                <StatCard
                  label="Words"
                  value={String(gameOverStats.wordsCompleted)}
                  accent="cyan"
                />
                <StatCard
                  label="Time"
                  value={formatTime(gameOverStats.elapsedTime)}
                  accent="white"
                />
              </div>

              {/* Mistyped Keys */}
              {gameOverStats.mistypedKeys.length > 0 && (
                <div className="mb-6 p-4 bg-white/5 rounded-lg">
                  <h3 className="text-xs text-white/40 uppercase tracking-wider mb-2 font-[family-name:var(--font-mono)]">
                    Most Mistyped Keys
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {gameOverStats.mistypedKeys.map(([key, count]) => (
                      <span
                        key={key}
                        className="px-3 py-1.5 rounded-md bg-[var(--neon-red)]/10 text-[var(--neon-red)] text-sm font-[family-name:var(--font-mono)] border border-[var(--neon-red)]/20"
                      >
                        {key === ' ' ? 'Space' : key} ×{count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handlePlayAgain}
                  className="neon-button flex-1"
                >
                  <span>🔄 Play Again</span>
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="flex-1 py-3 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80 transition-all font-[family-name:var(--font-mono)] text-sm font-semibold"
                >
                  ⬅ Back to Setup
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
  badge,
}: {
  label: string;
  value: string;
  accent: string;
  badge?: string;
}) {
  const colorMap: Record<string, string> = {
    cyan: 'var(--neon-cyan)',
    pink: 'var(--neon-pink)',
    green: 'var(--neon-green)',
    yellow: 'var(--neon-yellow)',
    purple: 'var(--neon-purple)',
    red: 'var(--neon-red)',
    white: 'rgba(255,255,255,0.8)',
  };

  return (
    <div className="p-3 rounded-lg bg-white/5 text-center">
      <div className="text-[0.6rem] text-white/40 uppercase tracking-wider mb-1 font-[family-name:var(--font-mono)]">
        {label}
      </div>
      <div
        className="text-lg font-bold font-[family-name:var(--font-mono)]"
        style={{ color: colorMap[accent] || colorMap.white }}
      >
        {value}
      </div>
      {badge && (
        <div className="text-[0.6rem] text-[var(--neon-yellow)] mt-1">
          {badge}
        </div>
      )}
    </div>
  );
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
