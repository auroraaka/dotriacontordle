import { DEFAULT_WORD_LENGTH } from '@/types/game';
import { hasDictionaryForLength, loadDictionary } from './dictionaries';

class WordService {
  private validWordsByLength = new Map<number, Set<string>>();
  private answerPoolByLength = new Map<number, string[]>();

  private normalizeLength(wordLength: number): number {
    return Math.max(1, Math.round(wordLength));
  }

  private ensureLoaded(wordLength: number): void {
    const normalizedLength = this.normalizeLength(wordLength);
    if (this.validWordsByLength.has(normalizedLength) && this.answerPoolByLength.has(normalizedLength)) return;

    if (!hasDictionaryForLength(normalizedLength)) {
      this.validWordsByLength.set(normalizedLength, new Set());
      this.answerPoolByLength.set(normalizedLength, []);
      return;
    }

    const dictionary = loadDictionary(normalizedLength);
    const validWords = dictionary.validWords
      .map((w) => w.toUpperCase())
      .filter((w) => w.length === normalizedLength);
    const answerWords = dictionary.answerWords
      .map((w) => w.toUpperCase())
      .filter((w) => w.length === normalizedLength);

    this.validWordsByLength.set(normalizedLength, new Set(validWords));
    this.answerPoolByLength.set(normalizedLength, Array.from(new Set(answerWords)));
  }

  async initialize(wordLength = DEFAULT_WORD_LENGTH): Promise<void> {
    this.ensureLoaded(wordLength);
  }

  async isValidWord(word: string, wordLength: number): Promise<boolean> {
    if (word.length !== wordLength) return false;
    if (!/^[A-Za-z]+$/.test(word)) return false;

    this.ensureLoaded(wordLength);

    const upperWord = word.toUpperCase();
    const validWords = this.validWordsByLength.get(this.normalizeLength(wordLength));
    if (!validWords) return false;
    return validWords.has(upperWord);
  }

  getRandomAnswers(count: number, wordLength: number): string[] {
    const normalizedCount = Math.max(0, Math.round(count));
    this.ensureLoaded(wordLength);
    const pool = this.answerPoolByLength.get(wordLength) ?? [];
    if (pool.length === 0) return [];

    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, normalizedCount);
  }

}

export const wordService = new WordService();

export const isValidWord = (word: string, wordLength = DEFAULT_WORD_LENGTH) => wordService.isValidWord(word, wordLength);
export const getRandomAnswers = (count: number, wordLength = DEFAULT_WORD_LENGTH) => wordService.getRandomAnswers(count, wordLength);
export const initializeWordService = (wordLength = DEFAULT_WORD_LENGTH) => wordService.initialize(wordLength);
