import { GameState, GameStats, GameSettings, BoardState, MAX_GUESSES } from '@/types/game';

const STORAGE_KEYS = {
  DAILY_STATE: 'dotriacontordle_daily_state',
  FREE_STATE: 'dotriacontordle_free_state',
  STATS: 'dotriacontordle_stats',
  SETTINGS: 'dotriacontordle_settings',
} as const;

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
  glowMode: false,
  feedbackEnabled: true,
};

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

export function saveGameState(state: GameState, mode: 'daily' | 'free'): void {
  if (!isStorageAvailable()) return;
  
  const key = mode === 'daily' ? STORAGE_KEYS.DAILY_STATE : STORAGE_KEYS.FREE_STATE;
  const stateToSave = { ...state, savedAt: Date.now() };
  
  try {
    localStorage.setItem(key, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}

export function loadGameState(mode: 'daily' | 'free', currentDailyNumber?: number): GameState | null {
  if (!isStorageAvailable()) return null;
  
  const key = mode === 'daily' ? STORAGE_KEYS.DAILY_STATE : STORAGE_KEYS.FREE_STATE;
  
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    
    const state = JSON.parse(saved) as (GameState & { savedAt?: number }) | (Partial<GameState> & { savedAt?: number });
    
    if (mode === 'daily' && currentDailyNumber !== undefined) {
      if (state.dailyNumber !== currentDailyNumber) {
        localStorage.removeItem(key);
        return null;
      }
    }
    
    const hasProgress =
      Array.isArray((state as GameState).guesses) && (state as GameState).guesses.length > 0
        ? true
        : typeof (state as GameState).currentGuess === 'string' && (state as GameState).currentGuess.length > 0;

    const savedAt = (state as { savedAt?: number }).savedAt;

    const inferredStart =
      (state as GameState).startedAt ??
      (hasProgress ? savedAt ?? Date.now() : null);

    const inferredEnd =
      (state as GameState).endedAt ??
      ((state as GameState).gameStatus && (state as GameState).gameStatus !== 'playing'
        ? savedAt ?? Date.now()
        : null);

    const inferredTimerBaseElapsedMs =
      typeof (state as GameState).timerBaseElapsedMs === 'number'
        ? (state as GameState).timerBaseElapsedMs
        : inferredStart === null
          ? 0
          : (state as GameState).gameStatus && (state as GameState).gameStatus !== 'playing'
            ? Math.max(0, (inferredEnd ?? savedAt ?? Date.now()) - inferredStart)
            : Math.max(0, Date.now() - inferredStart);

    const inferredTimerRunning =
      typeof (state as GameState).timerRunning === 'boolean'
        ? (state as GameState).timerRunning
        : Boolean((state as GameState).gameStatus === 'playing' && inferredStart !== null);

    const inferredTimerResumedAt =
      typeof (state as GameState).timerResumedAt === 'number'
        ? (state as GameState).timerResumedAt
        : inferredTimerRunning
          ? Date.now()
          : null;

    return {
      ...(state as GameState),
      startedAt: inferredStart,
      endedAt: inferredEnd,
      timerRunning: inferredTimerRunning,
      timerBaseElapsedMs: inferredTimerBaseElapsedMs,
      timerResumedAt: inferredTimerRunning ? inferredTimerResumedAt : null,
      timerToggledAt: typeof (state as GameState).timerToggledAt === 'number' ? (state as GameState).timerToggledAt : null,
    };
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
}

export function loadStats(): GameStats {
  if (!isStorageAvailable()) return DEFAULT_STATS;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!saved) return DEFAULT_STATS;
    
    const stats = JSON.parse(saved) as GameStats;
    if (stats.guessDistribution.length !== MAX_GUESSES) {
      stats.guessDistribution = new Array(MAX_GUESSES).fill(0);
    }
    return stats;
  } catch (error) {
    console.error('Failed to load stats:', error);
    return DEFAULT_STATS;
  }
}

export function saveStats(stats: GameStats): void {
  if (!isStorageAvailable()) return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save stats:', error);
  }
}

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

export function loadSettings(): GameSettings {
  if (!isStorageAvailable()) return DEFAULT_SETTINGS;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!saved) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(saved) as Record<string, unknown> | null;
    const merged = { ...DEFAULT_SETTINGS, ...(parsed && typeof parsed === 'object' ? parsed : {}) } as Record<string, unknown>;

    return {
      glowMode: Boolean(merged.glowMode),
      feedbackEnabled: Boolean(merged.feedbackEnabled),
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  if (!isStorageAvailable()) return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('dotriacontordle_settings_changed', { detail: settings }));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function createInitialBoards(answers: string[]): BoardState[] {
  return answers.map(answer => ({
    answer,
    solved: false,
    solvedAtGuess: null,
  }));
}
