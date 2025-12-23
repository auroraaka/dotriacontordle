'use client';

import { useEffect, useCallback, useRef } from 'react';

interface UseKeyboardProps {
  onLetter: (letter: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  onBoardSelect?: (boardNumber: number) => void;
  disabled?: boolean;
}

export function useKeyboard({ onLetter, onEnter, onBackspace, onBoardSelect, disabled = false }: UseKeyboardProps) {
  const numberBuffer = useRef('');
  const numberTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key;

      if (onBoardSelect && key >= '0' && key <= '9') {
        event.preventDefault();
        
        if (numberTimeout.current) clearTimeout(numberTimeout.current);
        
        numberBuffer.current += key;
        
        numberTimeout.current = setTimeout(() => {
          const boardNumber = parseInt(numberBuffer.current, 10);
          if (boardNumber >= 1 && boardNumber <= 32) {
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
    [onLetter, onEnter, onBackspace, onBoardSelect, disabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (numberTimeout.current) clearTimeout(numberTimeout.current);
    };
  }, [handleKeyDown]);
}
