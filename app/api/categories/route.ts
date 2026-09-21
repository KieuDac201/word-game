import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { LIBRARY_CATEGORIES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT 
        c.slug,
        c.label,
        c.icon,
        c.description,
        c.display_order,
        COUNT(s.id)::int AS sentence_count
      FROM categories c
      LEFT JOIN sentences s ON c.slug = s.category_slug
      GROUP BY c.slug, c.label, c.icon, c.description, c.display_order
      ORDER BY c.display_order ASC;
    `;

    if (rows && rows.length > 0) {
      const data = rows.map((r: any) => ({
        key: r.slug,
        slug: r.slug,
        label: r.label,
        icon: r.icon,
        description: r.description,
        displayOrder: r.display_order,
        sentenceCount: Number(r.sentence_count || 0),
      }));
      return NextResponse.json({ categories: data, source: 'database' });
    }
  } catch (error) {
    console.error('Failed to fetch categories from Neon DB, falling back to constants:', error);
  }

  // Fallback if DB is unavailable
  return NextResponse.json({
    categories: LIBRARY_CATEGORIES.map((c) => ({
      ...c,
      slug: c.key,
      sentenceCount: 0,
    })),
    source: 'fallback',
  });
}
