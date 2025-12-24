'use client';

import { motion } from 'motion/react';
import { Delete, CornerDownLeft } from 'lucide-react';
import { KEYBOARD_ROWS, KEY_STATE_STYLES } from '@/types/game';
import { useGame } from '@/context/GameContext';
import { useKeyboard } from '@/hooks/useKeyboard';

export function Keyboard() {
  const { state, addLetter, removeLetter, submitGuess, setExpandedBoard } = useGame();
  const { keyboardState, gameStatus } = state;

  useKeyboard({
    onLetter: addLetter,
    onEnter: submitGuess,
    onBackspace: removeLetter,
    onBoardSelect: setExpandedBoard,
    disabled: gameStatus !== 'playing',
  });

  const handleKeyClick = (key: string) => {
    if (gameStatus !== 'playing') return;

    if (key === 'ENTER') submitGuess();
    else if (key === 'BACKSPACE') removeLetter();
    else addLetter(key);
  };

  return (
    <div className="flex flex-col items-center gap-1 sm:gap-1.5 w-full max-w-[600px] mx-auto">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 sm:gap-1.5 justify-center w-full">
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === 'BACKSPACE';
            const keyState = keyboardState[key] || 'default';
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
                  ${isSpecial ? 'px-2 sm:px-3 md:px-4 text-[10px] sm:text-xs' : 'flex-1 max-w-[44px] sm:max-w-[52px]'}
                  h-11 sm:h-12 md:h-14 rounded-md font-semibold text-white text-sm sm:text-base
                  flex items-center justify-center transition-colors duration-150
                  cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                `}
                disabled={gameStatus !== 'playing'}
              >
                {key === 'BACKSPACE' ? <Delete className="w-5 h-5" /> : key === 'ENTER' ? <CornerDownLeft className="w-5 h-5" /> : key}
              </motion.button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
