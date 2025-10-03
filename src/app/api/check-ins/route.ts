// src/app/api/check-ins/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { redis } from "@/lib/db/redis";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";

// Cache configuration
const CACHE_KEY = "check-ins:recent";
const CACHE_TTL = 10; // 10 seconds for real-time feel

// Configure dynamic behavior for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/check-ins
 * Returns recent check-ins for the real-time feed
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  metrics.increment('api.check_ins.requests');

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const emotion = searchParams.get('emotion');
    const region = searchParams.get('region');

    // Try cache first (only for default query)
    if (!emotion && !region && offset === 0 && limit === 50) {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        metrics.increment('api.check_ins.cache_hit');
        return NextResponse.json({
          success: true,
          data: JSON.parse(cached),
          cached: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Build query filters
    const where: any = {};
    if (emotion) {
      where.emotion = emotion.toUpperCase();
    }
    if (region) {
      where.regionHash = region;
    }

    // Fetch check-ins from database
    const checkIns = await prisma.checkIn.findMany({
      where,
      select: {
        id: true,
        emotion: true,
        intensity: true,
        note: true,
        regionHash: true,
        createdAt: true,
        latitude: true,
        longitude: true,
        deviceType: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
    });

    // Format response with anonymized data
    const formattedCheckIns = checkIns.map((checkIn: any) => ({
      id: checkIn.id,
      emotion: checkIn.emotion.toLowerCase(),
      intensity: checkIn.intensity,
      note: checkIn.note || null,
      region: checkIn.regionHash,
      timestamp: checkIn.createdAt.toISOString(),
      // Include coordinates for map visualization
      coordinates: checkIn.latitude && checkIn.longitude ? {
        lat: checkIn.latitude,
        lng: checkIn.longitude,
      } : null,
      deviceType: checkIn.deviceType.toLowerCase(),
    }));

    // Get total count for pagination
    const total = await prisma.checkIn.count({ where });

    const response = {
      success: true,
      data: formattedCheckIns,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
      cached: false,
      timestamp: new Date().toISOString()
    };

    // Cache default query result
    if (!emotion && !region && offset === 0 && limit === 50) {
      await redis.set(CACHE_KEY, JSON.stringify(formattedCheckIns), { ex: CACHE_TTL });
    }

    metrics.increment('api.check_ins.success');
    metrics.timing('api.check_ins.duration', performance.now() - startTime);

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Error fetching check-ins', {
      error: error instanceof Error ? error.message : String(error)
    });

    metrics.increment('api.check_ins.error');

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch check-ins',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
