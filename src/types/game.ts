// Tile states
export type TileState = 'empty' | 'tbd' | 'correct' | 'present' | 'absent';

// Board state
export interface BoardState {
  answer: string;
  solved: boolean;
  solvedAtGuess: number | null;
}

// Game state
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

// Game statistics
export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[]; // Index = number of guesses used - 1
  lastPlayedDaily: number | null;
  lastCompletedDaily: number | null;
}

// Game settings
export interface GameSettings {
  hardMode: boolean;
  glowMode: boolean;
}

// Evaluation result for a single guess
export interface EvaluationResult {
  states: TileState[];
  isCorrect: boolean;
}

// Game constants
export const WORD_LENGTH = 6;
export const NUM_BOARDS = 32;
export const MAX_GUESSES = 37;
export const BOARD_COLS = 8;
export const BOARD_ROWS = 4;

// Keyboard layout
export const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
];

