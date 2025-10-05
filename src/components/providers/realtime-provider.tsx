// src/components/providers/realtime-provider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useGlobalStore } from '@/stores/global-store';

interface RealtimeContextType {
 isConnected: boolean;
 lastUpdate: Date | null;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
 const [isConnected, setIsConnected] = useState(false);
 const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
 const updateData = useGlobalStore(state => state.updateData);

 useEffect(() => {
   // Disable WebSocket in production until we have a real WebSocket server
   if (process.env.NODE_ENV === 'production') {
     console.log('WebSocket disabled in production');
     return;
   }

   const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
   if (!wsUrl || wsUrl === 'https://your-domain.com' || wsUrl.includes('http://')) {
     console.log('WebSocket URL not properly configured, skipping connection');
     return;
   }

   // Only attempt connection if URL is valid WebSocket URL (ws:// or wss://)
   if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
     console.log('Invalid WebSocket URL protocol, must start with ws:// or wss://');
     return;
   }

   try {
     const ws = new WebSocket(wsUrl);

     ws.onopen = () => {
       setIsConnected(true);
       console.log('WebSocket connected');
     };

     ws.onclose = () => {
       setIsConnected(false);
       // Don't attempt reconnect in production
       if (process.env.NODE_ENV !== 'production') {
         setTimeout(() => {
           console.log('Attempting to reconnect...');
         }, 5000);
       }
     };

     ws.onerror = (error) => {
       console.log('WebSocket error:', error);
     };

     ws.onmessage = (event) => {
       try {
         const data = JSON.parse(event.data);
         updateData(data);
         setLastUpdate(new Date());
       } catch (error) {
         console.error('Error processing WebSocket message:', error);
       }
     };

     return () => {
       ws.close();
     };
   } catch (error) {
     console.log('Failed to create WebSocket connection:', error);
   }
 }, [updateData]);

 return (
   <RealtimeContext.Provider value={{ isConnected, lastUpdate }}>
     {children}
   </RealtimeContext.Provider>
 );
}

export const useRealtime = () => {
 const context = useContext(RealtimeContext);
 if (context === undefined) {
   throw new Error('useRealtime must be used within a RealtimeProvider');
 }
 return context;
};