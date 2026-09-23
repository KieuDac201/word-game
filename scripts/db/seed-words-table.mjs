import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

// 1. Resolve DATABASE_URL from .env.local
const envPath = path.resolve(".env.local");
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
  if (match) databaseUrl = match[1];
}

if (!databaseUrl) {
  console.error("Error: No DATABASE_URL found in .env.local or environment.");
  process.exit(1);
}

const sql = neon(databaseUrl);

// Public English word list (370k+ words)
const DICT_URL = "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt";
const CACHE_DICT_PATH = path.resolve("data/public-dictionary.txt");

// Public English-Vietnamese dictionary (~109k entries)
const EV_DICT_URL = "https://raw.githubusercontent.com/yenthanh132/avdict-database-sqlite-converter/master/anhviet109K.txt";
const CACHE_EV_PATH = path.resolve("data/anhviet109K.txt");

async function fetchEnglishDictionary() {
  if (fs.existsSync(CACHE_DICT_PATH)) {
    console.log(`Using cached English dictionary at ${CACHE_DICT_PATH}...`);
    return fs.readFileSync(CACHE_DICT_PATH, "utf8");
  }

  console.log(`Downloading public English dictionary from ${DICT_URL}...`);
  const res = await fetch(DICT_URL);
  if (!res.ok) throw new Error(`Failed to download dictionary: HTTP ${res.status}`);
  const text = await res.text();
  fs.mkdirSync(path.dirname(CACHE_DICT_PATH), { recursive: true });
  fs.writeFileSync(CACHE_DICT_PATH, text, "utf8");
  console.log(`Downloaded English dictionary (${(text.length / 1024 / 1024).toFixed(2)} MB).`);
  return text;
}

async function fetchVietnameseDictionary() {
  if (fs.existsSync(CACHE_EV_PATH)) {
    console.log(`Using cached English-Vietnamese dictionary at ${CACHE_EV_PATH}...`);
    return fs.readFileSync(CACHE_EV_PATH, "utf8");
  }

  console.log(`Downloading English-Vietnamese dictionary from ${EV_DICT_URL}...`);
  const res = await fetch(EV_DICT_URL);
  if (!res.ok) throw new Error(`Failed to download EV dictionary: HTTP ${res.status}`);
  const text = await res.text();
  fs.mkdirSync(path.dirname(CACHE_EV_PATH), { recursive: true });
  fs.writeFileSync(CACHE_EV_PATH, text, "utf8");
  console.log(`Downloaded EV dictionary (${(text.length / 1024 / 1024).toFixed(2)} MB).`);
  return text;
}

function parseEVDictionary(rawText) {
  console.log("Parsing English-Vietnamese dictionary entries...");
  const lines = rawText.split("\n");
  const evMap = new Map();

  let currentWord = "";
  let currentMeanings = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("@")) {
      if (currentWord && currentMeanings.length > 0) {
        evMap.set(currentWord, currentMeanings.join("; "));
      }
      const match = line.slice(1).match(/^([^\/\s]+)/);
      currentWord = match ? match[1].toLowerCase().trim() : "";
      currentMeanings = [];
    } else if (line.startsWith("-")) {
      const meaning = line.replace(/^[-\s*]+/, "").split("+")[0].trim();
      if (meaning && currentMeanings.length < 2) {
        currentMeanings.push(meaning);
      }
    }
  }

  if (currentWord && currentMeanings.length > 0) {
    evMap.set(currentWord, currentMeanings.join("; "));
  }

  console.log(`Loaded ${evMap.size} English-Vietnamese translations.`);
  return evMap;
}

function getTranslation(word, evMap) {
  // 1. Direct match
  if (evMap.has(word)) return evMap.get(word);

  // 2. Simple inflection fallbacks
  if (word.endsWith("s") && evMap.has(word.slice(0, -1))) {
    return evMap.get(word.slice(0, -1));
  }
  if (word.endsWith("es") && evMap.has(word.slice(0, -2))) {
    return evMap.get(word.slice(0, -2));
  }
  if (word.endsWith("ed") && evMap.has(word.slice(0, -2))) {
    return evMap.get(word.slice(0, -2));
  }
  if (word.endsWith("ing") && evMap.has(word.slice(0, -3))) {
    return evMap.get(word.slice(0, -3));
  }

  return null;
}

function escapeSql(str) {
  if (!str) return "NULL";
  const cleaned = str.replace(/'/g, "''").slice(0, 255);
  return `'${cleaned}'`;
}

async function main() {
  console.log("=== Seeding Neon 'words' table with Vietnamese Translations ===");

  // 1. Ensure table structure with translate_vi column
  console.log("Ensuring 'words' table with 'translate_vi' column exists in Neon Postgres...");
  await sql`
    CREATE TABLE IF NOT EXISTS words (
      id SERIAL PRIMARY KEY,
      word VARCHAR(50) NOT NULL UNIQUE,
      length INT NOT NULL,
      first_letter CHAR(1) NOT NULL,
      last_letter CHAR(1) NOT NULL,
      translate_vi TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await sql`ALTER TABLE words ADD COLUMN IF NOT EXISTS translate_vi TEXT;`;
  await sql`CREATE INDEX IF NOT EXISTS idx_words_first_letter ON words (first_letter);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_words_last_letter ON words (last_letter);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_words_length ON words (length);`;

  // 2. Fetch and parse EV dictionary
  const evRaw = await fetchVietnameseDictionary();
  const evMap = parseEVDictionary(evRaw);

  // 3. Fetch English dictionary
  const enRaw = await fetchEnglishDictionary();
  const enLines = enRaw.split(/\r?\n/);

  // Clean words (len 3-25, [a-z] only)
  console.log("Filtering and mapping words with Vietnamese translations...");
  const wordsSet = new Set();
  for (const line of enLines) {
    const clean = line.trim().toLowerCase();
    if (/^[a-z]{3,25}$/.test(clean)) {
      wordsSet.add(clean);
    }
  }

  const wordsList = Array.from(wordsSet);
  console.log(`Total words to process: ${wordsList.length}`);

  // Count how many have translations
  let withTranslationCount = 0;
  for (const w of wordsList) {
    if (getTranslation(w, evMap)) withTranslationCount++;
  }
  console.log(`Words with matched Vietnamese translations: ${withTranslationCount}`);

  // 4. Batch upsert into Neon
  const BATCH_SIZE = 2500;
  const totalBatches = Math.ceil(wordsList.length / BATCH_SIZE);
  console.log(`Updating Neon in ${totalBatches} batches of ${BATCH_SIZE} words...`);

  const startTime = Date.now();
  let completedBatches = 0;
  const CONCURRENCY = 4;
  const batchIndices = Array.from({ length: totalBatches }, (_, i) => i);

  async function worker() {
    while (batchIndices.length > 0) {
      const b = batchIndices.shift();
      if (b === undefined) break;

      const batch = wordsList.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
      const valueTuples = batch
        .map((w) => {
          const len = w.length;
          const first = w[0];
          const last = w[len - 1];
          const vi = getTranslation(w, evMap);
          const viSql = escapeSql(vi);
          return `('${w}', ${len}, '${first}', '${last}', ${viSql})`;
        })
        .join(",\n");

      const query = `
        INSERT INTO words (word, length, first_letter, last_letter, translate_vi)
        VALUES ${valueTuples}
        ON CONFLICT (word) DO UPDATE
        SET translate_vi = EXCLUDED.translate_vi
        WHERE EXCLUDED.translate_vi IS NOT NULL;
      `;

      try {
        await sql.query(query);
      } catch (err) {
        console.error(`Error in batch ${b + 1}:`, err);
      }

      completedBatches++;
      if (completedBatches % 10 === 0 || completedBatches === totalBatches) {
        const percent = ((completedBatches / totalBatches) * 100).toFixed(1);
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
          `Progress: ${completedBatches}/${totalBatches} (${percent}%) (${elapsedSec}s)`
        );
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  // 5. Verification query from Neon
  const [totalRows] = await sql`SELECT count(*)::int as total FROM words;`;
  const [translatedRows] = await sql`SELECT count(*)::int as translated FROM words WHERE translate_vi IS NOT NULL;`;

  console.log("\n=== Neon Database Verification ===");
  console.log(`Total words: ${totalRows.total}`);
  console.log(`Words with translate_vi populated: ${translatedRows.translated}`);

  const sampleWords = ["apple", "tiger", "orange", "galaxy", "computer", "matrix", "dragon", "challenge"];
  const sampleRes = await sql`
    SELECT word, length, first_letter, last_letter, translate_vi
    FROM words
    WHERE word = ANY(${sampleWords});
  `;

  console.log("\nSample rows with translations:");
  for (const r of sampleRes) {
    console.log(`- ${r.word} (${r.length} letters): ${r.translate_vi}`);
  }

  console.log(`\nAll done in ${((Date.now() - startTime) / 1000).toFixed(1)}s!`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
