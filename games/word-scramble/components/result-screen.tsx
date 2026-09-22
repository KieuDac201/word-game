"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ScrambleCompletionData } from "../types";
import { playUIClick } from "@/lib/core/audio";
import { session } from "../session";
import { routes } from "../definition";
import { useTranslations } from "@/lib/hooks/use-translations";
import { StatsGrid } from "@/components/game/stats-grid";
import {
  SentenceReviewList,
  type ReviewItem,
} from "@/components/game/sentence-review-list";
import { NeonButton } from "@/components/ui/neon-button";

export default function ScrambleCompletionPage() {
  const router = useRouter();

  const [data, setData] = useState<ScrambleCompletionData | null>(null);
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
          (parsed.sentences ?? []).map((s) => [s.text, s.translationVi]),
        ),
      );
    }
    setLoading(false);
  }, [seed]);

  const translationMap = translations.translations;

  const reviewItems = useMemo<ReviewItem[]>(() => {
    if (!data?.sentences) return [];
    const query = searchQuery.trim().toLowerCase();

    return data.sentences
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (!query) return true;
        const translated =
          translationMap[item.text] || item.translationVi || "";
        return (
          item.text.toLowerCase().includes(query) ||
          translated.toLowerCase().includes(query)
        );
      })
      .map(({ item, index }) => ({
        id: item.id,
        text: item.text,
        translationVi: item.translationVi,
        badge: { text: `✓ Train #${index + 1}`, accent: "green" as const },
        meta: `${item.wordCount || item.text.split(" ").length} words${
          item.timeSeconds > 0 ? ` • ${item.timeSeconds}s` : ""
        }`,
        tone: "positive" as const,
      }));
  }, [data?.sentences, searchQuery, translationMap]);

  // Restart game with current config
  const handlePlayAgain = () => {
    playUIClick();
    if (data?.config) {
      session.saveConfig(data.config);
      router.push(routes.play);
    } else {
      router.push(routes.setup);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-white/40 font-[family-name:var(--font-mono)] animate-pulse flex items-center gap-2">
          <span className="text-xl">🚊</span> Loading Railway Summary...
        </div>
      </div>
    );
  }

  if (!data || !data.stats) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[70vh]">
        <div className="glass-card p-10 max-w-md w-full border border-white/10 text-center animate-fade-in">
          <div className="text-6xl mb-4">🚊</div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-mono)] text-white mb-2">
            No Recent Scramble Game
          </h2>
          <p className="text-white/50 text-sm mb-6">
            Assemble a train of scrambled words along the rail track to see all
            sentences and their translations!
          </p>
          <button
            onClick={() => router.push(routes.setup)}
            className="neon-button w-full py-3"
          >
            <span>🚀 Start Scramble Game</span>
          </button>
        </div>
      </div>
    );
  }

  const { stats, config } = data;

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-5xl w-full mx-auto pb-24">
      {/* ─── Hero Header ─── */}
      <div className="w-full text-center mb-6 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-[family-name:var(--font-mono)] text-white/70 mb-3">
          <span>🚊 {config.categoryName?.toUpperCase()}</span>
          <span className="opacity-30">•</span>
          <span>{config.difficulty?.toUpperCase()}</span>
          <span className="opacity-30">•</span>
          <span>{stats.sentencesCompleted} TRAINS COUPLED</span>
        </div>

        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-4xl">🏆</span>
          <h1
            className="text-4xl sm:text-5xl font-extrabold font-[family-name:var(--font-mono)] tracking-tight"
            style={{
              background:
                "linear-gradient(135deg, var(--neon-cyan), var(--neon-green))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            RAILWAY COMPLETED!
          </h1>
        </div>
        <p className="text-white/60 text-sm font-[family-name:var(--font-mono)]">
          All sentence carriages assembled with full Vietnamese translations
        </p>
      </div>

      {/* ─── Key Stats Grid ─── */}
      <div className="mb-6 w-full">
        <StatsGrid
          className="grid grid-cols-2 sm:grid-cols-5 gap-3"
          stats={[
            {
              label: "Total Score",
              value: stats.score.toLocaleString(),
              accent: "yellow",
            },
            {
              label: "Max Streak",
              value: `x${stats.maxCombo.toFixed(1)}`,
              accent: "pink",
            },
            {
              label: "Trains",
              value: `${stats.sentencesCompleted} / ${data.sentences.length}`,
              accent: "green",
            },
            { label: "Total Time", value: formatTime(stats.totalTime) },
            {
              label: "Hints Used",
              value: stats.hintsUsed,
              className: "col-span-2 sm:col-span-1",
            },
          ]}
        />
      </div>

      <SentenceReviewList
        items={reviewItems}
        translations={translations}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        allTexts={data.sentences.map((s) => s.text)}
        emptyMessage="No sentences matched your search query."
        toolbarLeft={
          <div className="flex items-center gap-2 text-xs text-white/60 font-[family-name:var(--font-mono)]">
            <span className="w-2 h-2 rounded-full bg-[var(--neon-green)]" />
            <span>Completed Sentences ({data.sentences.length})</span>
          </div>
        }
      />

      {/* ─── Bottom Floating Sticky Actions Bar ─── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] glass-card p-3 flex items-center gap-3 border border-white/20 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <NeonButton
          onClick={handlePlayAgain}
          className="flex-1 py-3 text-sm"
          style={{
            background:
              "linear-gradient(135deg, rgba(0, 240, 255, 0.25), rgba(0, 255, 136, 0.25))",
          }}
        >
          🔄 Play Again
        </NeonButton>

        <button
          onClick={() => {
            playUIClick();
            router.push(routes.setup);
          }}
          className="flex-1 py-3 rounded-lg bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white transition-all font-[family-name:var(--font-mono)] text-xs sm:text-sm font-semibold text-center flex items-center justify-center gap-1.5"
        >
          <span>⚙️ Change Setup</span>
        </button>

        <Link
          href="/"
          onClick={playUIClick}
          className="p-3 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-all text-sm flex items-center justify-center"
          title="Arcade Hub"
        >
          🏠
        </Link>
      </div>
    </div>
  );
}
