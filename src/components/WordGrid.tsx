'use client';

import { memo, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Tile, TileWithPop } from './Tile';
import { useGameActions, useGameBoards, useGameInput } from '@/context/GameContext';
import { TileState, WORD_LENGTH } from '@/types/game';

interface WordGridProps {
  boardIndex: number;
  mini?: boolean;
  showCurrentGuess?: boolean;
  maxRows?: number;
  hideStatusRing?: boolean;
  noBg?: boolean;
  glowMode?: boolean;
}

export const WordGrid = memo(function WordGrid({
  boardIndex,
  mini = false,
  showCurrentGuess = false,
  maxRows,
  hideStatusRing = false,
  noBg = false,
  glowMode = false,
}: WordGridProps) {
  const { boards, guesses, gameStatus } = useGameBoards();
  const { currentGuess } = useGameInput();
  const { getEvaluationForBoard } = useGameActions();
  const board = boards[boardIndex];

  const relevantGuesses = board.solved && board.solvedAtGuess !== null
    ? guesses.slice(0, board.solvedAtGuess + 1)
    : guesses;

  const displayGuesses = maxRows ? relevantGuesses.slice(-maxRows) : relevantGuesses;

  const statusClass = hideStatusRing
    ? ''
    : board.solved
    ? 'ring-2 ring-tile-correct/50'
    : gameStatus === 'lost'
    ? 'ring-2 ring-red-500/50'
    : '';

  return (
    <div className={`flex flex-col gap-0.5 p-1 rounded-lg ${noBg ? '' : 'bg-bg-tertiary/50'} ${statusClass} ${mini ? 'gap-px p-0.5' : 'gap-1 p-2'}`}>
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

      {showCurrentGuess && !board.solved && gameStatus === 'playing' && (
        <div className={`flex ${mini ? 'gap-px' : 'gap-0.5'}`}>
          {Array.from({ length: WORD_LENGTH }).map((_, idx) => (
            <TileWithPop
              key={idx}
              letter={currentGuess[idx] || ''}
              state={currentGuess[idx] ? 'tbd' : 'empty'}
              size={mini ? 'mini' : 'normal'}
              glowMode={glowMode}
            />
          ))}
        </div>
      )}

      {mini && !board.solved && gameStatus === 'playing' && (
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
  const { boards, guesses, gameStatus } = useGameBoards();
  const { getEvaluationForBoard } = useGameActions();
  const board = boards[boardIndex];

  const relevantGuesses = board.solved && board.solvedAtGuess !== null
    ? guesses.slice(0, board.solvedAtGuess + 1)
    : guesses;

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [miniLayout, setMiniLayout] = useState(() => ({
    rowsToShow: 3,
    tilePx: 8,
    gapX: 1,
    gapY: 1,
    fontPx: 5,
    radiusPx: 2,
  }));

  useLayoutEffect(() => {
    const el = gridContainerRef.current;
    if (!el) return;

    const computeLayout = (width: number, height: number) => {
      const cols = WORD_LENGTH;
      const isSmallViewport =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(max-width: 640px)').matches;

      const minRows = isSmallViewport ? 5 : 4;
      const maxRowsCap = isSmallViewport ? 8 : 6;
      const desiredMaxRows = isSmallViewport
        ? maxRowsCap
        : Math.min(maxRowsCap, Math.max(minRows, relevantGuesses.length));

      const computeForRows = (rows: number) => {
        const baseCell = Math.min(width / cols, height / rows);
        const gapX = Math.max(0, Math.min(4, Math.floor(baseCell * 0.06)));
        const gapY = Math.max(0, Math.min(4, Math.floor(baseCell * 0.06)));

        const tileW = (width - gapX * (cols - 1)) / cols;
        const tileH = (height - gapY * (rows - 1)) / rows;
        const tilePx = Math.max(4, Math.floor(Math.min(tileW, tileH)));

        const fontPx = Math.max(4, Math.min(14, Math.floor(tilePx * 0.55)));
        const radiusPx = Math.max(2, Math.min(8, Math.floor(tilePx * 0.2)));

        return { rowsToShow: rows, tilePx, gapX, gapY, fontPx, radiusPx };
      };

      const minReadableTilePx = 6;
      for (let rows = desiredMaxRows; rows >= minRows; rows--) {
        const candidate = computeForRows(rows);
        if (candidate.tilePx >= minReadableTilePx) return candidate;
      }

      return computeForRows(minRows);
    };

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) return;
      setMiniLayout((prev) => {
        const next = computeLayout(width, height);
        if (
          prev.rowsToShow === next.rowsToShow &&
          prev.tilePx === next.tilePx &&
          prev.gapX === next.gapX &&
          prev.gapY === next.gapY &&
          prev.fontPx === next.fontPx &&
          prev.radiusPx === next.radiusPx
        ) {
          return prev;
        }
        return next;
      });
    });

    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setMiniLayout(computeLayout(rect.width, rect.height));
    }

    ro.observe(el);
    return () => ro.disconnect();
  }, [relevantGuesses.length]);

  const displayGuesses = relevantGuesses.slice(-miniLayout.rowsToShow);

  const statusClass = board.solved
    ? 'ring-2 ring-tile-correct shadow-glow-green'
    : gameStatus === 'lost'
    ? 'ring-2 ring-red-500'
    : 'hover:ring-2 hover:ring-accent/50';

  const indicatorSummary = (() => {
    if (relevantGuesses.length === 0) return null;

    const rank: Record<TileState, number> = { empty: 0, absent: 1, present: 2, correct: 3, tbd: 0 };
    const best: TileState[] = new Array(WORD_LENGTH).fill('empty');

    for (let i = 0; i < relevantGuesses.length; i++) {
      const states = getEvaluationForBoard(boardIndex, i);
      for (let j = 0; j < WORD_LENGTH; j++) {
        if (rank[states[j]] > rank[best[j]]) best[j] = states[j];
      }
    }

    let correct = 0;
    let present = 0;
    for (const s of best) {
      if (s === 'correct') correct++;
      else if (s === 'present') present++;
    }

    return { correct, present, best };
  })();

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex flex-col gap-px sm:gap-0.5 md:gap-1 p-0.5 sm:p-0.5 md:p-1 lg:p-1.5 rounded-md lg:rounded-lg bg-bg-tertiary cursor-pointer transition-all duration-200 h-full min-w-0 ${statusClass}`}
    >
      <span className="absolute -top-1 -left-1 sm:-top-1.5 sm:-left-1.5 md:-top-2 md:-left-2 w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-bg-secondary rounded-full text-[7px] sm:text-[8px] md:text-[10px] flex items-center justify-center text-text-secondary font-bold z-10 border border-header-border">
        {boardIndex + 1}
      </span>

      {indicatorSummary && (
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 sm:-top-1.5 md:-top-2 flex items-center gap-0.5 pointer-events-none select-none z-10"
          aria-label={`Board ${boardIndex + 1}: ${indicatorSummary.correct} green, ${indicatorSummary.present} yellow`}
          title={`${indicatorSummary.correct} green • ${indicatorSummary.present} yellow (cumulative)`}
        >
          <div className="flex sm:hidden items-center gap-0.5">
            <span
              className={`w-3.5 h-3.5 bg-bg-secondary rounded-full text-[8px] flex items-center justify-center font-bold border border-tile-correct text-tile-correct shadow-[0_0_10px_rgba(34,197,94,0.25)] ${
                indicatorSummary.correct === 0 ? 'opacity-40' : 'opacity-95'
              }`}
            >
              {indicatorSummary.correct}
            </span>
            <span
              className={`w-3.5 h-3.5 bg-bg-secondary rounded-full text-[8px] flex items-center justify-center font-bold border border-tile-present text-tile-present shadow-[0_0_10px_rgba(234,179,8,0.22)] ${
                indicatorSummary.present === 0 ? 'opacity-40' : 'opacity-95'
              }`}
            >
              {indicatorSummary.present}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-0.5 px-1 py-0.5 bg-bg-secondary/85 border border-header-border rounded-full">
            {indicatorSummary.best.map((s, idx) => {
              const dotClass =
                s === 'correct'
                  ? 'bg-tile-correct shadow-[0_0_8px_rgba(34,197,94,0.35)]'
                  : s === 'present'
                  ? 'bg-tile-present shadow-[0_0_8px_rgba(234,179,8,0.28)]'
                  : 'bg-tile-absent/60';
              return (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full ${dotClass}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {board.solved && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-tile-correct/20 rounded-md lg:rounded-lg z-5"
        >
          <span className="text-base sm:text-xl md:text-2xl lg:text-3xl">✓</span>
        </motion.div>
      )}

      <div
        ref={gridContainerRef}
        className="flex flex-col flex-1 min-h-0 overflow-hidden rounded-sm min-w-0 w-full justify-end"
        style={{ gap: `${miniLayout.gapY}px` }}
      >
        {displayGuesses.length < miniLayout.rowsToShow &&
          Array.from({ length: miniLayout.rowsToShow - displayGuesses.length }).map((_, rowIdx) => (
            <div
              key={`empty-${rowIdx}`}
              className="grid w-full justify-center"
              style={{
                gridTemplateColumns: `repeat(${WORD_LENGTH}, ${miniLayout.tilePx}px)`,
                columnGap: `${miniLayout.gapX}px`,
              }}
            >
              {Array.from({ length: WORD_LENGTH }).map((_, colIdx) => (
                <div
                  key={colIdx}
                  className="bg-tile-empty"
                  style={{
                    width: `${miniLayout.tilePx}px`,
                    height: `${miniLayout.tilePx}px`,
                    borderRadius: `${miniLayout.radiusPx}px`,
                  }}
                />
              ))}
            </div>
          ))}
        {displayGuesses.map((guess, guessIdx) => {
          const actualGuessIndex = relevantGuesses.length - displayGuesses.length + guessIdx;
          const evaluation = getEvaluationForBoard(boardIndex, actualGuessIndex);

          return (
            <div
              key={guessIdx}
              className="grid w-full justify-center"
              style={{
                gridTemplateColumns: `repeat(${WORD_LENGTH}, ${miniLayout.tilePx}px)`,
                columnGap: `${miniLayout.gapX}px`,
              }}
            >
              {guess.split('').map((letter, letterIdx) => (
                <div
                  key={letterIdx}
                  className={`
                    font-bold flex items-center justify-center uppercase
                    ${evaluation[letterIdx] === 'correct' ? 'bg-tile-correct text-white' : ''}
                    ${evaluation[letterIdx] === 'present' ? 'bg-tile-present text-white' : ''}
                    ${evaluation[letterIdx] === 'absent' ? 'bg-tile-absent text-white/70' : ''}
                    ${evaluation[letterIdx] === 'empty' ? 'bg-tile-empty' : ''}
                  `}
                  style={{
                    width: `${miniLayout.tilePx}px`,
                    height: `${miniLayout.tilePx}px`,
                    borderRadius: `${miniLayout.radiusPx}px`,
                    fontSize: `${miniLayout.fontPx}px`,
                    lineHeight: 1,
                  }}
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
