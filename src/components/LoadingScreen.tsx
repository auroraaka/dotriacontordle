'use client';

import { motion } from 'motion/react';

export function LoadingScreen() {
  return (
    <div className="bg-bg-primary flex h-[100dvh] h-screen flex-col items-center justify-center overflow-hidden">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          <span className="text-gradient">Dotriacontordle</span>
        </h1>
        <p className="text-text-secondary mt-2 text-center text-sm">One guess. Every board.</p>
      </motion.div>

      <div className="mb-6 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="bg-tile-empty border-tile-border h-12 w-10 rounded-lg border sm:h-14 sm:w-12"
            initial={{ y: 0 }}
            animate={{
              y: [-5, 5, -5],
              backgroundColor: [
                'var(--tile-empty)',
                i % 3 === 0
                  ? 'var(--tile-correct)'
                  : i % 3 === 1
                    ? 'var(--tile-present)'
                    : 'var(--tile-absent)',
                'var(--tile-empty)',
              ],
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
            className="border-accent inline-block h-4 w-4 rounded-full border-2 border-t-transparent"
          />
          Fetching words from dictionary...
        </p>
        <p className="text-text-secondary/60 mt-2 text-xs">Calibrating your puzzle matrix</p>
      </motion.div>

      <div className="bg-grid-pattern pointer-events-none fixed inset-0 -z-10 opacity-5" />
    </div>
  );
}
