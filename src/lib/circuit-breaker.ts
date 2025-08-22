// src/lib/circuit-breaker.ts
/**
 * Advanced Circuit Breaker Pattern Implementation
 * ----------------------------------------------
 * Provides fault tolerance and resilience for external service dependencies.
 * This implementation includes features like:
 * - Configurable failure thresholds
 * - Self-healing recovery
 * - Exponential backoff
 * - Half-open state for recovery testing
 * - Isolated circuit breakers per service
 * - Event emission for monitoring
 * - Detailed metrics
 * 
 * @version 2.0.0
 */

import { logger } from './logger';
import { metrics } from './metrics';
import { EventEmitter } from 'events';

// Circuit breaker states
export enum CircuitState {
  CLOSED = 'CLOSED',         // Normal operation - requests flow through
  OPEN = 'OPEN',             // Failure detected - requests fail fast
  HALF_OPEN = 'HALF_OPEN'    // Testing recovery - limited requests pass through
}

export interface CircuitBreakerOptions {
  service: string;                // Name of the service being protected
  failureThreshold: number;       // Number of failures before opening circuit
  successThreshold?: number;      // Number of successes in half-open state to close circuit
  resetTimeout?: number;          // Milliseconds until trying half-open state
  maxRetries?: number;            // Maximum number of retry attempts
  retryDelay?: number;            // Base delay (ms) between retries
  timeout?: number;               // Request timeout in milliseconds
  fallbackFn?: (error: any, ...args: any[]) => any; // Optional fallback function
  maxCachedErrors?: number;       // Maximum number of errors to cache
  // Advanced options
  healthCheckInterval?: number;   // Interval for passive health checks
  expBackoffFactor?: number;      // Factor for exponential backoff
  maxRetryDelay?: number;         // Maximum delay between retries
  errorCacheTTL?: number;         // TTL for cached errors in milliseconds
}

interface CircuitBreakerStatus {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: Error | null;
  lastFailureTime: number | null;
  lastAttemptTime: number | null;
  nextAttemptTime: number | null;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rejectedRequests: number;
  retries: number;
  timeouts: number;
}

interface CircuitBreakerError extends Error {
  readonly circuit: string;
  readonly originalError?: Error;
  readonly isCircuitBreakerError: boolean;
}

const DEFAULT_OPTIONS: Partial<CircuitBreakerOptions> = {
  successThreshold: 2,
  resetTimeout: 30000,
  maxRetries: 3,
  retryDelay: 500,
  timeout: 10000,
  maxCachedErrors: 10,
  healthCheckInterval: 60000,
  expBackoffFactor: 2,
  maxRetryDelay: 30000,
  errorCacheTTL: 300000
};

// Registry to track all circuit breakers in the application
const circuitRegistry = new Map<string, CircuitBreaker>();

/**
 * Creates a circuit breaker error that includes original error details
 */
function createCircuitError(
  message: string, 
  circuit: string, 
  originalError?: Error
): CircuitBreakerError {
  const error = new Error(message) as CircuitBreakerError;
  error.circuit = circuit;
  error.isCircuitBreakerError = true;
  error.originalError = originalError;
  return error;
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailure: Error | null = null;
  private lastFailureTime: number | null = null;
  private lastAttemptTime: number | null = null;
  private nextAttemptTime: number | null = null;
  private totalRequests: number = 0;
  private successfulRequests: number = 0;
  private failedRequests: number = 0;
  private rejectedRequests: number = 0;
  private retries: number = 0;
  private timeouts: number = 0;
  private options: CircuitBreakerOptions;
  private recentErrors: Array<{error: Error, timestamp: number}> = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(options: CircuitBreakerOptions) {
    super();
    
    // Set options with defaults
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options
    } as CircuitBreakerOptions;
    
    // Register metrics
    this.registerMetrics();
    
    // Register in global registry
    circuitRegistry.set(this.options.service, this);
    
    // Start health check if enabled
    if (this.options.healthCheckInterval) {
      this.healthCheckInterval = setInterval(
        () => this.performHealthCheck(),
        this.options.healthCheckInterval
      );
    }
    
    // Log creation
    logger.info(`Circuit breaker created for service: ${this.options.service}`);
  }

  /**
   * Register metrics for monitoring this circuit breaker
   */
  private registerMetrics(): void {
    try {
      const base = `circuit_breaker.${this.options.service}`;
      
      metrics.registerGauge(`${base}.state`);
      metrics.registerCounter(`${base}.requests`);
      metrics.registerCounter(`${base}.successes`);
      metrics.registerCounter(`${base}.failures`);
      metrics.registerCounter(`${base}.rejections`);
      metrics.registerCounter(`${base}.retries`);
      metrics.registerCounter(`${base}.timeouts`);
      metrics.registerHistogram(`${base}.execution_time`);
    } catch (error) {
      // Non-fatal if metrics registration fails
      logger.warn(`Unable to register circuit breaker metrics: ${error}`);
    }
  }

  /**
   * Update metrics based on current state and operation
   */
  private updateMetrics(operation: 'request' | 'success' | 'failure' | 'rejection' | 'retry' | 'timeout'): void {
    try {
      const base = `circuit_breaker.${this.options.service}`;
      
      // Update state metric (0=open, 1=half-open, 2=closed)
      let stateValue = 0;
      if (this.state === CircuitState.HALF_OPEN) stateValue = 1;
      if (this.state === CircuitState.CLOSED) stateValue = 2;
      metrics.updateGauge(`${base}.state`, stateValue);
      
      // Update operation-specific metrics
      switch (operation) {
        case 'request':
          metrics.increment(`${base}.requests`);
          break;
        case 'success':
          metrics.increment(`${base}.successes`);
          break;
        case 'failure':
          metrics.increment(`${base}.failures`);
          break;
        case 'rejection':
          metrics.increment(`${base}.rejections`);
          break;
        case 'retry':
          metrics.increment(`${base}.retries`);
          break;
        case 'timeout':
          metrics.increment(`${base}.timeouts`);
          break;
      }
    } catch {
      // Silently fail if metrics update fails
    }
  }

  /**
   * Performs a health check and potentially resets the circuit
   */
  private performHealthCheck(): void {
    // Only check if circuit is open
    if (this.state !== CircuitState.OPEN) return;
    
    const now = Date.now();
    
    // Check if we should transition to half-open based on reset timeout
    if (this.lastFailureTime && 
        now - this.lastFailureTime >= (this.options.resetTimeout || DEFAULT_OPTIONS.resetTimeout!)) {
      this.toHalfOpen();
    }
  }

  /**
   * Transition circuit to open state
   */
  private toOpen(error: Error): void {
    if (this.state === CircuitState.OPEN) return;
    
    const prevState = this.state;
    this.state = CircuitState.OPEN;
    this.failures = 0;
    this.successes = 0;
    this.lastFailure = error;
    this.lastFailureTime = Date.now();
    this.nextAttemptTime = this.lastFailureTime + (this.options.resetTimeout || DEFAULT_OPTIONS.resetTimeout!);
    
    logger.warn(`Circuit OPENED for service ${this.options.service}`, {
      prevState,
      error: error.message,
      nextAttemptTime: new Date(this.nextAttemptTime).toISOString()
    });
    
    this.emit('open', {
      service: this.options.service,
      time: new Date(),
      error: error.message
    });
  }

  /**
   * Transition circuit to half-open state
   */
  private toHalfOpen(): void {
    if (this.state === CircuitState.HALF_OPEN) return;
    
    const prevState = this.state;
    this.state = CircuitState.HALF_OPEN;
    this.failures = 0;
    this.successes = 0;
    
    logger.info(`Circuit HALF-OPEN for service ${this.options.service}`, {
      prevState,
      time: new Date().toISOString()
    });
    
    this.emit('half-open', {
      service: this.options.service,
      time: new Date()
    });
  }

  /**
   * Transition circuit to closed state
   */
  private toClosed(): void {
    if (this.state === CircuitState.CLOSED) return;
    
    const prevState = this.state;
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.nextAttemptTime = null;
    
    logger.info(`Circuit CLOSED for service ${this.options.service}`, {
      prevState,
      time: new Date().toISOString()
    });
    
    this.emit('close', {
      service: this.options.service,
      time: new Date()
    });
  }

  /**
   * Record a success and potentially change circuit state
   */
  private recordSuccess(): void {
    this.successfulRequests++;
    this.updateMetrics('success');
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      
      if (this.successes >= (this.options.successThreshold || DEFAULT_OPTIONS.successThreshold!)) {
        this.toClosed();
      }
    }
  }

  /**
   * Record a failure and potentially change circuit state
   */
  private recordFailure(error: Error): void {
    this.failedRequests++;
    this.updateMetrics('failure');
    
    // Cache recent errors (with TTL management)
    this.addToRecentErrors(error);
    
    if (this.state === CircuitState.CLOSED) {
      this.failures++;
      
      if (this.failures >= this.options.failureThreshold) {
        this.toOpen(error);
      }
    } else if (this.state === CircuitState.HALF_OPEN) {
      this.toOpen(error);
    }
  }

  /**
   * Add error to recent errors cache with TTL management
   */
  private addToRecentErrors(error: Error): void {
    const now = Date.now();
    
    // Add new error
    this.recentErrors.push({
      error,
      timestamp: now
    });
    
    // Cleanup old errors based on TTL
    const ttl = this.options.errorCacheTTL || DEFAULT_OPTIONS.errorCacheTTL!;
    this.recentErrors = this.recentErrors.filter(e => now - e.timestamp < ttl);
    
    // Limit cache size
    if (this.recentErrors.length > (this.options.maxCachedErrors || DEFAULT_OPTIONS.maxCachedErrors!)) {
      this.recentErrors = this.recentErrors.slice(-this.options.maxCachedErrors!);
    }
  }

  /**
   * Main method to execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>, ...args: any[]): Promise<T> {
    this.totalRequests++;
    this.lastAttemptTime = Date.now();
    this.updateMetrics('request');
    
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if it's time to try again
      if (!this.nextAttemptTime || Date.now() < this.nextAttemptTime) {
        this.rejectedRequests++;
        this.updateMetrics('rejection');
        
        const error = createCircuitError(
          `Circuit for ${this.options.service} is OPEN`,
          this.options.service,
          this.lastFailure || undefined
        );
        
        // If fallback provided, execute it
        if (this.options.fallbackFn) {
          return this.options.fallbackFn(error, ...args);
        }
        
        throw error;
      } else {
        // Time to try again, move to half-open
        this.toHalfOpen();
      }
    }
    
    const startTime = Date.now();
    let retryCount = 0;
    let lastError: Error | null = null;
    
    // Execute with retries if configured
    while (retryCount <= (this.options.maxRetries || DEFAULT_OPTIONS.maxRetries!)) {
      try {
        // Execute with timeout if configured
        const result = await this.executeWithTimeout(fn);
        
        // Record metrics
        try {
          metrics.updateHistogram(
            `circuit_breaker.${this.options.service}.execution_time`,
            Date.now() - startTime
          );
        } catch {}
        
        // Record success and return result
        this.recordSuccess();
        return result;
      } catch (error) {
        // Store last error
        lastError = error as Error;
        
        // Don't retry circuit breaker errors
        if ((error as any).isCircuitBreakerError) {
          throw error;
        }
        
        // Check if we should retry
        if (retryCount < (this.options.maxRetries || DEFAULT_OPTIONS.maxRetries!)) {
          retryCount++;
          this.retries++;
          this.updateMetrics('retry');
          
          // Calculate delay with exponential backoff
          const factor = this.options.expBackoffFactor || DEFAULT_OPTIONS.expBackoffFactor!;
          const baseDelay = this.options.retryDelay || DEFAULT_OPTIONS.retryDelay!;
          const maxDelay = this.options.maxRetryDelay || DEFAULT_OPTIONS.maxRetryDelay!;
          
          let delay = baseDelay * Math.pow(factor, retryCount - 1);
          // Add jitter (±25%)
          delay = delay * (0.75 + Math.random() * 0.5);
          // Cap at max delay
          delay = Math.min(delay, maxDelay);
          
          logger.debug(`Retrying circuit ${this.options.service} after ${Math.round(delay)}ms (attempt ${retryCount})`, {
            error: error instanceof Error ? error.message : String(error)
          });
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Out of retries, record failure
        this.recordFailure(error as Error);
        
        // If fallback provided, execute it
        if (this.options.fallbackFn) {
          return this.options.fallbackFn(error, ...args);
        }
        
        throw error;
      }
    }
    
    // This should not happen, but TypeScript requires a return
    throw lastError!;
  }

  /**
   * Execute a function with timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    // If no timeout configured, execute directly
    if (!this.options.timeout) {
      return fn();
    }
    
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        this.timeouts++;
        this.updateMetrics('timeout');
        reject(createCircuitError(
          `Request to ${this.options.service} timed out after ${this.options.timeout}ms`,
          this.options.service
        ));
      }, this.options.timeout);
    });
    
    // Create a race with clear timeout logic
    try {
      // Race the function against timeout
      return await Promise.race([
        fn(),
        timeoutPromise
      ]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get circuit status for monitoring
   */
  getStatus(): CircuitBreakerStatus {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastFailureTime: this.lastFailureTime,
      lastAttemptTime: this.lastAttemptTime,
      nextAttemptTime: this.nextAttemptTime,
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      rejectedRequests: this.rejectedRequests,
      retries: this.retries,
      timeouts: this.timeouts
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(): Array<{error: Error, timestamp: number}> {
    return [...this.recentErrors];
  }

  /**
   * Force open the circuit (for testing or manual control)
   */
  forceOpen(reason: string = 'Manually forced open'): void {
    const error = new Error(reason);
    this.toOpen(error);
  }

  /**
   * Force close the circuit (for testing or manual control)
   */
  forceClose(): void {
    this.toClosed();
  }

  /**
   * Force half-open state (for testing or manual control)
   */
  forceHalfOpen(): void {
    this.toHalfOpen();
  }

  /**
   * Reset all counters and state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailure = null;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.recentErrors = [];
    
    logger.info(`Circuit breaker for ${this.options.service} reset`);
    this.emit('reset', {
      service: this.options.service,
      time: new Date()
    });
  }

  /**
   * Clean up resources when no longer needed
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Remove from registry
    circuitRegistry.delete(this.options.service);
    
    logger.info(`Circuit breaker for ${this.options.service} shut down`);
  }
  
  /**
   * Get all circuit breakers (for monitoring)
   */
  static getAllCircuits(): Map<string, CircuitBreaker> {
    return circuitRegistry;
  }
  
  /**
   * Get a circuit breaker by service name
   */
  static getCircuit(service: string): CircuitBreaker | undefined {
    return circuitRegistry.get(service);
  }
}

/**
 * Helper to create a new circuit breaker or get an existing one
 */
export function getCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker {
  const existing = circuitRegistry.get(options.service);
  if (existing) {
    return existing;
  }
  
  return new CircuitBreaker(options);
}