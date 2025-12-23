'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { WordGrid } from './WordGrid';
import { useGame } from '@/context/GameContext';

interface ExpandedBoardProps {
  boardIndex: number;
  onClose: () => void;
  onNavigate: (direction: -1 | 1) => void;
}

export function ExpandedBoard({ boardIndex, onClose, onNavigate }: ExpandedBoardProps) {
  const { state } = useGame();
  const board = state.boards[boardIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onNavigate(-1);
      else if (e.key === 'ArrowRight') onNavigate(1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigate]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative bg-bg-secondary rounded-xl p-4 sm:p-6 max-w-md w-full mx-4 max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4 shrink-0">
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

          <div className="flex-1 min-h-0 overflow-y-auto flex justify-center py-2">
            <WordGrid boardIndex={boardIndex} showCurrentGuess />
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10 shrink-0">
            <button
              onClick={() => onNavigate(-1)}
              disabled={boardIndex === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>

            <button
              onClick={() => onNavigate(1)}
              disabled={boardIndex === 31}
              className="flex items-center gap-1 px-3 py-2 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
