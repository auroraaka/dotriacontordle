'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Share2 } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { formatTimeUntilNextDaily } from '@/lib/daily';
import { useEffect, useState } from 'react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const { stats, state } = useGame();
  const [timeUntilNext, setTimeUntilNext] = useState(formatTimeUntilNextDaily());

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

  if (!isOpen) return null;

  const winPercentage = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  const maxDistribution = Math.max(...stats.guessDistribution, 1);
  const visibleDistribution = stats.guessDistribution.slice(0, 40);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-bg-secondary rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Statistics</h2>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatBox value={stats.gamesPlayed} label="Played" />
            <StatBox value={winPercentage} label="Win %" />
            <StatBox value={stats.currentStreak} label="Current Streak" />
            <StatBox value={stats.maxStreak} label="Max Streak" />
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-3">Guess Distribution</h3>
            {stats.gamesPlayed === 0 ? (
              <p className="text-text-secondary text-sm">No data yet</p>
            ) : (
              <div className="space-y-1">
                {visibleDistribution.map((count, idx) => {
                  if (idx > 36) return null;
                  const width = count > 0 ? Math.max((count / maxDistribution) * 100, 10) : 7;
                  const isCurrentGame = state.gameStatus === 'won' && state.guesses.length === idx + 1;

                  return (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-right">{idx + 1}</span>
                      <div
                        className={`h-4 flex items-center justify-end px-1 rounded-sm ${isCurrentGame ? 'bg-tile-correct' : 'bg-tile-absent'}`}
                        style={{ width: `${width}%` }}
                      >
                        <span className="font-bold">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {state.gameMode === 'daily' && (
            <div className="border-t border-white/10 pt-4">
              <div className="text-center">
                <p className="text-sm text-text-secondary mb-1">Next Dotriacontordle</p>
                <p className="text-2xl font-mono font-bold text-accent">{timeUntilNext}</p>
              </div>
            </div>
          )}

          {state.gameStatus !== 'playing' && (
            <div className="border-t border-white/10 pt-4 mt-4">
              <button
                onClick={() => shareResults(state)}
                className="w-full py-3 bg-tile-correct hover:bg-tile-correct/80 rounded-md font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs text-text-secondary">{label}</div>
    </div>
  );
}

function shareResults(state: { boards: { solved: boolean }[]; guesses: string[]; dailyNumber: number; gameStatus: string }) {
  const solved = state.boards.filter((b) => b.solved).length;
  const guessCount = state.guesses.length;
  const won = state.gameStatus === 'won';

  const emojiGrid = state.boards.map((b) => (b.solved ? '🟩' : '🟥')).join('');
  const formattedGrid = [
    emojiGrid.slice(0, 8),
    emojiGrid.slice(8, 16),
    emojiGrid.slice(16, 24),
    emojiGrid.slice(24, 32),
  ].join('\n');

  const text = `Dotriacontordle #${state.dailyNumber}
${won ? `${solved}/32 in ${guessCount}/37` : `${solved}/32 ❌`}

${formattedGrid}

https://dotriacontordle.com`;

  if (navigator.share) {
    navigator.share({ text });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
    alert('Results copied to clipboard!');
  }
}
