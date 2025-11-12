import { format, toZonedTime } from 'date-fns-tz';
import { Timestamp } from 'firebase-admin/firestore';
import { addHours, startOfDay, setHours, setMinutes } from 'date-fns';

const TIMEZONE = 'Asia/Tokyo';

/**
 * Convert Timestamp to Japan time string
 */
export function toJapanTimeString(timestamp: Timestamp, formatStr = 'yyyy/MM/dd HH:mm'): string {
  const date = timestamp.toDate();
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, formatStr, { timeZone: TIMEZONE });
}

/**
 * Get current time in Japan timezone as Timestamp
 */
export function getNowJST(): Timestamp {
  return Timestamp.now();
}

/**
 * Parse ISO string to Timestamp with JST timezone
 */
export function parseISOToTimestamp(isoString: string): Timestamp {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${isoString}`);
  }
  return Timestamp.fromDate(date);
}

/**
 * Calculate T-24h reminder time (24 hours before slot)
 */
export function calculateT24hReminder(slotAt: Timestamp): Timestamp {
  const date = slotAt.toDate();
  const reminderDate = addHours(date, -24);
  return Timestamp.fromDate(reminderDate);
}

/**
 * Calculate day-of reminder time (8 AM on the same day)
 */
export function calculateDayOfReminder(slotAt: Timestamp): Timestamp {
  const date = slotAt.toDate();
  const zonedDate = toZonedTime(date, TIMEZONE);
  const dayStart = startOfDay(zonedDate);
  const reminder8AM = setHours(setMinutes(dayStart, 0), 8);
  return Timestamp.fromDate(reminder8AM);
}

/**
 * Format time for display (e.g., "10:30")
 */
export function formatTimeOnly(timestamp: Timestamp): string {
  return toJapanTimeString(timestamp, 'HH:mm');
}

/**
 * Format date for display (e.g., "2025年11月1日")
 */
export function formatDateJapanese(timestamp: Timestamp): string {
  return toJapanTimeString(timestamp, 'yyyy年M月d日');
}

/**
 * Get Japanese day of week
 */
function getJapaneseDayOfWeek(date: Date): string {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
}

/**
 * Format date with Japanese day of week (e.g., "2025年11月15日(土) 21:00")
 */
export function formatDateTimeWithDayOfWeek(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  const zonedDate = toZonedTime(date, TIMEZONE);
  const dayOfWeek = getJapaneseDayOfWeek(zonedDate);
  const dateStr = format(zonedDate, 'yyyy年M月d日', { timeZone: TIMEZONE });
  const timeStr = format(zonedDate, 'HH:mm', { timeZone: TIMEZONE });
  return `${dateStr}(${dayOfWeek}) ${timeStr}`;
}
