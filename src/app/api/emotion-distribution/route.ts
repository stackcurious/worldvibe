// src/app/api/emotion-distribution/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { redis } from "@/lib/db/redis";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";

// Cache configuration
const CACHE_KEY_PREFIX = "emotion-distribution";
const CACHE_TTL = 60; // 1 minute

// Configure dynamic behavior
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/emotion-distribution
 * Returns distribution of emotions for pie charts and visualizations
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  metrics.increment('api.emotion_distribution.requests');

  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '24h';
    const region = searchParams.get('region');

    const cacheKey = region
      ? `${CACHE_KEY_PREFIX}:${timeRange}:${region}`
      : `${CACHE_KEY_PREFIX}:${timeRange}:global`;

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      metrics.increment('api.emotion_distribution.cache_hit');
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

    // Build query
    const where: any = {
      createdAt: {
        gte: since
      }
    };

    if (region) {
      where.regionHash = region;
    }

    // Get emotion distribution
    const distribution = await prisma.checkIn.groupBy({
      by: ['emotion'],
      where,
      _count: {
        id: true
      },
      _avg: {
        intensity: true
      }
    });

    // Calculate total for percentages
    const total = distribution.reduce((sum: number, item: any) => sum + item._count.id, 0);

    // Format response
    const emotions = distribution.map((item: any) => ({
      emotion: item.emotion.toLowerCase(),
      count: item._count.id,
      percentage: total > 0 ? (item._count.id / total) * 100 : 0,
      avgIntensity: item._avg.intensity || 0,
    }));

    // Sort by count descending
    emotions.sort((a: any, b: any) => b.count - a.count);

    // Calculate sentiment breakdown
    const positiveEmotions = ['joy', 'calm', 'anticipation', 'trust'];
    const negativeEmotions = ['stress', 'sadness', 'anger', 'fear', 'disgust'];

    const positive = emotions
      .filter((e: any) => positiveEmotions.includes(e.emotion))
      .reduce((sum: number, e: any) => sum + e.count, 0);

    const negative = emotions
      .filter((e: any) => negativeEmotions.includes(e.emotion))
      .reduce((sum: number, e: any) => sum + e.count, 0);

    const neutral = emotions
      .filter((e: any) => e.emotion === 'surprise')
      .reduce((sum: number, e: any) => sum + e.count, 0);

    const sentiment = {
      positive: {
        count: positive,
        percentage: total > 0 ? (positive / total) * 100 : 0,
      },
      negative: {
        count: negative,
        percentage: total > 0 ? (negative / total) * 100 : 0,
      },
      neutral: {
        count: neutral,
        percentage: total > 0 ? (neutral / total) * 100 : 0,
      }
    };

    const responseData = {
      emotions,
      sentiment,
      total,
      timeRange,
      region: region || 'global',
      since: since.toISOString(),
    };

    // Cache the result
    await redis.set(cacheKey, JSON.stringify(responseData), { ex: CACHE_TTL });

    metrics.increment('api.emotion_distribution.success');
    metrics.timing('api.emotion_distribution.duration', performance.now() - startTime);

    return NextResponse.json({
      success: true,
      data: responseData,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching emotion distribution', {
      error: error instanceof Error ? error.message : String(error)
    });

    metrics.increment('api.emotion_distribution.error');

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch emotion distribution',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
