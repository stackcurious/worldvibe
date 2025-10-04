// src/app/api/vibes/recent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/vibes/recent
 * Returns recent check-ins with notes (reasons why people feel the way they do)
 *
 * Query params:
 * - emotion: filter by specific emotion
 * - limit: number of results (default: 10, max: 50)
 * - withNotes: only return check-ins that have notes (default: true)
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  metrics.increment('api.vibes.recent.requests');

  try {
    const { searchParams } = new URL(request.url);
    const emotion = searchParams.get('emotion');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const withNotes = searchParams.get('withNotes') !== 'false'; // default true

    // Build query filters
    const where: any = {};

    if (emotion) {
      where.emotion = emotion.toUpperCase();
    }

    if (withNotes) {
      where.note = {
        not: null,
      };
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
    const vibes = checkIns.map((checkIn) => ({
      id: checkIn.id,
      emotion: checkIn.emotion.toLowerCase(),
      intensity: checkIn.intensity,
      reason: checkIn.note,
      region: checkIn.regionHash,
      timestamp: checkIn.createdAt.toISOString(),
      deviceType: checkIn.deviceType.toLowerCase(),
      // Calculate relative time
      relativeTime: getRelativeTime(checkIn.createdAt),
    }));

    metrics.increment('api.vibes.recent.success');
    metrics.timing('api.vibes.recent.duration', performance.now() - startTime);

    return NextResponse.json({
      success: true,
      vibes,
      count: vibes.length,
      emotion: emotion || 'all',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Error fetching recent vibes', {
      error: error instanceof Error ? error.message : String(error),
    });

    metrics.increment('api.vibes.recent.error');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch recent vibes',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Convert timestamp to relative time string
 */
function getRelativeTime(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  return `${diffDays}d ago`;
}
