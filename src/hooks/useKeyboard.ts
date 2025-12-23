'use client';

import { useEffect, useCallback } from 'react';

interface UseKeyboardProps {
  onLetter: (letter: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  disabled?: boolean;
}

export function useKeyboard({ onLetter, onEnter, onBackspace, disabled = false }: UseKeyboardProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      // Ignore if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = event.key.toUpperCase();

      if (key === 'ENTER') {
        event.preventDefault();
        onEnter();
      } else if (key === 'BACKSPACE') {
        event.preventDefault();
        onBackspace();
      } else if (key.length === 1 && key >= 'A' && key <= 'Z') {
        event.preventDefault();
        onLetter(key);
      }
    },
    [onLetter, onEnter, onBackspace, disabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

