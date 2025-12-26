import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DATAMUSE_API = 'https://api.datamuse.com/words';
const WORD_LENGTH = 6;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const word = (searchParams.get('word') ?? '').trim();

  if (word.length !== WORD_LENGTH || !/^[A-Za-z]+$/.test(word)) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  try {
    const upperWord = word.toUpperCase();
    const response = await fetch(`${DATAMUSE_API}?sp=${upperWord.toLowerCase()}&max=1`, {
      cache: 'force-cache',
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) return NextResponse.json({ valid: false }, { status: 200 });

    const data: Array<{ word: string }> = await response.json();
    const valid = data.some((item) => item.word.toUpperCase() === upperWord);

    return NextResponse.json(
      { valid },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      }
    );
  } catch {
    // Fail closed but do not throw (prevents noisy errors / broken gameplay).
    return NextResponse.json({ valid: false }, { status: 200 });
  }
}


