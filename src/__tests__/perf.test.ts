import { describe, it } from 'vitest';
import { evaluateGuess, updateKeyboardState } from '@/lib/evaluate';
import type { TileState, GameState } from '@/types/game';
import { WORD_LENGTH } from '@/types/game';

function nowMs() {
  return performance.now();
}

function msPerOp(label: string, ops: number, durationMs: number) {
  const per = durationMs / ops;
  // eslint-disable-next-line no-console
  console.log(`${label}: ${durationMs.toFixed(2)}ms total | ${per.toFixed(6)}ms/op | ops=${ops}`);
}

function makeFakeState(guessCount: number): GameState {
  const answers = [
    'ACTION', 'ANIMAL', 'ANSWER', 'BEAUTY', 'BEFORE', 'BETTER', 'BORDER', 'BOTTLE',
    'BRANCH', 'BREATH', 'BRIDGE', 'BRIGHT', 'BROKEN', 'BUDGET', 'BUTTON', 'CAMERA',
    'CANCEL', 'CARBON', 'CAREER', 'CASTLE', 'CAUGHT', 'CENTER', 'CHANCE', 'CHANGE',
    'CHARGE', 'CHEESE', 'CHOICE', 'CHURCH', 'CIRCLE', 'CLIENT', 'CLOSED', 'COFFEE',
  ];

  const guesses = Array.from({ length: guessCount }, (_, i) => {
    const base = `GUESS${i}`.toUpperCase().padEnd(WORD_LENGTH, 'X').slice(0, WORD_LENGTH);
    return base;
  });

  return {
    boards: answers.map((answer) => ({ answer, solved: false, solvedAtGuess: null })),
    guesses,
    currentGuess: 'ABCDEF',
    gameStatus: 'playing',
    keyboardState: {},
    expandedBoard: null,
    gameMode: 'daily',
    dailyNumber: 42,
    startedAt: null,
    endedAt: null,
    timerRunning: false,
    timerBaseElapsedMs: 0,
    timerResumedAt: null,
    timerToggledAt: null,
    gameId: 'bench',
  };
}

describe('perf smoke (prints timings)', () => {
  it('measures evaluateGuess throughput (single + looped)', () => {
    const guess = 'ABROAD';
    const answer = 'ACTION';
    const warm = 5000;
    for (let i = 0; i < warm; i++) evaluateGuess(guess, answer);

    const ops = 200_000;
    const t0 = nowMs();
    for (let i = 0; i < ops; i++) evaluateGuess(guess, answer);
    const t1 = nowMs();
    msPerOp('evaluateGuess', ops, t1 - t0);
  });

  it('measures "submit-like" evaluation (32 boards per guess)', () => {
    const answers = [
      'ACTION', 'ANIMAL', 'ANSWER', 'BEAUTY', 'BEFORE', 'BETTER', 'BORDER', 'BOTTLE',
      'BRANCH', 'BREATH', 'BRIDGE', 'BRIGHT', 'BROKEN', 'BUDGET', 'BUTTON', 'CAMERA',
      'CANCEL', 'CARBON', 'CAREER', 'CASTLE', 'CAUGHT', 'CENTER', 'CHANCE', 'CHANGE',
      'CHARGE', 'CHEESE', 'CHOICE', 'CHURCH', 'CIRCLE', 'CLIENT', 'CLOSED', 'COFFEE',
    ];

    const guess = 'ABROAD';
    const warm = 2000;
    for (let i = 0; i < warm; i++) {
      for (const a of answers) evaluateGuess(guess, a);
    }

    const guessesToSimulate = 20_000;
    const t0 = nowMs();
    for (let i = 0; i < guessesToSimulate; i++) {
      for (const a of answers) evaluateGuess(guess, a);
    }
    const t1 = nowMs();
    msPerOp('evaluateGuess x32 (per guess)', guessesToSimulate, t1 - t0);
  });

  it('measures updateKeyboardState for one guess', () => {
    const guess = 'ABROAD';
    const evaluation = evaluateGuess(guess, 'ACTION').states;
    const warm = 5000;
    let ks: Record<string, TileState> = {};
    for (let i = 0; i < warm; i++) ks = updateKeyboardState(ks, guess, evaluation);

    const ops = 200_000;
    const t0 = nowMs();
    for (let i = 0; i < ops; i++) ks = updateKeyboardState(ks, guess, evaluation);
    const t1 = nowMs();
    msPerOp('updateKeyboardState', ops, t1 - t0);
  });

  it('measures JSON.stringify size/time for representative game states', () => {
    const counts = [0, 5, 10, 20, 37];
    for (const guessCount of counts) {
      const s = makeFakeState(guessCount);
      const warm = 200;
      for (let i = 0; i < warm; i++) JSON.stringify(s);

      const ops = 5000;
      const t0 = nowMs();
      let out = '';
      for (let i = 0; i < ops; i++) out = JSON.stringify(s);
      const t1 = nowMs();
      // eslint-disable-next-line no-console
      console.log(`JSON.stringify guesses=${guessCount}: payload=${out.length} chars`);
      msPerOp(`JSON.stringify (guesses=${guessCount})`, ops, t1 - t0);
    }
  });
});


