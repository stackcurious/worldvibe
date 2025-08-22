// src/components/providers/index.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { RealtimeProvider } from "./realtime-provider";
import { RegionProvider } from "./region-provider";
import { AnalyticsProvider } from "./analytics-provider";
import { DatabaseStatusProvider } from "./database-status-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false
    }
  }
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <DatabaseStatusProvider>
          <AnalyticsProvider>
            <RealtimeProvider>
              <RegionProvider>
                {children}
              </RegionProvider>
            </RealtimeProvider>
          </AnalyticsProvider>
        </DatabaseStatusProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}