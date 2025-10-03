// @ts-nocheck
// src/services/region-service.ts
import prisma from "@/lib/db/prisma";
import { redisService as redis } from "@/lib/db/redis";
import { timescaleDB } from "@/lib/db/timescale";
import { regionHasher } from "@/lib/privacy/region-hash";
import { metrics } from "@/lib/monitoring";
import { logger } from "@/lib/logger";
import type { RegionTrends, TimeRange } from "@/types";

interface RegionOptions {
  timeRange?: TimeRange;
  granularity?: "1h" | "1d" | "1w";
  includeRealtime?: boolean;
}

class RegionService {
  async getRegionTrends(region: string, options: RegionOptions = {}): Promise<RegionTrends> {
    const start = Date.now();
    try {
      const regionHash = await regionHasher.hashRegion(region);
      const cacheKey = `trends:${regionHash}:${JSON.stringify(options)}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        metrics.increment("region_trends_cache_hit");
        logger.info("Region service: Cache hit", { cacheKey });
        return JSON.parse(cached);
      }

      const [historicalTrends, realtimeTrends] = await Promise.all([
        this.getHistoricalTrends(regionHash, options),
        options.includeRealtime ? this.getRealtimeTrends(regionHash) : Promise.resolve(null),
      ]);

      const trends = this.mergeTrends(historicalTrends, realtimeTrends);
      await redis.set(cacheKey, JSON.stringify(trends), { ex: 300 });
      metrics.timing("region_trends_duration", Date.now() - start);
      logger.info("Region service: Trends fetched", { regionHash });
      return trends;
    } catch (error) {
      logger.error("Region trends error:", {
        error: error instanceof Error ? error.message : error,
      });
      metrics.increment("region_trends_errors");
      throw error;
    }
  }

  private async getHistoricalTrends(regionHash: string, options: RegionOptions) {
    const query = `
      WITH emotion_stats AS (
        SELECT 
          time_bucket($1, created_at) AS bucket,
          emotion,
          AVG(intensity) as avg_intensity,
          COUNT(*) as count,
          MODE() WITHIN GROUP (ORDER BY emotion) as dominant_emotion
        FROM check_ins
        WHERE 
          region_hash = $2
          AND created_at > NOW() - $3::interval
        GROUP BY bucket, emotion
      )
      SELECT 
        bucket,
        json_agg(json_build_object(
          'emotion', emotion,
          'count', count,
          'avgIntensity', avg_intensity,
          'isDominant', emotion = dominant_emotion
        )) as emotions
      FROM emotion_stats
      GROUP BY bucket
      ORDER BY bucket DESC
    `;
    return timescaleDB.query(query, [
      options.granularity || "1h",
      regionHash,
      options.timeRange || "24h",
    ]);
  }

  private async getRealtimeTrends(regionHash: string) {
    const pipeline = redis.pipeline();
    pipeline.hgetall(`stats:${regionHash}`);
    pipeline.zrange(`trends:${regionHash}`, 0, -1, "WITHSCORES");
    const results = await pipeline.exec();
    const stats = results[0][1];
    const trends = results[1][1];
    return { stats, trends };
  }

  private mergeTrends(historical: any[], realtime: any | null) {
    // Merge historical and realtime trends as needed.
    return historical;
  }
}

export const regionService = new RegionService();
export const getRegionTrends = (region: string, options?: RegionOptions) =>
  regionService.getRegionTrends(region, options);
