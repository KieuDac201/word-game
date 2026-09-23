import { NextResponse } from "next/server";
import { getDb } from "@/lib/data/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const wordParam = searchParams.get("word");
  const firstLetterParam = searchParams.get("first");
  const randomParam = searchParams.get("random");
  const countParam = searchParams.get("count");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 20;

  try {
    const sql = getDb();

    // 1. Total count query
    if (countParam) {
      const [countRow] = await sql`SELECT count(*)::int as total FROM words;`;
      return NextResponse.json({ total: countRow.total });
    }

    // 2. Validate specific word
    if (wordParam) {
      const clean = wordParam.trim().toLowerCase();
      const rows = await sql`SELECT word, length, first_letter, last_letter, translate_vi FROM words WHERE word = ${clean} LIMIT 1;`;
      const found = rows.length > 0;
      return NextResponse.json({
        word: clean,
        valid: found,
        details: found ? rows[0] : null,
      });
    }

    // 3. Search words by starting letter
    if (firstLetterParam) {
      const char = firstLetterParam.trim().toLowerCase()[0];
      const rows = await sql`
        SELECT word, length, first_letter, last_letter, translate_vi
        FROM words
        WHERE first_letter = ${char}
        ORDER BY RANDOM()
        LIMIT ${limit};
      `;
      return NextResponse.json({
        firstLetter: char,
        count: rows.length,
        words: rows.map((r) => r.word),
        items: rows,
      });
    }

    // 4. Random starter word
    if (randomParam) {
      const rows = await sql`
        SELECT word, length, first_letter, last_letter, translate_vi
        FROM words
        WHERE length >= 4 AND length <= 8 AND translate_vi IS NOT NULL
        ORDER BY RANDOM()
        LIMIT 1;
      `;
      return NextResponse.json({
        word: rows[0]?.word || "clash",
        translationVi: rows[0]?.translate_vi || null,
      });
    }

    // Default: summary stats
    const [countRow] = await sql`SELECT count(*)::int as total FROM words;`;
    return NextResponse.json({
      message: "Neon Words Dictionary API",
      totalWords: countRow.total,
      usage: {
        validate: "/api/words?word=apple",
        byLetter: "/api/words?first=e&limit=10",
        random: "/api/words?random=1",
        count: "/api/words?count=1",
      },
    });
  } catch (error) {
    console.error("Neon words API error:", error);
    return NextResponse.json(
      { error: "Database query failed", details: String(error) },
      { status: 500 }
    );
  }
}
