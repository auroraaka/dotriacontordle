import wordsData from './words.json';

const WORD_LENGTH = 6;

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
    return false;
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
}

export const wordService = new WordService();

export const isValidWord = (word: string) => wordService.isValidWord(word);
export const getRandomAnswers = (count: number) => wordService.getRandomAnswers(count);
export const initializeWordService = () => wordService.initialize();
