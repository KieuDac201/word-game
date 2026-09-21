'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Difficulty, LibraryCategory } from '@/lib/types';
import { LIBRARY_CATEGORIES } from '@/lib/constants';

// Scramble Rail Config
export interface ScrambleConfig {
  categorySlug: string;
  categoryName: string;
  difficulty: Difficulty;
  roundCount: number; // 5, 10, 15, or 0 for endless
  hintsEnabled: boolean;
  soundEnabled: boolean;
}

export default function ScrambleSetupPage() {
  const router = useRouter();

  // State
  const [category, setCategory] = useState<string>('casual');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [roundCount, setRoundCount] = useState<number>(5);
  const [hintsEnabled, setHintsEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // DB Categories
  const [categories, setCategories] = useState<{
    key: string;
    slug: string;
    label: string;
    icon: string;
    description: string;
    sentenceCount?: number;
  }[]>(LIBRARY_CATEGORIES.map((c) => ({ ...c, slug: c.key })));

  const [dbStatus, setDbStatus] = useState<'loading' | 'connected' | 'offline'>('loading');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [categorySearch, setCategorySearch] = useState('');

  // Fetch categories from DB
  useEffect(() => {
    let isMounted = true;
    async function loadDbCategories() {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        if (isMounted && data.categories && data.categories.length > 0) {
          const mapped = data.categories.map((c: any) => ({
            key: c.slug,
            slug: c.slug,
            label: c.name,
            icon: c.icon || '📁',
            description: c.description || '',
            sentenceCount: c.sentence_count,
          }));
          setCategories(mapped);
          setDbStatus('connected');
        }
      } catch (err) {
        console.warn('Could not load categories from Neon DB, using default list:', err);
        if (isMounted) setDbStatus('offline');
      }
    }
    loadDbCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCategoryObj = useMemo(() => {
    return (
      categories.find((c) => (c.slug || c.key) === category) ||
      categories[0] || {
        key: 'casual',
        slug: 'casual',
        label: 'Casual Daily',
        icon: '☀️',
        description: 'Everyday phrases and common expressions',
        sentenceCount: 0,
      }
    );
  }, [categories, category]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [categories, categorySearch]);

  const handleStartGame = () => {
    const config: ScrambleConfig = {
      categorySlug: selectedCategoryObj.slug || selectedCategoryObj.key,
      categoryName: selectedCategoryObj.label,
      difficulty,
      roundCount,
      hintsEnabled,
      soundEnabled,
    };

    sessionStorage.setItem('scramble-config', JSON.stringify(config));
    router.push('/scramble/play');
  };

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-white flex flex-col items-center relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[var(--neon-cyan)]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[10%] w-[500px] h-[300px] bg-[var(--neon-purple)]/8 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-4xl px-6 py-6 flex items-center justify-between z-10 border-b border-white/5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-[family-name:var(--font-mono)] text-white/60 hover:text-[var(--neon-cyan)] transition-colors"
        >
          <span>←</span> Arcade Hub
        </Link>
        <div className="flex items-center gap-2 text-xs font-[family-name:var(--font-mono)] text-white/50">
          <span
            className={`w-2 h-2 rounded-full ${
              dbStatus === 'connected'
                ? 'bg-[var(--neon-green)] shadow-[0_0_8px_var(--neon-green)]'
                : dbStatus === 'loading'
                ? 'bg-[var(--neon-yellow)] animate-pulse'
                : 'bg-white/30'
            }`}
          />
          <span>Neon DB: {dbStatus === 'connected' ? 'Live' : dbStatus}</span>
        </div>
      </header>

      {/* Main Setup Container */}
      <main className="w-full max-w-2xl px-6 py-10 flex flex-col gap-8 z-10 animate-fade-in">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--neon-purple)]/10 text-[var(--neon-purple)] border border-[var(--neon-purple)]/30 text-xs font-[family-name:var(--font-mono)]">
            <span>🚊</span> Scrambled Sentence Rail
          </div>
          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight font-[family-name:var(--font-mono)]"
            style={{
              background:
                'linear-gradient(135deg, #ffffff 0%, var(--neon-purple) 50%, var(--neon-cyan) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            TRAIN ASSEMBLY DEPOT
          </h1>
          <p className="text-xs sm:text-sm text-white/50 max-w-md mx-auto">
            Reorder scrambled word carriages along magnetic rail tracks. Drag and drop or click to dock tokens into grammatical harmony.
          </p>
        </div>

        {/* Configuration Card */}
        <div className="glass-card p-6 sm:p-8 space-y-7 border border-white/10 shadow-2xl">
          {/* Section 1: Category Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2 font-[family-name:var(--font-mono)]">
              1. Vocabulary Category
            </label>

            {/* Custom Searchable Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  if (!isDropdownOpen) {
                    setTimeout(() => searchInputRef.current?.focus(), 50);
                  }
                }}
                className="w-full bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-white/15 hover:border-[var(--neon-cyan)]/50 rounded-xl p-3.5 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {selectedCategoryObj.icon}
                  </span>
                  <div className="truncate">
                    <div className="font-semibold text-sm text-white flex items-center gap-2">
                      <span>{selectedCategoryObj.label}</span>
                      {selectedCategoryObj.sentenceCount !== undefined && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-normal">
                          {selectedCategoryObj.sentenceCount} sentences
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/40 truncate">
                      {selectedCategoryObj.description}
                    </div>
                  </div>
                </div>
                <span className="text-white/40 group-hover:text-[var(--neon-cyan)] transition-colors ml-2">
                  {isDropdownOpen ? '▲' : '▼'}
                </span>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface-1)] border border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden max-h-72 flex flex-col animate-scale-in">
                  <div className="p-2.5 border-b border-white/10 bg-[var(--surface-2)]/50">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search 25 categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full bg-[var(--surface-0)] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[var(--neon-cyan)]"
                    />
                  </div>
                  <div className="overflow-y-auto divide-y divide-white/5 py-1">
                    {filteredCategories.map((c) => (
                      <button
                        key={c.slug || c.key}
                        type="button"
                        onClick={() => {
                          setCategory(c.slug || c.key);
                          setIsDropdownOpen(false);
                          setCategorySearch('');
                        }}
                        className={`w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-[var(--neon-cyan)]/10 text-left transition-colors ${
                          (c.slug || c.key) === category ? 'bg-[var(--neon-cyan)]/15 border-l-2 border-[var(--neon-cyan)]' : ''
                        }`}
                      >
                        <span className="text-xl flex-shrink-0">{c.icon}</span>
                        <div className="truncate flex-1">
                          <div className="text-xs font-semibold text-white flex items-center justify-between">
                            <span>{c.label}</span>
                            {c.sentenceCount !== undefined && (
                              <span className="text-[10px] text-white/40 font-normal">
                                {c.sentenceCount}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-white/40 truncate">
                            {c.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Difficulty Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2 font-[family-name:var(--font-mono)]">
              2. Sentence Length & Complexity
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: 'easy' as Difficulty,
                  label: 'Easy',
                  words: '3–5 Words',
                  desc: 'Quick sprints & basic grammar',
                  color: 'var(--neon-green)',
                },
                {
                  id: 'normal' as Difficulty,
                  label: 'Normal',
                  words: '6–10 Words',
                  desc: 'Standard clauses & idioms',
                  color: 'var(--neon-cyan)',
                },
                {
                  id: 'hard' as Difficulty,
                  label: 'Hard',
                  words: '11–20 Words',
                  desc: 'Complex academic structures',
                  color: 'var(--neon-pink)',
                },
              ].map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setDifficulty(tier.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    difficulty === tier.id
                      ? 'bg-white/10 border-[var(--neon-cyan)] shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                      : 'bg-[var(--surface-1)] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div
                    className="text-xs font-bold font-[family-name:var(--font-mono)] mb-0.5"
                    style={{ color: tier.color }}
                  >
                    {tier.label}
                  </div>
                  <div className="text-[11px] text-white/80 font-medium">
                    {tier.words}
                  </div>
                  <div className="text-[10px] text-white/40 mt-1 line-clamp-1">
                    {tier.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Challenge Length */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2 font-[family-name:var(--font-mono)]">
              3. Track Rounds
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { count: 5, label: '5 Trains', tag: 'Sprint' },
                { count: 10, label: '10 Trains', tag: 'Standard' },
                { count: 15, label: '15 Trains', tag: 'Endurance' },
                { count: 0, label: 'Endless', tag: 'Survival' },
              ].map((r) => (
                <button
                  key={r.count}
                  type="button"
                  onClick={() => setRoundCount(r.count)}
                  className={`py-2.5 px-2 rounded-lg border text-center transition-all ${
                    roundCount === r.count
                      ? 'bg-[var(--neon-purple)]/20 border-[var(--neon-purple)] text-white shadow-[0_0_12px_rgba(180,77,255,0.2)]'
                      : 'bg-[var(--surface-1)] border-white/10 text-white/60 hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-bold">{r.label}</div>
                  <div className="text-[10px] text-white/40">{r.tag}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Game Assistance & Audio */}
          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hintsEnabled}
                onChange={(e) => setHintsEnabled(e.target.checked)}
                className="rounded bg-[var(--surface-1)] border-white/20 text-[var(--neon-cyan)] focus:ring-0"
              />
              <span className="text-white/80">Enable Magnet Hint (🧲)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="rounded bg-[var(--surface-1)] border-white/20 text-[var(--neon-cyan)] focus:ring-0"
              />
              <span className="text-white/80">Sound Effects (Synthesized Audio)</span>
            </label>
          </div>

          {/* Launch Button */}
          <button
            type="button"
            onClick={handleStartGame}
            className="w-full py-4 rounded-xl font-bold font-[family-name:var(--font-mono)] text-sm uppercase tracking-wider text-black bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-purple)] to-[var(--neon-pink)] hover:opacity-90 transition-opacity shadow-[0_0_25px_rgba(0,240,255,0.3)] cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Launch Rail Challenge</span>
            <span>🚀</span>
          </button>
        </div>
      </main>
    </div>
  );
}
