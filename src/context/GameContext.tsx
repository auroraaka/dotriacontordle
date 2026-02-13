'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef, useState } from 'react';
import {
  GameState,
  GameStats,
  BoardState,
  TileState,
  GameConfig,
} from '@/types/game';
import { isValidWord, initializeWordService } from '@/lib/wordService';
import { getRandomAnswers } from '@/lib/answers';
import { getDailyNumber, getDailyAnswers } from '@/lib/daily';
import { evaluateGuess, updateKeyboardState } from '@/lib/evaluate';
import { primeFeedback, triggerFeedback } from '@/lib/feedback';
import { DEFAULT_GAME_CONFIG, normalizeGameConfig } from '@/lib/gameConfig';
import {
  saveGameState,
  loadGameState,
  loadStats,
  updateStatsAfterGame,
  createInitialBoards,
  getLastPlayedMode,
  loadSettings,
} from '@/lib/storage';

type GameAction =
  | { type: 'ADD_LETTER'; letter: string }
  | { type: 'REMOVE_LETTER' }
  | { type: 'SUBMIT_GUESS'; guess: string }
  | { type: 'TOGGLE_TIMER' }
  | { type: 'SET_EXPANDED_BOARD'; boardIndex: number | null }
  | { type: 'NEW_GAME'; mode: 'daily' | 'free'; dailyNumber?: number; config?: Partial<GameConfig> }
  | { type: 'LOAD_STATE'; state: GameState };

interface GameContextType {
  state: GameState;
  stats: GameStats;
  error: string | null;
  isLoadingWords: boolean;
  isValidating: boolean;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: () => void;
  toggleTimer: () => void;
  setExpandedBoard: (boardIndex: number | null) => void;
  newGame: (mode: 'daily' | 'free', dailyNumber?: number, config?: Partial<GameConfig>) => void;
  switchMode: (mode: 'daily' | 'free', dailyNumber?: number, config?: Partial<GameConfig>) => void;
  getEvaluationForBoard: (boardIndex: number, guessIndex: number) => TileState[];
}

const GameContext = createContext<GameContextType | null>(null);

type GameBoardsSnapshot = Pick<
  GameState,
  | 'boards'
  | 'guesses'
  | 'gameStatus'
  | 'keyboardState'
  | 'expandedBoard'
  | 'gameMode'
  | 'dailyNumber'
  | 'config'
  | 'startedAt'
  | 'endedAt'
  | 'timerRunning'
  | 'timerBaseElapsedMs'
  | 'timerResumedAt'
  | 'timerToggledAt'
  | 'gameId'
>;

type GameInputSnapshot = Pick<GameState, 'currentGuess'>;

type GameActions = Pick<
  GameContextType,
  | 'addLetter'
  | 'removeLetter'
  | 'submitGuess'
  | 'toggleTimer'
  | 'setExpandedBoard'
  | 'newGame'
  | 'switchMode'
  | 'getEvaluationForBoard'
>;

type GameAux = Pick<GameContextType, 'stats' | 'error' | 'isLoadingWords' | 'isValidating'>;

const GameBoardsContext = createContext<GameBoardsSnapshot | null>(null);
const GameInputContext = createContext<GameInputSnapshot | null>(null);
const GameActionsContext = createContext<GameActions | null>(null);
const GameAuxContext = createContext<GameAux | null>(null);

function getPreferredConfigFromSettings(): GameConfig {
  const settings = loadSettings();
  return normalizeGameConfig({
    wordLength: settings.preferredWordLength,
    boardCount: settings.preferredBoardCount,
    maxGuesses: settings.preferredMaxGuesses,
  });
}

function createInitialState(
  mode: 'daily' | 'free',
  dailyNumberOverride?: number,
  configOverride?: Partial<GameConfig>
): GameState {
  const config = normalizeGameConfig(configOverride ?? DEFAULT_GAME_CONFIG);
  const dailyNumber = mode === 'daily'
    ? (dailyNumberOverride ?? getDailyNumber())
    : getDailyNumber();
  const answers = mode === 'daily'
    ? getDailyAnswers(dailyNumber, config)
    : getRandomAnswers(config.boardCount, config.wordLength);

  return {
    config,
    boards: createInitialBoards(answers),
    guesses: [],
    currentGuess: '',
    gameStatus: 'playing',
    keyboardState: {},
    expandedBoard: null,
    gameMode: mode,
    dailyNumber,
    startedAt: null,
    endedAt: null,
    timerRunning: false,
    timerBaseElapsedMs: 0,
    timerResumedAt: null,
    timerToggledAt: null,
    gameId: `${mode}-${dailyNumber}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ADD_LETTER': {
      if (state.gameStatus !== 'playing') return state;
      if (state.currentGuess.length >= state.config.wordLength) return state;
      const now = Date.now();
      const shouldStart = state.startedAt === null;
      return {
        ...state,
        currentGuess: state.currentGuess + action.letter.toUpperCase(),
        startedAt: shouldStart ? now : state.startedAt,
        timerRunning: shouldStart ? true : state.timerRunning,
        timerResumedAt: shouldStart ? now : state.timerResumedAt,
      };
    }

    case 'REMOVE_LETTER': {
      if (state.gameStatus !== 'playing') return state;
      if (state.currentGuess.length === 0) return state;
      return {
        ...state,
        currentGuess: state.currentGuess.slice(0, -1),
      };
    }

    case 'SUBMIT_GUESS': {
      if (state.gameStatus !== 'playing') return state;
      const guess = action.guess.toUpperCase();
      if (guess.length !== state.config.wordLength) return state;
      if (state.guesses.includes(guess)) return state;

      const now = Date.now();
      const shouldStart = state.startedAt === null;

      const newGuesses = [...state.guesses, guess];
      const guessIndex = newGuesses.length - 1;

      const newBoards: BoardState[] = state.boards.map((board) => {
        if (board.solved) return board;

        const evaluation = evaluateGuess(guess, board.answer, state.config.wordLength);
        if (evaluation.isCorrect) {
          return { ...board, solved: true, solvedAtGuess: guessIndex };
        }
        return board;
      });

      let newKeyboardState = { ...state.keyboardState };
      for (const board of newBoards) {
        const evaluation = evaluateGuess(guess, board.answer, state.config.wordLength);
        newKeyboardState = updateKeyboardState(newKeyboardState, guess, evaluation.states);
      }

      const allSolved = newBoards.every((b) => b.solved);
      const outOfGuesses = newGuesses.length >= state.config.maxGuesses;

      let newStatus: 'playing' | 'won' | 'lost' = 'playing';
      if (allSolved) newStatus = 'won';
      else if (outOfGuesses) newStatus = 'lost';

      const willEnd = newStatus !== 'playing';
      const finalizedElapsedMs =
        willEnd && state.timerRunning && state.timerResumedAt !== null
          ? state.timerBaseElapsedMs + (now - state.timerResumedAt)
          : state.timerBaseElapsedMs;

      return {
        ...state,
        boards: newBoards,
        guesses: newGuesses,
        currentGuess: state.currentGuess === guess ? '' : state.currentGuess,
        keyboardState: newKeyboardState,
        gameStatus: newStatus,
        startedAt: shouldStart ? now : state.startedAt,
        endedAt: willEnd ? (state.endedAt ?? now) : null,
        timerRunning: willEnd ? false : (shouldStart ? true : state.timerRunning),
        timerBaseElapsedMs: willEnd ? finalizedElapsedMs : state.timerBaseElapsedMs,
        timerResumedAt: willEnd ? null : (shouldStart ? now : state.timerResumedAt),
      };
    }

    case 'TOGGLE_TIMER': {
      if (state.gameStatus !== 'playing') return state;

      const now = Date.now();
      if (state.startedAt === null) {
        return {
          ...state,
          startedAt: now,
          endedAt: null,
          timerRunning: true,
          timerBaseElapsedMs: 0,
          timerResumedAt: now,
          timerToggledAt: now,
        };
      }

      if (state.timerRunning) {
        const add = state.timerResumedAt !== null ? now - state.timerResumedAt : 0;
        return {
          ...state,
          timerRunning: false,
          timerBaseElapsedMs: state.timerBaseElapsedMs + add,
          timerResumedAt: null,
          timerToggledAt: now,
        };
      }

      return {
        ...state,
        timerRunning: true,
        timerResumedAt: now,
        timerToggledAt: now,
      };
    }

    case 'SET_EXPANDED_BOARD':
      return { ...state, expandedBoard: action.boardIndex };

    case 'NEW_GAME':
      return createInitialState(action.mode, action.dailyNumber, action.config ?? state.config);

    case 'LOAD_STATE':
      return action.state;

    default:
      return state;
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null, () => {
    const preferredConfig = getPreferredConfigFromSettings();
    return createInitialState('daily', undefined, preferredConfig);
  });
  const [stats, setStats] = React.useState<GameStats>(() => loadStats(state.config));
  const [error, setError] = React.useState<string | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isLoadingWords, setIsLoadingWords] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const errorTimeoutRef = useRef<number | null>(null);
  const isValidatingRef = useRef(false);
  const saveCurrentGuessTimeoutRef = useRef<number | null>(null);
  const hasBootstrappedRef = useRef(false);

  const setTransientError = useCallback((message: string) => {
    setError(message);
    if (errorTimeoutRef.current !== null) {
      window.clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    errorTimeoutRef.current = window.setTimeout(() => {
      setError((prev) => (prev === message ? null : prev));
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current !== null) window.clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    
    async function init() {
      setIsLoadingWords(true);
      
      try {
        await initializeWordService(state.config.wordLength);
      } catch (e) {
        console.error('Failed to initialize word service:', e);
      } finally {
        if (mounted) {
          setIsLoadingWords(false);
        }
      }
    }
    
    init();
    return () => { mounted = false; };
  }, [state.config.wordLength]);

  useEffect(() => {
    if (isLoadingWords || hasBootstrappedRef.current) return;
    
    const dailyNumber = getDailyNumber();
    const preferredConfig = getPreferredConfigFromSettings();
    const lastMode = getLastPlayedMode();
    
    if (lastMode === 'free') {
      const savedFree = loadGameState('free', undefined, preferredConfig);
      if (savedFree && savedFree.gameStatus === 'playing') {
        dispatch({ type: 'LOAD_STATE', state: savedFree });
        setStats(loadStats(savedFree.config));
        setIsInitialized(true);
        hasBootstrappedRef.current = true;
        return;
      }
    }

    const savedDaily = loadGameState('daily', dailyNumber, preferredConfig);
    if (savedDaily) {
      dispatch({ type: 'LOAD_STATE', state: savedDaily });
      setStats(loadStats(savedDaily.config));
    } else {
      dispatch({ type: 'NEW_GAME', mode: 'daily', config: preferredConfig });
      setStats(loadStats(preferredConfig));
    }

    setIsInitialized(true);
    hasBootstrappedRef.current = true;
  }, [isLoadingWords]);

  useEffect(() => {
    if (!isInitialized) return;
    saveGameState(state, state.gameMode);
  }, [isInitialized, state]);

  useEffect(() => {
    if (!isInitialized) return;
    setStats(loadStats(state.config));
  }, [isInitialized, state.config]);

  useEffect(() => {
    if (isInitialized && (state.gameStatus === 'won' || state.gameStatus === 'lost')) {
      const newStats = updateStatsAfterGame(
        state.gameStatus === 'won',
        state.guesses.length,
        state.config,
        state.gameMode === 'daily' ? state.dailyNumber : null
      );
      setStats(newStats);
    }
  }, [state.gameStatus, isInitialized, state.guesses.length, state.gameMode, state.dailyNumber, state.config]);

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!isInitialized) return;
    if (saveCurrentGuessTimeoutRef.current !== null) {
      window.clearTimeout(saveCurrentGuessTimeoutRef.current);
    }
    saveCurrentGuessTimeoutRef.current = window.setTimeout(() => {
      saveCurrentGuessTimeoutRef.current = null;
      const latest = stateRef.current;
      saveGameState(latest, latest.gameMode);
    }, 250);

    return () => {
      if (saveCurrentGuessTimeoutRef.current !== null) {
        window.clearTimeout(saveCurrentGuessTimeoutRef.current);
        saveCurrentGuessTimeoutRef.current = null;
      }
    };
  }, [isInitialized, state.currentGuess]);

  const addLetter = useCallback((letter: string) => {
    setError(null);
    const current = stateRef.current;
    if (current.gameStatus === 'playing' && current.currentGuess.length < current.config.wordLength) {
      void triggerFeedback('key');
    }
    dispatch({ type: 'ADD_LETTER', letter });
  }, []);

  const removeLetter = useCallback(() => {
    setError(null);
    const current = stateRef.current;
    if (current.gameStatus === 'playing' && current.currentGuess.length > 0) {
      void triggerFeedback('delete');
    }
    dispatch({ type: 'REMOVE_LETTER' });
  }, []);

  const submitGuess = useCallback(async () => {
    void primeFeedback();
    if (isValidatingRef.current) return;
    
    const current = stateRef.current;
    const guess = current.currentGuess;

    if (guess.length !== current.config.wordLength) {
      setTransientError('Not enough letters');
      void triggerFeedback('error');
      return;
    }

    if (current.guesses.includes(guess)) {
      setTransientError('Already guessed');
      void triggerFeedback('error');
      return;
    }
    
    isValidatingRef.current = true;
    setIsValidating(true);
    try {
      const valid = await isValidWord(guess, current.config.wordLength);
      if (!valid) {
        setTransientError('Not a word');
        void triggerFeedback('error');
        return;
      }

      const latestState = stateRef.current;
      const nextGuessesLen = latestState.guesses.length + 1;
      const outOfGuesses = nextGuessesLen >= latestState.config.maxGuesses;

      const willSolveCount = latestState.boards.reduce((acc, board) => {
        if (board.solved) return acc;
        const evaluation = evaluateGuess(guess, board.answer, latestState.config.wordLength);
        return acc + (evaluation.isCorrect ? 1 : 0);
      }, 0);

      const alreadySolvedCount = latestState.boards.filter((b) => b.solved).length;
      const allSolved = alreadySolvedCount + willSolveCount === latestState.boards.length;

      setError(null);
      dispatch({ type: 'SUBMIT_GUESS', guess });

      if (allSolved) void triggerFeedback('win');
      else if (outOfGuesses) void triggerFeedback('lose');
      else if (willSolveCount > 0) void triggerFeedback('solved');
      else void triggerFeedback('submit');
    } catch (e) {
      console.error('Word validation error:', e);
      setTransientError('Error validating word');
      void triggerFeedback('error');
    } finally {
      setIsValidating(false);
      isValidatingRef.current = false;
    }
  }, [setTransientError]);

  const toggleTimer = useCallback(() => {
    dispatch({ type: 'TOGGLE_TIMER' });
  }, []);

  const setExpandedBoard = useCallback((boardIndex: number | null) => {
    setError(null);
    dispatch({ type: 'SET_EXPANDED_BOARD', boardIndex });
  }, []);

  const newGame = useCallback((mode: 'daily' | 'free', dailyNumber?: number, config?: Partial<GameConfig>) => {
    setError(null);
    dispatch({ type: 'NEW_GAME', mode, dailyNumber, config });
  }, []);

  const switchMode = useCallback((mode: 'daily' | 'free', dailyNumber?: number, config?: Partial<GameConfig>) => {
    setError(null);
    const current = stateRef.current;
    const nextConfig = normalizeGameConfig(config ?? current.config);
    const targetDailyNumber = mode === 'daily' ? (dailyNumber ?? getDailyNumber()) : undefined;
    const switchingModes = current.gameMode !== mode;
    const switchingDailySeed =
      mode === 'daily' &&
      current.gameMode === 'daily' &&
      current.dailyNumber !== targetDailyNumber;
    const switchingConfig = current.config.profileId !== nextConfig.profileId;

    if (!switchingModes && !switchingDailySeed && !switchingConfig) return;

    const savedState = mode === 'daily'
      ? loadGameState('daily', targetDailyNumber, nextConfig)
      : loadGameState('free', undefined, nextConfig);
    const hasInProgressState =
      savedState?.gameStatus === 'playing' &&
      ((savedState.guesses?.length ?? 0) > 0 || (savedState.currentGuess?.length ?? 0) > 0);

    if (hasInProgressState) {
      const isTodayDaily = mode === 'daily' && targetDailyNumber === getDailyNumber();
      const modeLabel = mode === 'free'
        ? 'Free Play'
        : isTodayDaily
          ? 'Daily Puzzle'
          : `Daily #${targetDailyNumber}`;

      const resume = window.confirm(
        `Resume your in-progress ${modeLabel} game? Press Cancel to start a new one.`
      );

      if (resume) {
        dispatch({ type: 'LOAD_STATE', state: savedState });
        return;
      }
    }

    dispatch({ type: 'NEW_GAME', mode, dailyNumber: targetDailyNumber, config: nextConfig });
  }, []);

  const getEvaluationForBoard = useCallback((boardIndex: number, guessIndex: number): TileState[] => {
    const current = stateRef.current;
    const board = current.boards[boardIndex];
    const guess = current.guesses[guessIndex];

    if (!board || !guess) {
      return new Array(current.config.wordLength).fill('empty');
    }

    if (board.solved && board.solvedAtGuess !== null && guessIndex > board.solvedAtGuess) {
      return new Array(current.config.wordLength).fill('empty');
    }

    return evaluateGuess(guess, board.answer, current.config.wordLength).states;
  }, []);

  const boardsValue = useMemo<GameBoardsSnapshot>(
    () => ({
      boards: state.boards,
      guesses: state.guesses,
      gameStatus: state.gameStatus,
      keyboardState: state.keyboardState,
      expandedBoard: state.expandedBoard,
      gameMode: state.gameMode,
      dailyNumber: state.dailyNumber,
      config: state.config,
      startedAt: state.startedAt,
      endedAt: state.endedAt,
      timerRunning: state.timerRunning,
      timerBaseElapsedMs: state.timerBaseElapsedMs,
      timerResumedAt: state.timerResumedAt,
      timerToggledAt: state.timerToggledAt,
      gameId: state.gameId,
    }),
    [
      state.boards,
      state.guesses,
      state.gameStatus,
      state.keyboardState,
      state.expandedBoard,
      state.gameMode,
      state.dailyNumber,
      state.config,
      state.startedAt,
      state.endedAt,
      state.timerRunning,
      state.timerBaseElapsedMs,
      state.timerResumedAt,
      state.timerToggledAt,
      state.gameId,
    ]
  );

  const inputValue = useMemo<GameInputSnapshot>(() => ({ currentGuess: state.currentGuess }), [state.currentGuess]);

  const actionsValue = useMemo<GameActions>(
    () => ({
      addLetter,
      removeLetter,
      submitGuess,
      toggleTimer,
      setExpandedBoard,
      newGame,
      switchMode,
      getEvaluationForBoard,
    }),
    [addLetter, removeLetter, submitGuess, toggleTimer, setExpandedBoard, newGame, switchMode, getEvaluationForBoard]
  );

  const auxValue = useMemo<GameAux>(
    () => ({ stats, error, isLoadingWords, isValidating }),
    [stats, error, isLoadingWords, isValidating]
  );

  const value = useMemo(
    () => ({
      state,
      stats,
      error,
      isLoadingWords,
      isValidating,
      addLetter,
      removeLetter,
      submitGuess,
      toggleTimer,
      setExpandedBoard,
      newGame,
      switchMode,
      getEvaluationForBoard,
    }),
    [state, stats, error, isLoadingWords, isValidating, addLetter, removeLetter, submitGuess, toggleTimer, setExpandedBoard, newGame, switchMode, getEvaluationForBoard]
  );

  return (
    <GameContext.Provider value={value}>
      <GameActionsContext.Provider value={actionsValue}>
        <GameAuxContext.Provider value={auxValue}>
          <GameBoardsContext.Provider value={boardsValue}>
            <GameInputContext.Provider value={inputValue}>{children}</GameInputContext.Provider>
          </GameBoardsContext.Provider>
        </GameAuxContext.Provider>
      </GameActionsContext.Provider>
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

export function useGameBoards() {
  const ctx = useContext(GameBoardsContext);
  if (!ctx) throw new Error('useGameBoards must be used within a GameProvider');
  return ctx;
}

export function useGameInput() {
  const ctx = useContext(GameInputContext);
  if (!ctx) throw new Error('useGameInput must be used within a GameProvider');
  return ctx;
}

export function useGameActions() {
  const ctx = useContext(GameActionsContext);
  if (!ctx) throw new Error('useGameActions must be used within a GameProvider');
  return ctx;
}

export function useGameAux() {
  const ctx = useContext(GameAuxContext);
  if (!ctx) throw new Error('useGameAux must be used within a GameProvider');
  return ctx;
}
