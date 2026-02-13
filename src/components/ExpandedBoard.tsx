'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Delete, CornerDownLeft } from 'lucide-react';
import { WordGrid } from './WordGrid';
import { Tile } from './Tile';
import { useGameActions, useGameAux, useGameBoards } from '@/context/GameContext';
import { TileState, KEYBOARD_ROWS, KEY_STATE_STYLES } from '@/types/game';
import { loadSettings } from '@/lib/storage';
import { evaluateGuess, updateKeyboardState } from '@/lib/evaluate';

interface ExpandedBoardProps {
  boardIndex: number;
  onClose: () => void;
  onNavigate: (direction: -1 | 1) => void;
}

export function ExpandedBoard({ boardIndex, onClose, onNavigate }: ExpandedBoardProps) {
  const { boards, gameStatus, guesses } = useGameBoards();
  const { error } = useGameAux();
  const { addLetter, removeLetter, submitGuess, getEvaluationForBoard } = useGameActions();
  const board = boards[boardIndex];

  const boardKeyboardState = useMemo(() => {
    let keyboardState: Record<string, TileState> = {};

    const relevantGuessCount =
      board.solved && board.solvedAtGuess !== null ? board.solvedAtGuess + 1 : guesses.length;

    for (let i = 0; i < relevantGuessCount; i++) {
      const guess = guesses[i];
      const evaluation = evaluateGuess(guess, board.answer);
      keyboardState = updateKeyboardState(keyboardState, guess, evaluation.states);
    }

    return keyboardState;
  }, [board.answer, board.solved, board.solvedAtGuess, guesses]);

  const indicatorBestByPosition = useMemo(() => {
    const rank: Record<TileState, number> = { empty: 0, absent: 1, present: 2, correct: 3, tbd: 0 };
    const best: TileState[] = new Array(board.answer.length).fill('empty');

    const relevantGuessCount =
      board.solved && board.solvedAtGuess !== null ? board.solvedAtGuess + 1 : guesses.length;

    for (let i = 0; i < relevantGuessCount; i++) {
      const states = getEvaluationForBoard(boardIndex, i);
      for (let j = 0; j < best.length; j++) {
        if (rank[states[j]] > rank[best[j]]) best[j] = states[j];
      }
    }

    return best;
  }, [
    board.answer,
    board.solved,
    board.solvedAtGuess,
    boardIndex,
    getEvaluationForBoard,
    guesses.length,
  ]);
  const [glowMode, setGlowMode] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevGuessesLenRef = useRef<number>(guesses.length);
  const prevBoardIndexRef = useRef<number>(boardIndex);

  useEffect(() => {
    const apply = () => {
      const settings = loadSettings();
      setGlowMode(settings.glowMode);
    };

    apply();
    const onSettingsChanged = () => apply();
    window.addEventListener('dotriacontordle_settings_changed', onSettingsChanged as EventListener);
    return () =>
      window.removeEventListener(
        'dotriacontordle_settings_changed',
        onSettingsChanged as EventListener
      );
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onNavigate(-1);
      else if (e.key === 'ArrowRight') onNavigate(1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigate]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const prevLen = prevGuessesLenRef.current;
    const nextLen = guesses.length;
    const boardChanged = prevBoardIndexRef.current !== boardIndex;
    const guessJustCommitted = nextLen > prevLen;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: boardChanged ? 'auto' : guessJustCommitted ? 'smooth' : 'auto',
    });

    prevGuessesLenRef.current = nextLen;
    prevBoardIndexRef.current = boardIndex;
  }, [boardIndex, guesses.length]);

  const handleKeyClick = (key: string) => {
    if (gameStatus !== 'playing') return;

    if (key === 'ENTER') submitGuess();
    else if (key === 'BACKSPACE') removeLetter();
    else addLetter(key);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 z-[60] -translate-x-1/2 rounded-md bg-red-500 px-4 py-2 font-medium text-white shadow-lg"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="bg-bg-secondary relative mx-4 flex h-[90vh] max-h-[90vh] w-full max-w-lg flex-col rounded-xl p-4 sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative mb-3 flex shrink-0 items-center justify-between">
            <div className="flex items-center gap-3 pr-2">
              <span className="text-accent text-2xl font-bold">#{boardIndex + 1}</span>
              {board.solved && (
                <span className="bg-tile-correct/20 text-tile-correct rounded-md px-2 py-1 text-sm font-medium">
                  SOLVED
                </span>
              )}
              {gameStatus === 'lost' && !board.solved && (
                <span className="rounded-md bg-red-500/20 px-2 py-1 text-sm font-medium text-red-400">
                  {board.answer}
                </span>
              )}
            </div>

            {!board.solved && gameStatus === 'playing' && (
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2">
                <div className="flex gap-0.5">
                  {indicatorBestByPosition.map((s, idx) => (
                    <Tile
                      key={idx}
                      letter={s === 'correct' ? board.answer[idx] : ''}
                      state={s === 'correct' ? 'correct' : s === 'present' ? 'present' : 'empty'}
                      size="compact"
                      animate={false}
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="cursor-pointer rounded-md p-2 transition-colors hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-5 flex min-h-0 flex-1 items-start justify-center">
            <div
              ref={scrollContainerRef}
              className={`bg-bg-tertiary/50 no-scrollbar mb-2 max-h-full self-start overflow-y-auto rounded-lg p-2 ${
                board.solved
                  ? 'ring-tile-correct/50 ring-2'
                  : gameStatus === 'lost'
                    ? 'ring-2 ring-red-500/50'
                    : ''
              }`}
            >
              <WordGrid
                boardIndex={boardIndex}
                showCurrentGuess
                hideStatusRing
                noBg
                glowMode={glowMode}
                tileSize="compact"
              />
            </div>
          </div>

          {gameStatus === 'playing' && (
            <div className="mb-6 flex w-full shrink-0 flex-col items-center gap-1">
              {KEYBOARD_ROWS.map((row, rowIndex) => (
                <div key={rowIndex} className="flex w-full justify-center gap-1">
                  {row.map((key) => {
                    const isSpecial = key === 'ENTER' || key === 'BACKSPACE';
                    const keyState = boardKeyboardState[key] || 'default';
                    const specialStyle =
                      key === 'BACKSPACE' ? 'key-backspace' : key === 'ENTER' ? 'key-enter' : '';

                    return (
                      <motion.button
                        key={key}
                        onClick={() => handleKeyClick(key)}
                        whileTap={{ scale: 0.95 }}
                        className={` ${isSpecial ? specialStyle : KEY_STATE_STYLES[keyState]} ${isSpecial ? 'px-2 text-[10px]' : 'max-w-[36px] flex-1'} flex h-10 cursor-pointer items-center justify-center rounded-md text-sm font-semibold text-white transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50`}
                        disabled={gameStatus !== 'playing'}
                      >
                        {key === 'BACKSPACE' ? (
                          <Delete className="h-4 w-4" />
                        ) : key === 'ENTER' ? (
                          <CornerDownLeft className="h-4 w-4" />
                        ) : (
                          key
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          <div className="flex shrink-0 items-center justify-between border-t border-white/10 pt-3">
            <button
              onClick={() => onNavigate(-1)}
              className="flex cursor-pointer items-center gap-1 rounded-md px-3 py-2 transition-colors hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>

            <button
              onClick={() => onNavigate(1)}
              className="flex cursor-pointer items-center gap-1 rounded-md px-3 py-2 transition-colors hover:bg-white/10"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
