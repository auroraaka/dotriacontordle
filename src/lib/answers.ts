export { getRandomAnswers, initializeWordService } from './wordService';

import { loadDictionary } from './dictionaries';

function seededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDailyAnswersFromPool(count: number, seed: number, wordLength = 6): string[] {
  const { answerWords } = loadDictionary(wordLength);
  const shuffled = [...answerWords];
  const random = seededRandom(seed);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

export const WORD_POOL: string[] = loadDictionary(6).answerWords;
