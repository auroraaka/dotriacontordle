'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameProvider, useGameAux, useGameBoards, useGameInput } from '@/context/GameContext';
import { Header } from '@/components/Header';
import { GameBoard } from '@/components/GameBoard';
import { Keyboard } from '@/components/Keyboard';
import { LoadingScreen } from '@/components/LoadingScreen';
import { loadSettings } from '@/lib/storage';

function GameContent() {
  const { boards, guesses, gameStatus, config } = useGameBoards();
  const { currentGuess } = useGameInput();
  const { error, isLoadingWords } = useGameAux();
  const [glowMode, setGlowMode] = useState(false);

  useEffect(() => {
    const apply = () => {
      const settings = loadSettings();
      setGlowMode(settings.glowMode);
      if (settings.glowMode) document.body.classList.add('glow-mode');
      else document.body.classList.remove('glow-mode');
    };

    apply();

    const onSettingsChanged = () => apply();
    window.addEventListener('dotriacontordle_settings_changed', onSettingsChanged as EventListener);
    return () =>
      window.removeEventListener(
        'dotriacontordle_settings_changed',
        onSettingsChanged as EventListener
      );
  }, []);

  if (isLoadingWords) {
    return <LoadingScreen />;
  }

  return (
    <div className="bg-bg-primary flex h-[100dvh] h-screen flex-col overflow-hidden">
      <Header />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-md bg-red-500 px-4 py-2 font-medium text-white shadow-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameStatus !== 'playing' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`w-full shrink-0 py-2 text-center text-base font-bold ${
              gameStatus === 'won'
                ? 'bg-tile-correct/20 text-tile-correct'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {gameStatus === 'won' ? (
              <>
                Congratulations! You solved all {boards.length} words in {guesses.length} guesses.
              </>
            ) : (
              <>
                Game Over - You solved {boards.filter((b) => b.solved).length}/{boards.length} words
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="xs:p-2 flex min-h-0 flex-1 items-center justify-center p-1 sm:p-4">
          <GameBoard />
        </div>

        <div className="xs:pb-3 shrink-0 px-2 pb-2 sm:px-4 sm:pb-8">
          {gameStatus === 'playing' && (
            <div className="xs:my-3 my-2 flex justify-center sm:my-5">
              <div className="xs:gap-1.5 xs:p-2 bg-bg-tertiary/60 flex gap-1 rounded-xl border border-white/5 p-1.5 backdrop-blur-sm sm:gap-2 sm:p-3">
                {Array.from({ length: config.wordLength }).map((_, i) => (
                  <div
                    key={i}
                    className={`xs:w-9 xs:h-11 xs:text-2xl flex h-10 w-8 items-center justify-center rounded-lg border-2 text-xl font-bold uppercase transition-all duration-150 sm:h-14 sm:w-12 sm:text-3xl ${
                      currentGuess[i]
                        ? ''
                        : 'bg-tile-empty/30 text-text-secondary/20 border-tile-border/50'
                    }`}
                    style={
                      currentGuess[i]
                        ? glowMode
                          ? {
                              background: 'rgba(255, 0, 255, 0.2)',
                              color: '#ff00ff',
                              borderColor: '#ff00ff',
                              boxShadow:
                                '0 0 20px rgba(255, 0, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.2), inset 0 0 15px rgba(255, 0, 255, 0.1)',
                              textShadow: '0 0 10px rgba(255, 0, 255, 0.8)',
                            }
                          : {
                              background: 'rgba(6, 182, 212, 0.2)',
                              color: 'rgb(34, 211, 238)',
                              borderColor: 'rgb(34, 211, 238)',
                              boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
                            }
                        : undefined
                    }
                  >
                    {currentGuess[i] || ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Keyboard />
        </div>
      </main>

      <div className="bg-grid-pattern pointer-events-none fixed inset-0 -z-10 opacity-5" />
    </div>
  );
}

export default function Home() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
