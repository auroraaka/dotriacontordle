import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveGameState,
  loadGameState,
  loadStats,
  saveStats,
  loadSettings,
  saveSettings,
  createInitialBoards,
} from '@/lib/storage';
import { GameState, GameStats, GameSettings, MAX_GUESSES } from '@/types/game';

describe('Game State Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockGameState: GameState = {
    boards: [{ answer: 'CASTLE', solved: false, solvedAtGuess: null }],
    guesses: ['DRAGON'],
    currentGuess: 'CAS',
    gameStatus: 'playing',
    keyboardState: { C: 'present', A: 'correct' },
    expandedBoard: null,
    gameMode: 'daily',
    dailyNumber: 42,
  };

  it('saves and loads daily game state', () => {
    saveGameState(mockGameState, 'daily');
    const loaded = loadGameState('daily', 42);
    
    expect(loaded).not.toBeNull();
    expect(loaded?.guesses).toEqual(['DRAGON']);
    expect(loaded?.currentGuess).toBe('CAS');
    expect(loaded?.dailyNumber).toBe(42);
  });

  it('saves and loads free game state', () => {
    saveGameState({ ...mockGameState, gameMode: 'free' }, 'free');
    const loaded = loadGameState('free');
    
    expect(loaded).not.toBeNull();
    expect(loaded?.gameMode).toBe('free');
  });

  it('returns null for different daily number', () => {
    saveGameState(mockGameState, 'daily');
    const loaded = loadGameState('daily', 43);
    
    expect(loaded).toBeNull();
  });

  it('returns null when no state saved', () => {
    const loaded = loadGameState('daily', 1);
    expect(loaded).toBeNull();
  });
});

describe('Stats Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default stats when none saved', () => {
    const stats = loadStats();
    
    expect(stats.gamesPlayed).toBe(0);
    expect(stats.gamesWon).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.maxStreak).toBe(0);
    expect(stats.guessDistribution).toHaveLength(MAX_GUESSES);
  });

  it('saves and loads stats correctly', () => {
    const stats: GameStats = {
      gamesPlayed: 10,
      gamesWon: 8,
      currentStreak: 3,
      maxStreak: 5,
      guessDistribution: new Array(MAX_GUESSES).fill(0),
      lastPlayedDaily: 42,
      lastCompletedDaily: 42,
    };
    
    saveStats(stats);
    const loaded = loadStats();
    
    expect(loaded.gamesPlayed).toBe(10);
    expect(loaded.gamesWon).toBe(8);
    expect(loaded.currentStreak).toBe(3);
    expect(loaded.maxStreak).toBe(5);
    expect(loaded.lastPlayedDaily).toBe(42);
  });

  it('increments gamesPlayed and gamesWon on win', () => {
    const initial: GameStats = {
      gamesPlayed: 5,
      gamesWon: 3,
      currentStreak: 2,
      maxStreak: 4,
      guessDistribution: new Array(MAX_GUESSES).fill(0),
      lastPlayedDaily: null,
      lastCompletedDaily: null,
    };
    saveStats(initial);

    const afterWin: GameStats = {
      ...initial,
      gamesPlayed: initial.gamesPlayed + 1,
      gamesWon: initial.gamesWon + 1,
      currentStreak: initial.currentStreak + 1,
    };
    saveStats(afterWin);
    const loaded = loadStats();

    expect(loaded.gamesPlayed).toBe(6);
    expect(loaded.gamesWon).toBe(4);
    expect(loaded.currentStreak).toBe(3);
  });

  it('resets streak on loss', () => {
    const withStreak: GameStats = {
      gamesPlayed: 5,
      gamesWon: 5,
      currentStreak: 5,
      maxStreak: 5,
      guessDistribution: new Array(MAX_GUESSES).fill(0),
      lastPlayedDaily: null,
      lastCompletedDaily: null,
    };
    saveStats(withStreak);

    const afterLoss: GameStats = {
      ...withStreak,
      gamesPlayed: 6,
      currentStreak: 0,
    };
    saveStats(afterLoss);
    const loaded = loadStats();

    expect(loaded.currentStreak).toBe(0);
    expect(loaded.maxStreak).toBe(5);
  });
});

describe('Settings Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default settings when none saved', () => {
    const settings = loadSettings();
    expect(settings.glowMode).toBe(false);
  });

  it('saves and loads settings', () => {
    const settings: GameSettings = { glowMode: true };
    
    saveSettings(settings);
    const loaded = loadSettings();
    
    expect(loaded.glowMode).toBe(true);
  });
});

describe('createInitialBoards', () => {
  it('creates board states from answers', () => {
    const answers = ['CASTLE', 'DRAGON', 'BRIDGE'];
    const boards = createInitialBoards(answers);
    
    expect(boards).toHaveLength(3);
    expect(boards[0]).toEqual({ answer: 'CASTLE', solved: false, solvedAtGuess: null });
    expect(boards[1]).toEqual({ answer: 'DRAGON', solved: false, solvedAtGuess: null });
    expect(boards[2]).toEqual({ answer: 'BRIDGE', solved: false, solvedAtGuess: null });
  });

  it('handles empty array', () => {
    const boards = createInitialBoards([]);
    expect(boards).toHaveLength(0);
  });
});
