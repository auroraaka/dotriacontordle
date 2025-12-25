'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Delete, CornerDownLeft } from 'lucide-react';
import { WordGrid } from './WordGrid';
import { useGame } from '@/context/GameContext';
import { TileState, KEYBOARD_ROWS, KEY_STATE_STYLES } from '@/types/game';
import { loadSettings } from '@/lib/storage';
import { evaluateGuess, updateKeyboardState } from '@/lib/evaluate';

interface ExpandedBoardProps {
  boardIndex: number;
  onClose: () => void;
  onNavigate: (direction: -1 | 1) => void;
}

export function ExpandedBoard({ boardIndex, onClose, onNavigate }: ExpandedBoardProps) {
  const { state, error, addLetter, removeLetter, submitGuess } = useGame();
  const board = state.boards[boardIndex];
  const { gameStatus, guesses } = state;

  const boardKeyboardState = useMemo(() => {
    let keyboardState: Record<string, TileState> = {};
    
    const relevantGuessCount = board.solved && board.solvedAtGuess !== null
      ? board.solvedAtGuess + 1
      : guesses.length;
    
    for (let i = 0; i < relevantGuessCount; i++) {
      const guess = guesses[i];
      const evaluation = evaluateGuess(guess, board.answer);
      keyboardState = updateKeyboardState(keyboardState, guess, evaluation.states);
    }
    
    return keyboardState;
  }, [board.answer, board.solved, board.solvedAtGuess, guesses]); 
  const [glowMode, setGlowMode] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevGuessesLenRef = useRef<number>(state.guesses.length);
  const prevBoardIndexRef = useRef<number>(boardIndex);

  useEffect(() => {
    const apply = () => {
      const settings = loadSettings();
      setGlowMode(settings.glowMode);
    };

    apply();
    const onSettingsChanged = () => apply();
    window.addEventListener('dotriacontordle_settings_changed', onSettingsChanged as EventListener);
    return () => window.removeEventListener('dotriacontordle_settings_changed', onSettingsChanged as EventListener);
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
    const nextLen = state.guesses.length;
    const boardChanged = prevBoardIndexRef.current !== boardIndex;
    const guessJustCommitted = nextLen > prevLen;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: boardChanged ? 'auto' : guessJustCommitted ? 'smooth' : 'auto',
    });

    prevGuessesLenRef.current = nextLen;
    prevBoardIndexRef.current = boardIndex;
  }, [boardIndex, state.guesses.length]);

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
              className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 bg-red-500 text-white rounded-md font-medium shadow-lg"
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
          className="relative bg-bg-secondary rounded-xl p-4 sm:p-6 max-w-lg w-full mx-4 h-[90vh] max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-accent">#{boardIndex + 1}</span>
              {board.solved && (
                <span className="px-2 py-1 bg-tile-correct/20 text-tile-correct rounded-md text-sm font-medium">
                  SOLVED
                </span>
              )}
              {state.gameStatus === 'lost' && !board.solved && (
                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-md text-sm font-medium">
                  {board.answer}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 flex justify-center items-start mb-5">
            <div 
              ref={scrollContainerRef}
              className={`self-start max-h-full overflow-y-auto p-2 mb-2 rounded-lg bg-bg-tertiary/50 no-scrollbar ${
                board.solved 
                  ? 'ring-2 ring-tile-correct/50' 
                  : state.gameStatus === 'lost' 
                  ? 'ring-2 ring-red-500/50' 
                  : ''
              }`}
            >
              <WordGrid boardIndex={boardIndex} showCurrentGuess hideStatusRing noBg glowMode={glowMode} />
            </div>
          </div>

          {gameStatus === 'playing' && (
            <div className="flex flex-col items-center gap-1 w-full shrink-0 mb-6">
              {KEYBOARD_ROWS.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1 justify-center w-full">
                  {row.map((key) => {
                    const isSpecial = key === 'ENTER' || key === 'BACKSPACE';
                    const keyState = boardKeyboardState[key] || 'default';
                    const specialStyle =
                      key === 'BACKSPACE'
                        ? 'key-backspace'
                        : key === 'ENTER'
                        ? 'key-enter'
                        : '';

                    return (
                      <motion.button
                        key={key}
                        onClick={() => handleKeyClick(key)}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          ${isSpecial ? specialStyle : KEY_STATE_STYLES[keyState]}
                          ${isSpecial ? 'px-2 text-[10px]' : 'flex-1 max-w-[36px]'}
                          h-10 rounded-md font-semibold text-white text-sm
                          flex items-center justify-center transition-colors duration-150
                          cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                        disabled={gameStatus !== 'playing'}
                      >
                        {key === 'BACKSPACE' ? <Delete className="w-4 h-4" /> : key === 'ENTER' ? <CornerDownLeft className="w-4 h-4" /> : key}
                      </motion.button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/10 shrink-0">
            <button
              onClick={() => onNavigate(-1)}
              className="flex items-center gap-1 px-3 py-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>

            <button
              onClick={() => onNavigate(1)}
              className="flex items-center gap-1 px-3 py-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
