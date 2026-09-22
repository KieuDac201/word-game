"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Difficulty } from "@/lib/core/types";
import type { ScrambleConfig } from "../types";
import { ROUND_OPTIONS } from "../config";
import { useCategorySelection, findCategory } from "@/lib/hooks/use-categories";
import { session } from "../session";
import { routes } from "../definition";
import { CategoryPicker } from "@/components/game/category-picker";

export default function ScrambleSetupPage() {
  const router = useRouter();

  // State
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [roundCount, setRoundCount] = useState<number>(5);
  const [hintsEnabled, setHintsEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const {
    categories,
    status: dbStatus,
    selected: category,
    setSelected: setCategory,
  } = useCategorySelection();

  const handleStartGame = () => {
    const selected = findCategory(categories, category);
    const config: ScrambleConfig = {
      categorySlug: selected.slug || selected.key,
      categoryName: selected.label,
      difficulty,
      roundCount,
      hintsEnabled,
      soundEnabled,
    };

    session.saveConfig(config);
    router.push(routes.play);
  };

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-white flex flex-col items-center relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[var(--neon-cyan)]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[10%] w-[500px] h-[300px] bg-[var(--neon-purple)]/8 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-4xl px-6 py-6 flex items-center justify-between z-10 border-b border-white/5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-[family-name:var(--font-mono)] text-white/60 hover:text-[var(--neon-cyan)] transition-colors"
        >
          <span>←</span> Arcade Hub
        </Link>
        <div className="flex items-center gap-2 text-xs font-[family-name:var(--font-mono)] text-white/50">
          <span
            className={`w-2 h-2 rounded-full ${
              dbStatus === "connected"
                ? "bg-[var(--neon-green)] shadow-[0_0_8px_var(--neon-green)]"
                : dbStatus === "loading"
                  ? "bg-[var(--neon-yellow)] animate-pulse"
                  : "bg-white/30"
            }`}
          />
          <span>Neon DB: {dbStatus === "connected" ? "Live" : dbStatus}</span>
        </div>
      </header>

      {/* Main Setup Container */}
      <main className="w-full max-w-2xl px-6 py-10 flex flex-col gap-8 z-10 animate-fade-in">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--neon-purple)]/10 text-[var(--neon-purple)] border border-[var(--neon-purple)]/30 text-xs font-[family-name:var(--font-mono)]">
            <span>🚊</span> Scrambled Sentence Rail
          </div>
          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight font-[family-name:var(--font-mono)]"
            style={{
              background:
                "linear-gradient(135deg, #ffffff 0%, var(--neon-purple) 50%, var(--neon-cyan) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            TRAIN ASSEMBLY DEPOT
          </h1>
          <p className="text-xs sm:text-sm text-white/50 max-w-md mx-auto">
            Reorder scrambled word carriages along magnetic rail tracks. Drag
            and drop or click to dock tokens into grammatical harmony.
          </p>
        </div>

        {/* Configuration Card */}
        <div className="glass-card p-6 sm:p-8 space-y-7 border border-white/10 shadow-2xl">
          {/* Section 1: Category Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2 font-[family-name:var(--font-mono)]">
              1. Vocabulary Category
            </label>

            <CategoryPicker
              categories={categories}
              value={category}
              onChange={setCategory}
            />
          </div>

          {/* Section 2: Difficulty Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2 font-[family-name:var(--font-mono)]">
              2. Sentence Length & Complexity
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: "easy" as Difficulty,
                  label: "Easy",
                  words: "3–5 Words",
                  desc: "Quick sprints & basic grammar",
                  color: "var(--neon-green)",
                },
                {
                  id: "normal" as Difficulty,
                  label: "Normal",
                  words: "6–10 Words",
                  desc: "Standard clauses & idioms",
                  color: "var(--neon-cyan)",
                },
                {
                  id: "hard" as Difficulty,
                  label: "Hard",
                  words: "11–20 Words",
                  desc: "Complex academic structures",
                  color: "var(--neon-pink)",
                },
              ].map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setDifficulty(tier.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    difficulty === tier.id
                      ? "bg-white/10 border-[var(--neon-cyan)] shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                      : "bg-[var(--surface-1)] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div
                    className="text-xs font-bold font-[family-name:var(--font-mono)] mb-0.5"
                    style={{ color: tier.color }}
                  >
                    {tier.label}
                  </div>
                  <div className="text-[11px] text-white/80 font-medium">
                    {tier.words}
                  </div>
                  <div className="text-[10px] text-white/40 mt-1 line-clamp-1">
                    {tier.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Challenge Length */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2 font-[family-name:var(--font-mono)]">
              3. Track Rounds
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {ROUND_OPTIONS.map((r) => (
                <button
                  key={r.count}
                  type="button"
                  onClick={() => setRoundCount(r.count)}
                  className={`py-2.5 px-2 rounded-lg border text-center transition-all ${
                    roundCount === r.count
                      ? "bg-[var(--neon-purple)]/20 border-[var(--neon-purple)] text-white shadow-[0_0_12px_rgba(180,77,255,0.2)]"
                      : "bg-[var(--surface-1)] border-white/10 text-white/60 hover:text-white hover:border-white/20"
                  }`}
                >
                  <div className="text-xs font-bold">{r.label}</div>
                  <div className="text-[10px] text-white/40">{r.tag}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Game Assistance & Audio */}
          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hintsEnabled}
                onChange={(e) => setHintsEnabled(e.target.checked)}
                className="rounded bg-[var(--surface-1)] border-white/20 text-[var(--neon-cyan)] focus:ring-0"
              />
              <span className="text-white/80">Enable Magnet Hint (🧲)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="rounded bg-[var(--surface-1)] border-white/20 text-[var(--neon-cyan)] focus:ring-0"
              />
              <span className="text-white/80">
                Sound Effects (Synthesized Audio)
              </span>
            </label>
          </div>

          {/* Launch Button */}
          <button
            type="button"
            onClick={handleStartGame}
            className="w-full py-4 rounded-xl font-bold font-[family-name:var(--font-mono)] text-sm uppercase tracking-wider text-black bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-purple)] to-[var(--neon-pink)] hover:opacity-90 transition-opacity shadow-[0_0_25px_rgba(0,240,255,0.3)] cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Launch Rail Challenge</span>
            <span>🚀</span>
          </button>
        </div>
      </main>
    </div>
  );
}
