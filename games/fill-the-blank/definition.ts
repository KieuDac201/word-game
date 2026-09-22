import type { GameDefinition } from "../types";
import { gameRoutes } from "../types";

export const definition: GameDefinition = {
  id: "fill-the-blank",
  slug: "fill-the-blank",
  title: "Fill the Blank",
  tagline: "Pick the missing word",
  description:
    "One word is removed from each sentence. Choose the right word from four options before the streak breaks.",
  icon: "🧩",
  accent: "green",
  skills: ["vocabulary", "reading"],
  status: "live",
  estimatedMinutes: 4,
};

export const routes = gameRoutes(definition.slug);
