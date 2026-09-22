import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

function getDatabaseUrl() {
  const envPath = path.resolve('.env.local');
  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl && fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
    if (match) databaseUrl = match[1];
  }
  if (!databaseUrl) {
    throw new Error('No DATABASE_URL found in .env.local or process.env');
  }
  return databaseUrl;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

async function translateText(text) {
  const clean = text.trim();
  if (!clean) return null;

  // 1. Try Google clients5 endpoint
  try {
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=vi&q=${encodeURIComponent(clean)}`;
    const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const res = await fetch(url, {
      headers: { 'User-Agent': randomUA },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        return data[0].trim();
      }
    }
  } catch (err) {
    // Fall through to backup
  }

  // 2. Backup to MyMemory
  try {
    const email = `translator_${Math.floor(Math.random() * 100000)}@wordgame.dev`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|vi&de=${email}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      const trans = data?.responseData?.translatedText;
      if (trans && typeof trans === 'string' && !trans.startsWith('MYMEMORY WARNING:')) {
        return trans.trim();
      }
    }
  } catch (err) {
    // Return null if all failed
  }

  return null;
}

async function run() {
  const sql = neon(getDatabaseUrl());

  console.log('🔍 Fetching all untranslated sentences from Neon DB...');
  const untranslated = await sql`
    SELECT id, category_slug, text, word_count, difficulty
    FROM sentences
    WHERE translation_vi IS NULL
    ORDER BY id ASC;
  `;

  console.log(`📊 Found ${untranslated.length} sentences needing Vietnamese translation.`);

  if (untranslated.length === 0) {
    console.log('✅ All sentences already have translations!');
    return;
  }

  const CONCURRENCY = 15;
  const DB_BATCH_SIZE = 50;

  let completed = 0;
  const buffer = [];
  let totalSaved = 0;

  async function flushBuffer() {
    if (buffer.length === 0) return;
    const batch = buffer.splice(0, buffer.length);
    const values = batch
      .map((item) => {
        const escaped = item.translation_vi.replace(/'/g, "''");
        return `(${item.id}, '${escaped}')`;
      })
      .join(',\n');

    const updateQuery = `
      UPDATE sentences AS s
      SET translation_vi = v.translation_vi
      FROM (VALUES
        ${values}
      ) AS v(id, translation_vi)
      WHERE s.id = v.id;
    `;

    await sql.query(updateQuery);
    totalSaved += batch.length;
  }

  // Worker queue
  let currentIndex = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (currentIndex < untranslated.length) {
      const idx = currentIndex++;
      const item = untranslated[idx];
      if (!item) break;

      let trans = await translateText(item.text);
      if (!trans) {
        // Retry once after 500ms
        await new Promise((r) => setTimeout(r, 500));
        trans = await translateText(item.text);
      }

      if (trans) {
        buffer.push({ id: item.id, text: item.text, translation_vi: trans });
      }

      completed++;
      if (completed % 25 === 0 || completed === untranslated.length) {
        const percent = ((completed / untranslated.length) * 100).toFixed(1);
        process.stdout.write(`\r⏳ Translated ${completed}/${untranslated.length} (${percent}%) | DB Saved: ${totalSaved}...`);
      }

      if (buffer.length >= DB_BATCH_SIZE) {
        await flushBuffer();
      }

      // Small delay between requests to be polite
      await new Promise((r) => setTimeout(r, 40));
    }
  });

  await Promise.all(workers);
  await flushBuffer();

  console.log(`\n\n🎉 Successfully translated and updated ${totalSaved} sentences in Neon DB!`);

  // Update local data/sentences.json to match full DB state
  console.log('🔄 Updating local data/sentences.json and data/sentences-by-category.json...');
  const allRows = await sql`
    SELECT id, category_slug, text, translation_vi, word_count, difficulty, created_at
    FROM sentences
    ORDER BY category_slug ASC, id ASC;
  `;

  const outputDir = path.resolve('data');
  fs.writeFileSync(path.join(outputDir, 'sentences.json'), JSON.stringify(allRows, null, 2), 'utf8');

  const grouped = {};
  for (const r of allRows) {
    if (!grouped[r.category_slug]) grouped[r.category_slug] = [];
    grouped[r.category_slug].push({
      id: r.id,
      text: r.text,
      translation_vi: r.translation_vi,
      word_count: r.word_count,
      difficulty: r.difficulty,
    });
  }
  fs.writeFileSync(path.join(outputDir, 'sentences-by-category.json'), JSON.stringify(grouped, null, 2), 'utf8');

  console.log(`✅ Saved ${allRows.length} total sentences to data/sentences.json!`);
}

run().catch((err) => {
  console.error('❌ Translation process failed:', err);
  process.exit(1);
});
