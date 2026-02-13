import words4 from './4.json';
import words5 from './5.json';
import words6 from './6.json';
import words7 from './7.json';
import words8 from './8.json';
import words9 from './9.json';
import words10 from './10.json';

export type DictionaryData = {
  validWords: string[];
  answerWords: string[];
};

const dictionariesByLength: Record<number, string[]> = {
  4: words4,
  5: words5,
  6: words6,
  7: words7,
  8: words8,
  9: words9,
  10: words10,
};

const normalizedWordsByLength: Record<number, string[]> = Object.fromEntries(
  Object.entries(dictionariesByLength).map(([length, words]) => [
    Number(length),
    words.map((w) => w.toUpperCase()),
  ])
) as Record<number, string[]>;

export function hasDictionaryForLength(wordLength: number): boolean {
  return wordLength in normalizedWordsByLength;
}

export function loadDictionary(wordLength: number): DictionaryData {
  const words = normalizedWordsByLength[wordLength] ?? [];
  return {
    validWords: words,
    answerWords: words,
  };
}
