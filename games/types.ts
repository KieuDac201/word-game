import type { AccentToken } from "@/lib/theme";

export type SkillTag =
  | "typing"
  | "vocabulary"
  | "grammar"
  | "reading"
  | "listening";

export type GameStatus = "live" | "beta" | "coming-soon";

/** Everything the hub needs to advertise and route to a game. */
export interface GameDefinition {
  id: string;
  /** URL segment under /games. */
  slug: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  accent: AccentToken;
  skills: SkillTag[];
  status: GameStatus;
  estimatedMinutes: number;
}

export function gameRoutes(slug: string) {
  return {
    setup: `/games/${slug}`,
    play: `/games/${slug}/play`,
    result: `/games/${slug}/result`,
  };
}
