// @ts-nocheck
/**
 * Metrics API endpoint
 * ------------------
 * Provides Prometheus-compatible metrics for the application.
 * Covers:
 * - Database metrics
 * - Redis metrics
 * - System metrics
 * - API metrics
 * - Circuit breaker metrics
 */

import { NextResponse } from 'next/server';
import { getMetrics } from '@/lib/metrics';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // Get all application metrics
  const metricsText = await getMetrics();
  
  // Add database specific metrics
  let dbMetrics = '';
  try {
    // Get database status
    const dbStatus = (prisma as any).getStatus();
    
    // Format db pool metrics in prometheus format
    if (dbStatus?.poolMetrics) {
      const { poolMetrics } = dbStatus;
      dbMetrics += `# TYPE prisma_pool_connections gauge\n`;
      dbMetrics += `prisma_pool_connections{state="total"} ${poolMetrics.totalConnections || 0}\n`;
      dbMetrics += `prisma_pool_connections{state="active"} ${poolMetrics.activeConnections || 0}\n`;
      dbMetrics += `prisma_pool_connections{state="idle"} ${poolMetrics.idleConnections || 0}\n`;
      dbMetrics += `prisma_pool_connections{state="waiting"} ${poolMetrics.waitingClients || 0}\n\n`;
      
      // Add query distribution metrics
      if (dbStatus.queryDistribution) {
        dbMetrics += `# TYPE prisma_query_distribution counter\n`;
        Object.entries(dbStatus.queryDistribution).forEach(([model, count]) => {
          dbMetrics += `prisma_query_distribution{model="${model}"} ${count}\n`;
        });
        dbMetrics += '\n';
      }
    }
  } catch (error) {
    // Ignore errors, just don't add the metrics
  }
  
  // Add Node.js process metrics
  const processMetrics = getNodeMetrics();
  
  // Combine all metrics
  const allMetrics = [
    metricsText,
    dbMetrics,
    processMetrics
  ].join('\n');
  
  // Return metrics in Prometheus format
  return new Response(allMetrics, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}

/**
 * Get Node.js process metrics in Prometheus format
 */
function getNodeMetrics(): string {
  let result = '';
  
  try {
    // Memory metrics
    const memoryUsage = process.memoryUsage();
    
    result += '# HELP nodejs_memory_usage_bytes Memory usage of the Node.js process\n';
    result += '# TYPE nodejs_memory_usage_bytes gauge\n';
    result += `nodejs_memory_usage_bytes{type="rss"} ${memoryUsage.rss}\n`;
    result += `nodejs_memory_usage_bytes{type="heapTotal"} ${memoryUsage.heapTotal}\n`;
    result += `nodejs_memory_usage_bytes{type="heapUsed"} ${memoryUsage.heapUsed}\n`;
    result += `nodejs_memory_usage_bytes{type="external"} ${memoryUsage.external}\n\n`;
    
    // CPU usage metrics (rough estimation)
    result += '# HELP nodejs_uptime_seconds Process uptime in seconds\n';
    result += '# TYPE nodejs_uptime_seconds counter\n';
    result += `nodejs_uptime_seconds ${process.uptime()}\n\n`;
    
    // Event loop metrics
    if (global.performance) {
      const { nodeTiming } = global.performance;
      if (nodeTiming) {
        const bootstrapTime = nodeTiming.bootstrapComplete - nodeTiming.nodeStart;
        
        result += '# HELP nodejs_bootstrap_time_seconds Node.js bootstrap time in seconds\n';
        result += '# TYPE nodejs_bootstrap_time_seconds gauge\n';
        result += `nodejs_bootstrap_time_seconds ${bootstrapTime / 1000}\n\n`;
      }
    }
  } catch (error) {
    // Ignore errors in metrics collection
  }
  
  return result;
}