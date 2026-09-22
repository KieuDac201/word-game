"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Difficulty } from "@/lib/core/types";
import type { SentenceSource, GameConfig } from "../types";
import {
  DIFFICULTY_CONFIGS,
  SPEED_CONFIGS,
  DEFAULT_LIVES,
  LIVES_OPTIONS,
  type SpeedPreset,
} from "../config";
import { parseCustomText, validateCustomPool } from "@/lib/core/text";
import { buildSentencePool } from "@/lib/data/sentence-pool";
import { playUIClick } from "@/lib/core/audio";
import { useCategorySelection } from "@/lib/hooks/use-categories";
import { useSentenceLibrary } from "@/lib/hooks/use-sentence-library";
import { session } from "../session";
import { routes } from "../definition";
import { CategoryPicker } from "@/components/game/category-picker";
import { SectionTitle } from "@/components/ui/section-title";
import { NeonButton } from "@/components/ui/neon-button";

// ─── Main Word Game Setup Page Component ────────────────────

export default function WordGameSetupPage() {
  const router = useRouter();

  // State
  const [source, setSource] = useState<SentenceSource>("library");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [speedPreset, setSpeedPreset] = useState<SpeedPreset>("standard");
  const [customSpeedPPS, setCustomSpeedPPS] = useState(40);
  const [lives, setLives] = useState(DEFAULT_LIVES);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [customText, setCustomText] = useState("");

  const {
    categories,
    status: dbStatus,
    selected: category,
    setSelected: setCategory,
  } = useCategorySelection();
  const { sentencesByCategory, translations } = useSentenceLibrary();

  // Parse custom text
  const parsedCustom = useMemo(() => parseCustomText(customText), [customText]);
  const customValidation = useMemo(
    () => validateCustomPool(parsedCustom),
    [parsedCustom],
  );

  // Build final pool preview using DB sentences if loaded, else fallback
  const sentencePool = useMemo(() => {
    if (source === "custom") return parsedCustom;
    return buildSentencePool(
      source,
      category,
      difficulty,
      [],
      sentencesByCategory,
    );
  }, [source, category, difficulty, parsedCustom, sentencesByCategory]);

  const canStart =
    source === "library" ? sentencePool.length >= 5 : customValidation.valid;

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
      sentences: source === "custom" ? parsedCustom : sentencePool,
      isCustomSource: source === "custom",
      translations,
    };

    session.saveConfig(config);
    router.push(routes.play);
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
      <div className="game-content flex-1 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Background grid effect */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Top Hub Navigation Bar */}
        <div className="w-full max-w-3xl flex items-center justify-between mb-8 z-10">
          <Link
            href="/"
            onClick={() => playUIClick()}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all font-[family-name:var(--font-mono)] group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            <span>Arcade Hub</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-[family-name:var(--font-mono)] text-white/40">
            <span>Game Mode:</span>
            <span className="text-[var(--neon-cyan)] font-semibold flex items-center gap-1.5">
              <span>⚡</span> Falling Sentences
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="relative text-center mb-8 animate-slide-up">
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight font-[family-name:var(--font-mono)]"
            style={{
              background:
                "linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            FALLING SENTENCES
          </h1>
          <p className="text-white/40 mt-2 text-sm tracking-widest uppercase font-[family-name:var(--font-mono)]">
            Configure Your Typing Arena
          </p>
        </div>

        {/* Config Panel */}
        <div className="relative w-full max-w-3xl space-y-6 animate-fade-in">
          {/* ── Sentence Source ───────────────────────────── */}
          <div className="glass-card p-6 relative z-30">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle
                icon="📝"
                title="Sentence Source"
                subtitle="Choose your text pool"
              />
              {dbStatus === "connected" && (
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--neon-green)]/10 text-[var(--neon-green)] border border-[var(--neon-green)]/30 font-[family-name:var(--font-mono)] flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--neon-green)] animate-pulse" />
                  Neon DB Live
                </span>
              )}
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-5">
              {(["library", "custom"] as SentenceSource[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSource(s);
                    playUIClick();
                  }}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold font-[family-name:var(--font-mono)] transition-all ${
                    source === s
                      ? "bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/40"
                      : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10 hover:text-white/70"
                  }`}
                >
                  {s === "library" ? "📚 Library" : "✏️ Custom"}
                </button>
              ))}
            </div>

            {source === "library" ? (
              <CategoryPicker
                categories={categories}
                value={category}
                onChange={setCategory}
              />
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
                        ? "text-[var(--neon-green)]"
                        : "text-[var(--neon-red)]"
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
          </div>

          {/* ── Difficulty ────────────────────────────────── */}
          <div className="glass-card p-6">
            <SectionTitle
              icon="⚡"
              title="Difficulty"
              subtitle="Sentence length and challenge level"
            />
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(DIFFICULTY_CONFIGS) as Difficulty[]).map((d) => {
                const cfg = DIFFICULTY_CONFIGS[d];
                return (
                  <button
                    key={d}
                    onClick={() => {
                      setDifficulty(d);
                      playUIClick();
                    }}
                    className={`glass-card p-4 text-center transition-all cursor-pointer ${
                      difficulty === d ? "glass-card-active" : ""
                    }`}
                  >
                    <span className="font-bold font-[family-name:var(--font-mono)] block text-base mb-1 capitalize">
                      {cfg.label}
                    </span>
                    <span className="text-xs text-white/40 block mb-2">
                      {cfg.wordCountRange[0]}–{cfg.wordCountRange[1]} words
                    </span>
                    <span className="text-[11px] text-white/30 block">
                      {cfg.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Speed ─────────────────────────────────────── */}
          <div className="glass-card p-6">
            <SectionTitle
              icon="🚀"
              title="Fall Speed"
              subtitle="Control how fast sentences drop"
            />
            <div className="grid grid-cols-4 gap-3 mb-4">
              {(Object.keys(SPEED_CONFIGS) as SpeedPreset[]).map((sp) => {
                const cfg = SPEED_CONFIGS[sp];
                return (
                  <button
                    key={sp}
                    onClick={() => {
                      setSpeedPreset(sp);
                      playUIClick();
                    }}
                    className={`glass-card p-3 text-center transition-all cursor-pointer ${
                      speedPreset === sp ? "glass-card-active" : ""
                    }`}
                  >
                    <span className="font-semibold text-sm font-[family-name:var(--font-mono)] block capitalize">
                      {cfg.label}
                    </span>
                    {sp !== "custom" && (
                      <span className="text-xs text-white/40 block mt-1">
                        {cfg.multiplier}x
                      </span>
                    )}
                    {sp === "custom" && (
                      <span className="text-xs text-white/40 block mt-1">
                        Slider
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Speed Slider */}
            {speedPreset === "custom" && (
              <div className="pt-2">
                <div className="flex justify-between text-xs font-[family-name:var(--font-mono)] text-white/50 mb-2">
                  <span>Slow (20 px/s)</span>
                  <span className="text-[var(--neon-cyan)] font-bold">
                    {customSpeedPPS} px/s
                  </span>
                  <span>Fast (100 px/s)</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={customSpeedPPS}
                  onChange={(e) => setCustomSpeedPPS(Number(e.target.value))}
                  className="w-full accent-[var(--neon-cyan)] cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* ── Lives & Audio ─────────────────────────────── */}
          <div className="grid grid-cols-2 gap-6">
            {/* Lives */}
            <div className="glass-card p-6">
              <SectionTitle icon="❤️" title="Lives" subtitle="Errors allowed" />
              <div className="flex gap-3">
                {LIVES_OPTIONS.map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLives(l);
                      playUIClick();
                    }}
                    className={`flex-1 py-3 rounded-lg font-bold font-[family-name:var(--font-mono)] transition-all ${
                      lives === l
                        ? "bg-[var(--neon-pink)]/20 text-[var(--neon-pink)] border border-[var(--neon-pink)]/40 shadow-sm"
                        : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10"
                    }`}
                  >
                    {l} {l === 1 ? "Life" : "Lives"}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound */}
            <div className="glass-card p-6">
              <SectionTitle
                icon="🔊"
                title="Audio"
                subtitle="Sound effects volume"
              />
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    playUIClick();
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold font-[family-name:var(--font-mono)] transition-all ${
                    soundEnabled
                      ? "bg-[var(--neon-green)]/15 text-[var(--neon-green)] border border-[var(--neon-green)]/30"
                      : "bg-white/5 text-white/30 border border-transparent"
                  }`}
                >
                  {soundEnabled ? "ON" : "OFF"}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={soundEnabled ? soundVolume : 0}
                  disabled={!soundEnabled}
                  onChange={(e) => setSoundVolume(Number(e.target.value))}
                  className="flex-1 accent-[var(--neon-green)] cursor-pointer disabled:opacity-30"
                />
              </div>
            </div>
          </div>

          {/* ── Pool Summary & Start Button ───────────────── */}
          <div className="flex flex-col items-center pt-4 pb-8">
            <p className="text-xs text-white/40 mb-4 font-[family-name:var(--font-mono)]">
              {source === "library"
                ? `Pool: ${sentencePool.length} sentences ready • 3 simultaneous lanes`
                : `Custom: ${parsedCustom.length} sentences ready`}
            </p>

            <NeonButton
              onClick={handleStart}
              disabled={!canStart}
              className={`font-bold text-lg tracking-wider uppercase ${
                !canStart ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              Start Game
            </NeonButton>
          </div>
        </div>
      </div>
    </>
  );
}
