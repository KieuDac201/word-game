"use client";

import { useEffect, useState } from "react";

interface SentenceLibrary {
  sentencesByCategory: Record<string, string[]>;
  translations: Record<string, string>;
  loaded: boolean;
}

/** Loads the full sentence library (grouped by category) plus known translations. */
export function useSentenceLibrary(): SentenceLibrary {
  const [sentencesByCategory, setSentencesByCategory] = useState<
    Record<string, string[]>
  >({});
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const res = await fetch("/api/sentences");
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        if (!isMounted) return;

        if (data.sentencesByCategory)
          setSentencesByCategory(data.sentencesByCategory);
        if (data.translations) setTranslations(data.translations);
      } catch (err) {
        console.warn(
          "Sentence library fetch failed, using bundled fallback:",
          err,
        );
      } finally {
        if (isMounted) setLoaded(true);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { sentencesByCategory, translations, loaded };
}
