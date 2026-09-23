import type { GameDefinition } from "./types";
import { definition as fallingSentences } from "./falling-sentences/definition";
import { definition as wordScramble } from "./word-scramble/definition";
import { definition as fillTheBlank } from "./fill-the-blank/definition";
import { definition as wordChainClash } from "./word-chain-clash/definition";

/** Single source of truth for the hub. Add a game here and it appears everywhere. */
export const GAMES: GameDefinition[] = [
  fallingSentences,
  wordScramble,
  fillTheBlank,
  wordChainClash,
];

export function getGame(slug: string): GameDefinition | undefined {
  return GAMES.find((game) => game.slug === slug);
}

export const PLAYABLE_GAMES = GAMES.filter(
  (game) => game.status !== "coming-soon",
);
