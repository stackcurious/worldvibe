// src/app/api/trending/keywords/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { trendingNotesService } from '@/services/trending-notes-service';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/trending/keywords
 * Returns trending keywords based on check-in notes
 *
 * Query params:
 * - type: 'global' | 'emotion' | 'region' | 'hourly' (default: 'global')
 * - emotion: emotion type (required if type=emotion)
 * - region: region hash (required if type=region)
 * - hour: ISO hour string YYYY-MM-DDTHH (required if type=hourly)
 * - limit: number of results (default: 20, max: 50)
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  metrics.increment('api.trending.keywords.requests');

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'global';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    let trending;

    switch (type) {
      case 'emotion': {
        const emotion = searchParams.get('emotion');
        if (!emotion) {
          return NextResponse.json(
            { error: 'emotion parameter required for type=emotion' },
            { status: 400 }
          );
        }
        trending = await trendingNotesService.getEmotionTrending(emotion, limit);
        break;
      }

      case 'region': {
        const region = searchParams.get('region');
        if (!region) {
          return NextResponse.json(
            { error: 'region parameter required for type=region' },
            { status: 400 }
          );
        }
        trending = await trendingNotesService.getRegionTrending(region, limit);
        break;
      }

      case 'hourly': {
        const hour = searchParams.get('hour');
        if (!hour) {
          return NextResponse.json(
            { error: 'hour parameter required for type=hourly (format: YYYY-MM-DDTHH)' },
            { status: 400 }
          );
        }
        trending = await trendingNotesService.getHourlyTrending(hour, limit);
        break;
      }

      case 'global':
      default: {
        trending = await trendingNotesService.getGlobalTrending(limit);
        break;
      }
    }

    metrics.increment('api.trending.keywords.success');
    metrics.timing('api.trending.keywords.duration', performance.now() - startTime);

    return NextResponse.json({
      success: true,
      type,
      keywords: trending,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Error fetching trending keywords', {
      error: error instanceof Error ? error.message : String(error),
    });

    metrics.increment('api.trending.keywords.error');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trending keywords',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
