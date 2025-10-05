// src/components/real-time/data-stream.tsx
"use client";
import { useEffect, useCallback } from 'react';
import { useGlobalStore } from '@/stores/global-store';

export function DataStream() {
  const updateData = useGlobalStore(state => state.updateData);

  const connectWebSocket = useCallback(() => {
    // Disable WebSocket in production until we have a real WebSocket server
    if (process.env.NODE_ENV === 'production') {
      return () => {}; // Return empty cleanup function
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

    // Validate WebSocket URL before attempting connection
    if (!wsUrl || wsUrl === 'https://your-domain.com' || wsUrl.includes('http://')) {
      console.log('WebSocket URL not properly configured, skipping connection');
      return () => {}; // Return empty cleanup function
    }

    // Only attempt connection if URL is valid WebSocket URL
    if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
      console.log('Invalid WebSocket URL protocol');
      return () => {}; // Return empty cleanup function
    }

    try {
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          updateData(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.log('WebSocket error:', error);
        // Only retry in development
        if (process.env.NODE_ENV !== 'production') {
          setTimeout(connectWebSocket, 5000);
        }
      };

      return () => ws.close();
    } catch (error) {
      console.log('Failed to create WebSocket connection:', error);
      return () => {}; // Return empty cleanup function
    }
  }, [updateData]);

  useEffect(() => {
    const cleanup = connectWebSocket();
    return cleanup;
  }, [connectWebSocket]);

  return null; // This is a non-visual component
}