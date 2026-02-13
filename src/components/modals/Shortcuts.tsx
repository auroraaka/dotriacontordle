'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keyLabel: '1-32', description: 'Jump to a board number' },
  { keyLabel: 'A-Z', description: 'Type letters' },
  { keyLabel: 'Enter', description: 'Submit guess' },
  { keyLabel: 'Backspace', description: 'Delete letter' },
  { keyLabel: 'Space', description: 'Toggle timer' },
  { keyLabel: 'Esc', description: 'Close expanded board modal' },
  { keyLabel: 'Left/Right', description: 'Navigate expanded board' },
];

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="shortcuts-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          key="shortcuts-modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-bg-secondary rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Keyboard className="w-6 h-6 text-accent" />
              Shortcuts
            </h2>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {SHORTCUTS.map((shortcut) => (
              <div
                key={shortcut.keyLabel}
                className="flex items-center justify-between gap-4 rounded-md bg-bg-tertiary/60 border border-white/10 px-3 py-2"
              >
                <span className="font-mono text-sm text-accent">{shortcut.keyLabel}</span>
                <span className="text-sm text-text-secondary text-right">{shortcut.description}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
