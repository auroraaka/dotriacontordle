'use client';

import { motion } from 'motion/react';
import { TileState, KEYBOARD_ROWS } from '@/types/game';
import { useGame } from '@/context/GameContext';
import { useKeyboard } from '@/hooks/useKeyboard';

const keyStateStyles: Record<TileState | 'default', string> = {
  default: 'bg-key-default hover:bg-key-hover',
  empty: 'bg-key-default hover:bg-key-hover',
  tbd: 'bg-key-default hover:bg-key-hover',
  correct: 'bg-tile-correct hover:brightness-110',
  present: 'bg-tile-present hover:brightness-110',
  absent: 'bg-tile-absent hover:brightness-110',
};

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

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      removeLetter();
    } else {
      addLetter(key);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1 sm:gap-1.5 w-full max-w-[600px] mx-auto">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 sm:gap-1.5 justify-center w-full">
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === 'BACKSPACE';
            const keyState = keyboardState[key] || 'default';

            return (
              <motion.button
                key={key}
                onClick={() => handleKeyClick(key)}
                whileTap={{ scale: 0.95 }}
                className={`
                  ${keyStateStyles[keyState]}
                  ${isSpecial ? 'px-2 sm:px-3 md:px-4 text-[10px] sm:text-xs' : 'flex-1 max-w-[44px] sm:max-w-[52px]'}
                  h-11 sm:h-12 md:h-14 rounded-md font-semibold text-white text-sm sm:text-base
                  flex items-center justify-center
                  transition-colors duration-150
                  cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                `}
                disabled={gameStatus !== 'playing'}
              >
                {key === 'BACKSPACE' ? (
                  <BackspaceIcon />
                ) : key === 'ENTER' ? (
                  'ENTER'
                ) : (
                  key
                )}
              </motion.button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function BackspaceIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <line x1="18" y1="9" x2="12" y2="15" />
      <line x1="12" y1="9" x2="18" y2="15" />
    </svg>
  );
}

