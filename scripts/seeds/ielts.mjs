import { upsertCategoryAndSentences } from './seed-helper.mjs';
import { ieltsEasy, ieltsNormal, ieltsHard } from '../db/seed-ielts-200.mjs';

export const category = {
  slug: 'ielts',
  label: 'IELTS Academic',
  icon: '🎓',
  description: 'Academic vocabulary, essay arguments, and collocations',
  display_order: 2,
};

export const sentences = {
  easy: ieltsEasy,
  normal: ieltsNormal,
  hard: ieltsHard,
};

export async function seed() {
  return await upsertCategoryAndSentences(category, sentences);
}

if (process.argv[1]?.endsWith('ielts.mjs')) {
  seed().catch(console.error);
}
