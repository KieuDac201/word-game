import { BOT_VOCABULARY } from "./bot-vocabulary";

// Seed set from common words so thousands of words validate synchronously at 0ms
const LOCAL_WORDS_SET = new Set<string>();

// Populate synchronous seed words
for (const letter of Object.keys(BOT_VOCABULARY)) {
  for (const w of BOT_VOCABULARY[letter]) {
    LOCAL_WORDS_SET.add(w.toLowerCase());
  }
}

let isFullDictionaryLoaded = false;
let dictionaryLoadPromise: Promise<void> | null = null;

/**
 * Lazily loads the full words dictionary in the background.
 */
export async function loadFullDictionary(): Promise<void> {
  if (isFullDictionaryLoaded) return;
  if (dictionaryLoadPromise) return dictionaryLoadPromise;

  dictionaryLoadPromise = (async () => {
    try {
      if (typeof window === "undefined") return;
      const res = await fetch("/data/word-chain-dictionary.txt");
      if (!res.ok) return;
      const text = await res.text();
      const words = text.split("\n");
      for (let i = 0; i < words.length; i++) {
        const w = words[i].trim().toLowerCase();
        if (w) LOCAL_WORDS_SET.add(w);
      }
      isFullDictionaryLoaded = true;
    } catch {
      // Fallback remains with seed set
    }
  })();

  return dictionaryLoadPromise;
}

const SERVER_VALIDATED_CACHE = new Set<string>();
const DEFINITION_CACHE = new Map<string, { definition?: string; translationVi?: string }>();

/**
 * Checks whether a word is a valid English word using only our server and local dictionary.
 * 1. Checks local in-memory Set (369k+ words) -> 0ms.
 * 2. Checks cached server lookups -> 0ms.
 * 3. Queries our server API (/api/words?word=...).
 */
export async function validateWord(word: string): Promise<boolean> {
  const normalized = word.trim().toLowerCase();
  if (!/^[a-z]{3,25}$/.test(normalized)) {
    return false;
  }

  // Tier 1: Local memory set
  if (LOCAL_WORDS_SET.has(normalized) || SERVER_VALIDATED_CACHE.has(normalized)) {
    return true;
  }

  // If full dictionary is still loading, wait for it
  if (!isFullDictionaryLoaded && dictionaryLoadPromise) {
    await dictionaryLoadPromise;
    if (LOCAL_WORDS_SET.has(normalized)) {
      return true;
    }
  }

  // Tier 2: Check our server DB words API (/api/words?word=...)
  try {
    const dbRes = await fetch(`/api/words?word=${encodeURIComponent(normalized)}`);
    if (dbRes.ok) {
      const dbData = await dbRes.json();
      if (dbData.valid) {
        SERVER_VALIDATED_CACHE.add(normalized);
        if (dbData.details?.translate_vi) {
          DEFINITION_CACHE.set(normalized, {
            translationVi: dbData.details.translate_vi,
          });
        }
        return true;
      }
    }
  } catch {
    // If network fails, rely strictly on local set
  }

  return false;
}

/**
 * Fetch Vietnamese translation and details for game review from our server.
 */
export async function getWordDetails(
  word: string
): Promise<{ definition?: string; translationVi?: string }> {
  const normalized = word.trim().toLowerCase();
  if (DEFINITION_CACHE.has(normalized)) {
    return DEFINITION_CACHE.get(normalized)!;
  }

  let translationVi: string | undefined = undefined;

  // Fetch translate_vi from our server DB
  try {
    const dbRes = await fetch(`/api/words?word=${encodeURIComponent(normalized)}`);
    if (dbRes.ok) {
      const dbData = await dbRes.json();
      if (dbData.details?.translate_vi) {
        translationVi = dbData.details.translate_vi;
      }
    }
  } catch {
    // silent fallback
  }

  const details = {
    translationVi,
  };

  DEFINITION_CACHE.set(normalized, details);
  return details;
}
