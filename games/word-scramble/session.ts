import { createGameSession } from "@/lib/core/session";
import type { ScrambleConfig, ScrambleCompletionData } from "./types";

export const session = createGameSession<
  ScrambleConfig,
  ScrambleCompletionData
>("word-scramble");
