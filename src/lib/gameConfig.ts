import {
  DEFAULT_BOARD_COUNT,
  DEFAULT_MAX_GUESSES,
  DEFAULT_WORD_LENGTH,
  GameConfig,
  MAX_BOARD_COUNT,
  MAX_WORD_LENGTH,
  MIN_BOARD_COUNT,
  MIN_GUESS_COUNT,
  MIN_WORD_LENGTH,
} from '@/types/game';

export const DEFAULT_GAME_CONFIG: GameConfig = {
  wordLength: DEFAULT_WORD_LENGTH,
  boardCount: DEFAULT_BOARD_COUNT,
  maxGuesses: DEFAULT_MAX_GUESSES,
  profileId: createProfileId({
    wordLength: DEFAULT_WORD_LENGTH,
    boardCount: DEFAULT_BOARD_COUNT,
    maxGuesses: DEFAULT_MAX_GUESSES,
  }),
};

function toSafeInteger(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.round(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function createProfileId(
  config: Pick<GameConfig, 'wordLength' | 'boardCount' | 'maxGuesses'>
): string {
  return `${config.wordLength}x${config.boardCount}x${config.maxGuesses}`;
}

export function normalizeGameConfig(input?: Partial<GameConfig> | null): GameConfig {
  const wordLength = clamp(
    toSafeInteger(input?.wordLength, DEFAULT_WORD_LENGTH),
    MIN_WORD_LENGTH,
    MAX_WORD_LENGTH
  );
  const boardCount = clamp(
    toSafeInteger(input?.boardCount, DEFAULT_BOARD_COUNT),
    MIN_BOARD_COUNT,
    MAX_BOARD_COUNT
  );
  const maxGuesses = Math.max(
    MIN_GUESS_COUNT,
    toSafeInteger(input?.maxGuesses, DEFAULT_MAX_GUESSES)
  );

  return {
    wordLength,
    boardCount,
    maxGuesses,
    profileId: createProfileId({ wordLength, boardCount, maxGuesses }),
  };
}

export function getDefaultMaxGuesses(wordLength: number, boardCount: number): number {
  return Math.max(MIN_GUESS_COUNT, boardCount + wordLength - 1);
}
