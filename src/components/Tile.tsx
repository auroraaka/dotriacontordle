'use client';

import { motion } from 'motion/react';
import { TileState } from '@/types/game';

interface TileProps {
  letter: string;
  state: TileState;
  delay?: number;
  size?: 'mini' | 'normal' | 'large';
  animate?: boolean;
  glowMode?: boolean;
}

const stateStyles: Record<TileState, string> = {
  empty: 'bg-tile-empty border-tile-border',
  tbd: 'bg-tile-empty border-tile-active',
  correct: 'bg-tile-correct border-tile-correct text-white',
  present: 'bg-tile-present border-tile-present text-white',
  absent: 'bg-tile-absent border-tile-absent text-white',
};

const sizeStyles = {
  mini: 'w-4 h-4 text-[8px] border',
  normal: 'w-10 h-10 text-lg border-2 sm:w-12 sm:h-12 sm:text-xl',
  large: 'w-14 h-14 text-2xl border-2',
};

export function Tile({ letter, state, delay = 0, size = 'normal', animate = true }: TileProps) {
  const shouldAnimate = animate && state !== 'empty' && state !== 'tbd';

  return (
    <motion.div
      className={`flex items-center justify-center font-bold uppercase select-none transition-colors duration-100 ${stateStyles[state]} ${sizeStyles[size]}`}
      initial={shouldAnimate ? { rotateX: 0 } : false}
      animate={shouldAnimate ? { rotateX: 360 } : false}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <motion.span
        initial={shouldAnimate ? { opacity: 0 } : false}
        animate={shouldAnimate ? { opacity: 1 } : false}
        transition={{ duration: 0.05, delay: delay + 0.07 }}
      >
        {letter}
      </motion.span>
    </motion.div>
  );
}

const POP_ANIMATION = { scale: [1, 1.1, 1] };
const NO_ANIMATION = {};
const POP_TRANSITION = { duration: 0.1 };

const GLOW_STYLE = {
  background: 'var(--tile-active-bg)',
  color: 'var(--tile-active-color)',
  borderColor: 'var(--tile-active-border)',
  boxShadow: 'var(--tile-active-shadow)',
  textShadow: 'var(--tile-active-text-shadow)',
};

const NORMAL_ACTIVE_STYLE = {
  background: 'var(--tile-active-bg)',
  color: 'var(--tile-active-color)',
  borderColor: 'var(--tile-active-border)',
  boxShadow: 'var(--tile-active-shadow)',
};

export function TileWithPop({ letter, state, size = 'normal', glowMode = false }: TileProps) {
  const hasLetter = letter !== '';
  const isTbd = state === 'tbd' && hasLetter;

  return (
    <motion.div
      className={`flex items-center justify-center font-bold uppercase select-none ${stateStyles[state]} ${sizeStyles[size]}`}
      initial={false}
      animate={isTbd ? POP_ANIMATION : NO_ANIMATION}
      transition={POP_TRANSITION}
      style={isTbd ? (glowMode ? GLOW_STYLE : NORMAL_ACTIVE_STYLE) : undefined}
    >
      {letter}
    </motion.div>
  );
}
