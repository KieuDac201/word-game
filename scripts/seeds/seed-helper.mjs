import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

export function getDatabaseUrl() {
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

export function getDifficulty(wordCount) {
  if (wordCount <= 5) return 'easy';
  if (wordCount <= 10) return 'normal';
  return 'hard';
}

export async function upsertCategoryAndSentences(category, sentencesData) {
  const sql = neon(getDatabaseUrl());

  console.log(`\n📦 Processing category: ${category.label} (${category.slug})...`);

  // Ensure tables exist
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      slug VARCHAR(50) PRIMARY KEY,
      label VARCHAR(100) NOT NULL,
      icon VARCHAR(10) NOT NULL,
      description TEXT,
      display_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sentences (
      id SERIAL PRIMARY KEY,
      category_slug VARCHAR(50) NOT NULL REFERENCES categories(slug) ON DELETE CASCADE,
      text TEXT NOT NULL,
      word_count INT NOT NULL,
      difficulty VARCHAR(20) DEFAULT 'normal',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_category_text UNIQUE(category_slug, text)
    );
  `;

  // 1. Upsert category
  await sql`
    INSERT INTO categories (slug, label, icon, description, display_order)
    VALUES (${category.slug}, ${category.label}, ${category.icon}, ${category.description}, ${category.display_order ?? 99})
    ON CONFLICT (slug) DO UPDATE
    SET label = EXCLUDED.label,
        icon = EXCLUDED.icon,
        description = EXCLUDED.description,
        display_order = COALESCE(EXCLUDED.display_order, categories.display_order);
  `;

  // 2. Prepare sentences
  const items = [];
  const { easy = [], normal = [], hard = [] } = sentencesData;

  for (const text of easy) {
    const wc = text.trim().split(/\s+/).length;
    items.push({ text: text.trim(), wordCount: wc, difficulty: 'easy' });
  }
  for (const text of normal) {
    const wc = text.trim().split(/\s+/).length;
    items.push({ text: text.trim(), wordCount: wc, difficulty: 'normal' });
  }
  for (const text of hard) {
    const wc = text.trim().split(/\s+/).length;
    items.push({ text: text.trim(), wordCount: wc, difficulty: 'hard' });
  }

  // 3. Batch insert sentences in chunks of 50 to avoid huge queries
  const CHUNK_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map((item) =>
        sql`
          INSERT INTO sentences (category_slug, text, word_count, difficulty)
          VALUES (${category.slug}, ${item.text}, ${item.wordCount}, ${item.difficulty})
          ON CONFLICT (category_slug, text) DO UPDATE
          SET word_count = EXCLUDED.word_count,
              difficulty = EXCLUDED.difficulty;
        `
      )
    );
    inserted += chunk.length;
  }

  // 4. Summarize
  const stats = await sql`
    SELECT difficulty, COUNT(*)::int AS count
    FROM sentences
    WHERE category_slug = ${category.slug}
    GROUP BY difficulty
    ORDER BY difficulty;
  `;
  const total = await sql`
    SELECT COUNT(*)::int AS total
    FROM sentences
    WHERE category_slug = ${category.slug};
  `;

  console.log(`✅ ${category.label}: ${inserted} sentences upserted. Total in DB: ${total[0].total}`);
  console.log(`   Breakdown:`, stats);

  return {
    category: category.slug,
    total: total[0].total,
    stats,
  };
}
