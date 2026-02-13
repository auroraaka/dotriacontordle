import { getDailyAnswersFromPool } from './answers';
import { GameConfig } from '@/types/game';
import { DEFAULT_GAME_CONFIG } from './gameConfig';

const EPOCH_DATE = new Date('2025-01-01T13:00:00Z');

function getEasternTimeComponents(date: Date): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(date);
  return {
    year: parseInt(parts.find(p => p.type === 'year')?.value || '2025'),
    month: parseInt(parts.find(p => p.type === 'month')?.value || '1'),
    day: parseInt(parts.find(p => p.type === 'day')?.value || '1'),
    hour: parseInt(parts.find(p => p.type === 'hour')?.value || '0'),
    minute: parseInt(parts.find(p => p.type === 'minute')?.value || '0'),
    second: parseInt(parts.find(p => p.type === 'second')?.value || '0'),
  };
}

function easternTimeToUTC(year: number, month: number, day: number, hour: number, minute: number = 0, second: number = 0): Date {
  const targetEastern = { year, month, day, hour, minute, second };
  for (let utcHour = 11; utcHour <= 14; utcHour++) {
    const testDate = new Date(Date.UTC(year, month - 1, day, utcHour, minute, second));
    const eastern = getEasternTimeComponents(testDate);
    
    if (eastern.year === targetEastern.year &&
        eastern.month === targetEastern.month &&
        eastern.day === targetEastern.day &&
        eastern.hour === targetEastern.hour &&
        eastern.minute === targetEastern.minute) {
      return testDate;
    }
  }
  return new Date(Date.UTC(year, month - 1, day, hour + 5, minute, second));
}

function getNext8AMEastern(): Date {
  const now = new Date();
  const eastern = getEasternTimeComponents(now);
  const today8AM = easternTimeToUTC(eastern.year, eastern.month, eastern.day, 8, 0, 0);
  
  if (today8AM.getTime() <= now.getTime()) {
    const tomorrowUTC = new Date(Date.UTC(eastern.year, eastern.month - 1, eastern.day + 1, 12, 0, 0));
    const tomorrowEastern = getEasternTimeComponents(tomorrowUTC);
    return easternTimeToUTC(tomorrowEastern.year, tomorrowEastern.month, tomorrowEastern.day, 8, 0, 0);
  } else {
    return today8AM;
  }
}

function getCurrentDayStartEastern(): Date {
  const now = new Date();
  const eastern = getEasternTimeComponents(now);
  
  const today8AM = easternTimeToUTC(eastern.year, eastern.month, eastern.day, 8, 0, 0);
  
  if (today8AM.getTime() > now.getTime()) {
    const yesterdayUTC = new Date(Date.UTC(eastern.year, eastern.month - 1, eastern.day - 1, 12, 0, 0));
    const yesterdayEastern = getEasternTimeComponents(yesterdayUTC);
    return easternTimeToUTC(yesterdayEastern.year, yesterdayEastern.month, yesterdayEastern.day, 8, 0, 0);
  }
  
  return today8AM;
}

export function getDailyNumber(): number {
  const currentDayStart = getCurrentDayStartEastern();
  const diffTime = currentDayStart.getTime() - EPOCH_DATE.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

export function getDailyAnswers(dailyNumber: number, config: Pick<GameConfig, 'boardCount' | 'wordLength'> = DEFAULT_GAME_CONFIG): string[] {
  const seed = dailyNumber * 12345 + 67890;
  return getDailyAnswersFromPool(config.boardCount, seed, config.wordLength);
}

export function getTodaysAnswers(config: Pick<GameConfig, 'boardCount' | 'wordLength'> = DEFAULT_GAME_CONFIG): string[] {
  return getDailyAnswers(getDailyNumber(), config);
}

export function getTimeUntilNextDaily(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const nextReset = getNext8AMEastern();
  
  const diff = nextReset.getTime() - now.getTime();
  
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
