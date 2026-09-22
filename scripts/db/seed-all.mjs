import fs from 'fs';
import path from 'path';

async function main() {
  const seedsDir = path.resolve('scripts/seeds');
  const files = fs
    .readdirSync(seedsDir)
    .filter(
      (f) =>
        !f.startsWith('gen-') &&
        !f.startsWith('builder') &&
        !f.startsWith('seed-helper') &&
        !f.startsWith('categories-meta') &&
        !f.startsWith('fix-') &&
        f.endsWith('.mjs')
    )
    .sort();

  console.log(`================================================================`);
  console.log(`🚀 Master Category Seeder: Starting seeding for ${files.length} categories`);
  console.log(`🎯 Target per category: 100 Easy | 70 Normal | 30 Hard = 200 Total`);
  console.log(`================================================================`);

  const results = [];
  let grandTotal = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(seedsDir, file);
    console.log(`\n[${i + 1}/${files.length}] Running ${file}...`);

    try {
      const module = await import(filePath);
      if (typeof module.seed === 'function') {
        const res = await module.seed();
        results.push({
          category: module.category.label,
          slug: module.category.slug,
          easy: module.sentences.easy.length,
          normal: module.sentences.normal.length,
          hard: module.sentences.hard.length,
          seeded: module.sentences.easy.length + module.sentences.normal.length + module.sentences.hard.length,
          totalInDb: res?.total || 'N/A',
        });
        grandTotal += (res?.total || 0);
      } else {
        console.warn(`⚠️ No seed() function exported in ${file}`);
      }
    } catch (err) {
      console.error(`❌ Error in ${file}:`, err);
    }
  }

  console.log(`\n================================================================`);
  console.log(`📊 SEEDING SUMMARY TABLE`);
  console.log(`================================================================`);
  console.table(results);
  console.log(`\n🎉 Grand Total Sentences in Database across all categories: ${grandTotal}`);
  console.log(`================================================================\n`);
}

main().catch((err) => {
  console.error('Fatal error running seed-all:', err);
  process.exit(1);
});
