import prisma from "@/lib/db/prisma"; // Default import for prisma
import { redisService as redis } from "@/lib/db/redis"; // Correctly import Redis client
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";

interface AdTargetingContext {
  regionHash: string;
  emotion: string;
  intensity?: number;
  timeOfDay: string;
  userContext?: string;
}

export interface AdPlacement {
  id: string;
  adType: string;
  content: AdContent;
  priority: number;
  targeting: TargetingRules;
}

export interface AdContent {
  title: string;
  description: string;
  cta: string;
  imageUrl?: string;
  placement: "feed" | "sidebar" | "native";
}

export interface TargetingRules {
  emotions: string[];
  regions: string[];
  timeRanges: string[];
  minIntensity?: number;
  maxIntensity?: number;
}

/**
 * determineAdPlacement fetches eligible ads based on the provided context,
 * scores and selects the top ads, caches the result, and logs the targeting event.
 */
export async function determineAdPlacement(context: AdTargetingContext) {
  const cacheKey = `ad:target:${context.regionHash}:${context.emotion}:${context.timeOfDay}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      metrics.increment("ad.targeting.cache.hit");
      logger.info("Ad targeting: returning cached result", { cacheKey });
      return JSON.parse(cached as string);
    }

    const eligibleAds = await findEligibleAds(context);
    const scoredAds = await scoreAds(eligibleAds, context);
    const selectedAds = selectTopAds(scoredAds);

    // Set TTL as a number (300 seconds)
    await redis.set(cacheKey, JSON.stringify(selectedAds), 300);
    await logTargetingEvent({
      context,
      selectedAds,
      timestamp: new Date(),
    });

    metrics.increment("ad.targeting.success");
    logger.info("Ad targeting successful", { context, selectedAds });
    return selectedAds;
  } catch (error) {
    logger.error("Ad targeting failed", { 
      error: error instanceof Error ? error.message : error,
      context,
    });
    metrics.increment("ad.targeting.error");
    throw error;
  }
}

async function findEligibleAds(context: AdTargetingContext): Promise<AdPlacement[]> {
  return prisma.adPlacement.findMany({
    where: {
      active: true,
      targeting: {
        emotions: { has: context.emotion },
        regions: { has: context.regionHash },
      },
      AND: [
        { OR: [{ startDate: { lte: new Date() } }, { startDate: null }] },
        { OR: [{ endDate: { gte: new Date() } }, { endDate: null }] },
      ],
    },
    orderBy: { priority: "desc" },
  });
}

async function scoreAds(ads: AdPlacement[], context: AdTargetingContext) {
  return ads.map((ad) => ({
    ...ad,
    score: calculateAdScore(ad, context),
  }));
}

function calculateAdScore(ad: AdPlacement, context: AdTargetingContext): number {
  let score = ad.priority * 10;

  if (ad.targeting.emotions.includes(context.emotion)) {
    score += 20;
  }

  if (ad.targeting.timeRanges.includes(context.timeOfDay)) {
    score += 15;
  }

  if (context.intensity && ad.targeting.minIntensity && ad.targeting.maxIntensity) {
    if (context.intensity >= ad.targeting.minIntensity && context.intensity <= ad.targeting.maxIntensity) {
      score += 10;
    }
  }

  return score;
}

function selectTopAds(scoredAds: (AdPlacement & { score: number })[]): AdPlacement[] {
  return scoredAds.sort((a, b) => b.score - a.score).slice(0, 3);
}

async function logTargetingEvent(event: any) {
  await prisma.adTargetingLog.create({
    data: {
      context: event.context,
      selectedAds: event.selectedAds,
      timestamp: event.timestamp,
    },
  });
}
