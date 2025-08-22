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
   const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
   if (!wsUrl) {
     console.error('WebSocket URL not configured');
     return;
   }

   const ws = new WebSocket(wsUrl);

   ws.onopen = () => {
     setIsConnected(true);
     console.log('WebSocket connected');
   };

   ws.onclose = () => {
     setIsConnected(false);
     // Attempt to reconnect after 5 seconds
     setTimeout(() => {
       console.log('Attempting to reconnect...');
       // You might want to implement a more sophisticated reconnection strategy
     }, 5000);
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