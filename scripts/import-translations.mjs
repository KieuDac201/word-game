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

async function importTranslations() {
  const filePath = path.resolve('data/sentences.json');
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const withTranslation = items.filter((item) => item.translation_vi && item.translation_vi.trim() !== '');

  console.log(`📊 Found ${withTranslation.length} sentences with translation_vi out of ${items.length} total.`);

  if (withTranslation.length === 0) {
    console.log('No translations to update yet.');
    return;
  }

  const sql = neon(getDatabaseUrl());
  const CHUNK_SIZE = 50;
  let updated = 0;

  for (let i = 0; i < withTranslation.length; i += CHUNK_SIZE) {
    const chunk = withTranslation.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map((item) =>
        sql`
          UPDATE sentences
          SET translation_vi = ${item.translation_vi.trim()}
          WHERE id = ${item.id};
        `
      )
    );
    updated += chunk.length;
    process.stdout.write(`\r⏳ Updated ${updated}/${withTranslation.length} translations...`);
  }

  console.log(`\n✅ Successfully updated ${updated} translations in Neon DB!`);
}

importTranslations().catch((err) => {
  console.error('❌ Failed to import translations:', err);
  process.exit(1);
});
