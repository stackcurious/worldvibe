// src/lib/analytics/trends.ts
import { redis } from '../db/redis';
import { tsPool } from '../db/timescale';
import { metrics } from '../monitoring';
import type { TrendAnalysis } from '@/types';

export async function calculateTrends(options: {
  timeframe: string;
  region?: string;
}): Promise<TrendAnalysis> {
  const cacheKey = `trends:${options.timeframe}:${options.region || 'global'}`;
  
  try {
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Calculate trends using window functions
    const query = `
      WITH emotion_stats AS (
        SELECT 
          emotion,
          COUNT(*) as count,
          AVG(intensity) as avg_intensity,
          FIRST_VALUE(emotion) OVER (
            PARTITION BY region_hash 
            ORDER BY COUNT(*) DESC
          ) as dominant_emotion
        FROM check_ins
        WHERE 
          created_at > NOW() - $1::interval
          AND ($2::text IS NULL OR region_hash = $2)
        GROUP BY emotion, region_hash
      )
      SELECT 
        emotion,
        SUM(count) as total_count,
        AVG(avg_intensity) as intensity,
        COUNT(DISTINCT CASE 
          WHEN emotion = dominant_emotion THEN region_hash 
        END) as dominant_regions
      FROM emotion_stats
      GROUP BY emotion
      ORDER BY total_count DESC
    `;

    const result = await tsPool.query(query, [
      options.timeframe,
      options.region
    ]);

    const trends = processTrendResults(result.rows);

    // Cache results
    await redis.set(cacheKey, JSON.stringify(trends), 'EX', 300);

    return trends;
  } catch (error) {
    metrics.increment('trend_calculation_errors');
    throw error;
  }
}