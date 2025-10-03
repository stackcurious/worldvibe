import { NextRequest, NextResponse } from "next/server";
import { redisService as redis } from "@/lib/db/redis";
import { getGlobalAnalytics } from "@/services/analytics-service";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";

export const runtime = "nodejs";
export const revalidate = 30;

const CACHE_TTL_SECONDS = 300;

export async function GET(request: NextRequest) {
  const dateKey = new Date().toISOString().split("T")[0];
  const cacheKey = `analytics:global:${dateKey}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      metrics.increment("analytics.cache.hit");
      logger.info("Global analytics served from cache", { cacheKey });
      // Cast cachedData to string so JSON.parse receives a valid string.
      return NextResponse.json(JSON.parse(cachedData as string));
    }

    const analyticsData = await getGlobalAnalytics();
    await redis.set(cacheKey, JSON.stringify(analyticsData), { ex: CACHE_TTL_SECONDS });

    metrics.increment("analytics.success");
    logger.info("Global analytics fetched successfully", { cacheKey });
    return NextResponse.json({
      data: analyticsData,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error fetching analytics", {
      error: error instanceof Error ? error.message : error,
    });
    metrics.increment("analytics.error");
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
