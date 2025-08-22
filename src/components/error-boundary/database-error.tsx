'use client';

import { useEffect, useState } from 'react';
import { DatabaseIcon, RefreshCw, AlertCircle } from 'lucide-react';

interface DatabaseErrorProps {
  error: Error;
  reset: () => void;
}

/**
 * Database error boundary component that catches database connection errors
 * and displays a user-friendly error message with retry functionality
 */
export default function DatabaseError({ error, reset }: DatabaseErrorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [autoRetryEnabled, setAutoRetryEnabled] = useState(true);

  // Auto-retry logic
  useEffect(() => {
    if (!autoRetryEnabled) return;
    
    // Only auto-retry for the first 5 attempts
    if (connectionAttempts < 5) {
      const timer = setTimeout(() => {
        handleRetry();
      }, Math.min(1000 * (connectionAttempts + 1), 10000)); // Exponential backoff up to 10s
      
      return () => clearTimeout(timer);
    } else {
      // After 5 attempts, stop auto-retry
      setAutoRetryEnabled(false);
    }
  }, [connectionAttempts, autoRetryEnabled]);

  // Handle manual retry
  const handleRetry = () => {
    setIsLoading(true);
    setConnectionAttempts(prev => prev + 1);
    
    // Small delay to show loading indicator
    setTimeout(() => {
      reset();
      setIsLoading(false);
    }, 1000);
  };

  // Toggle auto-retry
  const toggleAutoRetry = () => {
    setAutoRetryEnabled(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mx-auto">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <DatabaseIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
            <AlertCircle className="h-8 w-8 text-red-500 absolute -bottom-2 -right-2" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Database Connection Error
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          We're having trouble connecting to our database. This is usually temporary. 
          {connectionAttempts > 0 && (
            <span> We've tried connecting {connectionAttempts} {connectionAttempts === 1 ? 'time' : 'times'} so far.</span>
          )}
        </p>
        
        <div className="space-y-4">
          <button
            onClick={handleRetry}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Retry Connection
              </>
            )}
          </button>
          
          <div className="flex items-center justify-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoRetryEnabled}
                onChange={toggleAutoRetry}
                className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Auto-retry connection
              </span>
            </label>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If this problem persists, try refreshing the page or coming back later.
          </p>
          
          <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            Error details: {error.message}
          </div>
        </div>
      </div>
    </div>
  );
}