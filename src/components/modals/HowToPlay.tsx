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
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 text-text-secondary">
            <p className="text-lg text-text-primary font-medium">
              Solve the full matrix: {config.boardCount} synchronized {config.wordLength}-letter targets in {config.maxGuesses} tries.
            </p>

            <ul className="space-y-2 list-disc list-inside">
              <li>Each guess is broadcast to every board at once</li>
              <li>Tile colors reveal precision: exact, displaced, or absent letters</li>
              <li>Open any mini-grid for a focused board-level analysis</li>
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
                  <span className="text-accent font-medium">Daily:</span> A shared daily seed for your selected profile. Return next cycle for a new matrix.
                </li>
                <li>
                  <span className="text-accent font-medium">Free Play:</span> On-demand procedural runs for practice, speed, and experimentation.
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
