import type { GameDefinition } from "../types";
import { gameRoutes } from "../types";

export const definition: GameDefinition = {
  id: "falling-sentences",
  slug: "falling-sentences",
  title: "Falling Sentences",
  tagline: "Type before they land",
  description:
    "Sentences drift down three lanes. Type them accurately to destroy them before they cross the danger line.",
  icon: "⚡",
  accent: "cyan",
  skills: ["typing", "reading"],
  status: "live",
  estimatedMinutes: 5,
};

export const routes = gameRoutes(definition.slug);
