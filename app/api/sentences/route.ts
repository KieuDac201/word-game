import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { SENTENCE_LIBRARIES, DIFFICULTY_CONFIGS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Support category, categoryId, or category_slug
  const categoryParam =
    searchParams.get('category') ||
    searchParams.get('categoryId') ||
    searchParams.get('category_slug');
  const category = categoryParam ? categoryParam.toLowerCase().trim() : null;

  // Support difficulty filter ('easy', 'normal', 'hard')
  const diffParam = searchParams.get('difficulty');
  const difficulty = diffParam ? diffParam.toLowerCase().trim() : null;

  // Support limit
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : null;

  try {
    const sql = getDb();

    // ─────────────────────────────────────────────────────────────
    // Case 1: Filter by BOTH Category and Difficulty
    // ─────────────────────────────────────────────────────────────
    if (category && difficulty) {
      const rows = limit
        ? await sql`
            SELECT id, category_slug, text, translation_vi, word_count, difficulty
            FROM sentences
            WHERE category_slug = ${category} AND difficulty = ${difficulty}
            ORDER BY RANDOM()
            LIMIT ${limit};
          `
        : await sql`
            SELECT id, category_slug, text, translation_vi, word_count, difficulty
            FROM sentences
            WHERE category_slug = ${category} AND difficulty = ${difficulty}
            ORDER BY RANDOM();
          `;

      const sentences = (rows as any[]).map((r) => r.text);
      const items = (rows as any[]).map((r) => ({
        id: r.id,
        text: r.text,
        translationVi: r.translation_vi || null,
        wordCount: r.word_count,
        difficulty: r.difficulty,
        categorySlug: r.category_slug,
      }));

      return NextResponse.json({
        category,
        difficulty,
        count: sentences.length,
        sentences,
        items,
        source: 'database',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // Case 2: Filter by Category ONLY
    // ─────────────────────────────────────────────────────────────
    if (category && !difficulty) {
      const rows = limit
        ? await sql`
            SELECT id, category_slug, text, translation_vi, word_count, difficulty
            FROM sentences
            WHERE category_slug = ${category}
            ORDER BY RANDOM()
            LIMIT ${limit};
          `
        : await sql`
            SELECT id, category_slug, text, translation_vi, word_count, difficulty
            FROM sentences
            WHERE category_slug = ${category}
            ORDER BY RANDOM();
          `;

      const sentences = (rows as any[]).map((r) => r.text);
      const items = (rows as any[]).map((r) => ({
        id: r.id,
        text: r.text,
        translationVi: r.translation_vi || null,
        wordCount: r.word_count,
        difficulty: r.difficulty,
        categorySlug: r.category_slug,
      }));

      // Also group by difficulty for convenience
      const byDifficulty: Record<string, string[]> = { easy: [], normal: [], hard: [] };
      for (const r of rows as any[]) {
        if (byDifficulty[r.difficulty]) {
          byDifficulty[r.difficulty].push(r.text);
        }
      }

      return NextResponse.json({
        category,
        difficulty: null,
        count: sentences.length,
        sentences,
        items,
        sentencesByDifficulty: byDifficulty,
        source: 'database',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // Case 3: Filter by Difficulty ONLY (across all categories)
    // ─────────────────────────────────────────────────────────────
    if (!category && difficulty) {
      const rows = limit
        ? await sql`
            SELECT id, category_slug, text, translation_vi, word_count, difficulty
            FROM sentences
            WHERE difficulty = ${difficulty}
            ORDER BY category_slug, RANDOM()
            LIMIT ${limit};
          `
        : await sql`
            SELECT id, category_slug, text, translation_vi, word_count, difficulty
            FROM sentences
            WHERE difficulty = ${difficulty}
            ORDER BY category_slug, RANDOM();
          `;

      const sentences = (rows as any[]).map((r) => r.text);
      const items = (rows as any[]).map((r) => ({
        id: r.id,
        text: r.text,
        translationVi: r.translation_vi || null,
        wordCount: r.word_count,
        difficulty: r.difficulty,
        categorySlug: r.category_slug,
      }));

      const grouped: Record<string, string[]> = {};
      for (const r of rows as any[]) {
        if (!grouped[r.category_slug]) grouped[r.category_slug] = [];
        grouped[r.category_slug].push(r.text);
      }

      return NextResponse.json({
        category: null,
        difficulty,
        count: sentences.length,
        sentences,
        items,
        sentencesByCategory: grouped,
        source: 'database',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // Case 4: No Filters — Return all sentences grouped
    // ─────────────────────────────────────────────────────────────
    const allRows = await sql`
      SELECT id, category_slug, text, translation_vi, word_count, difficulty
      FROM sentences
      ORDER BY category_slug, id;
    `;

    const grouped: Record<string, string[]> = {};
    const groupedByDiff: Record<string, Record<string, string[]>> = {};

    const translations: Record<string, string> = {};
    for (const r of allRows as any[]) {
      const cat = r.category_slug;
      const diff = r.difficulty;

      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(r.text);

      if (!groupedByDiff[cat]) groupedByDiff[cat] = { easy: [], normal: [], hard: [] };
      if (groupedByDiff[cat][diff]) {
        groupedByDiff[cat][diff].push(r.text);
      }

      if (r.translation_vi) {
        translations[r.text] = r.translation_vi;
      }
    }

    return NextResponse.json({
      count: (allRows as any[]).length,
      sentencesByCategory: grouped,
      sentencesByCategoryAndDifficulty: groupedByDiff,
      translations,
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch sentences from Neon DB, falling back to constants:', error);

    // Fallback: Filter in-memory constants by word count range
    const filterByDiffRange = (texts: string[], diff: string) => {
      const cfg = DIFFICULTY_CONFIGS[diff as keyof typeof DIFFICULTY_CONFIGS];
      if (!cfg) return texts;
      const [minW, maxW] = cfg.wordCountRange;
      return texts.filter((s) => {
        const words = s.split(/\s+/).length;
        return words >= minW && words <= maxW;
      });
    };

    if (category && SENTENCE_LIBRARIES[category as keyof typeof SENTENCE_LIBRARIES]) {
      let list = SENTENCE_LIBRARIES[category as keyof typeof SENTENCE_LIBRARIES];
      if (difficulty) {
        list = filterByDiffRange(list, difficulty);
      }
      return NextResponse.json({
        category,
        difficulty,
        count: list.length,
        sentences: list,
        items: list.map((text, idx) => ({
          id: idx,
          text,
          wordCount: text.split(/\s+/).length,
          difficulty: difficulty || 'normal',
          categorySlug: category,
        })),
        source: 'fallback',
      });
    }

    if (!category && difficulty) {
      const grouped: Record<string, string[]> = {};
      const flat: string[] = [];
      for (const [catSlug, texts] of Object.entries(SENTENCE_LIBRARIES)) {
        const filtered = filterByDiffRange(texts, difficulty);
        grouped[catSlug] = filtered;
        flat.push(...filtered);
      }
      return NextResponse.json({
        category: null,
        difficulty,
        count: flat.length,
        sentences: flat,
        sentencesByCategory: grouped,
        source: 'fallback',
      });
    }

    return NextResponse.json({
      sentencesByCategory: SENTENCE_LIBRARIES,
      source: 'fallback',
    });
  }
}
