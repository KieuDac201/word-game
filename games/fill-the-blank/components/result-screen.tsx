"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { playUIClick } from "@/lib/core/audio";
import { useTranslations } from "@/lib/hooks/use-translations";
import { StatsGrid } from "@/components/game/stats-grid";
import {
  SentenceReviewList,
  type ReviewItem,
} from "@/components/game/sentence-review-list";
import { NeonButton } from "@/components/ui/neon-button";
import type { FillBlankCompletionData } from "../types";
import { session } from "../session";
import { routes } from "../definition";

export default function ResultScreen() {
  const router = useRouter();

  const [data, setData] = useState<FillBlankCompletionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const translations = useTranslations();
  const { seed } = translations;

  useEffect(() => {
    const parsed = session.loadResult();
    if (parsed) {
      setData(parsed);
      seed(
        Object.fromEntries(
          (parsed.rounds ?? []).map((r) => [r.text, r.translationVi]),
        ),
      );
    }
    setLoading(false);
  }, [seed]);

  const translationMap = translations.translations;

  const reviewItems = useMemo<ReviewItem[]>(() => {
    if (!data?.rounds) return [];
    const query = searchQuery.trim().toLowerCase();

    return data.rounds
      .filter((round) => {
        if (!query) return true;
        const translated =
          translationMap[round.text] || round.translationVi || "";
        return (
          round.text.toLowerCase().includes(query) ||
          translated.toLowerCase().includes(query)
        );
      })
      .map((round, index) => ({
        id: round.id,
        text: round.text,
        translationVi: round.translationVi,
        badge: round.correct
          ? { text: `✓ Round ${index + 1}`, accent: "green" as const }
          : { text: `✕ Round ${index + 1}`, accent: "red" as const },
        meta: round.correct
          ? `${round.answer} • ${round.wordCount} words`
          : `chose "${round.chosen}" → ${round.answer}`,
        tone: round.correct ? ("positive" as const) : ("negative" as const),
      }));
  }, [data?.rounds, searchQuery, translationMap]);

  function handlePlayAgain() {
    playUIClick();
    if (data?.config) {
      session.saveConfig(data.config);
      router.push(routes.play);
    } else {
      router.push(routes.setup);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-white/40 font-[family-name:var(--font-mono)] animate-pulse">
          ⌛ Loading session summary...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[70vh]">
        <div className="glass-card p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🧩</div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-mono)] mb-2">
            No Recent Game Found
          </h2>
          <p className="text-white/50 text-sm mb-6">
            Play a round of Fill the Blank to see your answers and translations.
          </p>
          <NeonButton
            onClick={() => router.push(routes.setup)}
            className="w-full py-3"
          >
            🚀 Start A Game
          </NeonButton>
        </div>
      </div>
    );
  }

  const { stats, config } = data;
  const accuracy =
    stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const minutes = Math.floor(stats.totalTime / 60);
  const seconds = stats.totalTime % 60;

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-8 max-w-5xl w-full mx-auto pb-24">
      <div className="w-full text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-[family-name:var(--font-mono)] text-white/70 mb-3">
          <span>🧩 {config.categoryName?.toUpperCase()}</span>
          <span className="opacity-30">•</span>
          <span>{config.difficulty?.toUpperCase()}</span>
        </div>
        <h1
          className="text-4xl sm:text-5xl font-extrabold font-[family-name:var(--font-mono)] tracking-tight"
          style={{
            background:
              "linear-gradient(135deg, var(--neon-green), var(--neon-cyan))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ROUND COMPLETED
        </h1>
      </div>

      <div className="mb-8 w-full">
        <StatsGrid
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          stats={[
            {
              label: "Score",
              value: stats.score.toLocaleString(),
              accent: "yellow",
            },
            { label: "Accuracy", value: `${accuracy}%`, accent: "green" },
            {
              label: "Correct",
              value: `${stats.correct} / ${stats.total}`,
              accent: "cyan",
            },
            {
              label: "Best Streak",
              value: `🔥 ${stats.maxStreak}`,
              accent: "pink",
            },
          ]}
        />
      </div>

      <SentenceReviewList
        items={reviewItems}
        translations={translations}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        allTexts={data.rounds.map((r) => r.text)}
        toolbarLeft={
          <div className="flex items-center gap-2 text-xs text-white/60 font-[family-name:var(--font-mono)]">
            <span className="w-2 h-2 rounded-full bg-[var(--neon-green)]" />
            <span>
              {stats.total} rounds • {minutes}:
              {seconds.toString().padStart(2, "0")}
            </span>
          </div>
        }
      />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] glass-card p-3 flex items-center gap-3 border border-white/20 backdrop-blur-xl">
        <NeonButton onClick={handlePlayAgain} className="flex-1 py-3 text-sm">
          🔄 Play Again
        </NeonButton>
        <button
          onClick={() => {
            playUIClick();
            router.push(routes.setup);
          }}
          className="flex-1 py-3 rounded-lg bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-all font-[family-name:var(--font-mono)] text-xs sm:text-sm font-semibold cursor-pointer"
        >
          ⚙️ Change Setup
        </button>
        <Link
          href="/"
          onClick={playUIClick}
          className="p-3 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 transition-all text-sm"
          title="Home"
        >
          🏠
        </Link>
      </div>
    </div>
  );
}
