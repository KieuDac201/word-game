import { createGameSession } from "@/lib/core/session";
import type { GameMode, BotDifficulty, GameResultPayload } from "./types";

export interface ClashSessionConfig {
  mode: GameMode;
  roomCode?: string;
  playerName: string;
  difficulty: BotDifficulty;
  turnSeconds: number;
  initialHearts: number;
  minWordLength?: number;
}

export const session = createGameSession<ClashSessionConfig, GameResultPayload>(
  "word-chain-clash"
);
