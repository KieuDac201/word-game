"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Difficulty } from "@/lib/core/types";
import { useCategorySelection, findCategory } from "@/lib/hooks/use-categories";
import { playUIClick } from "@/lib/core/audio";
import { CategoryPicker } from "@/components/game/category-picker";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionTitle } from "@/components/ui/section-title";
import { NeonButton } from "@/components/ui/neon-button";
import { DIFFICULTY_WORD_RANGES } from "@/lib/core/constants";
import type { FillBlankConfig } from "../types";
import { ROUND_OPTIONS } from "../config";
import { session } from "../session";
import { definition, routes } from "../definition";

const DIFFICULTIES: { id: Difficulty; label: string; color: string }[] = [
  { id: "easy", label: "Easy", color: "var(--neon-green)" },
  { id: "normal", label: "Normal", color: "var(--neon-cyan)" },
  { id: "hard", label: "Hard", color: "var(--neon-pink)" },
];

export default function SetupScreen() {
  const router = useRouter();

  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [roundCount, setRoundCount] = useState(10);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const {
    categories,
    status,
    selected: category,
    setSelected: setCategory,
  } = useCategorySelection();

  function handleStart() {
    playUIClick();
    const selected = findCategory(categories, category);
    const config: FillBlankConfig = {
      categorySlug: selected.slug || selected.key,
      categoryName: selected.label,
      difficulty,
      roundCount,
      soundEnabled,
    };

    session.saveConfig(config);
    router.push(routes.play);
  }

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        <Link
          href="/"
          onClick={() => playUIClick()}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all font-[family-name:var(--font-mono)]"
        >
          <span>←</span>
          <span>Arcade Hub</span>
        </Link>
        <div className="flex items-center gap-2 text-xs font-[family-name:var(--font-mono)] text-white/40">
          <span
            className={`w-2 h-2 rounded-full ${
              status === "connected"
                ? "bg-[var(--neon-green)]"
                : status === "loading"
                  ? "bg-[var(--neon-yellow)] animate-pulse"
                  : "bg-white/30"
            }`}
          />
          <span>Neon DB: {status === "connected" ? "Live" : status}</span>
        </div>
      </div>

      <div className="text-center mb-8">
        <h1
          className="text-4xl md:text-5xl font-extrabold tracking-tight font-[family-name:var(--font-mono)]"
          style={{
            background:
              "linear-gradient(135deg, var(--neon-green), var(--neon-cyan))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {definition.title.toUpperCase()}
        </h1>
        <p className="text-white/40 mt-2 text-sm tracking-widest uppercase font-[family-name:var(--font-mono)]">
          {definition.tagline}
        </p>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        <GlassCard className="p-6 relative z-30">
          <SectionTitle
            icon="📚"
            title="Category"
            subtitle="Where the sentences come from"
          />
          <CategoryPicker
            categories={categories}
            value={category}
            onChange={setCategory}
          />
        </GlassCard>

        <GlassCard className="p-6">
          <SectionTitle
            icon="⚡"
            title="Difficulty"
            subtitle="Sentence length"
          />
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map((tier) => {
              const [min, max] = DIFFICULTY_WORD_RANGES[tier.id];
              return (
                <button
                  key={tier.id}
                  onClick={() => {
                    setDifficulty(tier.id);
                    playUIClick();
                  }}
                  className={`glass-card p-4 text-center transition-all cursor-pointer ${
                    difficulty === tier.id ? "glass-card-active" : ""
                  }`}
                >
                  <span
                    className="font-bold font-[family-name:var(--font-mono)] block text-base mb-1"
                    style={{ color: tier.color }}
                  >
                    {tier.label}
                  </span>
                  <span className="text-xs text-white/40 block">
                    {min}–{max} words
                  </span>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <SectionTitle
            icon="🎯"
            title="Rounds"
            subtitle="How many sentences to solve"
          />
          <div className="grid grid-cols-3 gap-3">
            {ROUND_OPTIONS.map((option) => (
              <button
                key={option.count}
                onClick={() => {
                  setRoundCount(option.count);
                  playUIClick();
                }}
                className={`py-3 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                  roundCount === option.count
                    ? "bg-[var(--neon-green)]/20 border-[var(--neon-green)] text-white"
                    : "bg-[var(--surface-1)] border-white/10 text-white/60 hover:border-white/20"
                }`}
              >
                <div className="text-xs font-bold">{option.label}</div>
                <div className="text-[10px] text-white/40">{option.tag}</div>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex items-center justify-between">
          <SectionTitle icon="🔊" title="Audio" subtitle="Sound effects" />
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playUIClick();
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold font-[family-name:var(--font-mono)] transition-all cursor-pointer ${
              soundEnabled
                ? "bg-[var(--neon-green)]/15 text-[var(--neon-green)] border border-[var(--neon-green)]/30"
                : "bg-white/5 text-white/30 border border-transparent"
            }`}
          >
            {soundEnabled ? "ON" : "OFF"}
          </button>
        </GlassCard>

        <div className="flex justify-center pt-2 pb-8">
          <NeonButton
            onClick={handleStart}
            className="font-bold text-lg tracking-wider uppercase"
          >
            Start Game
          </NeonButton>
        </div>
      </div>
    </div>
  );
}
