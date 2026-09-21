'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type {
  Difficulty,
  SpeedPreset,
  SentenceSource,
  LibraryCategory,
  GameConfig,
} from '@/lib/types';
import {
  DIFFICULTY_CONFIGS,
  SPEED_CONFIGS,
  LIBRARY_CATEGORIES,
  DEFAULT_LIVES,
  LIVES_OPTIONS,
} from '@/lib/constants';
import {
  parseCustomText,
  validateCustomPool,
  buildSentencePool,
} from '@/lib/sentence-pool';
import { playUIClick } from '@/lib/audio-engine';

// ─── Sub-components inline for simplicity ────────────────────

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold flex items-center gap-2 font-[family-name:var(--font-mono)]">
        <span className="text-xl">{icon}</span>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-white/40 mt-1 ml-8">{subtitle}</p>
      )}
    </div>
  );
}

// ─── Main Setup Page Component ──────────────────────────────

export default function SetupPage() {
  const router = useRouter();

  // State
  const [source, setSource] = useState<SentenceSource>('library');
  const [category, setCategory] = useState<LibraryCategory>('casual');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [speedPreset, setSpeedPreset] = useState<SpeedPreset>('standard');
  const [customSpeedPPS, setCustomSpeedPPS] = useState(40);
  const [lives, setLives] = useState(DEFAULT_LIVES);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [customText, setCustomText] = useState('');

  // Parse custom text
  const parsedCustom = useMemo(() => parseCustomText(customText), [customText]);
  const customValidation = useMemo(
    () => validateCustomPool(parsedCustom),
    [parsedCustom]
  );

  // Build final pool preview
  const sentencePool = useMemo(() => {
    if (source === 'custom') return parsedCustom;
    return buildSentencePool(source, category, difficulty, []);
  }, [source, category, difficulty, parsedCustom]);

  const canStart =
    source === 'library' ? sentencePool.length >= 5 : customValidation.valid;

  // Handle start
  function handleStart() {
    playUIClick();
    const config: GameConfig = {
      source,
      libraryCategory: category,
      difficulty,
      speedPreset,
      customSpeedPPS,
      lives,
      soundEnabled,
      soundVolume,
      sentences: source === 'custom' ? parsedCustom : sentencePool,
      isCustomSource: source === 'custom',
    };

    // Store config in sessionStorage for the play page
    sessionStorage.setItem('game-config', JSON.stringify(config));
    router.push('/play');
  }

  return (
    <>
      {/* Mobile notice */}
      <div className="desktop-only-notice fixed inset-0 bg-[var(--surface-0)] z-50 flex-col items-center justify-center text-center p-8 hidden">
        <span className="text-5xl mb-4">⌨️</span>
        <h2 className="text-xl font-bold mb-2">Desktop Recommended</h2>
        <p className="text-white/50 max-w-sm">
          This typing game is best experienced on a desktop with a physical
          keyboard. Please visit on a larger screen for the full arcade
          experience.
        </p>
      </div>

      {/* Main content */}
      <div className="game-content flex-1 flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
        {/* Background grid effect */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Header */}
        <div className="relative text-center mb-10 animate-slide-up">
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight font-[family-name:var(--font-mono)]"
            style={{
              background:
                'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            FALLING SENTENCES
          </h1>
          <p className="text-white/40 mt-2 text-sm tracking-widest uppercase font-[family-name:var(--font-mono)]">
            Arcade Typing Practice
          </p>
        </div>

        {/* Config Panel */}
        <div className="relative w-full max-w-3xl space-y-6 animate-fade-in">
          {/* ── Sentence Source ───────────────────────────── */}
          <div className="glass-card p-6">
            <SectionTitle
              icon="📝"
              title="Sentence Source"
              subtitle="Choose your text pool"
            />

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-5">
              {(['library', 'custom'] as SentenceSource[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSource(s);
                    playUIClick();
                  }}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold font-[family-name:var(--font-mono)] transition-all ${
                    source === s
                      ? 'bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/40'
                      : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10 hover:text-white/70'
                  }`}
                >
                  {s === 'library' ? '📚 Library' : '✏️ Custom'}
                </button>
              ))}
            </div>

            {source === 'library' ? (
              <div className="grid grid-cols-2 gap-3">
                {LIBRARY_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => {
                      setCategory(cat.key);
                      playUIClick();
                    }}
                    className={`glass-card p-4 text-left transition-all cursor-pointer ${
                      category === cat.key ? 'glass-card-active' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{cat.icon}</span>
                      <span className="font-semibold text-sm">{cat.label}</span>
                    </div>
                    <p className="text-xs text-white/40">{cat.description}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Paste your sentences here, one per line..."
                  className="w-full h-40 bg-white/5 border border-white/10 rounded-lg p-4 text-sm font-[family-name:var(--font-mono)] text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-[var(--neon-cyan)]/50 transition-colors"
                />
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span
                    className={
                      customValidation.valid
                        ? 'text-[var(--neon-green)]'
                        : 'text-[var(--neon-red)]'
                    }
                  >
                    {customValidation.valid
                      ? `✓ ${customValidation.count} sentences ready`
                      : customValidation.error}
                  </span>
                  <span className="text-white/30">
                    Max 20 words per sentence
                  </span>
                </div>
              </div>
            )}

            {source === 'library' && (
              <div className="mt-3 text-xs text-white/30 font-[family-name:var(--font-mono)]">
                {sentencePool.length} sentences available for{' '}
                {DIFFICULTY_CONFIGS[difficulty].label} difficulty
              </div>
            )}
          </div>

          {/* ── Difficulty ────────────────────────────────── */}
          <div className="glass-card p-6">
            <SectionTitle
              icon="🎯"
              title="Difficulty"
              subtitle="Controls sentence length and spawn pacing"
            />
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(DIFFICULTY_CONFIGS) as [Difficulty, typeof DIFFICULTY_CONFIGS.easy][]).map(
                ([key, config]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setDifficulty(key);
                      // Auto-set speed preset based on difficulty
                      setSpeedPreset('standard');
                      playUIClick();
                    }}
                    className={`glass-card p-4 text-center transition-all cursor-pointer ${
                      difficulty === key ? 'glass-card-active' : ''
                    }`}
                  >
                    <div className="text-lg mb-1">
                      {key === 'easy' ? '🟢' : key === 'normal' ? '🟡' : '🔴'}
                    </div>
                    <div className="font-bold text-sm">{config.label}</div>
                    <div className="text-xs text-white/40 mt-1">
                      {config.wordCountRange[0]}–{config.wordCountRange[1]} words
                    </div>
                  </button>
                )
              )}
            </div>
          </div>

          {/* ── Speed + Options Row ───────────────────────── */}
          <div className="grid grid-cols-2 gap-6">
            {/* Speed */}
            <div className="glass-card p-6">
              <SectionTitle icon="⚡" title="Fall Speed" />
              <div className="space-y-2">
                {(
                  Object.entries(SPEED_CONFIGS) as [SpeedPreset, typeof SPEED_CONFIGS.standard][]
                )
                  .filter(([key]) => key !== 'custom')
                  .map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSpeedPreset(key);
                        playUIClick();
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg text-sm text-left font-[family-name:var(--font-mono)] transition-all ${
                        speedPreset === key
                          ? 'bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/40'
                          : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'
                      }`}
                    >
                      {config.label}{' '}
                      <span className="text-white/30 text-xs">
                        ×{config.multiplier}
                      </span>
                    </button>
                  ))}
                {/* Custom speed */}
                <div
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-[family-name:var(--font-mono)] transition-all ${
                    speedPreset === 'custom'
                      ? 'bg-[var(--neon-cyan)]/15 border border-[var(--neon-cyan)]/40'
                      : 'bg-white/5 border border-transparent'
                  }`}
                >
                  <button
                    onClick={() => {
                      setSpeedPreset('custom');
                      playUIClick();
                    }}
                    className={`text-left w-full ${
                      speedPreset === 'custom'
                        ? 'text-[var(--neon-cyan)]'
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    Custom
                  </button>
                  {speedPreset === 'custom' && (
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="range"
                        min={10}
                        max={120}
                        step={5}
                        value={customSpeedPPS}
                        onChange={(e) =>
                          setCustomSpeedPPS(Number(e.target.value))
                        }
                        className="flex-1 accent-[var(--neon-cyan)]"
                      />
                      <span className="text-xs text-[var(--neon-cyan)] w-16 text-right">
                        {customSpeedPPS} px/s
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="glass-card p-6">
              <SectionTitle icon="⚙️" title="Options" />

              {/* Lives */}
              <div className="mb-5">
                <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                  Starting Lives
                </label>
                <div className="flex gap-2">
                  {LIVES_OPTIONS.map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        setLives(l);
                        playUIClick();
                      }}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold font-[family-name:var(--font-mono)] transition-all ${
                        lives === l
                          ? 'bg-[var(--neon-pink)]/15 text-[var(--neon-pink)] border border-[var(--neon-pink)]/40'
                          : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'
                      }`}
                    >
                      {l === 1 ? '💀 1' : `❤️ ${l}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-white/40 uppercase tracking-wider">
                    Sound FX
                  </label>
                  <button
                    onClick={() => {
                      setSoundEnabled(!soundEnabled);
                      playUIClick();
                    }}
                    className={`text-lg transition-all ${
                      soundEnabled ? '' : 'opacity-40'
                    }`}
                  >
                    {soundEnabled ? '🔊' : '🔇'}
                  </button>
                </div>
                {soundEnabled && (
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={soundVolume}
                    onChange={(e) => setSoundVolume(Number(e.target.value))}
                    className="w-full accent-[var(--neon-purple)]"
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── Start Button ──────────────────────────────── */}
          <div className="flex justify-center pt-4 pb-8">
            <button
              onClick={handleStart}
              disabled={!canStart}
              className="neon-button text-lg px-12 py-4"
            >
              <span>🚀 Start Game</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
