/**
 * Word Service - Fetches words dynamically from Datamuse API
 * with local caching for performance and offline support
 */

const DATAMUSE_API = 'https://api.datamuse.com/words';
const WORD_LENGTH = 6;
const CACHE_KEY = 'dotriacontordle_word_cache';
const CACHE_EXPIRY_HOURS = 24;

// Minimum words we need for the game to function
const MIN_ANSWER_POOL_SIZE = 500;
const MIN_VALID_WORDS_SIZE = 2000;

interface WordCache {
  validWords: string[];
  answerPool: string[];
  timestamp: number;
}

// Small fallback list for offline/error scenarios
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

  /**
   * Initialize the word service - fetches and caches words
   */
  async initialize(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    if (this.isInitialized) return;

    // Try to load from cache first
    const cached = this.loadFromCache();
    if (cached) {
      this.validWordsSet = new Set(cached.validWords);
      this.answerPool = cached.answerPool;
      this.isInitialized = true;
      console.log(`Loaded ${this.validWordsSet.size} valid words and ${this.answerPool.length} answers from cache`);
      return;
    }

    // Fetch fresh words from API
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

  /**
   * Fetch words from Datamuse API
   */
  private async fetchAndCacheWords(): Promise<void> {
    console.log('Fetching words from Datamuse API...');

    // Fetch common 6-letter words (sp=?????? matches 6 chars, md=f gets frequency)
    // We use multiple queries to get a good variety
    const queries = [
      // Common words by frequency
      `${DATAMUSE_API}?sp=${'?'.repeat(WORD_LENGTH)}&max=1000&md=f`,
      // Words related to common topics for variety
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

          // Only accept exactly 6 letters, alphabetic only
          if (word.length !== WORD_LENGTH || !/^[A-Z]+$/.test(word)) continue;

          allWords.add(word);

          // Extract frequency if available
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

    // Sort by frequency and take the most common for the answer pool
    frequentWords.sort((a, b) => b.freq - a.freq);
    const topWords = frequentWords
      .slice(0, MIN_ANSWER_POOL_SIZE)
      .map(w => w.word);

    // Use all fetched words as valid words, add fallbacks to ensure minimum
    this.validWordsSet = new Set([...allWords, ...FALLBACK_VALID_WORDS]);
    this.answerPool = topWords.length >= 100 ? topWords : [...FALLBACK_ANSWERS];

    // Ensure answer pool words are in valid words
    for (const word of this.answerPool) {
      this.validWordsSet.add(word);
    }

    console.log(`Fetched ${this.validWordsSet.size} valid words and ${this.answerPool.length} answers`);

    // Cache the results
    this.saveToCache();
  }

  /**
   * Check if a word is valid
   */
  isValidWord(word: string): boolean {
    if (!this.isInitialized) {
      // Fallback check if not initialized
      return FALLBACK_VALID_WORDS.has(word.toUpperCase());
    }
    return this.validWordsSet.has(word.toUpperCase());
  }

  /**
   * Validate a word against the API in real-time (for unknown words)
   */
  async validateWordOnline(word: string): Promise<boolean> {
    if (word.length !== WORD_LENGTH) return false;

    const upperWord = word.toUpperCase();

    // Check cache first
    if (this.validWordsSet.has(upperWord)) return true;

    // Query API to verify
    try {
      const response = await fetch(`${DATAMUSE_API}?sp=${word.toLowerCase()}&max=1`);
      if (!response.ok) return false;

      const data: Array<{ word: string }> = await response.json();
      const isValid = data.some(item => item.word.toUpperCase() === upperWord);

      // Add to cache if valid
      if (isValid) {
        this.validWordsSet.add(upperWord);
        this.saveToCache();
      }

      return isValid;
    } catch {
      return false;
    }
  }

  /**
   * Get random answers for freeplay mode
   */
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

  /**
   * Load words from localStorage cache
   */
  private loadFromCache(): WordCache | null {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: WordCache = JSON.parse(cached);

      // Check if cache is expired
      const ageHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);
      if (ageHours > CACHE_EXPIRY_HOURS) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      // Validate cache has enough data
      if (data.validWords.length < MIN_VALID_WORDS_SIZE / 2 ||
          data.answerPool.length < MIN_ANSWER_POOL_SIZE / 2) {
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  /**
   * Save words to localStorage cache
   */
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

  /**
   * Force refresh words from API
   */
  async refreshWords(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
    this.isInitialized = false;
    this.initPromise = null;
    await this.initialize();
  }

  /**
   * Get stats about loaded words
   */
  getStats(): { validWords: number; answerPool: number; isInitialized: boolean } {
    return {
      validWords: this.validWordsSet.size,
      answerPool: this.answerPool.length,
      isInitialized: this.isInitialized,
    };
  }
}

// Singleton instance
export const wordService = new WordService();

// Convenience exports
export const isValidWord = (word: string) => wordService.isValidWord(word);
export const validateWordOnline = (word: string) => wordService.validateWordOnline(word);
export const getRandomAnswers = (count: number) => wordService.getRandomAnswers(count);
export const initializeWordService = () => wordService.initialize();
export const refreshWordService = () => wordService.refreshWords();

