'use client';

import { memo } from 'react';
import { motion } from 'motion/react';
import { Tile, TileWithPop } from './Tile';
import { useGame } from '@/context/GameContext';
import { WORD_LENGTH } from '@/types/game';

interface WordGridProps {
  boardIndex: number;
  mini?: boolean;
  showCurrentGuess?: boolean;
  maxRows?: number;
  hideStatusRing?: boolean;
}

export const WordGrid = memo(function WordGrid({
  boardIndex,
  mini = false,
  showCurrentGuess = false,
  maxRows,
  hideStatusRing = false,
}: WordGridProps) {
  const { state, getEvaluationForBoard } = useGame();
  const board = state.boards[boardIndex];
  const { guesses, currentGuess } = state;

  const relevantGuesses = board.solved && board.solvedAtGuess !== null
    ? guesses.slice(0, board.solvedAtGuess + 1)
    : guesses;

  const displayGuesses = maxRows ? relevantGuesses.slice(-maxRows) : relevantGuesses;

  const statusClass = hideStatusRing
    ? ''
    : board.solved
    ? 'ring-2 ring-tile-correct/50'
    : state.gameStatus === 'lost'
    ? 'ring-2 ring-red-500/50'
    : '';

  return (
    <div className={`flex flex-col gap-0.5 p-1 rounded-lg bg-bg-tertiary/50 ${statusClass} ${mini ? 'gap-px p-0.5' : 'gap-1 p-2'}`}>
      {displayGuesses.map((guess, guessIdx) => {
        const actualGuessIndex = maxRows
          ? relevantGuesses.length - displayGuesses.length + guessIdx
          : guessIdx;
        const evaluation = getEvaluationForBoard(boardIndex, actualGuessIndex);

        return (
          <div key={guessIdx} className={`flex ${mini ? 'gap-px' : 'gap-0.5'}`}>
            {guess.split('').map((letter, letterIdx) => (
              <Tile
                key={letterIdx}
                letter={letter}
                state={evaluation[letterIdx]}
                delay={0}
                size={mini ? 'mini' : 'normal'}
                animate={false}
              />
            ))}
          </div>
        );
      })}

      {showCurrentGuess && !board.solved && state.gameStatus === 'playing' && (
        <div className={`flex ${mini ? 'gap-px' : 'gap-0.5'}`}>
          {Array.from({ length: WORD_LENGTH }).map((_, idx) => (
            <TileWithPop
              key={idx}
              letter={currentGuess[idx] || ''}
              state={currentGuess[idx] ? 'tbd' : 'empty'}
              size={mini ? 'mini' : 'normal'}
            />
          ))}
        </div>
      )}

      {mini && !board.solved && state.gameStatus === 'playing' && (
        <div className="flex gap-px">
          {Array.from({ length: WORD_LENGTH }).map((_, idx) => (
            <Tile key={idx} letter="" state="empty" size="mini" animate={false} />
          ))}
        </div>
      )}
    </div>
  );
});

export const MiniWordGrid = memo(function MiniWordGrid({
  boardIndex,
  onClick,
}: {
  boardIndex: number;
  onClick: () => void;
}) {
  const { state, getEvaluationForBoard } = useGame();
  const board = state.boards[boardIndex];
  const { guesses } = state;

  const relevantGuesses = board.solved && board.solvedAtGuess !== null
    ? guesses.slice(0, board.solvedAtGuess + 1)
    : guesses;
  const displayGuesses = relevantGuesses.slice(-3);

  const statusClass = board.solved
    ? 'ring-2 ring-tile-correct shadow-glow-green'
    : state.gameStatus === 'lost'
    ? 'ring-2 ring-red-500'
    : 'hover:ring-2 hover:ring-accent/50';

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex flex-col gap-px sm:gap-0.5 md:gap-1 p-0.5 sm:p-1 md:p-1.5 lg:p-2 rounded-md lg:rounded-lg bg-bg-tertiary cursor-pointer transition-all duration-200 h-full min-w-0 ${statusClass}`}
    >
      <span className="absolute -top-1 -left-1 sm:-top-1.5 sm:-left-1.5 md:-top-2 md:-left-2 w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-bg-secondary rounded-full text-[7px] sm:text-[8px] md:text-[10px] flex items-center justify-center text-text-secondary font-bold z-10 border border-header-border">
        {boardIndex + 1}
      </span>

      {board.solved && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-tile-correct/20 rounded-md lg:rounded-lg z-5"
        >
          <span className="text-base sm:text-xl md:text-2xl lg:text-3xl">✓</span>
        </motion.div>
      )}

      <div className="flex flex-col gap-px sm:gap-0.5 md:gap-1 flex-1 justify-center overflow-hidden rounded-sm min-w-0">
        {displayGuesses.length < 3 && Array.from({ length: 3 - displayGuesses.length }).map((_, rowIdx) => (
          <div key={`empty-${rowIdx}`} className="flex gap-px sm:gap-0.5 md:gap-1 justify-center">
            {Array.from({ length: WORD_LENGTH }).map((_, colIdx) => (
              <div key={colIdx} className="aspect-square w-[7px] xs:w-2 sm:w-3 md:w-3.5 lg:w-5 rounded-[2px] sm:rounded-sm bg-tile-empty flex-shrink-0" />
            ))}
          </div>
        ))}
        {displayGuesses.map((guess, guessIdx) => {
          const actualGuessIndex = relevantGuesses.length - displayGuesses.length + guessIdx;
          const evaluation = getEvaluationForBoard(boardIndex, actualGuessIndex);

          return (
            <div key={guessIdx} className="flex gap-px sm:gap-0.5 md:gap-1 justify-center">
              {guess.split('').map((letter, letterIdx) => (
                <div
                  key={letterIdx}
                  className={`
                    aspect-square w-[7px] xs:w-2 sm:w-3 md:w-3.5 lg:w-5 rounded-[2px] sm:rounded-sm text-[4px] xs:text-[5px] sm:text-[6px] md:text-[8px] lg:text-[10px] font-bold flex items-center justify-center uppercase flex-shrink-0
                    ${evaluation[letterIdx] === 'correct' ? 'bg-tile-correct text-white' : ''}
                    ${evaluation[letterIdx] === 'present' ? 'bg-tile-present text-white' : ''}
                    ${evaluation[letterIdx] === 'absent' ? 'bg-tile-absent text-white/70' : ''}
                    ${evaluation[letterIdx] === 'empty' ? 'bg-tile-empty' : ''}
                  `}
                >
                  {letter}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </motion.button>
  );
});
