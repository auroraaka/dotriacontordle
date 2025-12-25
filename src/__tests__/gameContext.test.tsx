import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { GameProvider, useGame } from '@/context/GameContext';
import { isValidWord } from '@/lib/wordService';
import { MAX_GUESSES } from '@/types/game';

const MOCK_ANSWERS = [
  'ACTION', 'ANIMAL', 'ANSWER', 'BEAUTY', 'BEFORE', 'BETTER', 'BORDER', 'BOTTLE',
  'BRANCH', 'BREATH', 'BRIDGE', 'BRIGHT', 'BROKEN', 'BUDGET', 'BUTTON', 'CAMERA',
  'CANCEL', 'CARBON', 'CAREER', 'CASTLE', 'CAUGHT', 'CENTER', 'CHANCE', 'CHANGE',
  'CHARGE', 'CHEESE', 'CHOICE', 'CHURCH', 'CIRCLE', 'CLIENT', 'CLOSED', 'COFFEE',
];

vi.mock('@/lib/wordService', async () => {
  return {
    initializeWordService: vi.fn(async () => {}),
    isValidWord: vi.fn(async () => true),
    getRandomAnswers: vi.fn((count: number) => MOCK_ANSWERS.slice(0, count)),
  };
});

vi.mock('@/lib/answers', async () => {
  const actual = await vi.importActual('@/lib/answers');
  return {
    ...actual,
    getRandomAnswers: vi.fn((count: number) => MOCK_ANSWERS.slice(0, count)),
  };
});

vi.mock('@/lib/daily', async () => {
  return {
    getDailyNumber: vi.fn(() => 42),
    getDailyAnswers: vi.fn(() => MOCK_ANSWERS),
  };
});

interface HarnessProps {
  customWord?: string;
}

function Harness({ customWord }: HarnessProps) {
  const { state, error, isValidating, addLetter, removeLetter, submitGuess, newGame } = useGame();

  const typeWord = (word: string) => {
    word.split('').forEach(addLetter);
  };

  return (
    <div>
      <div data-testid="guesses">{state.guesses.join(',')}</div>
      <div data-testid="currentGuess">{state.currentGuess}</div>
      <div data-testid="error">{error ?? ''}</div>
      <div data-testid="gameStatus">{state.gameStatus}</div>
      <div data-testid="isValidating">{isValidating ? 'true' : 'false'}</div>
      <div data-testid="guessCount">{state.guesses.length}</div>
      <div data-testid="solvedBoards">
        {state.boards.filter(b => b.solved).length}
      </div>
      <div data-testid="keyboardState">{JSON.stringify(state.keyboardState)}</div>
      <button onClick={() => newGame('free')}>new</button>
      <button onClick={() => typeWord(customWord || 'ABROAD')}>type</button>
      <button onClick={() => typeWord('ACTION')}>typeAction</button>
      <button onClick={() => typeWord('CAT')}>typeShort</button>
      <button onClick={() => typeWord('ZZZZXX')}>typeInvalid</button>
      <button onClick={() => submitGuess()}>submit</button>
      <button onClick={() => removeLetter()}>backspace</button>
      <button onClick={() => addLetter('X')}>addX</button>
    </div>
  );
}

async function setupGame() {
  render(
    <GameProvider>
      <Harness />
    </GameProvider>
  );

  await act(async () => {
    await vi.runAllTimersAsync();
  });

  fireEvent.click(screen.getByText('new'));
}

describe('Game input mechanics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('duplicate guess prevention', () => {
    it('does not allow submitting the same word twice', async () => {
      await setupGame();

      fireEvent.click(screen.getByText('type'));
      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });

      expect(screen.getByTestId('guesses').textContent).toBe('ABROAD');
      expect(screen.getByTestId('error').textContent).toBe('');

      fireEvent.click(screen.getByText('type'));
      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });

      expect(screen.getByTestId('guesses').textContent).toBe('ABROAD');
      expect(screen.getByTestId('error').textContent).toBe('Already guessed');

      expect(vi.mocked(isValidWord)).toHaveBeenCalledTimes(1);
    });

    it('allows submitting different words', async () => {
      await setupGame();

      fireEvent.click(screen.getByText('type'));
      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });

      expect(screen.getByTestId('guesses').textContent).toBe('ABROAD');

      fireEvent.click(screen.getByText('typeAction'));
      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });

      expect(screen.getByTestId('guesses').textContent).toBe('ABROAD,ACTION');
      expect(screen.getByTestId('error').textContent).toBe('');
    });
  });

  describe('incomplete word rejection', () => {
    it('rejects words with fewer than 6 letters', async () => {
      await setupGame();

      fireEvent.click(screen.getByText('typeShort'));
      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });

      expect(screen.getByTestId('guesses').textContent).toBe('');
      expect(screen.getByTestId('error').textContent).toBe('Not enough letters');
    });

    it('does not call word validation for incomplete words', async () => {
      await setupGame();

      fireEvent.click(screen.getByText('typeShort'));
      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });

      expect(vi.mocked(isValidWord)).not.toHaveBeenCalled();
    });
  });

  describe('invalid word rejection', () => {
    it('rejects words not in the word list', async () => {
      vi.mocked(isValidWord).mockResolvedValueOnce(false);

      await setupGame();

      fireEvent.click(screen.getByText('typeInvalid'));
      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });

      expect(screen.getByTestId('guesses').textContent).toBe('');
      expect(screen.getByTestId('error').textContent).toBe('Not a word');
    });
  });

  describe('letter input', () => {
    it('adds letters to current guess', async () => {
      await setupGame();

      fireEvent.click(screen.getByText('addX'));
      expect(screen.getByTestId('currentGuess').textContent).toBe('X');

      fireEvent.click(screen.getByText('addX'));
      expect(screen.getByTestId('currentGuess').textContent).toBe('XX');
    });

    it('removes letters with backspace', async () => {
      await setupGame();

      fireEvent.click(screen.getByText('typeShort'));
      expect(screen.getByTestId('currentGuess').textContent).toBe('CAT');

      fireEvent.click(screen.getByText('backspace'));
      expect(screen.getByTestId('currentGuess').textContent).toBe('CA');

      fireEvent.click(screen.getByText('backspace'));
      expect(screen.getByTestId('currentGuess').textContent).toBe('C');
    });

    it('does not add more than 6 letters', async () => {
      await setupGame();

      fireEvent.click(screen.getByText('type'));
      expect(screen.getByTestId('currentGuess').textContent).toBe('ABROAD');

      fireEvent.click(screen.getByText('addX'));
      expect(screen.getByTestId('currentGuess').textContent).toBe('ABROAD');
    });

    it('clears current guess after successful submission', async () => {
      await setupGame();

      fireEvent.click(screen.getByText('type'));
      expect(screen.getByTestId('currentGuess').textContent).toBe('ABROAD');

      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });

      expect(screen.getByTestId('currentGuess').textContent).toBe('');
    });

    it('keeps current guess after failed submission', async () => {
      await setupGame();

      fireEvent.click(screen.getByText('typeShort'));
      expect(screen.getByTestId('currentGuess').textContent).toBe('CAT');

      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });

      expect(screen.getByTestId('currentGuess').textContent).toBe('CAT');
    });
  });

  describe('board solving', () => {
    it('marks a board as solved when correct word is guessed', async () => {
      await setupGame();

      expect(screen.getByTestId('solvedBoards').textContent).toBe('0');

      fireEvent.click(screen.getByText('typeAction'));
      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });

      expect(screen.getByTestId('solvedBoards').textContent).toBe('1');
    });
  });

  describe('guess counting', () => {
    it('tracks guess count correctly', async () => {
      await setupGame();

      expect(screen.getByTestId('guessCount').textContent).toBe('0');

      fireEvent.click(screen.getByText('type'));
      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });

      expect(screen.getByTestId('guessCount').textContent).toBe('1');

      fireEvent.click(screen.getByText('typeAction'));
      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });

      expect(screen.getByTestId('guessCount').textContent).toBe('2');
    });

    it('does not increment guess count for rejected duplicates', async () => {
      await setupGame();

      fireEvent.click(screen.getByText('type'));
      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });

      expect(screen.getByTestId('guessCount').textContent).toBe('1');

      fireEvent.click(screen.getByText('type'));
      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });

      expect(screen.getByTestId('guessCount').textContent).toBe('1');
    });
  });

  describe('error clearing', () => {
    it('clears error when typing new letters', async () => {
      await setupGame();

      fireEvent.click(screen.getByText('typeShort'));
      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });
      expect(screen.getByTestId('error').textContent).toBe('Not enough letters');

      fireEvent.click(screen.getByText('addX'));
      expect(screen.getByTestId('error').textContent).toBe('');
    });

    it('clears error when using backspace', async () => {
      await setupGame();

      fireEvent.click(screen.getByText('typeShort'));
      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });
      expect(screen.getByTestId('error').textContent).toBe('Not enough letters');

      fireEvent.click(screen.getByText('backspace'));
      expect(screen.getByTestId('error').textContent).toBe('');
    });

    it('clears error when starting new game', async () => {
      await setupGame();

      fireEvent.click(screen.getByText('typeShort'));
      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });
      expect(screen.getByTestId('error').textContent).toBe('Not enough letters');

      fireEvent.click(screen.getByText('new'));
      expect(screen.getByTestId('error').textContent).toBe('');
    });
  });

  describe('new game', () => {
    it('resets guesses when starting new game', async () => {
      await setupGame();

      fireEvent.click(screen.getByText('type'));
      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });
      expect(screen.getByTestId('guesses').textContent).toBe('ABROAD');

      fireEvent.click(screen.getByText('new'));
      expect(screen.getByTestId('guesses').textContent).toBe('');
    });

    it('resets current guess when starting new game', async () => {
      await setupGame();

      fireEvent.click(screen.getByText('typeShort'));
      expect(screen.getByTestId('currentGuess').textContent).toBe('CAT');

      fireEvent.click(screen.getByText('new'));
      expect(screen.getByTestId('currentGuess').textContent).toBe('');
    });

    it('resets game status when starting new game', async () => {
      await setupGame();
      expect(screen.getByTestId('gameStatus').textContent).toBe('playing');

      fireEvent.click(screen.getByText('new'));
      expect(screen.getByTestId('gameStatus').textContent).toBe('playing');
    });
  });

  describe('persistence on final guess', () => {
    it('persists the terminal lost state (and clears currentGuess) after the last allowed guess', async () => {
      const idxToWord = (n: number) => {
        let x = n;
        let s = '';
        for (let i = 0; i < 6; i++) {
          s = String.fromCharCode(65 + (x % 26)) + s;
          x = Math.floor(x / 26);
        }
        return s;
      };

      const preGuesses = Array.from({ length: MAX_GUESSES - 1 }, (_, i) => idxToWord(i + 1));

      localStorage.setItem(
        'dotriacontordle_daily_state',
        JSON.stringify({
          boards: MOCK_ANSWERS.map((answer) => ({ answer, solved: false, solvedAtGuess: null })),
          guesses: preGuesses,
          currentGuess: idxToWord(999),
          gameStatus: 'playing',
          keyboardState: {},
          expandedBoard: null,
          gameMode: 'daily',
          dailyNumber: 42,
          startedAt: null,
          endedAt: null,
          timerRunning: false,
          timerBaseElapsedMs: 0,
          timerResumedAt: null,
          timerToggledAt: null,
        })
      );

      render(
        <GameProvider>
          <Harness customWord={idxToWord(12345)} />
        </GameProvider>
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(screen.getByTestId('gameStatus').textContent).toBe('playing');
      expect(Number(screen.getByTestId('guessCount').textContent)).toBe(MAX_GUESSES - 1);

      fireEvent.click(screen.getByText('type'));
      await act(async () => {
        fireEvent.click(screen.getByText('submit'));
      });

      expect(screen.getByTestId('gameStatus').textContent).toBe('lost');
      expect(screen.getByTestId('currentGuess').textContent).toBe('');

      const saved = localStorage.getItem('dotriacontordle_daily_state');
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved as string) as { gameStatus: string; currentGuess: string; guesses: string[] };
      expect(parsed.gameStatus).toBe('lost');
      expect(parsed.currentGuess).toBe('');
      expect(parsed.guesses).toHaveLength(MAX_GUESSES);

      expect(vi.mocked(isValidWord)).toHaveBeenCalled();
    });
  });
});
