// src/utils/date-helpers.ts
import { format, formatDistance, formatRelative, differenceInDays } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

export class DateHelper {
  static format(date: Date | string, pattern: string = 'yyyy-MM-dd HH:mm:ss'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, pattern);
  }

  static formatRelative(date: Date | string, baseDate: Date = new Date()): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatRelative(dateObj, baseDate);
  }

  static getTimeRanges(now: Date = new Date()) {
    return {
      today: format(now, 'yyyy-MM-dd'),
      thisWeek: format(now, 'yyyy-[W]II'),
      thisMonth: format(now, 'yyyy-MM'),
      thisYear: format(now, 'yyyy')
    };
  }

  static isWithinLast24Hours(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return differenceInDays(new Date(), dateObj) < 1;
  }

  static toUserTimezone(date: Date | string, timezone: string): Date {
    const utcDate = zonedTimeToUtc(date, timezone);
    return utcToZonedTime(utcDate, timezone);
  }
}