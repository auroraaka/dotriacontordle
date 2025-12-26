const WORD_LENGTH = 6;
const CACHE_KEY = 'dotriacontordle_word_cache';
const CACHE_EXPIRY_HOURS = 24;
const MIN_WORD_POOL_SIZE = 500;
const MIN_VALID_WORDS_SIZE = 2000;

import wordsData from './words.json';

const pendingValidations = new Map<string, Promise<boolean>>();

interface WordCache {
  validWords: string[];
  answerPool: string[];
  timestamp: number;
}

const FALLBACK_ANSWERS: string[] = [
  'ABROAD', 'ACTION', 'ANIMAL', 'ANSWER', 'BEAUTY', 'BEFORE', 'BETTER', 'BORDER',
  'BOTTLE', 'BRANCH', 'BREATH', 'BRIDGE', 'BRIGHT', 'BROKEN', 'BUDGET', 'BUTTON',
  'CAMERA', 'CANCEL', 'CARBON', 'CAREER', 'CASTLE', 'CAUGHT', 'CENTER', 'CHANCE',
  'CHANGE', 'CHARGE', 'CHEESE', 'CHOICE', 'CHURCH', 'CIRCLE', 'CLIENT', 'CLOSED',
  'COFFEE', 'COLUMN', 'COMING', 'COMMON', 'CORNER', 'COTTON', 'COUPLE', 'COURSE',
  'CREATE', 'CREDIT', 'CRISIS', 'CUSTOM', 'DAMAGE', 'DANGER', 'DECADE', 'DECIDE',
  'DEFINE', 'DEGREE', 'DELETE', 'DEMAND', 'DESIGN', 'DETAIL', 'DEVICE', 'DIFFER',
  'DINNER', 'DIRECT', 'DOCTOR', 'DOMAIN', 'DOUBLE', 'DRAGON', 'DRIVEN', 'DURING',
];

const FALLBACK_VALID_WORDS = new Set([
  ...FALLBACK_ANSWERS,
  'ABSORB', 'ACCEPT', 'ACCESS', 'ACCORD', 'ACCUSE', 'ACROSS', 'ACTIVE', 'ACTUAL',
  'ADVICE', 'ADVISE', 'AFFAIR', 'AFFECT', 'AFFORD', 'AFRAID', 'AGENCY', 'AGENDA',
  'ALMOST', 'ALUMNI', 'ALWAYS', 'AMOUNT', 'ANNUAL', 'ANYONE', 'ANYWAY', 'APPEAL',
  'APPEAR', 'AROUND', 'ARRIVE', 'ARTIST', 'ASKING', 'ASPECT', 'ASSESS', 'ASSIST',
  'ASSUME', 'ATTACK', 'ATTEND', 'AUTHOR', 'AVENUE', 'BACKUP', 'BANANA', 'BARELY',
  'BATTLE', 'BECAME', 'BECOME', 'BEHALF', 'BEHAVE', 'BEHIND', 'BELIEF', 'BELONG',
  'BESIDE', 'BEYOND', 'BISHOP', 'BITTER', 'BOUNCE', 'BORROW', 'BOTTOM', 'BOUGHT',
]);

class WordService {
  private validWordsSet: Set<string> = new Set();
  private answerPool: string[] = [];
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    if (this.isInitialized) return;

    const localWords = (wordsData as string[]).map((w) => w.toUpperCase());
    this.validWordsSet = new Set(localWords);
    this.answerPool = [...localWords];

    const cached = this.loadFromCache();
    if (cached) {
      for (const w of cached.validWords) this.validWordsSet.add(w.toUpperCase());
      this.answerPool = cached.answerPool.length > 0 ? cached.answerPool : this.answerPool;
      this.isInitialized = true;
      return;
    }

    for (const w of FALLBACK_VALID_WORDS) this.validWordsSet.add(w);
    this.isInitialized = true;
  }

  async isValidWord(word: string): Promise<boolean> {
    if (word.length !== WORD_LENGTH) return false;
    if (!/^[A-Za-z]+$/.test(word)) return false;

    const upperWord = word.toUpperCase();

    if (this.validWordsSet.has(upperWord)) return true;
    if (FALLBACK_VALID_WORDS.has(upperWord)) {
      this.validWordsSet.add(upperWord);
      return true;
    }

    const pending = pendingValidations.get(upperWord);
    if (pending) return pending;

    const validationPromise = this.validateWithApi(upperWord);
    pendingValidations.set(upperWord, validationPromise);

    try {
      return await validationPromise;
    } finally {
      pendingValidations.delete(upperWord);
    }
  }

  private async validateWithApi(upperWord: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/validate?word=${encodeURIComponent(upperWord)}`);
      if (!response.ok) return false;

      const data: { valid?: boolean } = await response.json();
      const isValid = data.valid === true;

      if (isValid) {
        this.validWordsSet.add(upperWord);
        this.saveToCache();
      }

      return isValid;
    } catch {
      return false;
    }
  }

  getRandomAnswers(count: number): string[] {
    const pool = this.isInitialized && this.answerPool.length > 0
      ? this.answerPool
      : FALLBACK_ANSWERS;

    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
  }

  private loadFromCache(): WordCache | null {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: WordCache = JSON.parse(cached);

      const ageHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);
      if (ageHours > CACHE_EXPIRY_HOURS) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      if (data.validWords.length < MIN_VALID_WORDS_SIZE / 2 ||
          data.answerPool.length < MIN_WORD_POOL_SIZE / 2) {
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  private saveToCache(): void {
    if (typeof window === 'undefined') return;

    try {
      const cache: WordCache = {
        validWords: Array.from(this.validWordsSet),
        answerPool: this.answerPool,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.warn('Failed to save word cache:', e);
    }
  }
}

export const wordService = new WordService();

export const isValidWord = (word: string) => wordService.isValidWord(word);
export const getRandomAnswers = (count: number) => wordService.getRandomAnswers(count);
export const initializeWordService = () => wordService.initialize();
