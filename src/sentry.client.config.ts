import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, // Use a public DSN for client-side
  tracesSampleRate: 1.0,
});
