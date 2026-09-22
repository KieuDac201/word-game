import { createGameSession } from "@/lib/core/session";
import type { FillBlankConfig, FillBlankCompletionData } from "./types";

export const session = createGameSession<
  FillBlankConfig,
  FillBlankCompletionData
>("fill-the-blank");
