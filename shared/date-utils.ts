import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import type { SiteSettings } from './settings-default';

/**
 * Formats a date using date-fns format tokens and optional timezone
 * 
 * @param date - Date to format (Date object, timestamp, or ISO string)
 * @param pattern - date-fns format pattern (e.g., 'LLLL d, yyyy')
 * @param timeZone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns Formatted date string
 * 
 * @example
 * formatDate(new Date(), 'LLLL d, yyyy', 'America/New_York')
 * // => 'September 21, 2025'
 */
export function formatDate(
  date: Date | number | string,
  pattern: string,
  timeZone?: string
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (timeZone && timeZone !== 'UTC') {
    return formatInTimeZone(dateObj, timeZone, pattern);
  }

  return format(dateObj, pattern);
}

/**
 * Formats a date using settings-defined format and timezone
 * 
 * @param date - Date to format
 * @param settings - Site settings object containing dateFormat and timezone
 * @param includeTime - Whether to include time in the output
 * @returns Formatted date string
 * 
 * @example
 * formatWithSettings(new Date(), settings)
 * // => 'September 21, 2025'
 * 
 * formatWithSettings(new Date(), settings, true)
 * // => 'September 21, 2025 3:45 pm'
 */
export function formatWithSettings(
  date: Date | number | string,
  settings: SiteSettings,
  includeTime = false
): string {
  const { dateFormat, timeFormat, timezone } = settings.general;
  const pattern = includeTime ? `${dateFormat} ${timeFormat}` : dateFormat;
  
  return formatDate(date, pattern, timezone);
}
