'use client';

import { useGameActions, useGameBoards } from '@/context/GameContext';
import { MiniWordGrid } from './WordGrid';
import { ExpandedBoard } from './ExpandedBoard';
import { BOARD_COLS, BOARD_ROWS } from '@/types/game';

export function GameBoard() {
  const { gameId, expandedBoard } = useGameBoards();
  const { setExpandedBoard } = useGameActions();

  return (
    <>
      <div className="w-full h-full max-w-[1600px] mx-auto flex items-center justify-center px-0.5 xs:px-1 sm:px-0">
        <div
          key={gameId}
          className="grid gap-0.5 xs:gap-1 sm:gap-2 md:gap-3 lg:gap-4 w-full h-full max-h-full max-w-full p-2 sm:p-2.5 md:p-3"
          style={{
            gridTemplateColumns: `repeat(${BOARD_COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${BOARD_ROWS}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: BOARD_ROWS }).map((_, rowIdx) =>
            Array.from({ length: BOARD_COLS }).map((_, colIdx) => {
              const boardIndex = rowIdx * BOARD_COLS + colIdx;
              return (
                <MiniWordGrid
                  key={boardIndex}
                  boardIndex={boardIndex}
                  onClick={() => setExpandedBoard(boardIndex)}
                />
              );
            })
          )}
        </div>
      </div>

      {expandedBoard !== null && (
        <ExpandedBoard
          boardIndex={expandedBoard}
          onClose={() => setExpandedBoard(null)}
          onNavigate={(direction) => {
            const newIndex = expandedBoard + direction;
            setExpandedBoard(((newIndex % 32) + 32) % 32);
          }}
        />
      )}
    </>
  );
}
