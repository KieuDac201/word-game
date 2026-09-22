import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function fetchMyMemoryTranslation(text: string): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=en|vi`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WordGameBot/1.0)',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (translated && typeof translated === 'string' && !translated.startsWith('MYMEMORY WARNING:')) {
      return translated.trim();
    }
    return null;
  } catch (err) {
    console.warn('MyMemory translation error:', err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const texts: string[] = Array.isArray(body.texts)
      ? body.texts
      : body.text
      ? [body.text]
      : [];

    if (texts.length === 0) {
      return NextResponse.json({ translations: {} });
    }

    const uniqueTexts = Array.from(new Set(texts.map((t) => t.trim()).filter(Boolean)));
    const translations: Record<string, string> = {};

    let sql: any = null;
    try {
      sql = getDb();
    } catch {
      // Offline fallback
    }

    // 1. Look up existing translations in Neon DB
    const missingTexts: string[] = [];
    if (sql) {
      try {
        const rows = await sql`
          SELECT text, translation_vi
          FROM sentences
          WHERE text = ANY(${uniqueTexts}) AND translation_vi IS NOT NULL;
        `;
        for (const r of rows as any[]) {
          if (r.translation_vi) {
            translations[r.text] = r.translation_vi;
          }
        }
      } catch (err) {
        console.warn('Failed querying DB for translations:', err);
      }
    }

    for (const t of uniqueTexts) {
      if (!translations[t]) {
        missingTexts.push(t);
      }
    }

    // 2. Fetch missing translations dynamically via MyMemory (limit to max 10 at once to be fast)
    const toFetch = missingTexts.slice(0, 15);
    await Promise.all(
      toFetch.map(async (text) => {
        const translated = await fetchMyMemoryTranslation(text);
        if (translated) {
          translations[text] = translated;
          // Optionally cache into Neon DB asynchronously
          if (sql) {
            try {
              await sql`
                UPDATE sentences
                SET translation_vi = ${translated}
                WHERE text = ${text} AND translation_vi IS NULL;
              `;
            } catch {
              // Ignore cache update error
            }
          }
        }
      })
    );

    return NextResponse.json({
      success: true,
      translations,
    });
  } catch (error) {
    console.error('Translation route error:', error);
    return NextResponse.json({ success: false, translations: {} }, { status: 500 });
  }
}
