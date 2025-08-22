// src/components/providers/analytics-provider.tsx
"use client";

import { createContext, useContext, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import * as amplitude from '@amplitude/analytics-browser';

interface AnalyticsContextType {
  trackEvent: (name: string, properties?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY!);
  }, []);

  useEffect(() => {
    amplitude.logEvent('page_view', {
      path: pathname,
      query: Object.fromEntries(searchParams.entries()),
      url: window.location.href
    });
  }, [pathname, searchParams]);

  return (
    <AnalyticsContext.Provider value={{ trackEvent: amplitude.logEvent }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};