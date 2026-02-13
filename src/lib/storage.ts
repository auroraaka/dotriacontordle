import { GameState, GameStats, GameSettings, BoardState, GameConfig } from '@/types/game';
import { DEFAULT_GAME_CONFIG, normalizeGameConfig } from './gameConfig';

const STORAGE_KEYS = {
  DAILY_STATE_PREFIX: 'dotriacontordle_daily_state_v2',
  DAILY_STATE_LEGACY_PREFIX: 'dotriacontordle_daily_state',
  DAILY_STATE_LEGACY: 'dotriacontordle_daily_state',
  FREE_STATE_PREFIX: 'dotriacontordle_free_state_v2',
  FREE_STATE_LEGACY: 'dotriacontordle_free_state',
  LAST_MODE: 'dotriacontordle_last_mode',
  STATS_PREFIX: 'dotriacontordle_stats_v2',
  STATS_LEGACY: 'dotriacontordle_stats',
  SETTINGS: 'dotriacontordle_settings',
} as const;

function getDailyStateKey(dailyNumber: number, config: GameConfig): string {
  return `${STORAGE_KEYS.DAILY_STATE_PREFIX}_${config.profileId}_${dailyNumber}`;
}

function getFreeStateKey(config: GameConfig): string {
  return `${STORAGE_KEYS.FREE_STATE_PREFIX}_${config.profileId}`;
}

function getStatsKey(config: GameConfig): string {
  return `${STORAGE_KEYS.STATS_PREFIX}_${config.profileId}`;
}

const DEFAULT_SETTINGS: GameSettings = {
  glowMode: false,
  feedbackEnabled: true,
  preferredWordLength: DEFAULT_GAME_CONFIG.wordLength,
  preferredBoardCount: DEFAULT_GAME_CONFIG.boardCount,
  preferredMaxGuesses: DEFAULT_GAME_CONFIG.maxGuesses,
};

function createDefaultStats(maxGuesses: number): GameStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: new Array(maxGuesses).fill(0),
    lastPlayedDaily: null,
    lastCompletedDaily: null,
  };
}

function isDefaultProfile(config: GameConfig): boolean {
  return config.profileId === DEFAULT_GAME_CONFIG.profileId;
}

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

function inferHydratedState(
  mode: 'daily' | 'free',
  rawState: (GameState & { savedAt?: number }) | (Partial<GameState> & { savedAt?: number }),
  fallbackConfig: GameConfig
): GameState {
  const savedAt = (rawState as { savedAt?: number }).savedAt;
  const config = normalizeGameConfig((rawState as GameState).config ?? fallbackConfig);
  const guesses = Array.isArray((rawState as GameState).guesses)
    ? (rawState as GameState).guesses
    : [];
  const currentGuess =
    typeof (rawState as GameState).currentGuess === 'string'
      ? (rawState as GameState).currentGuess
      : '';
  const gameStatus = (rawState as GameState).gameStatus ?? 'playing';
  const hasProgress = guesses.length > 0 || currentGuess.length > 0;

  const inferredStart =
    (rawState as GameState).startedAt ?? (hasProgress ? (savedAt ?? Date.now()) : null);

  const inferredEnd =
    (rawState as GameState).endedAt ?? (gameStatus !== 'playing' ? (savedAt ?? Date.now()) : null);

  const inferredTimerBaseElapsedMs =
    typeof (rawState as GameState).timerBaseElapsedMs === 'number'
      ? (rawState as GameState).timerBaseElapsedMs
      : inferredStart === null
        ? 0
        : gameStatus !== 'playing'
          ? Math.max(0, (inferredEnd ?? savedAt ?? Date.now()) - inferredStart)
          : Math.max(0, Date.now() - inferredStart);

  const inferredTimerRunning =
    typeof (rawState as GameState).timerRunning === 'boolean'
      ? (rawState as GameState).timerRunning
      : Boolean(gameStatus === 'playing' && inferredStart !== null);

  const inferredTimerResumedAt =
    typeof (rawState as GameState).timerResumedAt === 'number'
      ? (rawState as GameState).timerResumedAt
      : inferredTimerRunning
        ? Date.now()
        : null;

  const dailyNumber =
    typeof (rawState as GameState).dailyNumber === 'number'
      ? (rawState as GameState).dailyNumber
      : 1;

  const gameId =
    typeof (rawState as GameState).gameId === 'string' && (rawState as GameState).gameId
      ? (rawState as GameState).gameId
      : `${mode}-${config.profileId}-${dailyNumber}-${savedAt ?? Date.now()}`;

  return {
    config,
    boards: Array.isArray((rawState as GameState).boards) ? (rawState as GameState).boards : [],
    guesses,
    currentGuess,
    gameStatus: gameStatus === 'won' || gameStatus === 'lost' ? gameStatus : 'playing',
    keyboardState:
      typeof (rawState as GameState).keyboardState === 'object' &&
      (rawState as GameState).keyboardState
        ? (rawState as GameState).keyboardState
        : {},
    expandedBoard:
      typeof (rawState as GameState).expandedBoard === 'number'
        ? (rawState as GameState).expandedBoard
        : null,
    gameMode: mode,
    dailyNumber,
    startedAt: inferredStart,
    endedAt: inferredEnd,
    timerRunning: inferredTimerRunning,
    timerBaseElapsedMs: inferredTimerBaseElapsedMs,
    timerResumedAt: inferredTimerRunning ? inferredTimerResumedAt : null,
    timerToggledAt:
      typeof (rawState as GameState).timerToggledAt === 'number'
        ? (rawState as GameState).timerToggledAt
        : null,
    gameId,
  };
}

export function saveGameState(state: GameState, mode: 'daily' | 'free'): void {
  if (!isStorageAvailable()) return;

  const config = normalizeGameConfig(state.config);
  const key =
    mode === 'daily' ? getDailyStateKey(state.dailyNumber, config) : getFreeStateKey(config);
  const stateToSave = { ...state, config, savedAt: Date.now() };

  try {
    localStorage.setItem(key, JSON.stringify(stateToSave));
    if (isDefaultProfile(config)) {
      if (mode === 'daily') {
        localStorage.setItem(
          `${STORAGE_KEYS.DAILY_STATE_LEGACY_PREFIX}_${state.dailyNumber}`,
          JSON.stringify(stateToSave)
        );
      } else {
        localStorage.setItem(STORAGE_KEYS.FREE_STATE_LEGACY, JSON.stringify(stateToSave));
      }
    }
    localStorage.setItem(STORAGE_KEYS.LAST_MODE, mode);
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}

export function getLastPlayedMode(): 'daily' | 'free' {
  if (!isStorageAvailable()) return 'daily';

  try {
    const mode = localStorage.getItem(STORAGE_KEYS.LAST_MODE);
    if (mode === 'free') return 'free';
    return 'daily';
  } catch {
    return 'daily';
  }
}

export function loadGameState(
  mode: 'daily' | 'free',
  currentDailyNumber?: number,
  configInput?: Partial<GameConfig>
): GameState | null {
  if (!isStorageAvailable()) return null;

  const config = normalizeGameConfig(configInput ?? DEFAULT_GAME_CONFIG);

  try {
    let saved: string | null = null;
    let sourceKey: string | null = null;

    if (mode === 'daily') {
      if (typeof currentDailyNumber !== 'number') return null;
      const keyedState = localStorage.getItem(getDailyStateKey(currentDailyNumber, config));
      if (keyedState) {
        saved = keyedState;
        sourceKey = getDailyStateKey(currentDailyNumber, config);
      } else if (isDefaultProfile(config)) {
        const legacyKeyed = localStorage.getItem(
          `${STORAGE_KEYS.DAILY_STATE_LEGACY_PREFIX}_${currentDailyNumber}`
        );
        if (legacyKeyed) {
          saved = legacyKeyed;
          sourceKey = `${STORAGE_KEYS.DAILY_STATE_LEGACY_PREFIX}_${currentDailyNumber}`;
        } else {
          const legacyState = localStorage.getItem(STORAGE_KEYS.DAILY_STATE_LEGACY);
          if (legacyState) {
            saved = legacyState;
            sourceKey = STORAGE_KEYS.DAILY_STATE_LEGACY;
          }
        }
      }
    } else {
      const keyedState = localStorage.getItem(getFreeStateKey(config));
      if (keyedState) {
        saved = keyedState;
        sourceKey = getFreeStateKey(config);
      } else if (isDefaultProfile(config)) {
        const legacyState = localStorage.getItem(STORAGE_KEYS.FREE_STATE_LEGACY);
        if (legacyState) {
          saved = legacyState;
          sourceKey = STORAGE_KEYS.FREE_STATE_LEGACY;
        }
      }
    }

    if (!saved || !sourceKey) return null;

    const raw = JSON.parse(saved) as
      | (GameState & { savedAt?: number })
      | (Partial<GameState> & { savedAt?: number });
    const hydrated = inferHydratedState(mode, raw, config);

    if (mode === 'daily' && currentDailyNumber !== undefined) {
      if (hydrated.dailyNumber !== currentDailyNumber) {
        if (sourceKey === STORAGE_KEYS.DAILY_STATE_LEGACY) {
          localStorage.removeItem(sourceKey);
        }
        return null;
      }
    }

    const isLegacyKey =
      sourceKey === STORAGE_KEYS.DAILY_STATE_LEGACY ||
      sourceKey === STORAGE_KEYS.FREE_STATE_LEGACY ||
      (sourceKey.startsWith(`${STORAGE_KEYS.DAILY_STATE_LEGACY_PREFIX}_`) &&
        !sourceKey.startsWith(`${STORAGE_KEYS.DAILY_STATE_PREFIX}_`));

    if (isLegacyKey) {
      const migrateTarget =
        mode === 'daily'
          ? getDailyStateKey(hydrated.dailyNumber, hydrated.config)
          : getFreeStateKey(hydrated.config);
      localStorage.setItem(migrateTarget, JSON.stringify({ ...hydrated, savedAt: Date.now() }));
      localStorage.removeItem(sourceKey);
    }

    return hydrated;
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
}

function normalizeGuessDistribution(distribution: unknown, maxGuesses: number): number[] {
  const base = Array.isArray(distribution) ? distribution.slice(0, maxGuesses) : [];
  while (base.length < maxGuesses) base.push(0);
  return base.map((n) => (typeof n === 'number' && Number.isFinite(n) ? n : 0));
}

export function loadStats(configInput?: Partial<GameConfig>): GameStats {
  const config = normalizeGameConfig(configInput ?? DEFAULT_GAME_CONFIG);
  if (!isStorageAvailable()) return createDefaultStats(config.maxGuesses);

  try {
    const keyed = localStorage.getItem(getStatsKey(config));
    let saved = keyed;

    if (!saved && isDefaultProfile(config)) {
      saved = localStorage.getItem(STORAGE_KEYS.STATS_LEGACY);
    }

    if (!saved) return createDefaultStats(config.maxGuesses);

    const parsed = JSON.parse(saved) as GameStats;
    const normalized: GameStats = {
      gamesPlayed: Number(parsed.gamesPlayed) || 0,
      gamesWon: Number(parsed.gamesWon) || 0,
      currentStreak: Number(parsed.currentStreak) || 0,
      maxStreak: Number(parsed.maxStreak) || 0,
      guessDistribution: normalizeGuessDistribution(parsed.guessDistribution, config.maxGuesses),
      lastPlayedDaily: typeof parsed.lastPlayedDaily === 'number' ? parsed.lastPlayedDaily : null,
      lastCompletedDaily:
        typeof parsed.lastCompletedDaily === 'number' ? parsed.lastCompletedDaily : null,
    };

    if (!keyed && isDefaultProfile(config) && saved) {
      localStorage.setItem(getStatsKey(config), JSON.stringify(normalized));
      localStorage.removeItem(STORAGE_KEYS.STATS_LEGACY);
    }

    return normalized;
  } catch (error) {
    console.error('Failed to load stats:', error);
    return createDefaultStats(config.maxGuesses);
  }
}

export function saveStats(stats: GameStats, configInput?: Partial<GameConfig>): void {
  if (!isStorageAvailable()) return;

  const config = normalizeGameConfig(configInput ?? DEFAULT_GAME_CONFIG);
  const normalized: GameStats = {
    ...stats,
    guessDistribution: normalizeGuessDistribution(stats.guessDistribution, config.maxGuesses),
  };

  try {
    localStorage.setItem(getStatsKey(config), JSON.stringify(normalized));
  } catch (error) {
    console.error('Failed to save stats:', error);
  }
}

export function updateStatsAfterGame(
  won: boolean,
  guessesUsed: number,
  dailyNumber: number | null
): GameStats;
export function updateStatsAfterGame(
  won: boolean,
  guessesUsed: number,
  config: Partial<GameConfig>,
  dailyNumber: number | null
): GameStats;
export function updateStatsAfterGame(
  won: boolean,
  guessesUsed: number,
  configOrDaily: Partial<GameConfig> | number | null,
  dailyNumberMaybe?: number | null
): GameStats {
  const config =
    typeof configOrDaily === 'number' || configOrDaily === null
      ? DEFAULT_GAME_CONFIG
      : normalizeGameConfig(configOrDaily);
  const dailyNumber =
    typeof configOrDaily === 'number' || configOrDaily === null
      ? configOrDaily
      : (dailyNumberMaybe ?? null);
  const stats = loadStats(config);
  if (dailyNumber !== null && stats.lastPlayedDaily === dailyNumber) {
    return stats;
  }

  stats.gamesPlayed++;

  if (won) {
    stats.gamesWon++;
    stats.currentStreak++;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);

    if (guessesUsed > 0 && guessesUsed <= config.maxGuesses) {
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

  saveStats(stats, config);
  return stats;
}

export function loadSettings(): GameSettings {
  if (!isStorageAvailable()) return DEFAULT_SETTINGS;

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!saved) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(saved) as Record<string, unknown> | null;
    const merged = {
      ...DEFAULT_SETTINGS,
      ...(parsed && typeof parsed === 'object' ? parsed : {}),
    } as Record<string, unknown>;
    const preferred = normalizeGameConfig({
      wordLength: merged.preferredWordLength as number,
      boardCount: merged.preferredBoardCount as number,
      maxGuesses: merged.preferredMaxGuesses as number,
    });

    return {
      glowMode: Boolean(merged.glowMode),
      feedbackEnabled: Boolean(merged.feedbackEnabled),
      preferredWordLength: preferred.wordLength,
      preferredBoardCount: preferred.boardCount,
      preferredMaxGuesses: preferred.maxGuesses,
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  if (!isStorageAvailable()) return;

  const preferred = normalizeGameConfig({
    wordLength: settings.preferredWordLength,
    boardCount: settings.preferredBoardCount,
    maxGuesses: settings.preferredMaxGuesses,
  });
  const normalized: GameSettings = {
    glowMode: Boolean(settings.glowMode),
    feedbackEnabled: Boolean(settings.feedbackEnabled),
    preferredWordLength: preferred.wordLength,
    preferredBoardCount: preferred.boardCount,
    preferredMaxGuesses: preferred.maxGuesses,
  };

  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(normalized));
    window.dispatchEvent(
      new CustomEvent('dotriacontordle_settings_changed', { detail: normalized })
    );
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function createInitialBoards(answers: string[]): BoardState[] {
  return answers.map((answer) => ({
    answer,
    solved: false,
    solvedAtGuess: null,
  }));
}
