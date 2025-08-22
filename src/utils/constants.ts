// src/utils/constants.ts
export const EMOTIONS = ['Joy', 'Calm', 'Stress', 'Anticipation', 'Sadness'] as const;

export const INTENSITY = {
  MIN: 1,
  MAX: 5,
  DEFAULT: 3
} as const;

export const TIME_RANGES = {
  HOUR: '1h',
  DAY: '24h',
  WEEK: '7d',
  MONTH: '30d'
} as const;

export const CACHE_KEYS = {
  GLOBAL_STATS: 'stats:global',
  REGION_TRENDS: 'trends:region',
  USER_CHECKINS: 'checkins:user'
} as const;

export const API_RATE_LIMITS = {
  CHECKIN: 1,
  ANALYTICS: 100,
  REGION: 50
} as const;