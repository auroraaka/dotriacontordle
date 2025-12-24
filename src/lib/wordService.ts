const DATAMUSE_API = 'https://api.datamuse.com/words';
const WORD_LENGTH = 6;
const CACHE_KEY = 'dotriacontordle_word_cache';
const CACHE_EXPIRY_HOURS = 24;
const MIN_WORD_POOL_SIZE = 500;
const MIN_VALID_WORDS_SIZE = 2000;

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

    const cached = this.loadFromCache();
    if (cached) {
      this.validWordsSet = new Set(cached.validWords);
      this.answerPool = cached.answerPool;
      this.isInitialized = true;
      return;
    }

    try {
      await this.fetchAndCacheWords();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to fetch words from API, using fallback:', error);
      this.validWordsSet = new Set(FALLBACK_VALID_WORDS);
      this.answerPool = [...FALLBACK_ANSWERS];
      this.isInitialized = true;
    }
  }

  private async fetchAndCacheWords(): Promise<void> {
    const queries = [
      `${DATAMUSE_API}?sp=${'?'.repeat(WORD_LENGTH)}&max=1000&md=f`,
      `${DATAMUSE_API}?ml=common&sp=${'?'.repeat(WORD_LENGTH)}&max=500`,
      `${DATAMUSE_API}?ml=action&sp=${'?'.repeat(WORD_LENGTH)}&max=300`,
      `${DATAMUSE_API}?ml=thing&sp=${'?'.repeat(WORD_LENGTH)}&max=300`,
      `${DATAMUSE_API}?ml=place&sp=${'?'.repeat(WORD_LENGTH)}&max=300`,
      `${DATAMUSE_API}?ml=feeling&sp=${'?'.repeat(WORD_LENGTH)}&max=200`,
    ];

    const allWords = new Set<string>();
    const frequentWords: { word: string; freq: number }[] = [];

    for (const url of queries) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;

        const data: Array<{ word: string; tags?: string[] }> = await response.json();

        for (const item of data) {
          const word = item.word.toUpperCase();
          if (word.length !== WORD_LENGTH || !/^[A-Z]+$/.test(word)) continue;

          allWords.add(word);

          const freqTag = item.tags?.find(t => t.startsWith('f:'));
          if (freqTag) {
            const freq = parseFloat(freqTag.slice(2));
            frequentWords.push({ word, freq });
          }
        }
      } catch (e) {
        console.warn('Failed to fetch from:', url, e);
      }
    }

    frequentWords.sort((a, b) => b.freq - a.freq);
    const topWords = frequentWords.slice(0, MIN_WORD_POOL_SIZE).map(w => w.word);

    this.validWordsSet = new Set([...allWords, ...FALLBACK_VALID_WORDS]);
    this.answerPool = topWords.length >= 100 ? topWords : [...FALLBACK_ANSWERS];

    for (const word of this.answerPool) {
      this.validWordsSet.add(word);
    }

    this.saveToCache();
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
      const response = await fetch(`${DATAMUSE_API}?sp=${upperWord.toLowerCase()}&max=1`);
      if (!response.ok) return false;

      const data: Array<{ word: string }> = await response.json();
      const isValid = data.some(item => item.word.toUpperCase() === upperWord);

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
