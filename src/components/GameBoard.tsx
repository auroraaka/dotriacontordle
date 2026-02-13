'use client';

import { useMemo } from 'react';
import { useGameActions, useGameBoards } from '@/context/GameContext';
import { MiniWordGrid } from './WordGrid';
import { ExpandedBoard } from './ExpandedBoard';

export function GameBoard() {
  const { gameId, expandedBoard, boards } = useGameBoards();
  const { setExpandedBoard } = useGameActions();
  const boardCount = boards.length;

  const { cols, rows } = useMemo(() => {
    const safeBoardCount = Math.max(1, boardCount);
    const colsEstimate = Math.ceil(Math.sqrt(safeBoardCount * 2));
    const nextCols = Math.max(1, Math.min(safeBoardCount, colsEstimate));
    const nextRows = Math.max(1, Math.ceil(safeBoardCount / nextCols));
    return { cols: nextCols, rows: nextRows };
  }, [boardCount]);

  return (
    <>
      <div className="w-full h-full max-w-[1600px] mx-auto flex items-center justify-center px-0.5 xs:px-1 sm:px-0">
        <div
          key={gameId}
          className="grid gap-0.5 xs:gap-1 sm:gap-2 md:gap-3 lg:gap-4 w-full h-full max-h-full max-w-full p-2 sm:p-2.5 md:p-3"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {boards.map((_, boardIndex) => (
            <MiniWordGrid
              key={boardIndex}
              boardIndex={boardIndex}
              onClick={() => setExpandedBoard(boardIndex)}
            />
          ))}
        </div>
      </div>

      {expandedBoard !== null && boardCount > 0 && (
        <ExpandedBoard
          boardIndex={expandedBoard}
          onClose={() => setExpandedBoard(null)}
          onNavigate={(direction) => {
            const newIndex = expandedBoard + direction;
            setExpandedBoard(((newIndex % boardCount) + boardCount) % boardCount);
          }}
        />
      )}
    </>
  );
}
