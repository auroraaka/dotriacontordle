'use client';

import { motion } from 'motion/react';

export function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-bg-primary overflow-hidden">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          <span className="text-gradient">Dotriacontordle</span>
        </h1>
        <p className="text-text-secondary text-center mt-2 text-sm">
          32 Wordles at once
        </p>
      </motion.div>

      <div className="flex gap-2 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-10 h-12 sm:w-12 sm:h-14 rounded-lg bg-tile-empty border border-tile-border"
            initial={{ y: 0 }}
            animate={{ 
              y: [-5, 5, -5],
              backgroundColor: [
                'var(--tile-empty)',
                i % 3 === 0 ? 'var(--tile-correct)' : i % 3 === 1 ? 'var(--tile-present)' : 'var(--tile-absent)',
                'var(--tile-empty)'
              ]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <p className="text-text-secondary flex items-center gap-2">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full"
          />
          Fetching words from dictionary...
        </p>
        <p className="text-text-secondary/60 text-xs mt-2">
          Building your word pool for today
        </p>
      </motion.div>

      <div className="fixed inset-0 -z-10 bg-grid-pattern opacity-5 pointer-events-none" />
    </div>
  );
}
