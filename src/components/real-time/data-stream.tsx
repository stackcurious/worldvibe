// src/components/real-time/data-stream.tsx
"use client";
import { useEffect, useCallback } from 'react';
import { useGlobalStore } from '@/stores/global-store';

export function DataStream() {
  const updateData = useGlobalStore(state => state.updateData);

  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      updateData(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setTimeout(connectWebSocket, 5000); // Retry after 5s
    };

    return () => ws.close();
  }, [updateData]);

  useEffect(() => {
    const cleanup = connectWebSocket();
    return cleanup;
  }, [connectWebSocket]);

  return null; // This is a non-visual component
}