/**
 * Database Status Messages
 * -----------------------
 * User-friendly database status messages and utilities for displaying
 * connection status in the UI.
 */

import { logger } from '@/lib/logger';
import { checkDatabaseConnection } from './check-connection';

// Global status store to avoid redundant checks
let _dbStatus: {
  connected: boolean;
  lastChecked: number;
  message: string;
  level: 'info' | 'warning' | 'error';
} = {
  connected: false,
  lastChecked: 0,
  message: 'Connecting to database...',
  level: 'info'
};

// How often to refresh status (ms)
const STATUS_REFRESH_INTERVAL = 30000; // 30 seconds

/**
 * Get a user-friendly database status message
 */
export async function getDatabaseStatus(): Promise<{
  connected: boolean;
  message: string;
  level: 'info' | 'warning' | 'error';
}> {
  const now = Date.now();
  
  // Only check connection if it's been more than the refresh interval since last check
  // or if we've never successfully connected
  if (now - _dbStatus.lastChecked > STATUS_REFRESH_INTERVAL || !_dbStatus.connected) {
    try {
      const isConnected = await checkDatabaseConnection();
      _dbStatus.connected = isConnected;
      _dbStatus.lastChecked = now;
      
      if (isConnected) {
        _dbStatus.message = 'Connected to database';
        _dbStatus.level = 'info';
      } else {
        _dbStatus.message = 'Unable to connect to database. Retrying...';
        _dbStatus.level = 'error';
      }
    } catch (error) {
      logger.error('Error checking database status', {
        error: error instanceof Error ? error.message : String(error)
      });
      _dbStatus.connected = false;
      _dbStatus.message = 'Error checking database connection';
      _dbStatus.level = 'error';
    }
  }
  
  return {
    connected: _dbStatus.connected,
    message: _dbStatus.message,
    level: _dbStatus.level
  };
}

/**
 * Get user-friendly error message for database errors
 */
export function getDatabaseErrorMessage(error: any): string {
  // Connection errors
  if (error?.code === 'P1001' || error?.name === 'PrismaClientInitializationError') {
    return 'Cannot connect to the database. Please check your connection and try again.';
  }
  
  // Timeout errors
  if (error?.code === 'P1008' || error?.message?.includes('timed out')) {
    return 'Database operation timed out. The system might be experiencing high load, please try again.';
  }
  
  // Record not found
  if (error?.code === 'P2001' || error?.code === 'P2025') {
    return 'The requested information could not be found.';
  }
  
  // Unique constraint violation
  if (error?.code === 'P2002') {
    return 'This record already exists. Please try with different information.';
  }
  
  // Foreign key constraint violation
  if (error?.code === 'P2003') {
    return 'This operation refers to a record that does not exist.';
  }
  
  // Input validation
  if (error?.code === 'P2006' || error?.code === 'P2007') {
    return 'The provided information is invalid. Please check your inputs and try again.';
  }
  
  // Default message
  return 'An unexpected database error occurred. Our team has been notified.';
}

/**
 * Check if an error is a database connection error
 */
export function isDatabaseConnectionError(error: any): boolean {
  return [
    'P1001', // Connection error
    'P1002', // Database server terminated the connection
    'P1003', // Database does not exist at the specified URL
    'P1008', // Operations timed out
    'P1017', // Server closed the connection
  ].includes(error?.code);
}

/**
 * Check if an error is a transient error that might resolve with a retry
 */
export function isTransientDatabaseError(error: any): boolean {
  return [
    'P1001', // Connection error
    'P1002', // Database server terminated the connection
    'P1008', // Operations timed out
    'P1017', // Server closed the connection
    'P2024', // Timeout exceeded
    'P2034', // Transaction failed due to a serialization error
    'P2028', // Transaction was aborted
  ].includes(error?.code);
}