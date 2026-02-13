import { describe, it, expect } from 'vitest';
import { evaluateGuess, updateKeyboardState } from '@/lib/evaluate';

describe('evaluateGuess', () => {
  it('marks all correct when guess matches answer', () => {
    const result = evaluateGuess('CASTLE', 'CASTLE');
    expect(result.isCorrect).toBe(true);
    expect(result.states).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
  });

  it('marks all absent when no letters match', () => {
    const result = evaluateGuess('BUXOMZ', 'CASTLE');
    expect(result.isCorrect).toBe(false);
    expect(result.states).toEqual(['absent', 'absent', 'absent', 'absent', 'absent', 'absent']);
  });

  it('marks present when letter exists in wrong position', () => {
    // TRACES vs CASTLE
    // T: present (T at pos 3 in CASTLE)
    // R: absent
    // A: present (A at pos 1 in CASTLE)
    // C: present (C at pos 0 in CASTLE)
    // E: present (E at pos 5 in CASTLE)
    // S: present (S at pos 2 in CASTLE)
    const result = evaluateGuess('TRACES', 'CASTLE');
    expect(result.isCorrect).toBe(false);
    expect(result.states).toEqual([
      'present',
      'absent',
      'present',
      'present',
      'present',
      'present',
    ]);
  });

  it('marks correct over present for same letter', () => {
    // CARATS vs CASTLE (C-A-S-T-L-E)
    // C: correct (pos 0)
    // A: correct (pos 1)
    // R: absent
    // A: absent (A already used)
    // T: present (T at pos 3 in CASTLE)
    // S: present (S at pos 2 in CASTLE)
    const result = evaluateGuess('CARATS', 'CASTLE');
    expect(result.isCorrect).toBe(false);
    expect(result.states).toEqual(['correct', 'correct', 'absent', 'absent', 'present', 'present']);
  });

  it('handles duplicate letters correctly', () => {
    // ASSESS vs CASTLE (C-A-S-T-L-E)
    // A: present (A at pos 1)
    // S: absent (S at pos 2, but checked after correct S)
    // S: correct (pos 2)
    // E: present (E at pos 5)
    // S: absent (S already used)
    // S: absent (S already used)
    const result = evaluateGuess('ASSESS', 'CASTLE');
    expect(result.states).toEqual(['present', 'absent', 'correct', 'present', 'absent', 'absent']);
  });

  it('prioritizes correct position for duplicate letters', () => {
    // SASSES vs CASTLE (C-A-S-T-L-E)
    // S: absent (S at pos 2 in answer, will be used by correct match)
    // A: correct (pos 1)
    // S: correct (pos 2)
    // S: absent (S already used)
    // E: present (E at pos 5)
    // S: absent (S already used)
    const result = evaluateGuess('SASSES', 'CASTLE');
    expect(result.states).toEqual(['absent', 'correct', 'correct', 'absent', 'present', 'absent']);
  });

  it('is case insensitive', () => {
    const result = evaluateGuess('castle', 'CASTLE');
    expect(result.isCorrect).toBe(true);
    expect(result.states).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
  });

  it('throws error for wrong word length', () => {
    expect(() => evaluateGuess('CAT', 'CASTLE')).toThrow();
    expect(() => evaluateGuess('CASTLES', 'CASTLE')).toThrow();
  });
});

describe('updateKeyboardState', () => {
  it('adds new letter states', () => {
    const result = updateKeyboardState({}, 'CASTLE', [
      'correct',
      'present',
      'absent',
      'correct',
      'absent',
      'present',
    ]);
    expect(result.C).toBe('correct');
    expect(result.A).toBe('present');
    expect(result.S).toBe('absent');
  });

  it('upgrades absent to present', () => {
    const current = { A: 'absent' as const };
    const result = updateKeyboardState(current, 'ABCDEF', [
      'present',
      'absent',
      'absent',
      'absent',
      'absent',
      'absent',
    ]);
    expect(result.A).toBe('present');
  });

  it('upgrades present to correct', () => {
    const current = { A: 'present' as const };
    const result = updateKeyboardState(current, 'ABCDEF', [
      'correct',
      'absent',
      'absent',
      'absent',
      'absent',
      'absent',
    ]);
    expect(result.A).toBe('correct');
  });

  it('does not downgrade correct to present', () => {
    const current = { A: 'correct' as const };
    const result = updateKeyboardState(current, 'ABCDEF', [
      'present',
      'absent',
      'absent',
      'absent',
      'absent',
      'absent',
    ]);
    expect(result.A).toBe('correct');
  });

  it('does not downgrade present to absent', () => {
    const current = { A: 'present' as const };
    const result = updateKeyboardState(current, 'ABCDEF', [
      'absent',
      'absent',
      'absent',
      'absent',
      'absent',
      'absent',
    ]);
    expect(result.A).toBe('present');
  });
});
