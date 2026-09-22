"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SentenceRecord } from "@/lib/core/types";
import {
  setEnabled as setAudioEnabled,
  playUIClick,
  playWordComplete,
  playMistypeThud,
  playVictory,
} from "@/lib/core/audio";
import { GlassCard } from "@/components/ui/glass-card";
import type {
  BlankRound,
  FillBlankRoundResult,
  FillBlankCompletionData,
} from "../types";
import {
  POINTS_PER_CORRECT,
  STREAK_BONUS,
  SENTENCE_FETCH_LIMIT,
} from "../config";
import { buildRounds } from "../engine";
import { session } from "../session";
import { routes } from "../definition";

export default function PlayScreen() {
  const router = useRouter();

  const [rounds, setRounds] = useState<BlankRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const historyRef = useRef<FillBlankRoundResult[]>([]);

  const [config] = useState(() => session.loadConfig());

  useEffect(() => {
    if (!config) {
      router.replace(routes.setup);
      return;
    }

    setAudioEnabled(config.soundEnabled);
    let isMounted = true;

    async function load() {
      try {
        const params = new URLSearchParams({
          categoryId: config!.categorySlug,
          difficulty: config!.difficulty,
          limit: String(SENTENCE_FETCH_LIMIT),
        });
        const res = await fetch(`/api/sentences?${params}`);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();

        const records: SentenceRecord[] = (
          data.items ??
          data.sentences ??
          []
        ).map((item: SentenceRecord | string, i: number) =>
          typeof item === "string"
            ? { id: `s-${i}`, text: item }
            : {
                id: String(item.id ?? `s-${i}`),
                text: item.text,
                translationVi: item.translationVi ?? null,
              },
        );

        if (isMounted) setRounds(buildRounds(records, config!.roundCount));
      } catch (err) {
        console.warn("Failed to load sentences for fill-the-blank:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [config, router]);

  useEffect(() => {
    if (loading) return;
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [loading]);

  const finish = useCallback(
    (
      results: FillBlankRoundResult[],
      finalScore: number,
      bestStreak: number,
    ) => {
      if (!config) return;
      playVictory();
      const completion: FillBlankCompletionData = {
        config,
        stats: {
          score: finalScore,
          correct: results.filter((r) => r.correct).length,
          total: results.length,
          maxStreak: bestStreak,
          totalTime: elapsed,
        },
        rounds: results,
      };
      session.saveResult(completion);
      router.push(routes.result);
    },
    [config, elapsed, router],
  );

  function handleChoose(option: string) {
    if (chosen) return;
    const round = rounds[index];
    const correct = option === round.answer;

    setChosen(option);
    if (correct) playWordComplete();
    else playMistypeThud();

    const nextStreak = correct ? streak + 1 : 0;
    const gained = correct ? POINTS_PER_CORRECT + streak * STREAK_BONUS : 0;
    const nextScore = score + gained;
    const bestStreak = Math.max(maxStreak, nextStreak);

    setStreak(nextStreak);
    setMaxStreak(bestStreak);
    setScore(nextScore);

    historyRef.current = [
      ...historyRef.current,
      {
        id: round.id,
        text: round.text,
        translationVi: round.translationVi,
        answer: round.answer,
        chosen: option,
        correct,
        wordCount: round.words.length,
      },
    ];

    setTimeout(() => {
      if (index + 1 >= rounds.length) {
        finish(historyRef.current, nextScore, bestStreak);
      } else {
        setIndex(index + 1);
        setChosen(null);
      }
    }, 900);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-white/40 font-[family-name:var(--font-mono)] animate-pulse">
          🧩 Preparing rounds...
        </div>
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-white/50 text-sm">
          Not enough sentences in this category to build a round.
        </div>
        <button
          onClick={() => router.push(routes.setup)}
          className="neon-button cursor-pointer"
        >
          <span>Change Setup</span>
        </button>
      </div>
    );
  }

  const round = rounds[index];

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-8 max-w-3xl w-full mx-auto">
      <div className="w-full flex items-center justify-between mb-8">
        <Link
          href="/"
          onClick={() => playUIClick()}
          className="text-xs font-[family-name:var(--font-mono)] text-white/50 hover:text-white transition-colors"
        >
          ← Arcade Hub
        </Link>
        <div className="flex items-center gap-5 font-[family-name:var(--font-mono)] text-xs">
          <span className="text-white/40">
            Round <span className="text-white">{index + 1}</span>/
            {rounds.length}
          </span>
          <span className="text-[var(--neon-yellow)] font-bold">
            {score.toLocaleString()}
          </span>
          <span
            className={streak > 1 ? "text-[var(--neon-pink)]" : "text-white/40"}
          >
            🔥 {streak}
          </span>
        </div>
      </div>

      <GlassCard className="w-full p-8 mb-6">
        <p className="text-xl sm:text-2xl leading-relaxed text-center font-[family-name:var(--font-mono)]">
          {round.words.map((word, i) => {
            if (i !== round.blankIndex) {
              return (
                <span key={i} className="text-white/90">
                  {word}{" "}
                </span>
              );
            }
            return (
              <span
                key={i}
                className={`inline-block min-w-[6ch] px-2 mx-1 border-b-2 text-center transition-colors ${
                  chosen
                    ? chosen === round.answer
                      ? "border-[var(--neon-green)] text-[var(--neon-green)]"
                      : "border-[var(--neon-red)] text-[var(--neon-red)] line-through"
                    : "border-[var(--neon-cyan)] text-[var(--neon-cyan)]"
                }`}
              >
                {chosen ?? "?"}
              </span>
            );
          })}
        </p>

        {chosen && chosen !== round.answer && (
          <p className="mt-4 text-center text-sm font-[family-name:var(--font-mono)] text-white/60">
            Correct answer:{" "}
            <span className="text-[var(--neon-green)] font-bold">
              {round.answer}
            </span>
          </p>
        )}
      </GlassCard>

      <div className="w-full grid grid-cols-2 gap-3">
        {round.options.map((option) => {
          const isAnswer = option === round.answer;
          const isChosen = option === chosen;
          const revealed = chosen !== null;

          return (
            <button
              key={option}
              onClick={() => handleChoose(option)}
              disabled={revealed}
              className={`glass-card p-4 text-center font-[family-name:var(--font-mono)] font-semibold transition-all ${
                revealed
                  ? "cursor-default"
                  : "cursor-pointer hover:border-white/30"
              } ${
                revealed && isAnswer
                  ? "border-[var(--neon-green)] text-[var(--neon-green)]"
                  : revealed && isChosen
                    ? "border-[var(--neon-red)] text-[var(--neon-red)]"
                    : "text-white/80"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
