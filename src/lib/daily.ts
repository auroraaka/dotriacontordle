import { getDailyAnswersFromPool } from './answers';
import { NUM_BOARDS } from '@/types/game';

const EPOCH_DATE = new Date('2025-01-01T00:00:00Z');

export function getDailyNumber(): number {
  const now = new Date();
  const diffTime = now.getTime() - EPOCH_DATE.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

export function getDailyAnswers(dailyNumber: number): string[] {
  const seed = dailyNumber * 12345 + 67890;
  return getDailyAnswersFromPool(NUM_BOARDS, seed);
}

export function getTodaysAnswers(): string[] {
  return getDailyAnswers(getDailyNumber());
}

export function getTimeUntilNextDaily(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  
  const diff = tomorrow.getTime() - now.getTime();
  
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export function formatTimeUntilNextDaily(): string {
  const { hours, minutes, seconds } = getTimeUntilNextDaily();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
