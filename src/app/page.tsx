'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameProvider, useGame } from '@/context/GameContext';
import { Header } from '@/components/Header';
import { GameBoard } from '@/components/GameBoard';
import { Keyboard } from '@/components/Keyboard';
import { LoadingScreen } from '@/components/LoadingScreen';
import { loadSettings } from '@/lib/storage';

function GameContent() {
  const { state, error, isLoadingWords } = useGame();
  const [showError, setShowError] = useState(false);
  const [glowMode, setGlowMode] = useState(false);

  useEffect(() => {
    const settings = loadSettings();
    setGlowMode(settings.glowMode);
    if (settings.glowMode) {
      document.body.classList.add('glow-mode');
    } else {
      document.body.classList.remove('glow-mode');
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const settings = loadSettings();
      setGlowMode(settings.glowMode);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (isLoadingWords) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
      <Header />

      <AnimatePresence>
        {showError && error && (
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
        {state.gameStatus !== 'playing' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`w-full py-2 text-center font-bold text-base shrink-0 ${
              state.gameStatus === 'won' ? 'bg-tile-correct/20 text-tile-correct' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {state.gameStatus === 'won' ? (
              <>🎉 Congratulations! You solved all 32 words in {state.guesses.length} guesses!</>
            ) : (
              <>Game Over - You solved {state.boards.filter(b => b.solved).length}/32 words</>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 flex items-center justify-center p-2 sm:p-4">
          <GameBoard />
        </div>

        <div className="shrink-0 pb-6 sm:pb-8 px-2 sm:px-4">
          {state.gameStatus === 'playing' && (
            <div className="flex justify-center mb-4 sm:mb-5 mt-4 sm:mt-5">
              <div className="flex gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl bg-bg-tertiary/60 backdrop-blur-sm border border-white/5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-10 h-12 sm:w-12 sm:h-14 rounded-lg font-bold text-2xl sm:text-3xl flex items-center justify-center uppercase transition-all duration-150 border-2 ${
                      state.currentGuess[i] 
                        ? '' 
                        : 'bg-tile-empty/30 text-text-secondary/20 border-tile-border/50'
                    }`}
                    style={state.currentGuess[i] ? (glowMode ? {
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
                    {state.currentGuess[i] || ''}
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
