'use client';

import { motion, AnimatePresence } from 'motion/react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  if (!isOpen) return null;

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
          className="bg-bg-secondary rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">How To Play</h2>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4 text-text-secondary">
            <p className="text-lg text-text-primary font-medium">
              Guess all 32 six-letter words in 37 tries!
            </p>

            <ul className="space-y-2 list-disc list-inside">
              <li>Each guess applies to all 32 word puzzles simultaneously</li>
              <li>The color of the tiles will change to show how close your guess was</li>
              <li>Click on any mini-grid to see it in detail</li>
            </ul>

            <div className="border-t border-white/10 pt-4 mt-4">
              <h3 className="font-bold text-text-primary mb-3">Examples</h3>

              <div className="mb-4">
                <div className="flex gap-1 mb-2">
                  <ExampleTile letter="P" state="correct" />
                  <ExampleTile letter="L" state="empty" />
                  <ExampleTile letter="A" state="empty" />
                  <ExampleTile letter="N" state="empty" />
                  <ExampleTile letter="E" state="empty" />
                  <ExampleTile letter="T" state="empty" />
                </div>
                <p className="text-sm">
                  <span className="text-tile-correct font-bold">P</span> is in the word and in the correct spot.
                </p>
              </div>

              <div className="mb-4">
                <div className="flex gap-1 mb-2">
                  <ExampleTile letter="B" state="empty" />
                  <ExampleTile letter="R" state="present" />
                  <ExampleTile letter="I" state="empty" />
                  <ExampleTile letter="D" state="empty" />
                  <ExampleTile letter="G" state="empty" />
                  <ExampleTile letter="E" state="empty" />
                </div>
                <p className="text-sm">
                  <span className="text-tile-present font-bold">R</span> is in the word but in the wrong spot.
                </p>
              </div>

              <div className="mb-4">
                <div className="flex gap-1 mb-2">
                  <ExampleTile letter="F" state="empty" />
                  <ExampleTile letter="A" state="empty" />
                  <ExampleTile letter="M" state="empty" />
                  <ExampleTile letter="I" state="absent" />
                  <ExampleTile letter="L" state="empty" />
                  <ExampleTile letter="Y" state="empty" />
                </div>
                <p className="text-sm">
                  <span className="text-tile-absent font-bold">I</span> is not in the word in any spot.
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="font-bold text-text-primary mb-2">Game Modes</h3>
              <ul className="space-y-2 list-disc list-inside text-sm">
                <li>
                  <span className="text-accent font-medium">Daily:</span> Everyone plays the same puzzle. Come back tomorrow for a new one!
                </li>
                <li>
                  <span className="text-accent font-medium">Free Play:</span> Practice with random puzzles any time.
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ExampleTile({ letter, state }: { letter: string; state: 'correct' | 'present' | 'absent' | 'empty' }) {
  const stateStyles = {
    correct: 'bg-tile-correct border-tile-correct',
    present: 'bg-tile-present border-tile-present',
    absent: 'bg-tile-absent border-tile-absent',
    empty: 'bg-tile-empty border-tile-border',
  };

  return (
    <div className={`w-10 h-10 flex items-center justify-center font-bold text-lg border-2 ${stateStyles[state]}`}>
      {letter}
    </div>
  );
}
