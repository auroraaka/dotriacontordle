import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wordService, isValidWord, getRandomAnswers, initializeWordService } from '@/lib/wordService';

describe('wordService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('isValidWord', () => {
    it('rejects words with wrong length', async () => {
      expect(await isValidWord('CAT')).toBe(false);
      expect(await isValidWord('CASTLES')).toBe(false);
      expect(await isValidWord('')).toBe(false);
    });

    it('rejects words with non-alphabetic characters', async () => {
      expect(await isValidWord('CAST1E')).toBe(false);
      expect(await isValidWord('CAS-LE')).toBe(false);
      expect(await isValidWord('CAST E')).toBe(false);
    });

    it('accepts valid fallback words', async () => {
      expect(await isValidWord('ABROAD')).toBe(true);
      expect(await isValidWord('ACTION')).toBe(true);
      expect(await isValidWord('ANIMAL')).toBe(true);
    });

    it('is case insensitive', async () => {
      expect(await isValidWord('abroad')).toBe(true);
      expect(await isValidWord('ABROAD')).toBe(true);
      expect(await isValidWord('Abroad')).toBe(true);
    });
  });

  describe('getRandomAnswers', () => {
    it('returns requested number of answers', () => {
      const answers = getRandomAnswers(10);
      expect(answers).toHaveLength(10);
    });

    it('returns 32 answers for full game', () => {
      const answers = getRandomAnswers(32);
      expect(answers).toHaveLength(32);
    });

    it('returns valid 6-letter words', () => {
      const answers = getRandomAnswers(32);
      answers.forEach(answer => {
        expect(answer).toMatch(/^[A-Z]{6}$/);
      });
    });

    it('returns different results on each call (shuffled)', () => {
      const answers1 = getRandomAnswers(32);
      const answers2 = getRandomAnswers(32);
      expect(answers1).not.toEqual(answers2);
    });
  });

  describe('initializeWordService', () => {
    it('can be called multiple times safely', async () => {
      await initializeWordService();
      await initializeWordService();
      expect(true).toBe(true);
    });
  });
});

