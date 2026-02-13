'use client';

import { useCallback } from 'react';
import { motion } from 'motion/react';
import { Delete, CornerDownLeft } from 'lucide-react';
import { KEYBOARD_ROWS, KEY_STATE_STYLES } from '@/types/game';
import { useGameActions, useGameAux, useGameBoards } from '@/context/GameContext';
import { useKeyboard } from '@/hooks/useKeyboard';

export function Keyboard() {
  const { keyboardState, gameStatus, boards } = useGameBoards();
  const { isValidating } = useGameAux();
  const { addLetter, removeLetter, submitGuess, toggleTimer, setExpandedBoard } = useGameActions();
  const disabled = gameStatus !== 'playing';

  const onEnter = useCallback(() => {
    if (!isValidating) submitGuess();
  }, [isValidating, submitGuess]);

  useKeyboard({
    onLetter: addLetter,
    onEnter,
    onBackspace: removeLetter,
    onSpace: toggleTimer,
    onBoardSelect: setExpandedBoard,
    maxBoardNumber: boards.length,
    disabled,
  });

  const handleKeyClick = (key: string) => {
    if (disabled) return;

    if (key === 'ENTER') {
      if (!isValidating) submitGuess();
    } else if (key === 'BACKSPACE') removeLetter();
    else addLetter(key);
  };

  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-col items-center gap-1 sm:gap-1.5">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex w-full justify-center gap-1 sm:gap-1.5">
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === 'BACKSPACE';
            const keyState = keyboardState[key] || 'default';
            const specialStyle =
              key === 'BACKSPACE' ? 'key-backspace' : key === 'ENTER' ? 'key-enter' : '';

            return (
              <motion.button
                key={key}
                onClick={() => handleKeyClick(key)}
                whileTap={{ scale: 0.95 }}
                className={` ${isSpecial ? specialStyle : KEY_STATE_STYLES[keyState]} ${isSpecial ? 'xs:px-2 px-1.5 text-[10px] sm:px-3 sm:text-xs md:px-4' : 'xs:max-w-[40px] max-w-[36px] flex-1 sm:max-w-[52px]'} xs:h-10 xs:text-sm flex h-9 cursor-pointer items-center justify-center rounded-md text-[11px] font-semibold text-white transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:text-base md:h-14`}
                disabled={disabled}
              >
                {key === 'BACKSPACE' ? (
                  <Delete className="h-5 w-5" />
                ) : key === 'ENTER' ? (
                  <CornerDownLeft className="h-5 w-5" />
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
