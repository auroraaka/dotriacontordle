import { GameState, GameStats, GameSettings, BoardState, NUM_BOARDS, MAX_GUESSES } from '@/types/game';

const STORAGE_KEYS = {
  DAILY_STATE: 'dotriacontordle_daily_state',
  FREE_STATE: 'dotriacontordle_free_state',
  STATS: 'dotriacontordle_stats',
  SETTINGS: 'dotriacontordle_settings',
} as const;

// Default values
const DEFAULT_STATS: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: new Array(MAX_GUESSES).fill(0),
  lastPlayedDaily: null,
  lastCompletedDaily: null,
};

const DEFAULT_SETTINGS: GameSettings = {
  hardMode: false,
  glowMode: false,
};

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save game state to localStorage
 */
export function saveGameState(state: GameState, mode: 'daily' | 'free'): void {
  if (!isStorageAvailable()) return;
  
  const key = mode === 'daily' ? STORAGE_KEYS.DAILY_STATE : STORAGE_KEYS.FREE_STATE;
  const stateToSave = {
    ...state,
    // Only save essential data for daily mode
    savedAt: Date.now(),
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}

/**
 * Load game state from localStorage
 */
export function loadGameState(mode: 'daily' | 'free', currentDailyNumber?: number): GameState | null {
  if (!isStorageAvailable()) return null;
  
  const key = mode === 'daily' ? STORAGE_KEYS.DAILY_STATE : STORAGE_KEYS.FREE_STATE;
  
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    
    const state = JSON.parse(saved) as GameState & { savedAt?: number };
    
    // For daily mode, check if it's still the same day
    if (mode === 'daily' && currentDailyNumber !== undefined) {
      if (state.dailyNumber !== currentDailyNumber) {
        // It's a new day, clear the old state
        localStorage.removeItem(key);
        return null;
      }
    }
    
    return state;
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
}

/**
 * Clear game state
 */
export function clearGameState(mode: 'daily' | 'free'): void {
  if (!isStorageAvailable()) return;
  
  const key = mode === 'daily' ? STORAGE_KEYS.DAILY_STATE : STORAGE_KEYS.FREE_STATE;
  localStorage.removeItem(key);
}

/**
 * Load statistics
 */
export function loadStats(): GameStats {
  if (!isStorageAvailable()) return DEFAULT_STATS;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!saved) return DEFAULT_STATS;
    
    const stats = JSON.parse(saved) as GameStats;
    // Ensure guessDistribution has the right length
    if (stats.guessDistribution.length !== MAX_GUESSES) {
      stats.guessDistribution = new Array(MAX_GUESSES).fill(0);
    }
    return stats;
  } catch (error) {
    console.error('Failed to load stats:', error);
    return DEFAULT_STATS;
  }
}

/**
 * Save statistics
 */
export function saveStats(stats: GameStats): void {
  if (!isStorageAvailable()) return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save stats:', error);
  }
}

/**
 * Update stats after a game ends
 */
export function updateStatsAfterGame(
  won: boolean,
  guessesUsed: number,
  dailyNumber: number | null
): GameStats {
  const stats = loadStats();
  
  stats.gamesPlayed++;
  
  if (won) {
    stats.gamesWon++;
    stats.currentStreak++;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    
    // Update guess distribution (0-indexed)
    if (guessesUsed > 0 && guessesUsed <= MAX_GUESSES) {
      stats.guessDistribution[guessesUsed - 1]++;
    }
  } else {
    stats.currentStreak = 0;
  }
  
  if (dailyNumber !== null) {
    stats.lastPlayedDaily = dailyNumber;
    if (won) {
      stats.lastCompletedDaily = dailyNumber;
    }
  }
  
  saveStats(stats);
  return stats;
}

/**
 * Load settings
 */
export function loadSettings(): GameSettings {
  if (!isStorageAvailable()) return DEFAULT_SETTINGS;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!saved) return DEFAULT_SETTINGS;
    return JSON.parse(saved) as GameSettings;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings
 */
export function saveSettings(settings: GameSettings): void {
  if (!isStorageAvailable()) return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * Create initial board states from answers
 */
export function createInitialBoards(answers: string[]): BoardState[] {
  return answers.map(answer => ({
    answer,
    solved: false,
    solvedAtGuess: null,
  }));
}

