// src/types/env.d.ts
declare namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_APP_URL: string;
      NEXT_PUBLIC_API_URL: string;
      NEXT_PUBLIC_WS_URL: string;
      DATABASE_URL: string;
      TIMESCALEDB_URL: string;
      REDIS_URL: string;
      REDIS_TOKEN: string;
      KAFKA_BROKERS: string;
      KAFKA_USERNAME: string;
      KAFKA_PASSWORD: string;
      KAFKA_CLIENT_ID: string;
      NEXT_PUBLIC_AMPLITUDE_API_KEY: string;
      SENTRY_DSN: string;
      NEXT_PUBLIC_VERCEL_ANALYTICS_ID: string;
      DATADOG_API_KEY: string;
      DATADOG_APP_KEY: string;
      NEXT_PUBLIC_MAPBOX_TOKEN: string;
      GEOLOCATION_API_KEY: string;
      CACHE_TTL: string;
      REVALIDATE_INTERVAL: string;
      RATE_LIMIT_MAX: string;
      RATE_LIMIT_WINDOW: string;
      JWT_SECRET: string;
      ENCRYPTION_KEY: string;
      API_KEY_SALT: string;
      NEXT_PUBLIC_ENABLE_REALTIME: string;
      NEXT_PUBLIC_ENABLE_ANALYTICS: string;
      NEXT_PUBLIC_ENABLE_ADS: string;
      DEFAULT_REGION: string;
      MIN_REGION_GROUP_SIZE: string;
      AD_REFRESH_INTERVAL: string;
      MAX_ADS_PER_PAGE: string;
    }
  }