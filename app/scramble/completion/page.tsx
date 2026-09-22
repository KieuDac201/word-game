'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ScrambleConfig } from '../page';
import { playUIClick } from '@/lib/audio-engine';

export interface ScrambleSentenceHistoryItem {
  id: string;
  text: string;
  translationVi?: string | null;
  timeSeconds: number;
  wordCount: number;
}

export interface ScrambleCompletionData {
  config: ScrambleConfig;
  stats: {
    score: number;
    maxCombo: number;
    totalTime: number;
    hintsUsed: number;
    sentencesCompleted: number;
  };
  sentences: ScrambleSentenceHistoryItem[];
}

export default function ScrambleCompletionPage() {
  const router = useRouter();

  const [data, setData] = useState<ScrambleCompletionData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');

  // Translations
  const [showAllTranslations, setShowAllTranslations] = useState(false);
  const [openTranslations, setOpenTranslations] = useState<Record<string, boolean>>({});
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loadingTranslations, setLoadingTranslations] = useState<Record<string, boolean>>({});

  // Load from sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = sessionStorage.getItem('scramble-completion');
      if (raw) {
        const parsed: ScrambleCompletionData = JSON.parse(raw);
        setData(parsed);

        // Preload any available translations
        const initialTrans: Record<string, string> = {};
        for (const s of parsed.sentences || []) {
          if (s.translationVi) {
            initialTrans[s.text] = s.translationVi;
          }
        }
        setTranslations(initialTrans);
      }
    } catch (e) {
      console.error('Failed to parse scramble-completion:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtered sentences
  const filteredSentences = useMemo(() => {
    if (!data?.sentences) return [];
    if (!searchQuery.trim()) return data.sentences;

    const q = searchQuery.toLowerCase().trim();
    return data.sentences.filter((item) => {
      const matchEn = item.text.toLowerCase().includes(q);
      const trans = translations[item.text] || item.translationVi || '';
      const matchVi = trans.toLowerCase().includes(q);
      return matchEn || matchVi;
    });
  }, [data?.sentences, searchQuery, translations]);

  // Dynamic single sentence translation
  const fetchTranslation = useCallback(
    async (text: string) => {
      if (translations[text] || loadingTranslations[text]) return;

      setLoadingTranslations((prev) => ({ ...prev, [text]: true }));
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.translations && resData.translations[text]) {
            setTranslations((prev) => ({
              ...prev,
              [text]: resData.translations[text],
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch translation:', err);
      } finally {
        setLoadingTranslations((prev) => ({ ...prev, [text]: false }));
      }
    },
    [translations, loadingTranslations]
  );

  // Toggle single sentence
  const handleToggleTranslation = useCallback(
    (text: string) => {
      playUIClick();
      setOpenTranslations((prev) => {
        const nextState = !prev[text];
        if (nextState && !translations[text]) {
          fetchTranslation(text);
        }
        return { ...prev, [text]: nextState };
      });
    },
    [translations, fetchTranslation]
  );

  // Toggle all translations
  const handleToggleAllTranslations = useCallback(async () => {
    playUIClick();
    const nextShowAll = !showAllTranslations;
    setShowAllTranslations(nextShowAll);

    if (nextShowAll && data?.sentences) {
      const newOpen: Record<string, boolean> = {};
      const missing: string[] = [];

      for (const s of data.sentences) {
        newOpen[s.text] = true;
        if (!translations[s.text]) {
          missing.push(s.text);
        }
      }
      setOpenTranslations(newOpen);

      if (missing.length > 0) {
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: missing }),
          });
          if (res.ok) {
            const resData = await res.json();
            if (resData.translations) {
              setTranslations((prev) => ({
                ...prev,
                ...resData.translations,
              }));
            }
          }
        } catch (err) {
          console.warn('Batch translation failed:', err);
        }
      }
    } else {
      setOpenTranslations({});
    }
  }, [showAllTranslations, data?.sentences, translations]);

  // Restart game with current config
  const handlePlayAgain = () => {
    playUIClick();
    if (data?.config) {
      sessionStorage.setItem('scramble-config', JSON.stringify(data.config));
      router.push('/scramble/play');
    } else {
      router.push('/scramble');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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
            Assemble a train of scrambled words along the rail track to see all sentences and their translations!
          </p>
          <button
            onClick={() => router.push('/scramble')}
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
              background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-green))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
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
      <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="glass-card p-3.5 text-center">
          <div className="text-[0.65rem] text-white/40 uppercase tracking-wider font-[family-name:var(--font-mono)] mb-1">
            Total Score
          </div>
          <div className="text-xl font-bold font-[family-name:var(--font-mono)] text-[var(--neon-yellow)]">
            {stats.score.toLocaleString()}
          </div>
        </div>

        <div className="glass-card p-3.5 text-center">
          <div className="text-[0.65rem] text-white/40 uppercase tracking-wider font-[family-name:var(--font-mono)] mb-1">
            Max Streak
          </div>
          <div className="text-xl font-bold font-[family-name:var(--font-mono)] text-[var(--neon-pink)]">
            x{stats.maxCombo.toFixed(1)}
          </div>
        </div>

        <div className="glass-card p-3.5 text-center">
          <div className="text-[0.65rem] text-white/40 uppercase tracking-wider font-[family-name:var(--font-mono)] mb-1">
            Trains
          </div>
          <div className="text-xl font-bold font-[family-name:var(--font-mono)] text-[var(--neon-green)]">
            {stats.sentencesCompleted} / {data.sentences.length}
          </div>
        </div>

        <div className="glass-card p-3.5 text-center">
          <div className="text-[0.65rem] text-white/40 uppercase tracking-wider font-[family-name:var(--font-mono)] mb-1">
            Total Time
          </div>
          <div className="text-xl font-bold font-[family-name:var(--font-mono)] text-white/90">
            {formatTime(stats.totalTime)}
          </div>
        </div>

        <div className="glass-card p-3.5 text-center col-span-2 sm:col-span-1">
          <div className="text-[0.65rem] text-white/40 uppercase tracking-wider font-[family-name:var(--font-mono)] mb-1">
            Hints Used
          </div>
          <div className="text-xl font-bold font-[family-name:var(--font-mono)] text-white/80">
            {stats.hintsUsed}
          </div>
        </div>
      </div>

      {/* ─── Control Toolbar ─── */}
      <div className="w-full glass-card p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 border border-white/10">
        <div className="flex items-center gap-2 text-xs text-white/60 font-[family-name:var(--font-mono)]">
          <span className="w-2 h-2 rounded-full bg-[var(--neon-green)]" />
          <span>Completed Sentences ({data.sentences.length})</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="relative flex-1 sm:w-56">
            <input
              type="text"
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--neon-cyan)] font-[family-name:var(--font-mono)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1.5 text-xs text-white/40 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={handleToggleAllTranslations}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-[family-name:var(--font-mono)] transition-all flex items-center gap-2 whitespace-nowrap ${
              showAllTranslations
                ? 'bg-gradient-to-r from-[var(--neon-cyan)]/20 to-[var(--neon-green)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/15'
            }`}
          >
            <span>🇻🇳 {showAllTranslations ? 'Hide All Translations' : 'Show All Translations'}</span>
          </button>
        </div>
      </div>

      {/* ─── Sentences List ─── */}
      <div className="w-full flex flex-col gap-3">
        {filteredSentences.length === 0 ? (
          <div className="glass-card p-12 text-center text-white/40 font-[family-name:var(--font-mono)]">
            No sentences matched your search query.
          </div>
        ) : (
          filteredSentences.map((item, idx) => {
            const isOpen = showAllTranslations || !!openTranslations[item.text];
            const transText = translations[item.text] || item.translationVi;
            const isTranslating = !!loadingTranslations[item.text];

            return (
              <div
                key={`${item.id}-${idx}`}
                className="glass-card p-4 transition-all duration-200 border border-white/10 hover:border-[var(--neon-cyan)]/40"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[0.65rem] font-extrabold uppercase font-[family-name:var(--font-mono)] bg-[var(--neon-green)]/15 text-[var(--neon-green)] border border-[var(--neon-green)]/30 flex items-center gap-1">
                      <span>✓ TRAIN #{idx + 1}</span>
                    </span>

                    <span className="text-[0.7rem] text-white/40 font-[family-name:var(--font-mono)]">
                      {item.wordCount || item.text.split(' ').length} words
                      {item.timeSeconds > 0 && ` • ${item.timeSeconds}s`}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleTranslation(item.text)}
                    className={`px-2.5 py-1 rounded-md text-xs font-[family-name:var(--font-mono)] transition-all flex items-center gap-1.5 ${
                      isOpen
                        ? 'bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 border border-white/10'
                    }`}
                  >
                    <span>{isOpen ? '🇻🇳 Dịch' : '🇻🇳 Xem bản dịch'}</span>
                    <span className="text-[0.65rem] opacity-60">
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </button>
                </div>

                {/* English Text */}
                <p className="text-base sm:text-lg font-medium text-white tracking-wide leading-relaxed font-[family-name:var(--font-mono)]">
                  {item.text}
                </p>

                {/* Vietnamese Translation Accordion */}
                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-start gap-3 animate-fade-in bg-white/[0.02] p-3 rounded-lg">
                    <span className="text-lg">🇻🇳</span>
                    <div className="flex-1">
                      <div className="text-[0.65rem] text-[var(--neon-cyan)] uppercase font-bold tracking-wider font-[family-name:var(--font-mono)] mb-0.5">
                        Bản Dịch Tiếng Việt
                      </div>
                      {isTranslating ? (
                        <div className="text-sm text-white/40 italic font-[family-name:var(--font-mono)] flex items-center gap-2">
                          <span className="animate-spin text-xs">🌀</span> Đang tải bản dịch...
                        </div>
                      ) : transText ? (
                        <p className="text-sm sm:text-base font-normal text-white/90 leading-relaxed">
                          {transText}
                        </p>
                      ) : (
                        <div className="text-sm text-white/40 italic font-[family-name:var(--font-mono)]">
                          Chưa có bản dịch. Nhấn thử lại để tải.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ─── Bottom Floating Sticky Actions Bar ─── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] glass-card p-3 flex items-center gap-3 border border-white/20 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <button
          onClick={handlePlayAgain}
          className="neon-button flex-1 py-3 flex items-center justify-center gap-2 text-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.25), rgba(0, 255, 136, 0.25))',
          }}
        >
          <span>🔄 Play Again</span>
        </button>

        <button
          onClick={() => {
            playUIClick();
            router.push('/scramble');
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
