// src/services/ad-service.ts

import { adTargeting } from "@/lib/ads/targeting";
import { adPlacement } from "@/lib/ads/placement";
import { recommendationEngine } from "@/lib/ads/recommendation";
import { redisService as redis } from "@/lib/db/redis";
import { metrics } from "@/lib/monitoring";
import { logger } from "@/lib/logger";

// IMPORTANT: make sure these match your new or existing definitions in @/types
import type { Ad, AdContext, PlacementContext } from "@/types";

/**
 * The AdService class handles fetching or generating targeted ads
 * based on user context (emotion, region, timestamp, etc.) and
 * placement constraints (ad size, max number, etc.).
 *
 * Caches results in Redis to reduce overhead of repeated lookups.
 */
class AdService {
  /**
   * Main entry point: retrieve relevant ads for a given user context.
   */
  async getTargetedAds(context: AdContext, placement: PlacementContext): Promise<Ad[]> {
    const start = Date.now();
    // Build a cache key from the user context & placement constraints
    const cacheKey = `ads:${JSON.stringify({ context, placement })}`;

    try {
      // 1. Attempt to fetch ads from cache for performance
      const cached = await redis.get(cacheKey);
      if (cached) {
        metrics.increment("targeted_ads_cache_hit");
        logger.info("Ad service: Cache hit", { cacheKey });
        return JSON.parse(cached) as Ad[];
      }

      // 2. Get the set of targeted ads, placement constraints, and recommendations in parallel
      const [targetedAds, placementInfo, recommendations] = await Promise.all([
        adTargeting.determineTargets(context),       // which ads are relevant?
        adPlacement.determinePlacement(placement),   // can they fit?
        recommendationEngine.getRecommendations({
          // Supply the same info from context so recommendationEngine
          // can do its logic
          emotion: context.emotion,
          intensity: context.intensity,
          region: context.region,
          timeOfDay: context.timeOfDay,
        }),
      ]);

      // 3. Combine targeted ads with their recommendations & filter by placement
      const ads = this.combineAds(targetedAds, recommendations, placementInfo);

      // 4. Cache the final result for 60 seconds
      await redis.set(cacheKey, JSON.stringify(ads), 60);
      metrics.timing("ad_service_duration", Date.now() - start);
      logger.info("Ad service: Targeted ads retrieved", { count: ads.length });
      return ads;

    } catch (error) {
      logger.error("Ad service error:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      metrics.increment("ad_service_errors");
      // 5. Return a fallback if everything else fails
      return this.getFallbackAds(context);
    }
  }

  /**
   * Combine the targeted ads with the recommendation data, respecting the placement constraints.
   */
  private combineAds(targetedAds: Ad[], recommendations: any[], placementInfo: any): Ad[] {
    try {
      const combined = targetedAds
        // 1. Filter out any ads that won't fit in the given placement size
        .filter((ad) => this.isAdSuitable(ad, placementInfo))
        // 2. Enrich each ad object with relevant recommendations
        .map((ad) => this.enrichAdWithRecommendations(ad, recommendations));

      // 3. Limit final count to placementInfo.maxAds
      return combined.slice(0, placementInfo.maxAds);
    } catch (error) {
      logger.error("Error combining ads:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Check if the ad's size is compatible with the provided placement size.
   */
  private isAdSuitable(ad: Ad, placementInfo: any): boolean {
    if (!ad.dimensions || !placementInfo.size) return false;
    
    return (
      ad.dimensions.width <= placementInfo.size.width &&
      ad.dimensions.height <= placementInfo.size.height
    );
  }

  /**
   * Enrich an ad with relevant recommendation data.
   */
  private enrichAdWithRecommendations(ad: Ad, recommendations: any[]): Ad {
    const relevantRecommendations = recommendations.filter(
      (rec) => rec.adId === ad.id || rec.category === ad.category
    );

    return {
      ...ad,
      relevanceScore: relevantRecommendations.length > 0 
        ? Math.max(...relevantRecommendations.map(r => r.score))
        : 0,
      recommendations: relevantRecommendations,
    };
  }

  /**
   * Return fallback ads when the main system fails.
   */
  private getFallbackAds(context: AdContext): Ad[] {
    logger.info("Serving fallback ads", { context: { region: context.region } });
    metrics.increment("fallback_ads_served");
    
    // Return a simple set of generic ads
    return [
      {
        id: "fallback-1",
        title: "Discover More",
        imageUrl: "/images/fallback/generic-1.jpg",
        dimensions: { width: 300, height: 250 },
        category: "generic",
        url: "/recommended",
      }
    ];
  }
}

// Create singleton instance
const adService = new AdService();

// Export instance methods as standalone functions
export const getTargetedAds = (context: AdContext, placement: PlacementContext): Promise<Ad[]> => {
  return adService.getTargetedAds(context, placement);
};

// Export the service instance for advanced use cases
export { adService };