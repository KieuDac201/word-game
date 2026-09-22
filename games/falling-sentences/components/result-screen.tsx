"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { WordGameCompletionData } from "../types";
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

export default function WordGameCompletionPage() {
  const router = useRouter();

  const [data, setData] = useState<WordGameCompletionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "success" | "failed"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  const translations = useTranslations();
  const { seed } = translations;

  useEffect(() => {
    const parsed = session.loadResult();
    if (parsed) {
      setData(parsed);
      seed({
        ...(parsed.config?.translations ?? {}),
        ...Object.fromEntries(
          (parsed.sentences ?? []).map((s) => [s.text, s.translationVi]),
        ),
      });
    }
    setLoading(false);
  }, [seed]);

  const counts = useMemo(() => {
    if (!data?.sentences) return { total: 0, success: 0, failed: 0 };
    const success = data.sentences.filter((s) => s.status === "success").length;
    return {
      total: data.sentences.length,
      success,
      failed: data.sentences.length - success,
    };
  }, [data?.sentences]);

  const translationMap = translations.translations;

  const reviewItems = useMemo<ReviewItem[]>(() => {
    if (!data?.sentences) return [];
    const query = searchQuery.trim().toLowerCase();

    return data.sentences
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (statusFilter !== "all" && item.status !== statusFilter)
          return false;
        if (!query) return true;
        const translated =
          translationMap[item.text] || item.translationVi || "";
        return (
          item.text.toLowerCase().includes(query) ||
          translated.toLowerCase().includes(query)
        );
      })
      .map(({ item, index }) => {
        const isSuccess = item.status === "success";
        return {
          id: item.id,
          text: item.text,
          translationVi: item.translationVi,
          badge: isSuccess
            ? { text: "✓ Completed", accent: "green" as const }
            : { text: "✕ Dropped", accent: "red" as const },
          meta: `#${index + 1} • ${item.wordCount || item.text.split(" ").length} words`,
          tone: isSuccess ? ("positive" as const) : ("negative" as const),
        };
      });
  }, [data?.sentences, statusFilter, searchQuery, translationMap]);

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

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-white/40 font-[family-name:var(--font-mono)] animate-pulse flex items-center gap-3">
          <span className="text-xl">⌛</span> Loading session summary...
        </div>
      </div>
    );
  }

  // Fallback if no game data exists in session
  if (!data || !data.stats) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[70vh]">
        <div className="glass-card p-10 max-w-md w-full border border-white/10 text-center animate-fade-in">
          <div className="text-6xl mb-4">⌨️</div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-mono)] text-white mb-2">
            No Recent Game Found
          </h2>
          <p className="text-white/50 text-sm mb-6">
            Play a round of Falling Sentences to see all completed and dropped
            sentences with their translations!
          </p>
          <button
            onClick={() => router.push(routes.setup)}
            className="neon-button w-full py-3"
          >
            <span>🚀 Start A Game</span>
          </button>
        </div>
      </div>
    );
  }

  const { stats, config } = data;
  const isVictory = stats.isVictory;

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-5xl w-full mx-auto pb-24">
      {/* ─── Hero Completion Header ─── */}
      <div className="w-full text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-[family-name:var(--font-mono)] text-white/70 mb-3">
          <span>🎮 {config.libraryCategory?.toUpperCase() || "PRACTICE"}</span>
          <span className="opacity-30">•</span>
          <span>{config.difficulty?.toUpperCase()}</span>
          <span className="opacity-30">•</span>
          <span>SPEED: {config.speedPreset?.toUpperCase()}</span>
        </div>

        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-4xl">{isVictory ? "🏆" : "💀"}</span>
          <h1
            className="text-4xl sm:text-5xl font-extrabold font-[family-name:var(--font-mono)] tracking-tight"
            style={{
              background: isVictory
                ? "linear-gradient(135deg, var(--neon-green), var(--neon-cyan))"
                : "linear-gradient(135deg, var(--neon-pink), var(--neon-red))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {isVictory ? "VICTORY COMPLETED!" : "ROUND COMPLETED"}
          </h1>
        </div>
        <p className="text-white/60 text-sm font-[family-name:var(--font-mono)]">
          Detailed performance breakdown & sentence translation review
        </p>
      </div>

      {/* ─── Key Stats Grid ─── */}
      <div className="mb-8 w-full">
        <StatsGrid
          stats={[
            {
              label: "Final Score",
              value: stats.finalScore.toLocaleString(),
              accent: "cyan",
            },
            {
              label: "Accuracy",
              value: `${stats.accuracy}%`,
              accent: "purple",
            },
            {
              label: "Avg / Peak WPM",
              value: (
                <>
                  {stats.averageWpm}{" "}
                  <span className="text-xs text-white/40">
                    / {stats.peakWpm}
                  </span>
                </>
              ),
              accent: "green",
            },
            {
              label: "Max Combo",
              value: `×${stats.maxCombo}`,
              accent: "yellow",
            },
            {
              label: "Sentences",
              value: (
                <>
                  <span className="text-[var(--neon-green)]">
                    {counts.success}
                  </span>
                  <span className="text-white/30"> / </span>
                  <span className="text-[var(--neon-red)]">
                    {counts.failed}
                  </span>
                </>
              ),
            },
            { label: "Duration", value: formatTime(stats.elapsedTime) },
          ]}
        />
      </div>

      <SentenceReviewList
        items={reviewItems}
        translations={translations}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        allTexts={data.sentences.map((s) => s.text)}
        toolbarLeft={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {(
              [
                {
                  id: "all",
                  label: "All Sentences",
                  count: counts.total,
                  accent: "white",
                },
                {
                  id: "success",
                  label: "✅ Completed",
                  count: counts.success,
                  accent: "green",
                },
                {
                  id: "failed",
                  label: "❌ Dropped",
                  count: counts.failed,
                  accent: "red",
                },
              ] as const
            ).map((pill) => {
              const isActive = statusFilter === pill.id;
              const activeClass =
                pill.accent === "white"
                  ? "bg-white/20 text-white border border-white/30 shadow-sm"
                  : pill.accent === "green"
                    ? "bg-[var(--neon-green)]/20 text-[var(--neon-green)] border border-[var(--neon-green)]/40 shadow-sm"
                    : "bg-[var(--neon-red)]/20 text-[var(--neon-red)] border border-[var(--neon-red)]/40 shadow-sm";

              return (
                <button
                  key={pill.id}
                  onClick={() => {
                    playUIClick();
                    setStatusFilter(pill.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-[family-name:var(--font-mono)] transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? activeClass
                      : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
                  }`}
                >
                  <span>{pill.label}</span>
                  <span className="px-1.5 rounded-full bg-white/10 text-[0.7rem] text-white/70">
                    {pill.count}
                  </span>
                </button>
              );
            })}
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
              "linear-gradient(135deg, rgba(0, 240, 255, 0.25), rgba(180, 77, 255, 0.25))",
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
          title="Home"
        >
          🏠
        </Link>
      </div>
    </div>
  );
}
