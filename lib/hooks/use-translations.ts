"use client";

import { useCallback, useState } from "react";
import { playUIClick } from "@/lib/core/audio";

export interface TranslationController {
  /** Known english -> vietnamese translations. */
  translations: Record<string, string>;
  /** Whether every sentence's translation panel is force-expanded. */
  showAll: boolean;
  /** Merge already-known translations (e.g. from the game config) into the cache. */
  seed: (entries: Record<string, string | null | undefined>) => void;
  get: (text: string) => string | undefined;
  isOpen: (text: string) => boolean;
  isLoading: (text: string) => boolean;
  toggle: (text: string) => void;
  toggleAll: (texts: string[]) => void;
}

async function requestTranslations(
  body: object,
): Promise<Record<string, string>> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Translate request failed: ${res.status}`);
  const data = await res.json();
  return data.translations ?? {};
}

/** Lazy Vietnamese translation cache plus the expand/collapse state for a review list. */
export function useTranslations(): TranslationController {
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);

  const seed = useCallback(
    (entries: Record<string, string | null | undefined>) => {
      setTranslations((prev) => {
        const next = { ...prev };
        for (const [text, value] of Object.entries(entries)) {
          if (value) next[text] = value;
        }
        return next;
      });
    },
    [],
  );

  const fetchOne = useCallback(async (text: string) => {
    setLoading((prev) => ({ ...prev, [text]: true }));
    try {
      const result = await requestTranslations({ text });
      if (result[text]) {
        setTranslations((prev) => ({ ...prev, [text]: result[text] }));
      }
    } catch (err) {
      console.warn("Failed to fetch translation:", err);
    } finally {
      setLoading((prev) => ({ ...prev, [text]: false }));
    }
  }, []);

  const toggle = useCallback(
    (text: string) => {
      playUIClick();
      setOpen((prev) => {
        const next = !prev[text];
        if (next && !translations[text] && !loading[text]) {
          fetchOne(text);
        }
        return { ...prev, [text]: next };
      });
    },
    [translations, loading, fetchOne],
  );

  const toggleAll = useCallback(
    async (texts: string[]) => {
      playUIClick();
      const next = !showAll;
      setShowAll(next);

      if (!next) {
        setOpen({});
        return;
      }

      setOpen(Object.fromEntries(texts.map((t) => [t, true])));

      const missing = texts.filter((t) => !translations[t]);
      if (missing.length === 0) return;

      try {
        const result = await requestTranslations({ texts: missing });
        setTranslations((prev) => ({ ...prev, ...result }));
      } catch (err) {
        console.warn("Batch translation failed:", err);
      }
    },
    [showAll, translations],
  );

  return {
    translations,
    showAll,
    seed,
    get: (text) => translations[text],
    isOpen: (text) => showAll || !!open[text],
    isLoading: (text) => !!loading[text],
    toggle,
    toggleAll,
  };
}
