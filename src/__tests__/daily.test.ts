import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDailyNumber, getDailyAnswers, getTimeUntilNextDaily }from '@/lib/daily';

describe('getDailyNumber', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 1 on epoch date', () => {
    vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));
    expect(getDailyNumber()).toBe(1);
  });

  it('returns 2 on day after epoch', () => {
    vi.setSystemTime(new Date('2025-01-02T12:00:00Z'));
    expect(getDailyNumber()).toBe(2);
  });

  it('returns correct number for arbitrary date', () => {
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    expect(getDailyNumber()).toBe(15);
  });

  it('returns correct number for date far in future', () => {
    vi.setSystemTime(new Date('2025-12-31T12:00:00Z'));
    expect(getDailyNumber()).toBe(365);
  });
});

describe('getDailyAnswers', () => {
  it('returns 32 answers', () => {
    const answers = getDailyAnswers(1);
    expect(answers).toHaveLength(32);
  });

  it('returns consistent answers for same daily number', () => {
    const answers1 = getDailyAnswers(42);
    const answers2 = getDailyAnswers(42);
    expect(answers1).toEqual(answers2);
  });

  it('returns different answers for different daily numbers', () => {
    const answers1 = getDailyAnswers(1);
    const answers2 = getDailyAnswers(2);
    expect(answers1).not.toEqual(answers2);
  });

  it('returns all uppercase 6-letter words', () => {
    const answers = getDailyAnswers(1);
    answers.forEach(answer => {
      expect(answer).toMatch(/^[A-Z]{6}$/);
    });
  });

  it('returns unique answers (no duplicates)', () => {
    const answers = getDailyAnswers(1);
    const uniqueAnswers = new Set(answers);
    expect(uniqueAnswers.size).toBe(32);
  });
});

describe('getTimeUntilNextDaily', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns correct time at midnight UTC', () => {
    vi.setSystemTime(new Date('2025-01-15T00:00:00Z'));
    const time = getTimeUntilNextDaily();
    expect(time.hours).toBe(24);
    expect(time.minutes).toBe(0);
    expect(time.seconds).toBe(0);
  });

  it('returns correct time at noon UTC', () => {
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    const time = getTimeUntilNextDaily();
    expect(time.hours).toBe(12);
    expect(time.minutes).toBe(0);
    expect(time.seconds).toBe(0);
  });

  it('returns correct time with minutes and seconds', () => {
    vi.setSystemTime(new Date('2025-01-15T23:30:30Z'));
    const time = getTimeUntilNextDaily();
    expect(time.hours).toBe(0);
    expect(time.minutes).toBe(29);
    expect(time.seconds).toBe(30);
  });
});

