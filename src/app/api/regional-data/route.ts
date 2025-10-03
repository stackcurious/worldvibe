// src/app/api/regional-data/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { redis } from "@/lib/db/redis";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";

// Cache configuration
const CACHE_KEY_PREFIX = "regional-data";
const CACHE_TTL = 300; // 5 minutes

// Configure dynamic behavior
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/regional-data
 * Returns emotional data aggregated by region for heatmap visualization
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  metrics.increment('api.regional_data.requests');

  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '24h'; // 24h, 7d, 30d
    const cacheKey = `${CACHE_KEY_PREFIX}:${timeRange}`;

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      metrics.increment('api.regional_data.cache_hit');
      return NextResponse.json({
        success: true,
        data: JSON.parse(cached),
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Calculate time window
    const now = new Date();
    const timeWindowMap: Record<string, number> = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30,
    };
    const hoursAgo = timeWindowMap[timeRange] || 24;
    const since = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    // Aggregate by region
    const regionalData = await prisma.checkIn.groupBy({
      by: ['regionHash', 'emotion'],
      where: {
        createdAt: {
          gte: since
        }
      },
      _count: {
        id: true
      },
      _avg: {
        intensity: true
      }
    });

    // Transform to region-centric format
    const regionMap = new Map<string, any>();

    for (const item of regionalData) {
      if (!regionMap.has(item.regionHash)) {
        regionMap.set(item.regionHash, {
          region: item.regionHash,
          totalCheckIns: 0,
          emotions: {},
          dominantEmotion: null,
          avgIntensity: 0,
        });
      }

      const region = regionMap.get(item.regionHash)!;
      region.totalCheckIns += item._count.id;
      region.emotions[item.emotion.toLowerCase()] = {
        count: item._count.id,
        avgIntensity: item._avg.intensity || 0,
        percentage: 0, // Will calculate after
      };
    }

    // Calculate percentages and dominant emotions
    const regions = Array.from(regionMap.values()).map(region => {
      let maxCount = 0;
      let totalIntensity = 0;
      let totalEmotionCount = 0;

      for (const [emotion, data] of Object.entries(region.emotions) as [string, any][]) {
        data.percentage = (data.count / region.totalCheckIns) * 100;

        if (data.count > maxCount) {
          maxCount = data.count;
          region.dominantEmotion = emotion;
        }

        totalIntensity += data.avgIntensity * data.count;
        totalEmotionCount += data.count;
      }

      region.avgIntensity = totalEmotionCount > 0
        ? totalIntensity / totalEmotionCount
        : 0;

      return region;
    });

    // Sort by total check-ins
    regions.sort((a, b) => b.totalCheckIns - a.totalCheckIns);

    // Add global statistics
    const globalStats = {
      totalRegions: regions.length,
      totalCheckIns: regions.reduce((sum, r) => sum + r.totalCheckIns, 0),
      avgIntensity: regions.reduce((sum, r) => sum + r.avgIntensity, 0) / regions.length || 0,
      timeRange,
      since: since.toISOString(),
    };

    const response = {
      success: true,
      data: {
        regions,
        global: globalStats,
      },
      cached: false,
      timestamp: new Date().toISOString()
    };

    // Cache the result
    await redis.set(cacheKey, JSON.stringify(response.data), { ex: CACHE_TTL });

    metrics.increment('api.regional_data.success');
    metrics.timing('api.regional_data.duration', performance.now() - startTime);

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Error fetching regional data', {
      error: error instanceof Error ? error.message : String(error)
    });

    metrics.increment('api.regional_data.error');

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch regional data',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
