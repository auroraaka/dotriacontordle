export type TileState = 'empty' | 'tbd' | 'correct' | 'present' | 'absent';

export interface GameConfig {
  wordLength: number;
  boardCount: number;
  maxGuesses: number;
  profileId: string;
}

export interface BoardState {
  answer: string;
  solved: boolean;
  solvedAtGuess: number | null;
}

export interface GameState {
  config: GameConfig;
  boards: BoardState[];
  guesses: string[];
  currentGuess: string;
  gameStatus: 'playing' | 'won' | 'lost';
  keyboardState: Record<string, TileState>;
  expandedBoard: number | null;
  gameMode: 'daily' | 'free';
  dailyNumber: number;
  startedAt: number | null;
  endedAt: number | null;
  timerRunning: boolean;
  timerBaseElapsedMs: number;
  timerResumedAt: number | null;
  timerToggledAt: number | null;
  gameId: string;
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
  lastPlayedDaily: number | null;
  lastCompletedDaily: number | null;
}

export interface GameSettings {
  glowMode: boolean;
  feedbackEnabled: boolean;
  preferredWordLength: number;
  preferredBoardCount: number;
  preferredMaxGuesses: number;
}

export interface EvaluationResult {
  states: TileState[];
  isCorrect: boolean;
}

export const DEFAULT_WORD_LENGTH = 6;
export const DEFAULT_BOARD_COUNT = 32;
export const DEFAULT_MAX_GUESSES = 37;
export const WORD_LENGTH = DEFAULT_WORD_LENGTH;
export const NUM_BOARDS = DEFAULT_BOARD_COUNT;
export const MAX_GUESSES = DEFAULT_MAX_GUESSES;
export const MIN_WORD_LENGTH = 4;
export const MAX_WORD_LENGTH = 10;
export const MIN_BOARD_COUNT = 1;
export const MAX_BOARD_COUNT = 128;
export const MIN_GUESS_COUNT = 1;

export const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
];

export const KEY_STATE_STYLES: Record<TileState | 'default', string> = {
  default: 'bg-key-default hover:bg-key-hover',
  empty: 'bg-key-default hover:bg-key-hover',
  tbd: 'bg-key-default hover:bg-key-hover',
  correct: 'bg-tile-correct hover:brightness-110',
  present: 'bg-tile-present hover:brightness-110',
  absent: 'bg-key-absent hover:brightness-110',
};
