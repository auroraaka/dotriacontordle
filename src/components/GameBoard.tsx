'use client';

import { useGame } from '@/context/GameContext';
import { MiniWordGrid } from './WordGrid';
import { ExpandedBoard } from './ExpandedBoard';
import { BOARD_COLS, BOARD_ROWS } from '@/types/game';

export function GameBoard() {
  const { state, setExpandedBoard } = useGame();

  return (
    <>
      {/* 8x4 Grid of mini boards */}
      <div className="w-full h-full max-w-[1600px] mx-auto flex items-center justify-center">
        <div
          className="grid gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 w-full h-full max-h-full"
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

      {/* Expanded board modal */}
      {state.expandedBoard !== null && (
        <ExpandedBoard
          boardIndex={state.expandedBoard}
          onClose={() => setExpandedBoard(null)}
          onNavigate={(direction) => {
            const newIndex = state.expandedBoard! + direction;
            if (newIndex >= 0 && newIndex < 32) {
              setExpandedBoard(newIndex);
            }
          }}
        />
      )}
    </>
  );
}

