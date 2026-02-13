'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useGameBoards } from '@/context/GameContext';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  const { config } = useGameBoards();
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
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
          className="bg-bg-secondary max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">How To Play</h2>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-md p-2 transition-colors hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="text-text-secondary space-y-4">
            <p className="text-text-primary text-lg font-medium">
              Solve the full matrix: {config.boardCount} synchronized {config.wordLength}-letter
              targets in {config.maxGuesses} tries.
            </p>

            <ul className="list-inside list-disc space-y-2">
              <li>Each guess is broadcast to every board at once</li>
              <li>Tile colors reveal precision: exact, displaced, or absent letters</li>
              <li>Open any mini-grid for a focused board-level analysis</li>
            </ul>

            <div className="mt-4 border-t border-white/10 pt-4">
              <h3 className="text-text-primary mb-3 font-bold">Examples</h3>

              <div className="mb-4">
                <div className="mb-2 flex gap-1">
                  <ExampleTile letter="P" state="correct" />
                  <ExampleTile letter="L" state="empty" />
                  <ExampleTile letter="A" state="empty" />
                  <ExampleTile letter="N" state="empty" />
                  <ExampleTile letter="E" state="empty" />
                  <ExampleTile letter="T" state="empty" />
                </div>
                <p className="text-sm">
                  <span className="text-tile-correct font-bold">P</span> is in the word and in the
                  correct spot.
                </p>
              </div>

              <div className="mb-4">
                <div className="mb-2 flex gap-1">
                  <ExampleTile letter="B" state="empty" />
                  <ExampleTile letter="R" state="present" />
                  <ExampleTile letter="I" state="empty" />
                  <ExampleTile letter="D" state="empty" />
                  <ExampleTile letter="G" state="empty" />
                  <ExampleTile letter="E" state="empty" />
                </div>
                <p className="text-sm">
                  <span className="text-tile-present font-bold">R</span> is in the word but in the
                  wrong spot.
                </p>
              </div>

              <div className="mb-4">
                <div className="mb-2 flex gap-1">
                  <ExampleTile letter="F" state="empty" />
                  <ExampleTile letter="A" state="empty" />
                  <ExampleTile letter="M" state="empty" />
                  <ExampleTile letter="I" state="absent" />
                  <ExampleTile letter="L" state="empty" />
                  <ExampleTile letter="Y" state="empty" />
                </div>
                <p className="text-sm">
                  <span className="text-tile-absent font-bold">I</span> is not in the word in any
                  spot.
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-text-primary mb-2 font-bold">Game Modes</h3>
              <ul className="list-inside list-disc space-y-2 text-sm">
                <li>
                  <span className="text-accent font-medium">Daily:</span> A shared daily seed for
                  your selected profile. Return next cycle for a new matrix.
                </li>
                <li>
                  <span className="text-accent font-medium">Free Play:</span> On-demand procedural
                  runs for practice, speed, and experimentation.
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ExampleTile({
  letter,
  state,
}: {
  letter: string;
  state: 'correct' | 'present' | 'absent' | 'empty';
}) {
  const stateStyles = {
    correct: 'bg-tile-correct border-tile-correct',
    present: 'bg-tile-present border-tile-present',
    absent: 'bg-tile-absent border-tile-absent',
    empty: 'bg-tile-empty border-tile-border',
  };

  return (
    <div
      className={`flex h-10 w-10 items-center justify-center border-2 text-lg font-bold ${stateStyles[state]}`}
    >
      {letter}
    </div>
  );
}
