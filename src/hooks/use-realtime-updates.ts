// src/hooks/use-realtime-updates.ts
"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

interface WebSocketConfig {
  url: string;
  retryAttempts?: number;
  retryDelay?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useRealtimeUpdates(
  onMessage: (msg: any) => void,
  config: WebSocketConfig
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    wsRef.current = new WebSocket(config.url);

    wsRef.current.onopen = () => {
      reconnectAttempts.current = 0;
      setIsConnected(true);
      config.onConnect?.();
      toast.success("Real-time connection established");
      logger.info("WebSocket connected", { url: config.url });
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
        // Optionally, invalidate queries that may have stale data.
        queryClient.invalidateQueries({ queryKey: ["global-stats"] });
      } catch (error) {
        logger.error("WebSocket message error:", {
          error: error instanceof Error ? error.message : error,
        });
        Sentry.captureException(error);
      }
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      config.onDisconnect?.();
      logger.warn("WebSocket closed, attempting reconnection", {
        attempts: reconnectAttempts.current,
      });
      if (reconnectAttempts.current < (config.retryAttempts || 3)) {
        const delay = (config.retryDelay || 5000) * Math.pow(2, reconnectAttempts.current);
        reconnectAttempts.current++;
        setTimeout(() => {
          connect();
        }, delay);
      } else {
        toast.error("Real-time connection lost");
      }
    };

    wsRef.current.onerror = (error) => {
      logger.error("WebSocket encountered error:", { error });
      Sentry.captureException(error);
      wsRef.current?.close();
    };
  }, [config, onMessage, queryClient]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback(
    (msg: any) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(msg));
      } else {
        logger.warn("WebSocket not connected. Cannot send message", { msg });
      }
    },
    []
  );

  return {
    sendMessage,
    isConnected,
  };
}
