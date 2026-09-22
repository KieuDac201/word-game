import { createGameSession } from "@/lib/core/session";
import type { GameConfig, WordGameCompletionData } from "./types";

export const session = createGameSession<GameConfig, WordGameCompletionData>(
  "falling-sentences",
);
