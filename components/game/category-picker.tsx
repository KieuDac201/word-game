"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SearchInput } from "@/components/ui/search-input";
import { findCategory, type CategoryOption } from "@/lib/hooks/use-categories";
import { playUIClick } from "@/lib/core/audio";

interface CategoryPickerProps {
  categories: CategoryOption[];
  value: string;
  onChange: (slug: string) => void;
  label?: string;
}

/** Searchable category dropdown shared by every game's setup screen. */
export function CategoryPicker({
  categories,
  value,
  onChange,
  label = "Selected Category",
}: CategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => findCategory(categories, value),
    [categories, value],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }, [categories, search]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    const focusTimer = setTimeout(() => searchRef.current?.focus(), 50);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(focusTimer);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/50 font-[family-name:var(--font-mono)]">
          {label}
        </span>
        <span className="text-[11px] text-[var(--neon-cyan)]/80 font-[family-name:var(--font-mono)]">
          {categories.length} Categories Available
        </span>
      </div>

      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          playUIClick();
        }}
        className={`w-full glass-card p-4 text-left transition-all cursor-pointer flex items-center justify-between gap-4 border ${
          isOpen
            ? "border-[var(--neon-cyan)]/70 shadow-[0_0_20px_rgba(0,240,255,0.2)] ring-1 ring-[var(--neon-cyan)]/40 bg-[var(--surface-2)]/90"
            : "border-white/10 hover:border-white/25 bg-[var(--surface-1)]/60 hover:bg-[var(--surface-1)]/90"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="text-2xl flex-shrink-0 p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-inner">
            {selected.icon}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-white tracking-wide truncate">
                {selected.label}
              </span>
              {!!selected.sentenceCount && (
                <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/30 font-[family-name:var(--font-mono)] flex-shrink-0 font-medium">
                  {selected.sentenceCount} sentences
                </span>
              )}
            </div>
            <p className="text-xs text-white/50 truncate mt-0.5">
              {selected.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/5 text-white/70 border border-white/10 hidden sm:inline-block font-[family-name:var(--font-mono)]">
            {isOpen ? "Close" : "Change"}
          </span>
          <span
            className={`text-xs text-[var(--neon-cyan)] transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl bg-[#0e0e17]/95 backdrop-blur-2xl border border-[var(--neon-cyan)]/30 shadow-[0_15px_40px_rgba(0,0,0,0.8)] p-3 animate-fade-in">
          <SearchInput
            ref={searchRef}
            value={search}
            onChange={setSearch}
            placeholder={`Search ${categories.length} categories (e.g. science, cinema, ai)...`}
            className="mb-2.5"
          />

          <div className="flex items-center justify-between px-1 pb-1.5 text-[10px] text-white/40 font-[family-name:var(--font-mono)] border-b border-white/5 mb-1.5">
            <span>CATEGORIES</span>
            <span>{filtered.length} matching</span>
          </div>

          <div
            className="max-h-[290px] overflow-y-auto space-y-1 pr-1"
            role="listbox"
          >
            {filtered.map((cat) => {
              const slug = cat.slug || cat.key;
              const isSelected = slug === value;
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => {
                    onChange(slug);
                    setIsOpen(false);
                    setSearch("");
                    playUIClick();
                  }}
                  className={`w-full p-2.5 rounded-lg text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-[var(--neon-cyan)]/15 border border-[var(--neon-cyan)]/40 text-white shadow-sm"
                      : "bg-white/5 border border-transparent hover:bg-white/10 text-white/80 hover:text-white"
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl flex-shrink-0">{cat.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs truncate">
                          {cat.label}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] text-[var(--neon-cyan)] font-mono">
                            ✓ Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/40 truncate mt-0.5">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  {!!cat.sentenceCount && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-[family-name:var(--font-mono)] flex-shrink-0 ${
                        isSelected
                          ? "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/30"
                          : "bg-white/5 text-white/50 border border-white/10"
                      }`}
                    >
                      {cat.sentenceCount}
                    </span>
                  )}
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="py-8 text-center text-white/40 text-xs">
                No category matches &quot;{search}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
