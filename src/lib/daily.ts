import { getDailyAnswersFromPool } from './answers';
import { NUM_BOARDS } from '@/types/game';

// Epoch date for daily puzzle numbering (adjust as needed)
const EPOCH_DATE = new Date('2025-01-01T00:00:00Z');

/**
 * Get the current daily puzzle number
 */
export function getDailyNumber(): number {
  const now = new Date();
  const diffTime = now.getTime() - EPOCH_DATE.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Start from 1
}

/**
 * Get the answers for a specific daily puzzle
 * Uses the STATIC answer pool with a seeded shuffle to ensure
 * all players get the same words on the same day
 */
export function getDailyAnswers(dailyNumber: number): string[] {
  // Create a seed based on the daily number
  const seed = dailyNumber * 12345 + 67890;
  return getDailyAnswersFromPool(NUM_BOARDS, seed);
}

/**
 * Get the answers for today's puzzle
 */
export function getTodaysAnswers(): string[] {
  return getDailyAnswers(getDailyNumber());
}

/**
 * Get time until next daily puzzle resets (midnight UTC)
 */
export function getTimeUntilNextDaily(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  
  const diff = tomorrow.getTime() - now.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
}

/**
 * Format time until next daily as string
 */
export function formatTimeUntilNextDaily(): string {
  const { hours, minutes, seconds } = getTimeUntilNextDaily();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
