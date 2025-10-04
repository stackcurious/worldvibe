'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';

interface DatabaseStatusProviderProps {
  children: React.ReactNode;
}

interface DatabaseStatusContextType {
  connected: boolean;
  message: string;
  level: 'info' | 'warning' | 'error';
  lastChecked: number;
}

const DatabaseStatusContext = createContext<DatabaseStatusContextType>({
  connected: false,
  message: 'Checking database connection...',
  level: 'info',
  lastChecked: 0
});

export function useDatabaseStatus() {
  return useContext(DatabaseStatusContext);
}

export function DatabaseStatusProvider({ children }: DatabaseStatusProviderProps) {
  const [status, setStatus] = useState<DatabaseStatusContextType>({
    connected: false,
    message: 'Checking database connection...',
    level: 'info',
    lastChecked: 0
  });

  const [notified, setNotified] = useState(false);

  // Check database status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/health/database', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStatus({
            connected: data.connected,
            message: data.message,
            level: data.level,
            lastChecked: Date.now()
          });
          
          // Only show error notification if the connection fails after being successful
          if (!data.connected && notified) {
            toast.error('Database connection lost', {
              icon: <XCircle className="h-4 w-4" />,
              description: 'Trying to reconnect automatically...',
              duration: 0 // Persistent until dismissed
            });
            setNotified(false);
          } else if (data.connected && !notified) {
            setNotified(true);
          }
        }
      } catch (error) {
        setStatus({
          connected: false,
          message: 'Error checking database status',
          level: 'error',
          lastChecked: Date.now()
        });
      }
    };
    
    // Check on initial load
    checkStatus();
    
    // Set up interval to check periodically
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, [notified]);

  return (
    <DatabaseStatusContext.Provider value={status}>
      {children}
    </DatabaseStatusContext.Provider>
  );
}