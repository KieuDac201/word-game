export type PlayerId = "player1" | "player2";

export type GameMode = "online-host" | "online-guest" | "vs-bot";

export type BotDifficulty = "novice" | "scholar" | "grandmaster";

export interface PlayerState {
  id: PlayerId;
  name: string;
  hearts: number; // Starts at 3
  wordsCount: number;
  totalLetters: number;
  isTurn: boolean;
  isBot?: boolean;
}

export interface ChainWord {
  id: string;
  word: string;
  playedBy: PlayerId;
  playedByName: string;
  timestamp: number;
  definition?: string;
  translationVi?: string;
}

export interface WordChainConfig {
  turnSeconds: number; // Default 30
  initialHearts: number; // Default 3
  minWordLength: number; // Default 3
  difficulty: BotDifficulty;
}

export interface GameResultPayload {
  winner: PlayerId | "draw";
  winnerName: string;
  loserName: string;
  chain: ChainWord[];
  p1Stats: {
    name: string;
    words: number;
    heartsRemaining: number;
    longestWord: string;
  };
  p2Stats: {
    name: string;
    words: number;
    heartsRemaining: number;
    longestWord: string;
  };
  matchDurationSeconds: number;
}

export type P2PMessageType =
  | "JOIN_ROOM"
  | "ROOM_ACCEPTED"
  | "START_MATCH"
  | "PLAY_WORD"
  | "TIMER_TICK"
  | "TURN_TIMEOUT"
  | "PLAYER_LEFT"
  | "PLAYER_RESIGNED"
  | "REMATCH_OFFER"
  | "REMATCH_ACCEPT";

export interface P2PMessage {
  type: P2PMessageType;
  sender: PlayerId;
  payload?: Record<string, unknown>;
  timestamp: number;
}
