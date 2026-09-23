"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { playUIClick } from "@/lib/core/audio";
import { routes, definition } from "../definition";
import { session } from "../session";
import { generateRoomCode } from "../webrtc";
import type { GameMode, BotDifficulty } from "../types";
import { BOT_PROFILES } from "../config";

export default function WordChainSetupScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryRoom = searchParams.get("room");

  const [mode, setMode] = useState<GameMode>(() =>
    queryRoom ? "online-guest" : "online-host"
  );
  const [playerName, setPlayerName] = useState<string>(() =>
    queryRoom ? "Player 2" : "Player 1"
  );
  const [roomCode] = useState<string>(() => generateRoomCode());
  const [joinCode, setJoinCode] = useState<string>(() =>
    queryRoom ? queryRoom.toUpperCase() : ""
  );
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("scholar");
  const [turnSeconds, setTurnSeconds] = useState<number>(30);
  const [initialHearts, setInitialHearts] = useState<number>(3);

  const handleStartGame = () => {
    playUIClick();
    const finalName = playerName.trim() || (mode === "online-guest" ? "Player 2" : "Player 1");
    const activeCode = mode === "online-guest" ? joinCode.trim().toUpperCase() : roomCode;

    session.saveConfig({
      mode,
      roomCode: mode !== "vs-bot" ? activeCode : undefined,
      playerName: finalName,
      difficulty: botDifficulty,
      turnSeconds,
      initialHearts,
    });

    router.push(routes.play);
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--surface-0)] text-white flex flex-col items-center relative overflow-x-hidden touch-manipulation">
      {/* Background ambient neon glow */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[var(--neon-yellow)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[10%] w-[500px] h-[300px] bg-[var(--neon-pink)]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="w-full max-w-4xl px-4 py-4 sm:px-6 sm:py-6 flex items-center justify-between z-10 border-b border-white/5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-[family-name:var(--font-mono)] text-white/60 hover:text-[var(--neon-yellow)] transition-colors py-1"
        >
          <span>←</span> Arcade Hub
        </Link>
        <div className="flex items-center gap-2 text-xs font-[family-name:var(--font-mono)] text-white/50">
          <span className="w-2 h-2 rounded-full bg-[var(--neon-green)] inline-block animate-pulse" />
          <span className="text-[11px] sm:text-xs">WebRTC 1v1</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10 flex flex-col items-center z-10 space-y-6 sm:space-y-8">
        {/* Title & Badge */}
        <div className="text-center space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--neon-yellow)]/30 bg-[var(--neon-yellow)]/10 text-[11px] sm:text-xs font-mono text-[var(--neon-yellow)] tracking-wider uppercase">
            <span>{definition.icon}</span>
            <span>{definition.tagline}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Word Chain <span className="text-[var(--neon-yellow)]">Clash</span>
          </h1>
          <p className="text-xs sm:text-base text-white/60 max-w-lg mx-auto">
            {definition.description}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="w-full grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              playUIClick();
              setMode("online-host");
            }}
            className={`py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-lg font-medium text-xs sm:text-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 active:scale-95 touch-manipulation ${
              mode === "online-host"
                ? "bg-[var(--neon-yellow)] text-black font-bold shadow-[0_0_20px_rgba(255,225,77,0.3)]"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>⚔️</span>
            <span>Host Room</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playUIClick();
              setMode("online-guest");
            }}
            className={`py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-lg font-medium text-xs sm:text-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 active:scale-95 touch-manipulation ${
              mode === "online-guest"
                ? "bg-[var(--neon-yellow)] text-black font-bold shadow-[0_0_20px_rgba(255,225,77,0.3)]"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>🔗</span>
            <span>Join Room</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playUIClick();
              setMode("vs-bot");
            }}
            className={`py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-lg font-medium text-xs sm:text-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 active:scale-95 touch-manipulation ${
              mode === "vs-bot"
                ? "bg-[var(--neon-yellow)] text-black font-bold shadow-[0_0_20px_rgba(255,225,77,0.3)]"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>🤖</span>
            <span>Solo vs Bot</span>
          </button>
        </div>

        {/* Configuration Box */}
        <GlassCard className="w-full p-4 sm:p-8 space-y-4 sm:space-y-6">
          {/* Player Name */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-white/60">
              Your Player Name
            </label>
            <input
              type="text"
              value={playerName}
              maxLength={15}
              autoCapitalize="words"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. WordMaster"
              className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-lg bg-black/40 border border-white/15 focus:border-[var(--neon-yellow)] text-white placeholder-white/30 text-base sm:text-sm outline-none transition-colors"
            />
          </div>

          {/* Host & Solo Arena Customization Settings */}
          {mode !== "online-guest" && (
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--neon-yellow)] font-bold">
                  ⚙️ Match Rule Settings
                </span>
                <span className="text-[11px] font-mono text-white/40">
                  {mode === "online-host" ? "Host controls room rules" : "Custom rules"}
                </span>
              </div>

              {/* Turn Time Limit Selector */}
              <div className="space-y-2">
                <label className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-white/60 flex items-center justify-between">
                  <span>⏱️ Turn Time Limit</span>
                  <span className="text-[var(--neon-cyan)] font-bold font-mono">
                    {turnSeconds}s per move
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { sec: 15, label: "15s", tag: "⚡ Blitz" },
                    { sec: 30, label: "30s", tag: "⚔️ Standard" },
                    { sec: 45, label: "45s", tag: "🧠 Tactical" },
                    { sec: 60, label: "60s", tag: "☕ Relaxed" },
                  ].map((t) => (
                    <button
                      key={t.sec}
                      type="button"
                      onClick={() => {
                        playUIClick();
                        setTurnSeconds(t.sec);
                      }}
                      className={`py-2.5 px-2 rounded-xl border text-center transition-all active:scale-95 touch-manipulation flex flex-col items-center justify-center gap-0.5 ${
                        turnSeconds === t.sec
                          ? "border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/15 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                      }`}
                    >
                      <span className="text-sm font-mono font-bold">{t.label}</span>
                      <span className="text-[9px] font-mono text-white/50">{t.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Initial Lives / Hearts Selector */}
              <div className="space-y-2">
                <label className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-white/60 flex items-center justify-between">
                  <span>❤️ Initial Lives (Hearts)</span>
                  <span className="text-red-400 font-bold font-mono">
                    {"❤️".repeat(initialHearts)} ({initialHearts} {initialHearts === 1 ? "Life" : "Lives"})
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { hearts: 1, label: "1 Life", tag: "💀 Sudden Death" },
                    { hearts: 3, label: "3 Lives", tag: "⚔️ Standard Duel" },
                    { hearts: 5, label: "5 Lives", tag: "🛡️ Endurance" },
                  ].map((h) => (
                    <button
                      key={h.hearts}
                      type="button"
                      onClick={() => {
                        playUIClick();
                        setInitialHearts(h.hearts);
                      }}
                      className={`py-2.5 px-2 rounded-xl border text-center transition-all active:scale-95 touch-manipulation flex flex-col items-center justify-center gap-0.5 ${
                        initialHearts === h.hearts
                          ? "border-red-500 bg-red-500/15 text-white font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                      }`}
                    >
                      <span className="text-sm font-mono font-bold">{h.label}</span>
                      <span className="text-[9px] font-mono text-white/50">{h.tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mode-Specific Settings */}
          {mode === "vs-bot" && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <label className="text-xs font-mono uppercase tracking-wider text-white/60">
                Choose AI Opponent
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(["novice", "scholar", "grandmaster"] as BotDifficulty[]).map((diff) => {
                  const bot = BOT_PROFILES[diff];
                  const selected = botDifficulty === diff;
                  return (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => {
                        playUIClick();
                        setBotDifficulty(diff);
                      }}
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                        selected
                          ? "border-[var(--neon-yellow)] bg-[var(--neon-yellow)]/10 shadow-[0_0_15px_rgba(255,225,77,0.2)]"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{bot.avatar}</span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                            diff === "novice"
                              ? "bg-green-500/20 text-green-400"
                              : diff === "scholar"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {diff}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-white">{bot.name}</span>
                      <span className="text-xs text-white/50">
                        {diff === "novice"
                          ? "Casual & gentle"
                          : diff === "scholar"
                          ? "Quick & versatile"
                          : "Aggressive trap endings"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {mode === "online-host" && (
            <div className="space-y-4 p-4 rounded-xl bg-black/40 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono uppercase text-white/50">Room Passcode</div>
                  <div className="text-3xl font-black tracking-widest text-[var(--neon-yellow)] mt-1">
                    {roomCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playUIClick();
                    navigator.clipboard.writeText(
                      `${window.location.origin}/games/word-chain-clash?room=${roomCode}`
                    );
                    alert("Invite link copied to clipboard!");
                  }}
                  className="px-3 py-2 text-xs font-mono border border-white/20 rounded-lg hover:border-[var(--neon-yellow)] hover:text-[var(--neon-yellow)] transition-colors"
                >
                  📋 Copy Invite Link
                </button>
              </div>
              <p className="text-xs text-white/50">
                Share this 4-letter code or invite link with your friend. You will connect automatically once they join!
              </p>
            </div>
          )}

          {mode === "online-guest" && (
            <div className="space-y-3">
              <label className="text-xs font-mono uppercase tracking-wider text-white/60">
                Enter 4-Letter Room Code
              </label>
              <input
                type="text"
                value={joinCode}
                maxLength={4}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABCD"
                className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/15 focus:border-[var(--neon-yellow)] text-white text-center text-2xl font-mono tracking-widest uppercase outline-none transition-colors"
              />
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white/50 text-center">
                ℹ️ Turn timer and lives will be automatically synchronized from the Host.
              </div>
            </div>
          )}

          {/* Quick Rules Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-white/10 text-center">
            <div className="p-2.5 rounded-lg bg-white/5">
              <div className="text-base font-mono">{"❤️".repeat(initialHearts)}</div>
              <div className="text-[11px] text-white/50 font-mono mt-0.5">
                {mode === "online-guest" ? "Host's Lives" : `${initialHearts} Lives Each`}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5">
              <div className="text-base font-mono">⏱️ {turnSeconds}s</div>
              <div className="text-[11px] text-white/50 font-mono mt-0.5">
                {mode === "online-guest" ? "Host's Timer" : `${turnSeconds}s Per Move`}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5">
              <div className="text-base">🔤 A-Z</div>
              <div className="text-[11px] text-white/50 font-mono mt-0.5">Shiritori Rule</div>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5">
              <div className="text-base">📚 370k+</div>
              <div className="text-[11px] text-white/50 font-mono mt-0.5">All Words Valid</div>
            </div>
          </div>

          {/* Start CTA */}
          <NeonButton
            onClick={handleStartGame}
            disabled={mode === "online-guest" && joinCode.trim().length !== 4}
            className="w-full py-4 text-base font-bold tracking-wide"
          >
            {mode === "vs-bot"
              ? "⚔️ Enter Battle Arena"
              : mode === "online-host"
              ? "🚀 Create Room & Wait for Player"
              : "⚡ Join & Fight"}
          </NeonButton>
        </GlassCard>
      </main>
    </div>
  );
}
