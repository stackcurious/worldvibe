// @ts-nocheck
// src/lib/ads/targeting.ts
import { redis } from '../db/redis';
import { metrics } from '../monitoring';
import { logger } from '../logger';

interface TargetingCriteria {
 emotion: string;
 region: string;
 timeOfDay?: string;
 userContext?: string[];
 intensity?: number;
}

interface AdTarget {
 id: string;
 type: string;
 priority: number;
 content: AdContent;
 targeting: TargetingRules;
}

interface AdContent {
 title: string;
 description: string;
 imageUrl?: string;
 callToAction: string;
 link?: string;
}

interface TargetingRules {
 emotions: string[];
 regions: string[];
 timeRanges: string[];
 minIntensity?: number;
 maxIntensity?: number;
 contexts?: string[];
}

class AdTargeting {
 private readonly cachePrefix = 'ad-targeting:';
 private readonly cacheDuration = 300; // 5 minutes

 async determineTargets(criteria: TargetingCriteria): Promise<AdTarget[]> {
   const start = Date.now();
   
   try {
     // Check cache
     const cacheKey = this.generateCacheKey(criteria);
     const cached = await redis.get(cacheKey);
     
     if (cached) {
       metrics.increment('ad_targeting_cache_hit');
       return JSON.parse(cached);
     }

     // Score and select ads
     const eligibleAds = await this.findEligibleAds(criteria);
     const scoredAds = this.scoreAds(eligibleAds, criteria);
     const selectedAds = this.selectTopAds(scoredAds);

     // Cache results
     await redis.set(
       cacheKey,
       JSON.stringify(selectedAds),
       { ex: this.cacheDuration }
     );

     metrics.timing('ad_targeting_duration', Date.now() - start);
     return selectedAds;
   } catch (error) {
     logger.error('Ad targeting error:', error);
     metrics.increment('ad_targeting_errors');
     throw error;
   }
 }

 private async findEligibleAds(criteria: TargetingCriteria): Promise<AdTarget[]> {
   // Complex targeting logic here
   const timeOfDay = criteria.timeOfDay || this.getCurrentTimeOfDay();
   
   return await redis.zrangebyscore(
     'ads:active',
     Date.now(),
     '+inf'
   ).then(ads => 
     ads.filter(ad => this.isAdEligible(ad, criteria, timeOfDay))
   );
 }

 private scoreAds(ads: AdTarget[], criteria: TargetingCriteria): Array<AdTarget & { score: number }> {
   return ads.map(ad => ({
     ...ad,
     score: this.calculateAdScore(ad, criteria)
   }));
 }

 private calculateAdScore(ad: AdTarget, criteria: TargetingCriteria): number {
   let score = 0;

   // Base score from ad priority
   score += ad.priority * 10;

   // Emotion match
   if (ad.targeting.emotions.includes(criteria.emotion)) {
     score += 20;
   }

   // Region match
   if (ad.targeting.regions.includes(criteria.region)) {
     score += 15;
   }

   // Intensity match
   if (criteria.intensity && 
       ad.targeting.minIntensity && 
       ad.targeting.maxIntensity &&
       criteria.intensity >= ad.targeting.minIntensity &&
       criteria.intensity <= ad.targeting.maxIntensity) {
     score += 10;
   }

   // Context match
   if (criteria.userContext && ad.targeting.contexts) {
     const contextMatches = criteria.userContext.filter(ctx => 
       ad.targeting.contexts!.includes(ctx)
     ).length;
     score += contextMatches * 5;
   }

   return score;
 }

 private selectTopAds(scoredAds: Array<AdTarget & { score: number }>): AdTarget[] {
   return scoredAds
     .sort((a, b) => b.score - a.score)
     .slice(0, 3);
 }

 private generateCacheKey(criteria: TargetingCriteria): string {
   return `${this.cachePrefix}${JSON.stringify(criteria)}`;
 }

 private getCurrentTimeOfDay(): string {
   const hour = new Date().getHours();
   if (hour >= 5 && hour < 12) return 'morning';
   if (hour >= 12 && hour < 17) return 'afternoon';
   if (hour >= 17 && hour < 22) return 'evening';
   return 'night';
 }

 private isAdEligible(ad: AdTarget, criteria: TargetingCriteria, timeOfDay: string): boolean {
   return (
     ad.targeting.emotions.includes(criteria.emotion) &&
     ad.targeting.regions.includes(criteria.region) &&
     ad.targeting.timeRanges.includes(timeOfDay) &&
     (!criteria.intensity ||
       !ad.targeting.minIntensity ||
       !ad.targeting.maxIntensity ||
       (criteria.intensity >= ad.targeting.minIntensity &&
        criteria.intensity <= ad.targeting.maxIntensity))
   );
 }
}

export const adTargeting = new AdTargeting();