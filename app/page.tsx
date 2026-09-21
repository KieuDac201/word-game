'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { playUIClick } from '@/lib/audio-engine';

export default function HomePage() {
  const [totalCategories, setTotalCategories] = useState<number>(25);
  const [totalSentences, setTotalSentences] = useState<number>(5486);
  const [dbStatus, setDbStatus] = useState<'loading' | 'connected' | 'offline'>('loading');

  useEffect(() => {
    let isMounted = true;
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.categories && data.categories.length > 0) {
          setTotalCategories(data.categories.length);
          const sum = data.categories.reduce(
            (acc: number, c: any) => acc + (c.sentenceCount || 0),
            0
          );
          if (sum > 0) setTotalSentences(sum);
          if (data.source === 'database') setDbStatus('connected');
        }
      })
      .catch(() => {
        if (isMounted) setDbStatus('offline');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-0)] text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--neon-cyan)]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[var(--neon-purple)]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full border-b border-white/5 bg-[var(--surface-1)]/40 backdrop-blur-md px-6 py-4 relative z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-1.5 rounded-lg bg-white/5 border border-white/10 shadow-inner">
              ⌨️
            </span>
            <div>
              <span className="font-extrabold text-base tracking-wider font-[family-name:var(--font-mono)] text-white flex items-center gap-2">
                ARCADE TYPING HUB
              </span>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-[family-name:var(--font-mono)]">
                Next-Gen Keyboard Arena
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {dbStatus === 'connected' && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--neon-green)]/10 text-[var(--neon-green)] border border-[var(--neon-green)]/30 font-[family-name:var(--font-mono)] flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--neon-green)] animate-pulse" />
                Neon DB Live
              </span>
            )}
            <span className="text-[11px] px-3 py-1 rounded-full bg-white/5 text-white/50 border border-white/10 font-[family-name:var(--font-mono)] hidden sm:inline-block">
              {totalSentences.toLocaleString()} Sentences • {totalCategories} Categories
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col justify-center relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/25 text-xs font-[family-name:var(--font-mono)] mb-4">
            <span>✨</span> Choose Your Game Mode
          </div>
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight font-[family-name:var(--font-mono)] mb-4"
            style={{
              background:
                'linear-gradient(135deg, #ffffff 0%, var(--neon-cyan) 50%, var(--neon-purple) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            SELECT YOUR TYPING CHALLENGE
          </h1>
          <p className="text-sm sm:text-base text-white/50 leading-relaxed font-sans">
            Level up your typing speed, ear-to-keyboard reflexes, and vocabulary mastery across fast-paced arcade challenges.
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
          {/* ── GAME 1: Falling Sentences (Word Game) ── */}
          <div className="glass-card p-8 flex flex-col justify-between relative group hover:border-[var(--neon-cyan)]/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.12)]">
            {/* Ambient highlight */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--neon-cyan)]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[var(--neon-cyan)]/20 transition-all" />

            <div>
              {/* Badge & Icon Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform">
                  ⚡
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[var(--neon-green)]/15 text-[var(--neon-green)] border border-[var(--neon-green)]/30 font-[family-name:var(--font-mono)] flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--neon-green)] animate-pulse" />
                  PLAYABLE NOW
                </span>
              </div>

              {/* Title & Tagline */}
              <h2 className="text-2xl font-bold text-white mb-2 font-[family-name:var(--font-mono)] group-hover:text-[var(--neon-cyan)] transition-colors">
                Falling Sentences
              </h2>
              <p className="text-xs uppercase tracking-wider text-[var(--neon-cyan)]/80 font-semibold font-[family-name:var(--font-mono)] mb-4">
                Word Game • Lane Defense & Speed
              </p>

              <p className="text-sm text-white/60 leading-relaxed mb-6">
                Complete falling words across 3 dynamic lanes before they cross the danger line. Manage lane pressure, keep combo streaks alive, and race against accelerating fall speeds.
              </p>

              {/* Feature Pills */}
              <div className="space-y-2.5 mb-8">
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <span className="text-[var(--neon-cyan)] text-sm">✓</span>
                  <span><strong>25 Curated Categories</strong> (IELTS, Tech, Philosophy, Quotes)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <span className="text-[var(--neon-cyan)] text-sm">✓</span>
                  <span><strong>3 Difficulty Tiers</strong> (Easy, Normal, Hard) with custom speed sliders</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <span className="text-[var(--neon-cyan)] text-sm">✓</span>
                  <span><strong>Real Space-Key Typing</strong> with combo multipliers up to 10x</span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div>
              <Link
                href="/words"
                onClick={() => playUIClick()}
                className="w-full py-4 px-6 rounded-xl font-bold font-[family-name:var(--font-mono)] text-sm tracking-wider uppercase flex items-center justify-center gap-2 bg-[var(--neon-cyan)] text-black hover:bg-white hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] transition-all cursor-pointer group-hover:translate-y-[-1px]"
              >
                <span>Play Word Game</span>
                <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>

          {/* ── GAME 2: Listen Game (Listen & Type) ── */}
          <div className="glass-card p-8 flex flex-col justify-between relative border-white/5 bg-white/[0.02] opacity-80 hover:opacity-100 transition-all duration-300">
            <div>
              {/* Badge & Icon Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[var(--neon-purple)]/10 border border-[var(--neon-purple)]/30 flex items-center justify-center text-3xl shadow-inner">
                  🎧
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[var(--neon-purple)]/15 text-[var(--neon-purple)] border border-[var(--neon-purple)]/30 font-[family-name:var(--font-mono)] flex items-center gap-1.5">
                  <span>🔒</span> COMING SOON
                </span>
              </div>

              {/* Title & Tagline */}
              <h2 className="text-2xl font-bold text-white/90 mb-2 font-[family-name:var(--font-mono)]">
                Listen & Type
              </h2>
              <p className="text-xs uppercase tracking-wider text-[var(--neon-purple)]/80 font-semibold font-[family-name:var(--font-mono)] mb-4">
                Listen Game • Audio Speech Comprehension
              </p>

              <p className="text-sm text-white/50 leading-relaxed mb-6">
                Listen to spoken English sentences and transcribe what you hear. Master phonetic nuances, build auditory reflex speed, and practice without relying on visual text prompts.
              </p>

              {/* Feature Preview Pills */}
              <div className="space-y-2.5 mb-8">
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span className="text-[var(--neon-purple)] text-sm">🎙️</span>
                  <span><strong>Speech Synthesis Engine</strong> with adjustable playback rate (0.75x–1.25x)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span className="text-[var(--neon-purple)] text-sm">🔁</span>
                  <span><strong>Replay Shortcuts</strong> (<code className="px-1 py-0.5 rounded bg-white/5 text-[var(--neon-purple)]">Tab</code> / <code className="px-1 py-0.5 rounded bg-white/5 text-[var(--neon-purple)]">Ctrl+Space</code>) and blurred hints</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span className="text-[var(--neon-purple)] text-sm">📊</span>
                  <span><strong>Ear-to-Hand Metrics</strong> tracking listening WPM & transcription accuracy</span>
                </div>
              </div>
            </div>

            {/* In Development CTA */}
            <div>
              <button
                disabled
                className="w-full py-4 px-6 rounded-xl font-bold font-[family-name:var(--font-mono)] text-sm tracking-wider uppercase flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
              >
                <span>🔒 In Development</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Platform Info Banner */}
        <div className="mt-16 text-center text-xs font-[family-name:var(--font-mono)] text-white/30 flex items-center justify-center gap-6">
          <span>⌨️ Physical Keyboard Recommended</span>
          <span>•</span>
          <span>⚡ 60 FPS Canvas Physics</span>
          <span>•</span>
          <span>🔊 Synthesized Audio Engine</span>
        </div>
      </main>
    </div>
  );
}
