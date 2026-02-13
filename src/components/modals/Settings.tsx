'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { loadSettings, saveSettings } from '@/lib/storage';
import { GameSettings } from '@/types/game';
import { useGameActions, useGameBoards } from '@/context/GameContext';
import { getDailyNumber } from '@/lib/daily';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { gameMode, dailyNumber } = useGameBoards();
  const { newGame, switchMode } = useGameActions();
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const currentDailyNumber = getDailyNumber();
  const maxArchiveDay = Math.max(1, currentDailyNumber - 1);
  const [archiveDaily, setArchiveDaily] = useState(maxArchiveDay);

  const clampArchiveDaily = (value: number) => Math.max(1, Math.min(maxArchiveDay, value));

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

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
          className="bg-bg-secondary rounded-xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Settings</h2>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <SettingRow
              title="Glow Mode"
              description="Inverted neon color theme with enhanced glow effects"
              enabled={settings.glowMode}
              onChange={(enabled) => updateSetting('glowMode', enabled)}
            />
          </div>

          <div className="border-t border-white/10 mt-6 pt-6 space-y-3">
            <button
              onClick={() => {
                if (gameMode === 'daily' && dailyNumber === currentDailyNumber) newGame('daily');
                else switchMode('daily');
                onClose();
              }}
              className="w-full py-3 bg-accent hover:bg-accent/80 rounded-md font-bold transition-colors cursor-pointer"
            >
              Play Daily Puzzle
            </button>
            <button
              onClick={() => {
                if (gameMode === 'free') newGame('free');
                else switchMode('free');
                onClose();
              }}
              className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-md font-bold transition-colors cursor-pointer"
            >
              Start Free Play
            </button>
          </div>

          <div className="border-t border-white/10 mt-6 pt-6">
            <h3 className="font-bold mb-1">Daily Archive Practice</h3>
            <p className="text-sm text-text-secondary mb-3">
              Replay any previous daily seed by number.
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="archive-day" className="text-sm text-text-secondary shrink-0">
                Day #
              </label>
              <input
                id="archive-day"
                type="number"
                min={1}
                max={maxArchiveDay}
                value={archiveDaily}
                onChange={(e) => {
                  const next = parseInt(e.target.value, 10);
                  if (Number.isNaN(next)) {
                    setArchiveDaily(1);
                    return;
                  }
                  setArchiveDaily(clampArchiveDaily(next));
                }}
                className="w-full bg-bg-tertiary border border-white/15 rounded-md px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                onClick={() => {
                  const selectedDay = clampArchiveDaily(archiveDaily);
                  if (gameMode === 'daily' && dailyNumber === selectedDay) newGame('daily', selectedDay);
                  else switchMode('daily', selectedDay);
                  onClose();
                }}
                className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Play
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Available: #1 to #{maxArchiveDay}
            </p>
          </div>

          <div className="border-t border-white/10 mt-6 pt-4 text-center text-xs text-text-secondary">
            <p>Dotriacontordle - 32 Words, 6 Letters, 37 Guesses</p>
            <p className="mt-1">A Wordle variant for true puzzle enthusiasts.</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SettingRow({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-text-secondary">{description}</div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${enabled ? 'bg-tile-correct' : 'bg-white/20'}`}
      >
        <motion.div
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
          animate={{ left: enabled ? '26px' : '2px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
