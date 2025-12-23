export type TileState = 'empty' | 'tbd' | 'correct' | 'present' | 'absent';

export interface BoardState {
  answer: string;
  solved: boolean;
  solvedAtGuess: number | null;
}

export interface GameState {
  boards: BoardState[];
  guesses: string[];
  currentGuess: string;
  gameStatus: 'playing' | 'won' | 'lost';
  keyboardState: Record<string, TileState>;
  expandedBoard: number | null;
  gameMode: 'daily' | 'free';
  dailyNumber: number;
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
  hardMode: boolean;
  glowMode: boolean;
}

export interface EvaluationResult {
  states: TileState[];
  isCorrect: boolean;
}

export const WORD_LENGTH = 6;
export const NUM_BOARDS = 32;
export const MAX_GUESSES = 37;
export const BOARD_COLS = 8;
export const BOARD_ROWS = 4;

export const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
];
