'use client';

import { useState } from 'react';
import { HelpCircle, BarChart3, Settings} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { HowToPlayModal } from './modals/HowToPlay';
import { StatsModal } from './modals/Stats';
import { SettingsModal } from './modals/Settings';

export function Header() {
  const { state, newGame } = useGame();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const solvedCount = state.boards.filter((b) => b.solved).length;

  return (
    <>
      <header className="w-full border-b border-header-border bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              <span className="text-accent">DOTRIA</span>
              <span className="text-text-primary">CONTORDLE</span>
            </h1>
            <span className="text-xs text-text-secondary hidden sm:inline">
              32 words • 6 letters • 37 guesses
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="hidden sm:flex items-center gap-4 mr-4">
              <span className="text-text-secondary">
                Solved: <span className="text-accent font-bold">{solvedCount}/32</span>
              </span>
              <span className="text-text-secondary">
                Guesses: <span className="text-accent font-bold">{state.guesses.length}/37</span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <IconButton onClick={() => setShowHowToPlay(true)} title="How to Play">
                <HelpCircle className="w-5 h-5" />
              </IconButton>
              <IconButton onClick={() => setShowStats(true)} title="Statistics">
                <BarChart3 className="w-5 h-5" />
              </IconButton>
              <IconButton onClick={() => setShowSettings(true)} title="Settings">
                <Settings className="w-5 h-5" />
              </IconButton>
              {state.gameStatus !== 'playing' && (
                <button
                  onClick={() => newGame('free')}
                  className="ml-2 px-3 py-1.5 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/80 transition-colors cursor-pointer"
                >
                  New Game
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="sm:hidden border-t border-header-border px-4 py-2 flex justify-center gap-6 text-xs">
          <span className="text-text-secondary">
            Solved: <span className="text-accent font-bold">{solvedCount}/32</span>
          </span>
          <span className="text-text-secondary">
            Guesses: <span className="text-accent font-bold">{state.guesses.length}/37</span>
          </span>
        </div>
      </header>

      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
      <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}

function IconButton({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-md hover:bg-white/10 transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
    >
      {children}
    </button>
  );
}
