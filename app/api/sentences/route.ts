import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { SENTENCE_LIBRARIES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');

  try {
    const sql = getDb();

    if (category) {
      let rows;
      if (difficulty) {
        rows = await sql`
          SELECT text, word_count, difficulty
          FROM sentences
          WHERE category_slug = ${category} AND difficulty = ${difficulty}
          ORDER BY RANDOM();
        `;
        // Fallback to all sentences in this category if difficulty has too few
        if (!rows || rows.length < 5) {
          rows = await sql`
            SELECT text, word_count, difficulty
            FROM sentences
            WHERE category_slug = ${category}
            ORDER BY RANDOM();
          `;
        }
      } else {
        rows = await sql`
          SELECT text, word_count, difficulty
          FROM sentences
          WHERE category_slug = ${category}
          ORDER BY RANDOM();
        `;
      }

      const sentences = (rows as any[]).map((r) => r.text);
      return NextResponse.json({ sentences, source: 'database' });
    }

    // Fetch all sentences grouped by category
    const allRows = await sql`
      SELECT category_slug, text, word_count, difficulty
      FROM sentences
      ORDER BY category_slug, id;
    `;

    const grouped: Record<string, string[]> = {};
    for (const r of allRows as any[]) {
      if (!grouped[r.category_slug]) grouped[r.category_slug] = [];
      grouped[r.category_slug].push(r.text);
    }

    return NextResponse.json({ sentencesByCategory: grouped, source: 'database' });
  } catch (error) {
    console.error('Failed to fetch sentences from Neon DB, falling back to constants:', error);

    if (category && SENTENCE_LIBRARIES[category as keyof typeof SENTENCE_LIBRARIES]) {
      return NextResponse.json({
        sentences: SENTENCE_LIBRARIES[category as keyof typeof SENTENCE_LIBRARIES],
        source: 'fallback',
      });
    }

    return NextResponse.json({
      sentencesByCategory: SENTENCE_LIBRARIES,
      source: 'fallback',
    });
  }
}
