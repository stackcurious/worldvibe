// src/hooks/use-timeframe.ts
"use client";

import { useState, useCallback } from "react";

/**
 * Timeframe defines the options for time-based filtering.
 * (Note: This is a hook‑specific type and is kept separate from chart options.)
 */
export type Timeframe = "24h" | "week" | "month";

export function useTimeframe(defaultValue: Timeframe = "24h") {
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultValue);

  const updateTimeframe = useCallback((newTimeframe: Timeframe) => {
    if (["24h", "week", "month"].includes(newTimeframe)) {
      setTimeframe(newTimeframe);
    }
  }, []);

  return { timeframe, setTimeframe: updateTimeframe };
}
