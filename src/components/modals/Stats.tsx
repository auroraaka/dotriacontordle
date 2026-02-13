'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Share2 } from 'lucide-react';
import { useGameAux, useGameBoards } from '@/context/GameContext';
import { formatTimeUntilNextDaily } from '@/lib/daily';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BoardState, TileState } from '@/types/game';
import { evaluateGuess } from '@/lib/evaluate';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const state = useGameBoards();
  const { stats } = useGameAux();
  const [timeUntilNext, setTimeUntilNext] = useState(formatTimeUntilNextDaily());
  const [shareToast, setShareToast] = useState<{
    kind: 'success' | 'error';
    message: string;
  } | null>(null);
  const shareToastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const tick = () => setTimeUntilNext(formatTimeUntilNextDaily());
    const raf = window.requestAnimationFrame(tick);
    const interval = window.setInterval(tick, 1000);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearInterval(interval);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (shareToastTimeoutRef.current !== null) window.clearTimeout(shareToastTimeoutRef.current);
    };
  }, []);

  const showShareToast = (toast: { kind: 'success' | 'error'; message: string }) => {
    setShareToast(toast);
    if (shareToastTimeoutRef.current !== null) window.clearTimeout(shareToastTimeoutRef.current);
    shareToastTimeoutRef.current = window.setTimeout(() => {
      setShareToast(null);
      shareToastTimeoutRef.current = null;
    }, 2200);
  };

  const guessDistributionRows = useMemo(
    () =>
      stats.guessDistribution
        .map((count, index) => ({ guess: index + 1, count }))
        .filter((entry) => entry.count > 0),
    [stats.guessDistribution]
  );

  const analytics = useMemo(() => {
    if (state.gameStatus === 'playing') return null;

    const solvedByGuess = new Array(state.guesses.length).fill(0);
    const solvedBoards: { boardIndex: number; solvedAtGuess: number }[] = [];

    state.boards.forEach((board, boardIndex) => {
      if (typeof board.solvedAtGuess === 'number') {
        solvedByGuess[board.solvedAtGuess] += 1;
        solvedBoards.push({ boardIndex, solvedAtGuess: board.solvedAtGuess });
      }
    });

    let biggestJumpGuess = -1;
    let biggestJumpSolved = 0;
    solvedByGuess.forEach((solvedCount, index) => {
      if (solvedCount > biggestJumpSolved) {
        biggestJumpSolved = solvedCount;
        biggestJumpGuess = index;
      }
    });

    solvedBoards.sort((a, b) => a.solvedAtGuess - b.solvedAtGuess || a.boardIndex - b.boardIndex);
    const solveOrder = solvedBoards.map((entry) => entry.boardIndex + 1);

    const hardestBoard = getHardestBoard(state.boards, state.guesses);

    return {
      biggestJumpGuess: biggestJumpGuess >= 0 ? biggestJumpGuess + 1 : null,
      biggestJumpSolved,
      solveOrder,
      hardestBoard,
    };
  }, [state.boards, state.guesses, state.gameStatus]);

  if (!isOpen) return null;

  const winPercentage =
    stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;

  return (
    <>
      <AnimatePresence>
        <motion.div
          key="stats-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-bg-secondary max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Statistics</h2>
              <button
                onClick={onClose}
                className="cursor-pointer rounded-md p-2 transition-colors hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 grid grid-cols-4 gap-4">
              <StatBox value={stats.gamesPlayed} label="Played" />
              <StatBox value={winPercentage} label="Win %" />
              <StatBox value={stats.currentStreak} label="Current Streak" />
              <StatBox value={stats.maxStreak} label="Max Streak" />
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="mb-2 text-sm font-semibold">Guess Distribution (Wins)</p>
              {guessDistributionRows.length === 0 ? (
                <p className="text-text-secondary text-sm">No completed wins yet.</p>
              ) : (
                <GuessDistribution rows={guessDistributionRows} />
              )}
            </div>

            {state.gameMode === 'daily' && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="text-center">
                  <p className="text-text-secondary mb-1 text-sm">Next Dotriacontordle</p>
                  <p className="text-accent font-mono text-2xl font-bold">{timeUntilNext}</p>
                </div>
              </div>
            )}

            {analytics && (
              <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                <p className="text-sm font-semibold">Run Analytics</p>
                <AnalyticsRow
                  label="Biggest Jump"
                  value={
                    analytics.biggestJumpGuess
                      ? `Guess ${analytics.biggestJumpGuess} (+${analytics.biggestJumpSolved})`
                      : 'No boards solved'
                  }
                />
                <AnalyticsRow
                  label="Hardest Board"
                  value={`#${analytics.hardestBoard.boardNumber} (${analytics.hardestBoard.detail})`}
                />
                <AnalyticsRow label="Solve Order" value={formatSolveOrder(analytics.solveOrder)} />
              </div>
            )}

            {state.gameStatus !== 'playing' && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <button
                  onClick={async () => {
                    const toast = await shareResults(state);
                    if (toast) showShareToast(toast);
                  }}
                  className="bg-tile-correct hover:bg-tile-correct/80 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md py-3 font-bold transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                  Share
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {shareToast && (
          <motion.div
            key="stats-share-toast"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-md px-4 py-2 text-sm font-medium shadow-lg ${
              shareToast.kind === 'success' ? 'bg-tile-correct text-white' : 'bg-red-500 text-white'
            }`}
          >
            {shareToast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-text-secondary text-xs">{label}</div>
    </div>
  );
}

function AnalyticsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-text-secondary shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function GuessDistribution({ rows }: { rows: { guess: number; count: number }[] }) {
  const maxCount = Math.max(...rows.map((row) => row.count), 1);

  return (
    <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
      {rows.map((row) => (
        <div key={row.guess} className="flex items-center gap-2 text-xs">
          <span className="text-text-secondary w-7 text-right font-mono">{row.guess}</span>
          <div className="bg-bg-tertiary h-5 flex-1 overflow-hidden rounded-sm">
            <div
              className="bg-accent/80 h-full"
              style={{ width: `${Math.max(8, (row.count / maxCount) * 100)}%` }}
            />
          </div>
          <span className="w-6 text-right font-semibold">{row.count}</span>
        </div>
      ))}
    </div>
  );
}

function formatSolveOrder(order: number[]): string {
  if (order.length === 0) return 'No solved boards';
  const preview = order
    .slice(0, 10)
    .map((boardNumber) => `#${boardNumber}`)
    .join(' -> ');
  const remaining = order.length - 10;
  return remaining > 0 ? `${preview} ... +${remaining} more` : preview;
}

function getHardestBoard(
  boards: BoardState[],
  guesses: string[]
): { boardNumber: number; detail: string } {
  const boardSignals = boards.map((board, boardIndex) => {
    const signal = getBoardSignal(board, guesses);
    return {
      boardIndex,
      solved: board.solved,
      solvedAtGuess: board.solvedAtGuess,
      ...signal,
    };
  });

  const unsolved = boardSignals
    .filter((entry) => !entry.solved)
    .sort(
      (a, b) =>
        a.score - b.score ||
        a.correct - b.correct ||
        a.present - b.present ||
        a.boardIndex - b.boardIndex
    );

  if (unsolved.length > 0) {
    const hardest = unsolved[0];
    return {
      boardNumber: hardest.boardIndex + 1,
      detail: `${hardest.correct} green, ${hardest.present} yellow`,
    };
  }

  const solved = boardSignals
    .filter((entry) => typeof entry.solvedAtGuess === 'number')
    .sort(
      (a, b) => (b.solvedAtGuess ?? -1) - (a.solvedAtGuess ?? -1) || a.boardIndex - b.boardIndex
    );

  const hardest = solved[0];
  if (!hardest) return { boardNumber: 1, detail: 'No data' };

  return {
    boardNumber: hardest.boardIndex + 1,
    detail: `Solved on guess ${(hardest.solvedAtGuess ?? 0) + 1}`,
  };
}

function getBoardSignal(
  board: BoardState,
  guesses: string[]
): { correct: number; present: number; score: number } {
  const rank: Record<TileState, number> = { empty: 0, absent: 1, present: 2, correct: 3, tbd: 0 };
  const best: TileState[] = new Array(board.answer.length).fill('empty');
  const relevantGuessCount =
    board.solved && board.solvedAtGuess !== null ? board.solvedAtGuess + 1 : guesses.length;

  for (let i = 0; i < relevantGuessCount; i++) {
    const guess = guesses[i];
    if (!guess) continue;
    const states = evaluateGuess(guess, board.answer).states;
    for (let j = 0; j < states.length; j++) {
      if (rank[states[j]] > rank[best[j]]) best[j] = states[j];
    }
  }

  let correct = 0;
  let present = 0;
  for (const state of best) {
    if (state === 'correct') correct++;
    else if (state === 'present') present++;
  }

  return {
    correct,
    present,
    score: correct * 2 + present,
  };
}

async function shareResults(state: {
  boards: { solved: boolean }[];
  guesses: string[];
  dailyNumber: number;
  gameStatus: string;
  config: { maxGuesses: number };
}): Promise<{ kind: 'success' | 'error'; message: string } | null> {
  const solved = state.boards.filter((b) => b.solved).length;
  const guessCount = state.guesses.length;
  const won = state.gameStatus === 'won';
  const boardCount = state.boards.length;
  const rowWidth = Math.max(1, Math.min(boardCount, Math.ceil(Math.sqrt(boardCount * 2))));

  const emojiGrid = state.boards.map((b) => (b.solved ? '🟩' : '🟥')).join('');
  const rows: string[] = [];
  for (let i = 0; i < emojiGrid.length; i += rowWidth) {
    rows.push(emojiGrid.slice(i, i + rowWidth));
  }
  const formattedGrid = rows.join('\n');

  const text = `Dotriacontordle #${state.dailyNumber}
${won ? `${solved}/${boardCount} in ${guessCount}/${state.config.maxGuesses}` : `${solved}/${boardCount} ❌`}

${formattedGrid}

https://dotriacontordle.com`;

  try {
    if (navigator.share) {
      await navigator.share({ text });
      return { kind: 'success', message: 'Shared.' };
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return { kind: 'success', message: 'Results copied to clipboard.' };
    }

    return { kind: 'error', message: 'Sharing is not available on this device.' };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return null;
    return { kind: 'error', message: 'Unable to share results right now.' };
  }
}
