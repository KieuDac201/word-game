"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { playUIClick } from "@/lib/core/audio";
import { session } from "../session";
import { routes } from "../definition";
import type { GameResultPayload } from "../types";

export default function WordChainResultScreen() {
  const router = useRouter();

  const [result] = useState<GameResultPayload | null>(() => {
    return session.loadResult();
  });

  const [config] = useState(() => {
    return session.loadConfig();
  });

  if (!result) {
    return (
      <div className="min-h-screen bg-[var(--surface-0)] text-white flex flex-col items-center justify-center p-6 space-y-4">
        <p className="text-white/60">No recent match result found.</p>
        <NeonButton onClick={() => router.push(routes.setup)}>
          Go to Arena Setup
        </NeonButton>
      </div>
    );
  }

  const isPlayer1Winner = result.winner === "player1";
  const isMeWinner =
    (config?.mode === "online-guest" && !isPlayer1Winner) ||
    (config?.mode !== "online-guest" && isPlayer1Winner);

  const handleRematch = () => {
    playUIClick();
    router.push(routes.setup);
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--surface-0)] text-white flex flex-col items-center relative overflow-x-hidden touch-manipulation">
      {/* Background ambient lighting */}
      <div
        className={`absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-3xl pointer-events-none ${
          isMeWinner ? "bg-[var(--neon-green)]/15" : "bg-red-500/15"
        }`}
      />

      {/* Top Header */}
      <header className="w-full max-w-4xl px-4 py-4 sm:px-6 sm:py-6 flex items-center justify-between z-10 border-b border-white/5 shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-white/60 hover:text-[var(--neon-yellow)] transition-colors py-1"
        >
          <span>←</span> Arcade Hub
        </Link>
        <div className="text-xs font-mono text-white/50">
          Match Duration: {result.matchDurationSeconds}s
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10 flex flex-col items-center z-10 space-y-6 sm:space-y-8">
        {/* Victory / Defeat Title */}
        <div className="text-center space-y-2 sm:space-y-3">
          <div className="text-5xl sm:text-6xl animate-bounce">
            {isMeWinner ? "🏆" : "💀"}
          </div>
          <h1
            className={`text-3xl sm:text-5xl font-black tracking-tight ${
              isMeWinner ? "text-[var(--neon-yellow)]" : "text-red-400"
            }`}
          >
            {isMeWinner ? "VICTORY!" : "DEFEAT"}
          </h1>
          <p className="text-xs sm:text-base text-white/70">
            {isMeWinner
              ? `${result.winnerName} conquered the arena!`
              : `${result.winnerName} was the last player standing.`}
          </p>
        </div>

        {/* Head-to-Head Stats Comparison */}
        <GlassCard className="w-full p-4 sm:p-6 space-y-4 sm:space-y-6">
          <h3 className="text-xs font-mono uppercase tracking-widest text-white/50 text-center">
            Match Head-to-Head
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Player 1 Stats */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl border flex flex-col space-y-2.5 sm:space-y-3 ${
                isPlayer1Winner
                  ? "border-[var(--neon-yellow)] bg-[var(--neon-yellow)]/5"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white truncate max-w-[160px]">
                  {result.p1Stats.name}
                </span>
                {isPlayer1Winner && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--neon-yellow)]/20 text-[var(--neon-yellow)] font-semibold shrink-0">
                    WINNER
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs font-mono text-white/70">
                <div className="flex justify-between">
                  <span>Words Chained:</span>
                  <span className="text-white font-bold">
                    {result.p1Stats.words}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Longest Word:</span>
                  <span className="text-[var(--neon-cyan)] font-bold uppercase truncate ml-2">
                    {result.p1Stats.longestWord}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Hearts Left:</span>
                  <span>{"❤️".repeat(result.p1Stats.heartsRemaining) || "0"}</span>
                </div>
              </div>
            </div>

            {/* Player 2 Stats */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl border flex flex-col space-y-2.5 sm:space-y-3 ${
                !isPlayer1Winner
                  ? "border-[var(--neon-yellow)] bg-[var(--neon-yellow)]/5"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white truncate max-w-[160px]">
                  {result.p2Stats.name}
                </span>
                {!isPlayer1Winner && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--neon-yellow)]/20 text-[var(--neon-yellow)] font-semibold shrink-0">
                    WINNER
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs font-mono text-white/70">
                <div className="flex justify-between">
                  <span>Words Chained:</span>
                  <span className="text-white font-bold">
                    {result.p2Stats.words}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Longest Word:</span>
                  <span className="text-[var(--neon-cyan)] font-bold uppercase truncate ml-2">
                    {result.p2Stats.longestWord}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Hearts Left:</span>
                  <span>{"❤️".repeat(result.p2Stats.heartsRemaining) || "0"}</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Full Word Chain History Review */}
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-white/50">
            <span>Vocabulary Chain Breakdown ({result.chain.length} words)</span>
            <span className="hidden sm:inline">Educational Review</span>
          </div>

          <div className="space-y-2 max-h-60 sm:max-h-72 overflow-y-auto pr-1">
            {result.chain.map((c, i) => (
              <div
                key={c.id || i}
                className="p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 sm:gap-4"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm sm:text-base font-bold uppercase tracking-wider text-white truncate">
                      {c.word}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-white/60 shrink-0 truncate max-w-[100px]">
                      {c.playedByName}
                    </span>
                  </div>
                  {c.translationVi ? (
                    <div className="text-[11px] sm:text-xs text-[var(--neon-green)] line-clamp-1 flex items-center gap-1.5 font-medium">
                      <span className="text-[9px] sm:text-[10px] opacity-70 font-mono">VN:</span>
                      <span>{c.translationVi}</span>
                    </div>
                  ) : c.definition ? (
                    <div className="text-[11px] sm:text-xs text-white/60 italic line-clamp-1">
                      {c.definition}
                    </div>
                  ) : null}
                </div>

                <div className="text-right text-[10px] sm:text-xs font-mono text-white/40 shrink-0">
                  {c.word.length}L
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
          <NeonButton onClick={handleRematch} className="w-full sm:flex-1 py-3.5 sm:py-4 font-bold text-sm sm:text-base">
            ⚔️ Play Again / Rematch
          </NeonButton>
          <Link
            href="/"
            className="w-full sm:flex-1 py-3.5 sm:py-4 font-bold rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-center transition-all flex items-center justify-center text-sm active:scale-95"
          >
            Arcade Hub
          </Link>
        </div>
      </main>
    </div>
  );
}
