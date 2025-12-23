'use client';

import { motion } from 'motion/react';
import { TileState } from '@/types/game';

interface TileProps {
  letter: string;
  state: TileState;
  delay?: number;
  size?: 'mini' | 'normal' | 'large';
  animate?: boolean;
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
      className={`
        flex items-center justify-center font-bold uppercase select-none
        ${stateStyles[state]}
        ${sizeStyles[size]}
        transition-colors duration-100
      `}
      initial={shouldAnimate ? { rotateX: 0 } : false}
      animate={shouldAnimate ? { rotateX: 360 } : false}
      transition={{
        duration: 0.5,
        delay: delay,
        ease: 'easeInOut',
      }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <motion.span
        initial={shouldAnimate ? { opacity: 0 } : false}
        animate={shouldAnimate ? { opacity: 1 } : false}
        transition={{ duration: 0.1, delay: delay + 0.25 }}
      >
        {letter}
      </motion.span>
    </motion.div>
  );
}

// Pop animation for when a letter is typed
export function TileWithPop({ letter, state, delay = 0, size = 'normal' }: TileProps) {
  const hasLetter = letter !== '';

  return (
    <motion.div
      className={`
        flex items-center justify-center font-bold uppercase select-none
        ${stateStyles[state]}
        ${sizeStyles[size]}
      `}
      initial={false}
      animate={hasLetter && state === 'tbd' ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.1 }}
    >
      {letter}
    </motion.div>
  );
}

