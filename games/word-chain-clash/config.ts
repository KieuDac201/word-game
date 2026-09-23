import type { WordChainConfig, BotDifficulty } from "./types";

export const DEFAULT_CONFIG: WordChainConfig = {
  turnSeconds: 30,
  initialHearts: 3,
  minWordLength: 3,
  difficulty: "scholar",
};

export const MIN_TIMER_FLOOR = 10;

export const STARTER_WORDS = [
  "clash",
  "spark",
  "tiger",
  "flame",
  "quest",
  "galaxy",
  "dragon",
  "planet",
  "bridge",
  "castle",
  "matrix",
  "silver",
  "stream",
  "shadow",
  "knight",
  "falcon",
  "thunder",
  "phoenix",
  "wizard",
  "crystal",
  "horizon",
  "voyage",
  "jungle",
  "breeze",
  "mystic",
  "legend",
  "summit",
  "ocean",
  "vortex",
  "prism",
  "rocket",
  "anchor",
  "canyon",
  "desert",
  "eclipse",
  "forest",
  "glacier",
  "harbor",
  "island",
  "jaguar",
  "kingdom",
  "lantern",
  "marble",
  "nebula",
  "orbit",
  "pirate",
  "quartz",
  "ripple",
  "safari",
  "temple",
  "universe",
  "volcano",
  "warrior",
  "zenith",
  "beacon",
  "cosmic",
  "dynamo",
  "echo",
  "fortress",
  "gravity",
  "haven",
  "insight",
  "journey",
  "kinetic",
  "lumen",
  "meteor",
  "nomad",
  "oasis",
  "pulse",
  "quantum",
];

export interface BotProfile {
  name: string;
  avatar: string;
  minThinkMs: number;
  maxThinkMs: number;
  failProbability: number; // probability of getting stuck and timing out
}

export const BOT_PROFILES: Record<BotDifficulty, BotProfile> = {
  novice: {
    name: "Lexi (Novice)",
    avatar: "🤖",
    minThinkMs: 5000,
    maxThinkMs: 10000,
    failProbability: 0.25,
  },
  scholar: {
    name: "Athena (Scholar)",
    avatar: "🦉",
    minThinkMs: 3000,
    maxThinkMs: 6500,
    failProbability: 0.1,
  },
  grandmaster: {
    name: "Nexus (Grandmaster)",
    avatar: "⚡",
    minThinkMs: 1500,
    maxThinkMs: 3500,
    failProbability: 0.02,
  },
};
