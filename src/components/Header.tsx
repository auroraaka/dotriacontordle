'use client';

import { useState } from 'react';
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
          {/* Logo */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              <span className="text-accent">DOTRIA</span>
              <span className="text-text-primary">CONTORDLE</span>
            </h1>
            <span className="text-xs text-text-secondary hidden sm:inline">
              32 words • 6 letters • 37 guesses
            </span>
          </div>

          {/* Game Info */}
          <div className="flex items-center gap-2 text-sm">
            <div className="hidden sm:flex items-center gap-4 mr-4">
              <span className="text-text-secondary">
                Solved: <span className="text-accent font-bold">{solvedCount}/32</span>
              </span>
              <span className="text-text-secondary">
                Guesses: <span className="text-accent font-bold">{state.guesses.length}/37</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <IconButton onClick={() => setShowHowToPlay(true)} title="How to Play">
                <QuestionIcon />
              </IconButton>
              <IconButton onClick={() => setShowStats(true)} title="Statistics">
                <ChartIcon />
              </IconButton>
              <IconButton onClick={() => setShowSettings(true)} title="Settings">
                <SettingsIcon />
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

        {/* Mobile game info bar */}
        <div className="sm:hidden border-t border-header-border px-4 py-2 flex justify-center gap-6 text-xs">
          <span className="text-text-secondary">
            Solved: <span className="text-accent font-bold">{solvedCount}/32</span>
          </span>
          <span className="text-text-secondary">
            Guesses: <span className="text-accent font-bold">{state.guesses.length}/37</span>
          </span>
        </div>
      </header>

      {/* Modals */}
      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
      <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}

function IconButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
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

function QuestionIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

