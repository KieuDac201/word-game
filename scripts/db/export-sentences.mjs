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

async function exportSentences() {
  const sql = neon(getDatabaseUrl());

  console.log('📦 Fetching all sentences from Neon DB...');
  const rows = await sql`
    SELECT 
      id,
      category_slug,
      text,
      translation_vi,
      word_count,
      difficulty,
      created_at
    FROM sentences
    ORDER BY category_slug ASC, id ASC;
  `;

  console.log(`✅ Retrieved ${rows.length} sentences.`);

  // Create data directory if not exists
  const outputDir = path.resolve('data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Save flat array of all sentences
  const flatFilePath = path.join(outputDir, 'sentences.json');
  fs.writeFileSync(flatFilePath, JSON.stringify(rows, null, 2), 'utf8');
  console.log(`📄 Saved flat list (${rows.length} items) to: ${flatFilePath}`);

  // 2. Also save grouped by category for easy per-category editing/translating
  const grouped = {};
  for (const row of rows) {
    const cat = row.category_slug;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({
      id: row.id,
      text: row.text,
      translation_vi: row.translation_vi,
      word_count: row.word_count,
      difficulty: row.difficulty,
    });
  }

  const groupedFilePath = path.join(outputDir, 'sentences-by-category.json');
  fs.writeFileSync(groupedFilePath, JSON.stringify(grouped, null, 2), 'utf8');
  console.log(`📄 Saved grouped list (${Object.keys(grouped).length} categories) to: ${groupedFilePath}`);
}

exportSentences().catch((err) => {
  console.error('❌ Failed to export sentences:', err);
  process.exit(1);
});
