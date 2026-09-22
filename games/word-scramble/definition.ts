import type { GameDefinition } from "../types";
import { gameRoutes } from "../types";

export const definition: GameDefinition = {
  id: "word-scramble",
  slug: "word-scramble",
  title: "Word Scramble",
  tagline: "Rebuild the sentence",
  description:
    "Drag scrambled word carriages onto the rail in the right order to restore each sentence.",
  icon: "🚊",
  accent: "purple",
  skills: ["grammar", "vocabulary"],
  status: "live",
  estimatedMinutes: 6,
};

export const routes = gameRoutes(definition.slug);
