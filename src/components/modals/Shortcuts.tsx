'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Keyboard } from 'lucide-react';
import { useGameBoards } from '@/context/GameContext';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BASE_SHORTCUTS = [
  { keyLabel: 'A-Z', description: 'Type letters' },
  { keyLabel: 'Enter', description: 'Submit guess' },
  { keyLabel: 'Backspace', description: 'Delete letter' },
  { keyLabel: 'Space', description: 'Toggle timer' },
  { keyLabel: 'Esc', description: 'Close expanded board modal' },
  { keyLabel: 'Left/Right', description: 'Navigate expanded board' },
];

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const { boards } = useGameBoards();
  const shortcuts = [
    { keyLabel: `1-${boards.length}`, description: 'Jump to a board number' },
    ...BASE_SHORTCUTS,
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="shortcuts-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          key="shortcuts-modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-bg-secondary max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Keyboard className="text-accent h-6 w-6" />
              Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-md p-2 transition-colors hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.keyLabel}
                className="bg-bg-tertiary/60 flex items-center justify-between gap-4 rounded-md border border-white/10 px-3 py-2"
              >
                <span className="text-accent font-mono text-sm">{shortcut.keyLabel}</span>
                <span className="text-text-secondary text-right text-sm">
                  {shortcut.description}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
