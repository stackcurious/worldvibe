/**
 * Health check API endpoint
 * ------------------------
 * Provides health status of the application and its dependencies:
 * - Database connection
 * - Redis connection  
 * - TimescaleDB
 * - Overall system health
 * 
 * Response includes detailed metrics on each component.
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { redis } from '@/lib/db/redis';
import { metrics, getMetrics } from '@/lib/monitoring';
import { timescaleDB } from '@/lib/db/timescale';
import { CircuitBreaker } from '@/lib/circuit-breaker';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  
  // Check database connection
  let databaseHealthy = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseHealthy = true;
  } catch (error) {
    metrics.increment('health_check.database.error');
  }
  
  // Check Redis connection
  let redisHealthy = false;
  try {
    await redis.get('health-check');
    redisHealthy = true;
  } catch (error) {
    metrics.increment('health_check.redis.error');
  }
  
  // Check TimescaleDB
  let timescaleHealthy = false;
  try {
    await timescaleDB.query('SELECT 1');
    timescaleHealthy = true;
  } catch (error) {
    metrics.increment('health_check.timescale.error');
  }
  
  // Check circuit breakers
  const circuitBreakers = CircuitBreaker.getAllCircuits();
  const circuitStatus: Record<string, any> = {};
  
  for (const [name, circuit] of circuitBreakers.entries()) {
    circuitStatus[name] = circuit.getStatus().state;
  }
  
  // Check database pool metrics
  let poolMetrics = {};
  try {
    const dbStatus = (prisma as any).getStatus();
    poolMetrics = dbStatus.poolMetrics || {};
  } catch (error) {
    // Ignore error
  }
  
  // Build response
  const response = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    healthy: databaseHealthy && redisHealthy,
    services: {
      database: {
        status: databaseHealthy ? 'up' : 'down',
        pool: poolMetrics
      },
      redis: {
        status: redisHealthy ? 'up' : 'down'
      },
      timescale: {
        status: timescaleHealthy ? 'up' : 'down'
      }
    },
    circuit_breakers: circuitStatus,
    response_time: `${Date.now() - startTime}ms`
  };
  
  // Update health metrics
  metrics.gauge('health_check.database', databaseHealthy ? 1 : 0);
  metrics.gauge('health_check.redis', redisHealthy ? 1 : 0);
  metrics.gauge('health_check.timescale', timescaleHealthy ? 1 : 0);
  metrics.gauge('health_check.overall', (databaseHealthy && redisHealthy) ? 1 : 0);
  metrics.timing('health_check.response_time', Date.now() - startTime);
  
  // Return response with appropriate status code
  return NextResponse.json(
    response,
    { 
      status: databaseHealthy && redisHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json'
      }
    }
  );
}

// Also export metrics endpoint
export async function HEAD() {
  try {
    // Simple check to see if the database is responding
    await prisma.$queryRaw`SELECT 1`;
    return new Response(null, { status: 200 });
  } catch (error) {
    return new Response(null, { status: 503 });
  }
}