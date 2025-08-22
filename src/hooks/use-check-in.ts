// src/hooks/use-check-in.ts
"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { useAnalytics } from "./use-analytics";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

const checkInSchema = z.object({
  token: z.string(),
  region: z.string(),
  emotion: z.string(),
  intensity: z.number().min(1).max(5),
});

export type CheckInData = z.infer<typeof checkInSchema>;

export function useCheckIn() {
  const { trackEvent } = useAnalytics();
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: CheckInData) => {
      try {
        // Validate input data
        const validated = checkInSchema.parse(data);

        // Enforce rate limiting (one check-in per day)
        if (lastCheckIn && Date.now() - lastCheckIn.getTime() < 86400000) {
          throw new Error("Already checked in today");
        }

        const res = await fetch("/api/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validated),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Check-in failed");
        }

        setLastCheckIn(new Date());
        trackEvent("check_in_success", { emotion: data.emotion });
        return res.json();
      } catch (error) {
        trackEvent("check_in_error", {
          error: error instanceof Error ? error.message : error,
        });
        logger.error("Check-in mutation error:", {
          error: error instanceof Error ? error.message : error,
        });
        Sentry.captureException(error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Check-in recorded!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to check in");
    },
  });

  const submitCheckIn = useCallback(
    async (data: CheckInData) => mutation.mutateAsync(data),
    [mutation]
  );

  return {
    submitCheckIn,
    isLoading: mutation.isLoading,
    error: mutation.error,
    lastCheckIn,
  };
}
