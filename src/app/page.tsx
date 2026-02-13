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
    return () => window.removeEventListener('dotriacontordle_settings_changed', onSettingsChanged as EventListener);
  }, []);

  if (isLoadingWords) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-bg-primary overflow-hidden">
      <Header />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-500 text-white rounded-md font-medium shadow-lg"
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
            className={`w-full py-2 text-center font-bold text-base shrink-0 ${
              gameStatus === 'won' ? 'bg-tile-correct/20 text-tile-correct' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {gameStatus === 'won' ? (
              <>Congratulations! You solved all {boards.length} words in {guesses.length} guesses.</>
            ) : (
              <>Game Over - You solved {boards.filter((b) => b.solved).length}/{boards.length} words</>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 flex items-center justify-center p-1 xs:p-2 sm:p-4">
          <GameBoard />
        </div>

        <div className="shrink-0 pb-2 xs:pb-3 sm:pb-8 px-2 sm:px-4">
          {gameStatus === 'playing' && (
            <div className="flex justify-center my-2 xs:my-3 sm:my-5">
              <div className="flex gap-1 xs:gap-1.5 sm:gap-2 p-1.5 xs:p-2 sm:p-3 rounded-xl bg-bg-tertiary/60 backdrop-blur-sm border border-white/5">
                {Array.from({ length: config.wordLength }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-10 xs:w-9 xs:h-11 sm:w-12 sm:h-14 rounded-lg font-bold text-xl xs:text-2xl sm:text-3xl flex items-center justify-center uppercase transition-all duration-150 border-2 ${
                      currentGuess[i]
                        ? '' 
                        : 'bg-tile-empty/30 text-text-secondary/20 border-tile-border/50'
                    }`}
                    style={currentGuess[i] ? (glowMode ? {
                      background: 'rgba(255, 0, 255, 0.2)',
                      color: '#ff00ff',
                      borderColor: '#ff00ff',
                      boxShadow: '0 0 20px rgba(255, 0, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.2), inset 0 0 15px rgba(255, 0, 255, 0.1)',
                      textShadow: '0 0 10px rgba(255, 0, 255, 0.8)',
                    } : {
                      background: 'rgba(6, 182, 212, 0.2)',
                      color: 'rgb(34, 211, 238)',
                      borderColor: 'rgb(34, 211, 238)',
                      boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
                    }) : undefined}
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

      <div className="fixed inset-0 -z-10 bg-grid-pattern opacity-5 pointer-events-none" />
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
