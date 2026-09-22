"use client";

import { SearchInput } from "@/components/ui/search-input";
import type { TranslationController } from "@/lib/hooks/use-translations";
import { accentAlpha, accentColor, type AccentToken } from "@/lib/theme";

export interface ReviewItem {
  id: string | number;
  text: string;
  translationVi?: string | null;
  /** Status pill shown top-left, e.g. "✓ COMPLETED" or "✓ TRAIN #3". */
  badge: { text: string; accent: AccentToken };
  /** Secondary line next to the badge, e.g. "#2 • 7 words". */
  meta?: string;
  /** Tints the card border when the item represents a failure. */
  tone?: "positive" | "negative";
}

interface SentenceReviewListProps {
  items: ReviewItem[];
  translations: TranslationController;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  /** Extra controls rendered at the left of the toolbar (e.g. status filter pills). */
  toolbarLeft?: React.ReactNode;
  allTexts: string[];
  emptyMessage?: string;
}

/** Filterable sentence list with per-item Vietnamese translation accordions. */
export function SentenceReviewList({
  items,
  translations,
  searchQuery,
  onSearchChange,
  toolbarLeft,
  allTexts,
  emptyMessage = "No sentences matched your filter criteria.",
}: SentenceReviewListProps) {
  return (
    <>
      <div className="w-full glass-card p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10">
        {toolbarLeft ?? <span />}

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search words..."
            className="flex-1 sm:w-56"
          />

          <button
            onClick={() => translations.toggleAll(allTexts)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-[family-name:var(--font-mono)] transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              translations.showAll
                ? "bg-gradient-to-r from-[var(--neon-cyan)]/20 to-[var(--neon-purple)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                : "bg-white/10 text-white/80 border border-white/20 hover:bg-white/15"
            }`}
          >
            <span>
              🇻🇳{" "}
              {translations.showAll
                ? "Hide All Translations"
                : "Show All Translations"}
            </span>
          </button>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3">
        {items.length === 0 ? (
          <div className="glass-card p-12 text-center text-white/40 font-[family-name:var(--font-mono)]">
            {emptyMessage}
          </div>
        ) : (
          items.map((item, idx) => {
            const isOpen = translations.isOpen(item.text);
            const translated =
              translations.get(item.text) ?? item.translationVi;
            const isTranslating = translations.isLoading(item.text);
            const isNegative = item.tone === "negative";

            return (
              <div
                key={`${item.id}-${idx}`}
                className={`glass-card p-4 transition-all duration-200 border ${
                  isNegative
                    ? "border-[var(--neon-red)]/20 hover:border-[var(--neon-red)]/40 bg-[var(--neon-red)]/[0.02]"
                    : "border-white/10 hover:border-[var(--neon-green)]/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded text-[0.65rem] font-extrabold uppercase font-[family-name:var(--font-mono)] border"
                      style={{
                        color: accentColor(item.badge.accent),
                        backgroundColor: accentAlpha(item.badge.accent, 0.15),
                        borderColor: accentAlpha(item.badge.accent, 0.3),
                      }}
                    >
                      {item.badge.text}
                    </span>

                    {item.meta && (
                      <span className="text-[0.7rem] text-white/40 font-[family-name:var(--font-mono)]">
                        {item.meta}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => translations.toggle(item.text)}
                    className={`px-2.5 py-1 rounded-md text-xs font-[family-name:var(--font-mono)] transition-all flex items-center gap-1.5 cursor-pointer ${
                      isOpen
                        ? "bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/30"
                        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 border border-white/10"
                    }`}
                  >
                    <span>{isOpen ? "🇻🇳 Dịch" : "🇻🇳 Xem bản dịch"}</span>
                    <span className="text-[0.65rem] opacity-60">
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </button>
                </div>

                <p className="text-base sm:text-lg font-medium text-white tracking-wide leading-relaxed font-[family-name:var(--font-mono)]">
                  {item.text}
                </p>

                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-start gap-3 animate-fade-in bg-white/[0.02] p-3 rounded-lg">
                    <span className="text-lg">🇻🇳</span>
                    <div className="flex-1">
                      <div className="text-[0.65rem] text-[var(--neon-cyan)] uppercase font-bold tracking-wider font-[family-name:var(--font-mono)] mb-0.5">
                        Bản Dịch Tiếng Việt
                      </div>
                      {isTranslating ? (
                        <div className="text-sm text-white/40 italic font-[family-name:var(--font-mono)] flex items-center gap-2">
                          <span className="animate-spin text-xs">🌀</span> Đang
                          tải bản dịch...
                        </div>
                      ) : translated ? (
                        <p className="text-sm sm:text-base font-normal text-white/90 leading-relaxed">
                          {translated}
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
    </>
  );
}
