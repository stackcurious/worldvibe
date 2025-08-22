/**
 * Database Error Handler
 * ---------------------
 * Provides centralized error handling for database operations,
 * with user-friendly error messages and recovery strategies.
 */

import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';
import { getDatabaseErrorMessage, isTransientDatabaseError } from './status-messages';

/**
 * Options for error handling
 */
interface ErrorHandlerOptions {
  /** Operation name for logging and metrics */
  operation: string;
  /** Whether to retry transient errors */
  retry?: boolean;
  /** Maximum number of retries */
  maxRetries?: number;
  /** Whether to swallow the error and return a default value */
  silent?: boolean;
  /** Default value to return if silent=true */
  defaultValue?: any;
}

/**
 * Safely execute a database operation with error handling
 * 
 * @example
 * ```typescript
 * const user = await executeDatabaseOperation(
 *   () => prisma.user.findUnique({ where: { id } }),
 *   { operation: 'getUserById', silent: true, defaultValue: null }
 * );
 * ```
 */
export async function executeDatabaseOperation<T>(
  operation: () => Promise<T>,
  options: ErrorHandlerOptions
): Promise<T> {
  const {
    operation: operationName,
    retry = true,
    maxRetries = 3,
    silent = false,
    defaultValue = null
  } = options;
  
  let attempts = 0;
  let lastError: Error | null = null;
  
  while (attempts <= maxRetries) {
    try {
      // Track operation
      metrics.increment('database.operations', 1, { operation: operationName });
      const startTime = Date.now();
      
      // Execute the operation
      const result = await operation();
      
      // Track successful operation
      metrics.timing('database.operation_time', Date.now() - startTime, { 
        operation: operationName 
      });
      metrics.increment('database.operations.success', 1, { 
        operation: operationName 
      });
      
      return result;
    } catch (error) {
      lastError = error as Error;
      attempts++;
      
      // Log the error
      logger.error(`Database operation '${operationName}' failed`, {
        error: error instanceof Error ? error.message : String(error),
        code: (error as any).code,
        attempt: attempts,
        maxRetries
      });
      
      // Track error in metrics
      metrics.increment('database.operations.error', 1, { 
        operation: operationName,
        code: (error as any).code || 'unknown' 
      });
      
      // Check if we should retry
      const shouldRetry = retry && 
        isTransientDatabaseError(error) && 
        attempts <= maxRetries;
      
      if (shouldRetry) {
        // Add exponential backoff with jitter
        const backoff = Math.min(100 * Math.pow(2, attempts - 1), 2000);
        const jitter = backoff * 0.2 * (Math.random() - 0.5);
        const delay = backoff + jitter;
        
        logger.info(`Retrying database operation '${operationName}' in ${Math.round(delay)}ms (attempt ${attempts}/${maxRetries})`);
        metrics.increment('database.operations.retry', 1, { operation: operationName });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If we're in silent mode, return the default value
      if (silent) {
        logger.warn(`Swallowing error in database operation '${operationName}'`, {
          error: error instanceof Error ? error.message : String(error)
        });
        return defaultValue;
      }
      
      // Add user-friendly message to the error
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        error.message = getDatabaseErrorMessage(error);
      }
      
      // Re-throw the error
      throw error;
    }
  }
  
  // This should never happen, but TypeScript requires a return
  throw lastError!;
}

/**
 * Parse a database error into a user-friendly format
 * Useful for API endpoints to return consistent error responses
 */
export function parseDatabaseError(error: any): {
  message: string;
  code: string;
  retriable: boolean;
  statusCode: number;
} {
  // Default error info
  const errorInfo = {
    message: getDatabaseErrorMessage(error),
    code: error?.code || 'UNKNOWN_ERROR',
    retriable: isTransientDatabaseError(error),
    statusCode: 500 // Internal Server Error by default
  };
  
  // Adjust status code based on error type
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Not found errors
    if (error.code === 'P2001' || error.code === 'P2025') {
      errorInfo.statusCode = 404; // Not Found
    }
    // Unique constraint violations
    else if (error.code === 'P2002') {
      errorInfo.statusCode = 409; // Conflict
    }
    // Input validation errors
    else if (['P2006', 'P2007', 'P2008', 'P2009', 'P2010', 'P2011', 'P2012'].includes(error.code)) {
      errorInfo.statusCode = 400; // Bad Request
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    errorInfo.statusCode = 400; // Bad Request
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    errorInfo.statusCode = 503; // Service Unavailable
  }
  
  return errorInfo;
}