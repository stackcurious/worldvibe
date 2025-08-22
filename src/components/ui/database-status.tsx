'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface DatabaseStatusProps {
  /** Whether to show full details or just an icon */
  minimal?: boolean;
  /** Optional class name for styling */
  className?: string;
}

type StatusLevel = 'info' | 'warning' | 'error';

interface StatusResponse {
  connected: boolean;
  message: string;
  level: StatusLevel;
  timestamp: string; // ISO date string
}

/**
 * Database status indicator component that shows real-time status
 * of the database connection with user-friendly messages
 */
export function DatabaseStatus({ minimal = false, className = '' }: DatabaseStatusProps) {
  const [status, setStatus] = useState<StatusResponse>({
    connected: false,
    message: 'Checking database connection...',
    level: 'info',
    timestamp: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);

  // Fetch status from API
  const fetchStatus = async () => {
    try {
      setLoading(true);
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
        setStatus(data);
      } else {
        setStatus({
          connected: false,
          message: 'Error checking database status',
          level: 'error',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      setStatus({
        connected: false,
        message: 'Network error checking database status',
        level: 'error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch on initial load
  useEffect(() => {
    fetchStatus();
    
    // Set interval to check periodically (every 30 seconds)
    const interval = setInterval(fetchStatus, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Icons and colors based on status
  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="animate-spin h-4 w-4" />;
    
    switch (status.level) {
      case 'info':
        return <CheckCircle className="text-green-500 h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="text-amber-500 h-4 w-4" />;
      case 'error':
        return <AlertCircle className="text-red-500 h-4 w-4" />;
      default:
        return <AlertCircle className="text-gray-500 h-4 w-4" />;
    }
  };

  // Minimal version (just the icon)
  if (minimal) {
    return (
      <div 
        className={`flex items-center ${className}`}
        title={status.message}
      >
        {getStatusIcon()}
      </div>
    );
  }

  // Full version with message
  return (
    <div className={`flex items-center gap-2 p-2 rounded text-sm ${className}`}>
      {getStatusIcon()}
      <span>
        {status.message}
      </span>
      {loading && (
        <RefreshCw className="animate-spin h-3 w-3 ml-1 text-gray-400" />
      )}
      <button 
        onClick={fetchStatus}
        aria-label="Refresh database status"
        className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Refresh status"
      >
        <RefreshCw className="h-3 w-3 text-gray-500" />
      </button>
    </div>
  );
}