"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { playUIClick } from "@/lib/core/audio";
import { accentAlpha, accentColor } from "@/lib/theme";
import type { GameDefinition } from "@/games/types";
import { gameRoutes } from "@/games/types";

export function GameCard({ game }: { game: GameDefinition }) {
  const available = game.status !== "coming-soon";

  const card = (
    <GlassCard
      className={`p-6 h-full flex flex-col gap-4 transition-all ${
        available ? "hover:-translate-y-1" : "opacity-50"
      }`}
      style={
        available
          ? { boxShadow: `0 0 0 1px ${accentAlpha(game.accent, 0.15)}` }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="text-3xl p-3 rounded-xl border"
          style={{
            backgroundColor: accentAlpha(game.accent, 0.1),
            borderColor: accentAlpha(game.accent, 0.3),
          }}
        >
          {game.icon}
        </span>

        <div className="flex items-center gap-2">
          {game.status !== "live" && (
            <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-[family-name:var(--font-mono)]">
              {game.status}
            </span>
          )}
          <span className="text-[10px] text-white/40 font-[family-name:var(--font-mono)]">
            ~{game.estimatedMinutes} min
          </span>
        </div>
      </div>

      <div className="flex-1">
        <h2
          className="text-xl font-bold font-[family-name:var(--font-mono)] tracking-tight"
          style={{ color: accentColor(game.accent) }}
        >
          {game.title}
        </h2>
        <p className="text-xs uppercase tracking-wider text-white/40 mt-0.5 font-[family-name:var(--font-mono)]">
          {game.tagline}
        </p>
        <p className="text-sm text-white/60 mt-3 leading-relaxed">
          {game.description}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {game.skills.map((skill) => (
          <span
            key={skill}
            className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 font-[family-name:var(--font-mono)]"
          >
            {skill}
          </span>
        ))}
      </div>
    </GlassCard>
  );

  if (!available) return <div className="h-full">{card}</div>;

  return (
    <Link
      href={gameRoutes(game.slug).setup}
      onClick={() => playUIClick()}
      className="h-full block"
    >
      {card}
    </Link>
  );
}
