// @ts-nocheck
// src/lib/analytics/aggregator.ts
import { prisma } from '../db/prisma';
import { redis } from '../db/redis';
import { tsPool } from '../db/timescale';
import { logger } from '../logger';

interface AggregationOptions {
  interval: '1h' | '24h' | '7d' | '30d';
  regions?: string[];
  emotions?: string[];
}

export async function aggregateCheckIns(options: AggregationOptions) {
  const startTime = Date.now();
  
  try {
    // Time-series aggregation using TimescaleDB
    const timeseriesQuery = `
      SELECT 
        time_bucket($1, created_at) AS bucket,
        region_hash,
        emotion,
        COUNT(*) as count,
        AVG(intensity) as avg_intensity
      FROM check_ins
      WHERE created_at > NOW() - $2::interval
      GROUP BY bucket, region_hash, emotion
      ORDER BY bucket DESC
    `;

    const [timeseriesData, realtimeStats] = await Promise.all([
      // Get historical aggregates
      tsPool.query(timeseriesQuery, [
        options.interval,
        `${options.interval}`
      ]),
      
      // Get real-time stats from Redis
      Promise.all(
        (options.emotions || []).map(emotion =>
          redis.hgetall(`stats:emotions:${emotion}`)
        )
      )
    ]);

    // Merge historical and real-time data
    const mergedData = mergeAggregates(timeseriesData.rows, realtimeStats);

    // Cache results
    await redis.set(
      `cache:aggregates:${options.interval}`,
      JSON.stringify(mergedData),
      { ex: 300 } // 5 minutes
    );

    // Log performance metrics
    logger.info('Aggregation complete', {
      duration: Date.now() - startTime,
      interval: options.interval,
      recordsProcessed: timeseriesData.rowCount
    });

    return mergedData;
  } catch (error) {
    logger.error('Aggregation error:', error);
    throw error;
  }
}