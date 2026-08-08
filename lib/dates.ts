import { formatInTimeZone, toDate } from 'date-fns-tz';

export const DEFAULT_TIMEZONE = 'Asia/Riyadh';

export function getLogicalNutritionDate(
  timestamp: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
}

export function getNowInTimezone(timezone: string = DEFAULT_TIMEZONE): Date {
  const now = new Date();
  const zoned = toDate(now, { timeZone: timezone });
  return zoned;
}

export function getHourInTimezone(
  timestamp: Date | string = new Date(),
  timezone: string = DEFAULT_TIMEZONE
): number {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return Number(formatInTimeZone(date, timezone, 'H'));
}

export function formatTimeInTimezone(
  timestamp: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return formatInTimeZone(date, timezone, 'HH:mm');
}

export function getGreeting(locale: 'ar' | 'en' = 'ar', hour?: number): string {
  const h = hour ?? getHourInTimezone();
  if (h < 12) return locale === 'ar' ? 'صباح الخير' : 'Good morning';
  if (h < 17) return locale === 'ar' ? 'مساء الخير' : 'Good afternoon';
  return locale === 'ar' ? 'مساء الخير' : 'Good evening';
}

export function addDays(logicalDate: string, days: number): string {
  const [year, month, day] = logicalDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
