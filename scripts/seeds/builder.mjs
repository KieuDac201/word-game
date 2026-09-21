import fs from 'fs';
import path from 'path';

const seedsDir = path.resolve('scripts/seeds');
if (!fs.existsSync(seedsDir)) {
  fs.mkdirSync(seedsDir, { recursive: true });
}

// Helper to format and ensure strict word count bounds
export function normalizeSentence(str, minWords, maxWords) {
  const words = str.trim().split(/\s+/).filter(Boolean);
  if (words.length < minWords) {
    // Pad if somehow under (rare)
    return words.join(' ');
  }
  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(' ');
  }
  return words.join(' ');
}

export function formatSentenceBank({ easy, normal, hard }) {
  // Deduplicate and trim
  const cleanEasy = Array.from(new Set(easy.map(s => normalizeSentence(s, 3, 5))));
  const cleanNormal = Array.from(new Set(normal.map(s => normalizeSentence(s, 6, 10))));
  const cleanHard = Array.from(new Set(hard.map(s => normalizeSentence(s, 11, 20))));

  return {
    easy: cleanEasy.slice(0, 100),
    normal: cleanNormal.slice(0, 70),
    hard: cleanHard.slice(0, 30),
  };
}

export function writeCategorySeedFile(cat, rawData) {
  const data = formatSentenceBank(rawData);


  const content = `import { upsertCategoryAndSentences } from './seed-helper.mjs';

export const category = ${JSON.stringify(cat, null, 2)};

export const sentences = ${JSON.stringify(data, null, 2)};

export async function seed() {
  return await upsertCategoryAndSentences(category, sentences);
}

if (process.argv[1]?.endsWith('${cat.slug}.mjs')) {
  seed().catch(console.error);
}
`;

  const filePath = path.join(seedsDir, `${cat.slug}.mjs`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Generated: ${filePath} (Easy: ${data.easy.length}, Normal: ${data.normal.length}, Hard: ${data.hard.length})`);
}
