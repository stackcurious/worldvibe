// src/hooks/use-analytics.ts
"use client";

import { useCallback, useEffect, useRef } from "react";
import * as Sentry from "@sentry/nextjs";
import { init, track } from "@amplitude/analytics-browser";
import { usePathname, useSearchParams } from "next/navigation";
import { logger } from "@/lib/logger";

// Ref to ensure Amplitude is initialized only once.
const amplitudeInitializedRef = { current: false };

export function useAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!amplitudeInitializedRef.current) {
      const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || "";
      init(apiKey);
      amplitudeInitializedRef.current = true;
      logger.info("Amplitude initialized", { apiKey });
    }
  }, []);

  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      try {
        // Track event in Amplitude with additional context.
        track(eventName, {
          ...properties,
          path: pathname,
          queryParams: Object.fromEntries(searchParams.entries()),
        });

        // Add a Sentry breadcrumb for better traceability.
        Sentry.addBreadcrumb({
          category: "analytics",
          message: eventName,
          data: properties,
        });
        logger.debug("Tracked event", { eventName, properties });
      } catch (error) {
        logger.error("Analytics tracking error", {
          error: error instanceof Error ? error.message : error,
        });
        Sentry.captureException(error);
      }
    },
    [pathname, searchParams]
  );

  return { trackEvent };
}
