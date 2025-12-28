'use client';

import { useEffect, useMemo, useState } from 'react';
import { HelpCircle, BarChart3, Settings, Clock, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useGameActions, useGameBoards } from '@/context/GameContext';
import { HowToPlayModal } from './modals/HowToPlay';
import { StatsModal } from './modals/Stats';
import { SettingsModal } from './modals/Settings';
import { loadSettings, saveSettings } from '@/lib/storage';
import { primeFeedback } from '@/lib/feedback';

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) {
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function Header() {
  const state = useGameBoards();
  const { newGame, toggleTimer } = useGameActions();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [feedbackEnabled, setFeedbackEnabled] = useState(() => loadSettings().feedbackEnabled);

  const solvedCount = state.boards.filter((b) => b.solved).length;
  const [now, setNow] = useState(() => Date.now());
  const [toggleFlash, setToggleFlash] = useState(false);

  useEffect(() => {
    if (!state.timerToggledAt) return;
    let t: number | null = null;
    const raf = window.requestAnimationFrame(() => {
      setToggleFlash(true);
      t = window.setTimeout(() => setToggleFlash(false), 175);
    });
    return () => {
      window.cancelAnimationFrame(raf);
      if (t !== null) window.clearTimeout(t);
    };
  }, [state.timerToggledAt]);

  useEffect(() => {
    if (!state.timerRunning) return;
    if (state.gameStatus !== 'playing') return;

    const tick = () => setNow(Date.now());
    const raf = window.requestAnimationFrame(tick);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, [state.timerRunning, state.gameStatus]);

  useEffect(() => {
    const apply = () => setFeedbackEnabled(loadSettings().feedbackEnabled);
    const onSettingsChanged = () => apply();
    window.addEventListener('dotriacontordle_settings_changed', onSettingsChanged as EventListener);
    return () => window.removeEventListener('dotriacontordle_settings_changed', onSettingsChanged as EventListener);
  }, []);

  const toggleFeedback = async () => {
    const current = loadSettings();
    const next = !current.feedbackEnabled;
    const updated = { ...current, feedbackEnabled: next };
    saveSettings(updated);
    setFeedbackEnabled(next);
    if (next) await primeFeedback();
  };

  const elapsedMs = useMemo(() => {
    if (!state.startedAt) return 0;
    if (state.gameStatus !== 'playing') return state.timerBaseElapsedMs;
    if (!state.timerRunning) return state.timerBaseElapsedMs;
    if (state.timerResumedAt === null) return state.timerBaseElapsedMs;
    return state.timerBaseElapsedMs + (now - state.timerResumedAt);
  }, [
    state.startedAt,
    state.gameStatus,
    state.timerBaseElapsedMs,
    state.timerRunning,
    state.timerResumedAt,
    now,
  ]);

  const timerDisplay = useMemo(() => formatElapsed(elapsedMs), [elapsedMs]);
  const timerActive = state.startedAt !== null;

  return (
    <>
      <header className="w-full border-b border-header-border bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between">
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
              <span className="text-text-secondary flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className={`${timerActive ? 'text-accent' : 'text-text-secondary'} font-bold tabular-nums`}>
                  {timerDisplay}
                </span>
                <button
                  type="button"
                  onClick={toggleTimer}
                  disabled={state.gameStatus !== 'playing'}
                  title="Start/stop timer (Space)"
                  className={[
                    'ml-1 p-1 rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                    toggleFlash ? 'border-accent ring-2 ring-accent/60 shadow-[0_0_18px_rgba(34,211,238,0.35)]' : 'border-transparent hover:bg-white/10',
                  ].join(' ')}
                >
                  {state.timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </span>
              <span className="text-text-secondary">
                Solved: <span className="text-accent font-bold">{solvedCount}/32</span>
              </span>
              <span className="text-text-secondary">
                Guesses: <span className="text-accent font-bold">{state.guesses.length}/37</span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <IconButton onClick={toggleFeedback} title={feedbackEnabled ? 'Mute (sound + haptics)' : 'Unmute (sound + haptics)'}>
                {feedbackEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </IconButton>
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

        <div className="sm:hidden border-t border-header-border px-3 py-1.5 flex justify-center gap-6 text-xs">
          <span className="text-text-secondary flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span className={`${timerActive ? 'text-accent' : 'text-text-secondary'} font-bold tabular-nums`}>
              {timerDisplay}
            </span>
            <button
              type="button"
              onClick={toggleTimer}
              disabled={state.gameStatus !== 'playing'}
              title="Start/stop timer (Space)"
              className={[
                'ml-1 p-1 rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                toggleFlash ? 'border-accent ring-2 ring-accent/60 shadow-[0_0_14px_rgba(34,211,238,0.35)]' : 'border-transparent hover:bg-white/10',
              ].join(' ')}
            >
              {state.timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </span>
          <span className="text-text-secondary">
            Solved: <span className="text-accent font-bold">{solvedCount}/32</span>
          </span>
          <span className="text-text-secondary">
            Guesses: <span className="text-accent font-bold">{state.guesses.length}/37</span>
          </span>
        </div>
      </header>

      {showHowToPlay && <HowToPlayModal isOpen={true} onClose={() => setShowHowToPlay(false)} />}
      {showStats && <StatsModal isOpen={true} onClose={() => setShowStats(false)} />}
      {showSettings && <SettingsModal isOpen={true} onClose={() => setShowSettings(false)} />}
    </>
  );
}

function IconButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void | Promise<void>;
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
