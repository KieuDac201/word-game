"use client";

import { useCategories } from "@/lib/hooks/use-categories";
import { GameCard } from "@/components/game/game-card";
import { GAMES } from "@/games/registry";

export default function HomePage() {
  const { categories, status } = useCategories();

  const totalSentences = categories.reduce(
    (sum, category) => sum + (category.sentenceCount ?? 0),
    0,
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--neon-cyan)]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[var(--neon-purple)]/5 rounded-full blur-3xl pointer-events-none" />

      <header className="w-full border-b border-white/5 bg-[var(--surface-1)]/40 backdrop-blur-md px-6 py-4 relative z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-1.5 rounded-lg bg-white/5 border border-white/10">
              🎮
            </span>
            <span className="font-extrabold text-base tracking-wider font-[family-name:var(--font-mono)]">
              ENGLISH GAME HUB
            </span>
          </div>

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
            <span>
              {status === "connected" ? "Neon DB Live" : `Neon DB ${status}`}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 relative z-10">
        <div className="text-center mb-12">
          <h1
            className="text-4xl md:text-6xl font-extrabold tracking-tight font-[family-name:var(--font-mono)]"
            style={{
              background:
                "linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            PRACTICE ENGLISH
          </h1>
          <p className="text-white/50 mt-4 max-w-xl mx-auto">
            Pick a game and train a different skill. Every game draws from the
            same sentence library with Vietnamese translations.
          </p>

          <div className="flex items-center justify-center gap-6 mt-6 text-xs font-[family-name:var(--font-mono)] text-white/40">
            <span>
              <span className="text-[var(--neon-cyan)] font-bold">
                {GAMES.length}
              </span>{" "}
              games
            </span>
            <span className="opacity-30">•</span>
            <span>
              <span className="text-[var(--neon-cyan)] font-bold">
                {categories.length}
              </span>{" "}
              categories
            </span>
            {totalSentences > 0 && (
              <>
                <span className="opacity-30">•</span>
                <span>
                  <span className="text-[var(--neon-cyan)] font-bold">
                    {totalSentences.toLocaleString()}
                  </span>{" "}
                  sentences
                </span>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </main>
    </div>
  );
}
