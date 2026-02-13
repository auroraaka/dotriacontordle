import { describe, it, expect } from 'vitest';
import { WORD_POOL, getDailyAnswersFromPool } from '@/lib/answers';

describe('WORD_POOL', () => {
  it('contains at least 400 words for variety', () => {
    expect(WORD_POOL.length).toBeGreaterThanOrEqual(400);
  });

  it('contains only 6-letter uppercase words', () => {
    WORD_POOL.forEach((word) => {
      expect(word).toMatch(/^[A-Z]{6}$/);
    });
  });

  it('contains no duplicates', () => {
    const uniqueWords = new Set(WORD_POOL);
    expect(uniqueWords.size).toBe(WORD_POOL.length);
  });
});

describe('getDailyAnswersFromPool', () => {
  it('returns requested count of answers', () => {
    const answers = getDailyAnswersFromPool(10, 12345);
    expect(answers).toHaveLength(10);
  });

  it('returns consistent results for same seed', () => {
    const answers1 = getDailyAnswersFromPool(32, 99999);
    const answers2 = getDailyAnswersFromPool(32, 99999);
    expect(answers1).toEqual(answers2);
  });

  it('returns different results for different seeds', () => {
    const answers1 = getDailyAnswersFromPool(32, 11111);
    const answers2 = getDailyAnswersFromPool(32, 22222);
    expect(answers1).not.toEqual(answers2);
  });

  it('returns words from the answer pool', () => {
    const answers = getDailyAnswersFromPool(32, 54321);
    answers.forEach((answer) => {
      expect(WORD_POOL).toContain(answer);
    });
  });

  it('returns unique words (no duplicates in result)', () => {
    const answers = getDailyAnswersFromPool(32, 12345);
    const uniqueAnswers = new Set(answers);
    expect(uniqueAnswers.size).toBe(32);
  });
});
