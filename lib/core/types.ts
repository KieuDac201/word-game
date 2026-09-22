/** Difficulty bands shared by every game. */
export type Difficulty = "easy" | "normal" | "hard";

/** Sentence library category slug. Known slugs are hints; any DB slug is valid. */
export type LibraryCategory =
  | "casual"
  | "quotes"
  | "programming"
  | "idioms"
  | (string & {});

/** A sentence as served by /api/sentences. */
export interface SentenceRecord {
  id: string;
  text: string;
  translationVi?: string | null;
  wordCount?: number;
  difficulty?: Difficulty;
}
