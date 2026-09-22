import { cleanWord, shuffle } from "@/lib/core/text";
import type { SentenceRecord } from "@/lib/core/types";
import type { BlankRound } from "./types";
import { MIN_BLANK_WORD_LENGTH, OPTIONS_PER_ROUND, STOP_WORDS } from "./config";

function isBlankable(clean: string): boolean {
  return clean.length >= MIN_BLANK_WORD_LENGTH && !STOP_WORDS.has(clean);
}

/** Every distinct blankable word across the pool, used as distractors. */
export function buildDistractorPool(sentences: SentenceRecord[]): string[] {
  const pool = new Set<string>();
  for (const sentence of sentences) {
    for (const raw of sentence.text.split(/\s+/)) {
      const clean = cleanWord(raw);
      if (isBlankable(clean)) pool.add(clean);
    }
  }
  return [...pool];
}

export function buildRound(
  sentence: SentenceRecord,
  distractorPool: string[],
): BlankRound | null {
  const words = sentence.text.split(/\s+/).filter(Boolean);

  const candidates = words
    .map((raw, index) => ({ index, clean: cleanWord(raw) }))
    .filter((candidate) => isBlankable(candidate.clean));
  if (candidates.length === 0) return null;

  const target = candidates[Math.floor(Math.random() * candidates.length)];

  const distractors = shuffle(
    distractorPool.filter((word) => word !== target.clean),
  ).slice(0, OPTIONS_PER_ROUND - 1);
  if (distractors.length < OPTIONS_PER_ROUND - 1) return null;

  return {
    id: sentence.id,
    text: sentence.text,
    translationVi: sentence.translationVi ?? null,
    words,
    blankIndex: target.index,
    answer: target.clean,
    options: shuffle([target.clean, ...distractors]),
  };
}

/** Build up to `count` rounds, skipping sentences with no usable blank. */
export function buildRounds(
  sentences: SentenceRecord[],
  count: number,
): BlankRound[] {
  const pool = buildDistractorPool(sentences);
  const rounds: BlankRound[] = [];

  for (const sentence of shuffle([...sentences])) {
    if (count > 0 && rounds.length >= count) break;
    const round = buildRound(sentence, pool);
    if (round) rounds.push(round);
  }

  return rounds;
}
