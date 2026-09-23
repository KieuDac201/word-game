import type { GameDefinition } from "../types";
import { gameRoutes } from "../types";

export const definition: GameDefinition = {
  id: "word-chain-clash",
  slug: "word-chain-clash",
  title: "Word Chain Clash",
  tagline: "2-Player Vocabulary Duel",
  description:
    "Battle head-to-head in real time! Chain valid English words using your opponent's ending letter before the 30s timer runs out.",
  icon: "⚔️",
  accent: "yellow",
  skills: ["vocabulary", "typing"],
  status: "live",
  estimatedMinutes: 5,
};

export const routes = gameRoutes(definition.slug);
