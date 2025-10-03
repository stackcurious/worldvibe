// @ts-nocheck
// src/lib/monitoring.ts

import { metrics, getMetrics } from './metrics';
import { logger } from './logger';

interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
}

interface ServiceStatus {
  healthy: boolean;
  checks: Record<string, boolean>;
  timestamp: string;
  uptime: number;
  metrics: Record<string, number>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private healthChecks: Map<string, HealthCheck>;
  private startTime: number;

  private constructor() {
    this.healthChecks = new Map();
    this.startTime = Date.now();
    this.setupDefaultChecks();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private setupDefaultChecks() {
    // Add Redis health check
    this.addHealthCheck('redis', async () => {
      try {
        const redis = (await import('./db/redis')).redis;
        await redis.get('health-check');
        return true;
      } catch (error) {
        logger.error('Redis health check failed:', error);
        return false;
      }
    });

    // Add database health check
    this.addHealthCheck('database', async () => {
      try {
        const { prisma } = await import('./db/prisma');
        await prisma.$queryRaw`SELECT 1`;
        return true;
      } catch (error) {
        logger.error('Database health check failed:', error);
        return false;
      }
    });
  }

  /**
   * Add a new health check
   */
  addHealthCheck(name: string, check: () => Promise<boolean>) {
    this.healthChecks.set(name, { name, check });
  }

  /**
   * Run all health checks
   */
  async checkHealth(): Promise<ServiceStatus> {
    const checks: Record<string, boolean> = {};
    let allHealthy = true;

    for (const [name, healthCheck] of this.healthChecks) {
      try {
        const isHealthy = await healthCheck.check();
        checks[name] = isHealthy;
        if (!isHealthy) allHealthy = false;
      } catch (error) {
        logger.error(`Health check failed for ${name}:`, error);
        checks[name] = false;
        allHealthy = false;
      }
    }

    const status: ServiceStatus = {
      healthy: allHealthy,
      checks,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      metrics: await getMetrics()
    };

    // Record health metrics
    metrics.updateGauge('service_health', allHealthy ? 1 : 0);
    metrics.updateGauge('service_uptime_seconds', status.uptime);

    Object.entries(checks).forEach(([name, isHealthy]) => {
      metrics.updateGauge(`health_check_${name}`, isHealthy ? 1 : 0);
    });

    return status;
  }

  /**
   * Create a monitoring middleware
   */
  createMonitoringMiddleware() {
    return async (req: any, res: any, next: Function) => {
      // Add request ID for tracking
      const requestId = crypto.randomUUID();
      req.requestId = requestId;

      // Track request timing
      const startTime = process.hrtime();

      // Add response hooks
      res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = (seconds * 1000) + (nanoseconds / 1_000_000);

        // Record request metrics
        metrics.recordRequest(
          req.method,
          req.route?.path || req.path,
          res.statusCode,
          duration
        );

        // Log request completion
        logger.info('Request completed', {
          requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration
        });
      });

      // Handle errors
      res.on('error', (error: Error) => {
        metrics.recordError('http_request', error, {
          requestId,
          method: req.method,
          path: req.path
        });

        logger.error('Request error', {
          requestId,
          error: error.message,
          stack: error.stack
        });
      });

      next();
    };
  }

  /**
   * Get system metrics
   */
  async getMetrics() {
    return getMetrics();
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();

// Re-export metrics for convenience
export { metrics, getMetrics };