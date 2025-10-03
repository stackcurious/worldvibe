import { NextRequest, NextResponse } from "next/server";
import { redisService as redis } from "@/lib/db/redis";
import { getRegionTrends } from "@/services/region-service";
import { validateRegion } from "@/lib/validation";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const preferredRegion = "auto";
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    if (!region || !validateRegion(region)) {
      logger.warn("Invalid region parameter", { region });
      return NextResponse.json({ error: "Invalid region" }, { status: 400 });
    }
    const dateKey = new Date().toISOString().split("T")[0];
    const cacheKey = `trends:${region}:${dateKey}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info("Region trends served from cache", { cacheKey });
      // Cast cached to string to ensure JSON.parse gets a valid string.
      return NextResponse.json(JSON.parse(cached as string));
    }
    const data = await getRegionTrends(region);
    await redis.set(cacheKey, JSON.stringify(data), { ex: 300 });
    logger.info("Region trends fetched successfully", { region });
    return NextResponse.json({
      data,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Region trends error", {
      error: error instanceof Error ? error.message : error,
    });
    return NextResponse.json({ error: "Failed to fetch region trends" }, { status: 500 });
  }
}
