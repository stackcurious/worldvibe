import { NextRequest, NextResponse } from "next/server";
import { getTrendingKeywords, getAllTrendingKeywords } from "@/services/trending-notes-service";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/trending/keywords
 * Returns trending keywords from recent check-in notes
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  metrics.increment('api.trending.keywords.requests');

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const emotion = searchParams.get('emotion');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const all = searchParams.get('all') === 'true';

    let keywords;

    if (all) {
      keywords = await getAllTrendingKeywords(limit);
    } else {
      keywords = await getTrendingKeywords(emotion || undefined, limit);
    }

    metrics.increment('api.trending.keywords.success');
    metrics.timing('api.trending.keywords.duration', performance.now() - startTime);

    return NextResponse.json({
      keywords,
      count: keywords.length,
      emotion: emotion || 'all',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching trending keywords', {
      error: error instanceof Error ? error.message : String(error)
    });

    metrics.increment('api.trending.keywords.error');

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch trending keywords',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
