import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN, // Use a private DSN for the server
  tracesSampleRate: 1.0,
});
