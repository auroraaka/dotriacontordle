'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useState } from 'react';
import {
  GameState,
  GameStats,
  BoardState,
  TileState,
  WORD_LENGTH,
  NUM_BOARDS,
  MAX_GUESSES,
} from '@/types/game';
import { isValidWord, initializeWordService } from '@/lib/words';
import { getRandomAnswers } from '@/lib/answers';
import { getDailyNumber, getDailyAnswers } from '@/lib/daily';
import { evaluateGuess, updateKeyboardState } from '@/lib/evaluate';
import {
  saveGameState,
  loadGameState,
  loadStats,
  updateStatsAfterGame,
  createInitialBoards,
} from '@/lib/storage';

// Action types
type GameAction =
  | { type: 'ADD_LETTER'; letter: string }
  | { type: 'REMOVE_LETTER' }
  | { type: 'SUBMIT_GUESS' }
  | { type: 'SET_EXPANDED_BOARD'; boardIndex: number | null }
  | { type: 'NEW_GAME'; mode: 'daily' | 'free' }
  | { type: 'LOAD_STATE'; state: GameState }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'CLEAR_ERROR' };

interface GameContextType {
  state: GameState;
  stats: GameStats;
  error: string | null;
  isLoadingWords: boolean;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: () => void;
  setExpandedBoard: (boardIndex: number | null) => void;
  newGame: (mode: 'daily' | 'free') => void;
  getEvaluationForBoard: (boardIndex: number, guessIndex: number) => TileState[];
}

const GameContext = createContext<GameContextType | null>(null);

// Create initial state
function createInitialState(mode: 'daily' | 'free'): GameState {
  const dailyNumber = getDailyNumber();
  const answers = mode === 'daily'
    ? getDailyAnswers(dailyNumber)
    : getRandomAnswers(NUM_BOARDS);

  return {
    boards: createInitialBoards(answers),
    guesses: [],
    currentGuess: '',
    gameStatus: 'playing',
    keyboardState: {},
    expandedBoard: null,
    gameMode: mode,
    dailyNumber,
  };
}

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ADD_LETTER': {
      if (state.gameStatus !== 'playing') return state;
      if (state.currentGuess.length >= WORD_LENGTH) return state;
      return {
        ...state,
        currentGuess: state.currentGuess + action.letter.toUpperCase(),
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
      if (state.currentGuess.length !== WORD_LENGTH) return state;
      if (!isValidWord(state.currentGuess)) return state;

      const newGuesses = [...state.guesses, state.currentGuess];
      const guessIndex = newGuesses.length - 1;

      // Evaluate against all unsolved boards
      const newBoards: BoardState[] = state.boards.map((board) => {
        if (board.solved) return board;

        const evaluation = evaluateGuess(state.currentGuess, board.answer);
        if (evaluation.isCorrect) {
          return {
            ...board,
            solved: true,
            solvedAtGuess: guessIndex,
          };
        }
        return board;
      });

      // Update keyboard state
      let newKeyboardState = { ...state.keyboardState };
      for (const board of newBoards) {
        const evaluation = evaluateGuess(state.currentGuess, board.answer);
        newKeyboardState = updateKeyboardState(newKeyboardState, state.currentGuess, evaluation.states);
      }

      // Check game status
      const allSolved = newBoards.every((b) => b.solved);
      const outOfGuesses = newGuesses.length >= MAX_GUESSES;

      let newStatus: 'playing' | 'won' | 'lost' = 'playing';
      if (allSolved) {
        newStatus = 'won';
      } else if (outOfGuesses) {
        newStatus = 'lost';
      }

      return {
        ...state,
        boards: newBoards,
        guesses: newGuesses,
        currentGuess: '',
        keyboardState: newKeyboardState,
        gameStatus: newStatus,
      };
    }

    case 'SET_EXPANDED_BOARD': {
      return {
        ...state,
        expandedBoard: action.boardIndex,
      };
    }

    case 'NEW_GAME': {
      return createInitialState(action.mode);
    }

    case 'LOAD_STATE': {
      return action.state;
    }

    default:
      return state;
  }
}

// Provider component
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null, () => createInitialState('daily'));
  const [stats, setStats] = React.useState<GameStats>(() => loadStats());
  const [error, setError] = React.useState<string | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isLoadingWords, setIsLoadingWords] = useState(true);

  // Initialize word service on mount
  useEffect(() => {
    let mounted = true;
    
    async function init() {
      setIsLoadingWords(true);
      const startTime = Date.now();
      const MIN_LOADING_TIME = 2000;
      
      try {
        await initializeWordService();
      } catch (e) {
        console.error('Failed to initialize word service:', e);
      } finally {
        if (mounted) {
          const elapsed = Date.now() - startTime;
          const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
          
          setTimeout(() => {
            if (mounted) {
              setIsLoadingWords(false);
            }
          }, remainingTime);
        }
      }
    }
    
    init();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Load saved state on mount (after words are loaded)
  useEffect(() => {
    if (isLoadingWords) return;
    
    const dailyNumber = getDailyNumber();
    const savedDaily = loadGameState('daily', dailyNumber);

    if (savedDaily) {
      dispatch({ type: 'LOAD_STATE', state: savedDaily });
    } else {
      // Reinitialize with fresh answers now that words are loaded
      dispatch({ type: 'NEW_GAME', mode: 'daily' });
    }

    setStats(loadStats());
    setIsInitialized(true);
  }, [isLoadingWords]);

  // Save state when it changes
  useEffect(() => {
    if (isInitialized && state.gameStatus === 'playing') {
      saveGameState(state, state.gameMode);
    }
  }, [state, isInitialized]);

  // Update stats when game ends
  useEffect(() => {
    if (isInitialized && (state.gameStatus === 'won' || state.gameStatus === 'lost')) {
      const newStats = updateStatsAfterGame(
        state.gameStatus === 'won',
        state.guesses.length,
        state.gameMode === 'daily' ? state.dailyNumber : null
      );
      setStats(newStats);
    }
  }, [state.gameStatus, isInitialized, state.guesses.length, state.gameMode, state.dailyNumber]);

  // Actions
  const addLetter = useCallback((letter: string) => {
    setError(null);
    dispatch({ type: 'ADD_LETTER', letter });
  }, []);

  const removeLetter = useCallback(() => {
    setError(null);
    dispatch({ type: 'REMOVE_LETTER' });
  }, []);

  const submitGuess = useCallback(() => {
    if (state.currentGuess.length !== WORD_LENGTH) {
      setError('Not enough letters');
      return;
    }
    if (!isValidWord(state.currentGuess)) {
      setError('Not in word list');
      return;
    }
    setError(null);
    dispatch({ type: 'SUBMIT_GUESS' });
  }, [state.currentGuess]);

  const setExpandedBoard = useCallback((boardIndex: number | null) => {
    dispatch({ type: 'SET_EXPANDED_BOARD', boardIndex });
  }, []);

  const newGame = useCallback((mode: 'daily' | 'free') => {
    setError(null);
    dispatch({ type: 'NEW_GAME', mode });
  }, []);

  // Get evaluation for a specific board and guess
  const getEvaluationForBoard = useCallback(
    (boardIndex: number, guessIndex: number): TileState[] => {
      const board = state.boards[boardIndex];
      const guess = state.guesses[guessIndex];

      if (!board || !guess) {
        return new Array(WORD_LENGTH).fill('empty');
      }

      // If board was already solved before this guess, show empty
      if (board.solved && board.solvedAtGuess !== null && guessIndex > board.solvedAtGuess) {
        return new Array(WORD_LENGTH).fill('empty');
      }

      return evaluateGuess(guess, board.answer).states;
    },
    [state.boards, state.guesses]
  );

  const value = useMemo(
    () => ({
      state,
      stats,
      error,
      isLoadingWords,
      addLetter,
      removeLetter,
      submitGuess,
      setExpandedBoard,
      newGame,
      getEvaluationForBoard,
    }),
    [state, stats, error, isLoadingWords, addLetter, removeLetter, submitGuess, setExpandedBoard, newGame, getEvaluationForBoard]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// Hook
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
