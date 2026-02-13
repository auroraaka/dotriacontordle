'use client';

import { useEffect, useCallback, useRef } from 'react';
import { MAX_BOARD_COUNT } from '@/types/game';

interface UseKeyboardProps {
  onLetter: (letter: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  onSpace?: () => void;
  onBoardSelect?: (boardNumber: number) => void;
  maxBoardNumber?: number;
  disabled?: boolean;
}

export function useKeyboard({
  onLetter,
  onEnter,
  onBackspace,
  onSpace,
  onBoardSelect,
  maxBoardNumber = MAX_BOARD_COUNT,
  disabled = false,
}: UseKeyboardProps) {
  const numberBuffer = useRef('');
  const numberTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key;

      if (onSpace && (key === ' ' || key === 'Spacebar')) {
        event.preventDefault();
        onSpace();
        return;
      }

      if (onBoardSelect && key >= '0' && key <= '9') {
        event.preventDefault();
        
        if (numberTimeout.current) clearTimeout(numberTimeout.current);
        
        numberBuffer.current += key;
        
        numberTimeout.current = setTimeout(() => {
          const boardNumber = parseInt(numberBuffer.current, 10);
          if (boardNumber >= 1 && boardNumber <= maxBoardNumber) {
            onBoardSelect(boardNumber - 1);
          }
          numberBuffer.current = '';
        }, 300);
        
        return;
      }

      const upperKey = key.toUpperCase();

      if (upperKey === 'ENTER') {
        event.preventDefault();
        onEnter();
      } else if (upperKey === 'BACKSPACE') {
        event.preventDefault();
        onBackspace();
      } else if (upperKey.length === 1 && upperKey >= 'A' && upperKey <= 'Z') {
        event.preventDefault();
        onLetter(upperKey);
      }
    },
    [onLetter, onEnter, onBackspace, onSpace, onBoardSelect, maxBoardNumber, disabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (numberTimeout.current) clearTimeout(numberTimeout.current);
    };
  }, [handleKeyDown]);
}
