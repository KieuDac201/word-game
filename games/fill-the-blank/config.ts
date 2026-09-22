export const ROUND_OPTIONS = [
  { count: 5, label: "5 Rounds", tag: "Quick" },
  { count: 10, label: "10 Rounds", tag: "Standard" },
  { count: 20, label: "20 Rounds", tag: "Marathon" },
];

export const OPTIONS_PER_ROUND = 4;
export const MIN_BLANK_WORD_LENGTH = 4;
export const SENTENCE_FETCH_LIMIT = 60;

export const POINTS_PER_CORRECT = 100;
export const STREAK_BONUS = 25;

/** Words too common or too structural to make an interesting blank. */
export const STOP_WORDS = new Set([
  "that",
  "this",
  "with",
  "from",
  "they",
  "them",
  "have",
  "been",
  "were",
  "will",
  "your",
  "when",
  "what",
  "then",
  "than",
  "their",
  "there",
  "about",
  "would",
  "could",
  "should",
  "which",
  "while",
  "into",
  "over",
  "some",
]);
