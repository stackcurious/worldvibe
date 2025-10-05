import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";
import { getRegionDisplayName } from "@/lib/location/region-decoder";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/vibes/recent
 * Returns recent check-ins with notes for the vibes section
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  metrics.increment('api.vibes.recent.requests');

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const emotion = searchParams.get('emotion');

    // Build query filters
    const where: any = {
      note: {
        not: null
      }
    };

    if (emotion) {
      where.emotion = emotion.toUpperCase();
    }

    // Fetch recent check-ins with notes
    const checkIns = await prisma.checkIn.findMany({
      where,
      select: {
        id: true,
        emotion: true,
        intensity: true,
        note: true,
        regionHash: true,
        createdAt: true,
        deviceType: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Format response
    const vibes = checkIns.map((checkIn: any) => ({
      id: checkIn.id,
      emotion: checkIn.emotion.toLowerCase(),
      intensity: checkIn.intensity,
      reason: checkIn.note,
      region: getRegionDisplayName(checkIn.regionHash),
      timestamp: checkIn.createdAt.toISOString(),
      deviceType: checkIn.deviceType.toLowerCase(),
    }));

    metrics.increment('api.vibes.recent.success');
    metrics.timing('api.vibes.recent.duration', performance.now() - startTime);

    return NextResponse.json({
      vibes,
      count: vibes.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching recent vibes', {
      error: error instanceof Error ? error.message : String(error)
    });

    metrics.increment('api.vibes.recent.error');

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch recent vibes',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
