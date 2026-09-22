/**
 * Typed sessionStorage handoff between a game's setup, play, and result screens.
 * Keys are namespaced per game so new games never collide.
 */
export interface GameSession<TConfig, TResult> {
  saveConfig: (config: TConfig) => void;
  loadConfig: () => TConfig | null;
  saveResult: (result: TResult) => void;
  loadResult: () => TResult | null;
  clear: () => void;
}

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Failed to parse session entry "${key}":`, err);
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to persist session entry "${key}":`, err);
  }
}

export function createGameSession<TConfig, TResult>(
  gameId: string,
): GameSession<TConfig, TResult> {
  const configKey = `${gameId}:config`;
  const resultKey = `${gameId}:result`;

  return {
    saveConfig: (config) => write(configKey, config),
    loadConfig: () => read<TConfig>(configKey),
    saveResult: (result) => write(resultKey, result),
    loadResult: () => read<TResult>(resultKey),
    clear: () => {
      if (typeof window === "undefined") return;
      sessionStorage.removeItem(configKey);
      sessionStorage.removeItem(resultKey);
    },
  };
}
