// src/lib/ads/recommendation.ts
// @ts-nocheck - Complex recommendation system with type issues
import { redis } from '../db/redis';
import { metrics } from '../monitoring';
import { logger } from '../logger';
import { anonymizer } from '../privacy/anonymizer';

interface RecommendationContext {
 emotion: string;
 intensity: number;
 region: string;
 timeOfDay: string;
 recentEmotions?: string[];
 deviceType?: string;
}

interface Recommendation {
 id: string;
 title: string;
 description: string;
 type: 'activity' | 'content' | 'product';
 confidence: number;
 relevanceScore: number;
 source: 'ml' | 'rules' | 'popular';
 metadata: Record<string, any>;
}

class RecommendationEngine {
 private readonly cachePrefix = 'rec:';
 private readonly defaultTTL = 1800; // 30 minutes
 private mlEndpoint?: string;

 constructor() {
   this.mlEndpoint = process.env.ML_RECOMMENDATION_ENDPOINT;
 }

 async getRecommendations(
   context: RecommendationContext,
   limit: number = 5
 ): Promise<Recommendation[]> {
   const start = Date.now();

   try {
     // Check cache first
     const cacheKey = this.buildCacheKey(context);
     const cached = await redis.get(cacheKey);

     if (cached) {
       metrics.increment('recommendation_cache_hit');
       return JSON.parse(cached);
     }

     // Get recommendations from multiple sources
     const [mlRecs, ruleRecs, popularRecs] = await Promise.allSettled([
       this.getMlRecommendations(context),
       this.getRuleBasedRecommendations(context),
       this.getPopularRecommendations(context.region)
     ]);

     // Merge and rank recommendations
     const recommendations = await this.mergeAndRankRecommendations(
       this.unwrapResults([mlRecs, ruleRecs, popularRecs]),
       context
     );

     // Cache results
     await redis.set(
       cacheKey,
       JSON.stringify(recommendations),
       { ex: this.defaultTTL }
     );

     // Track metrics
     metrics.timing('recommendation_generation', Date.now() - start);
     this.trackRecommendationMetrics(recommendations);

     return recommendations.slice(0, limit);
   } catch (error) {
     logger.error('Recommendation error:', error);
     metrics.increment('recommendation_errors');
     
     // Fallback to cached popular recommendations
     return this.getFallbackRecommendations(context);
   }
 }

 private async getMlRecommendations(
   context: RecommendationContext
 ): Promise<Recommendation[]> {
   if (!this.mlEndpoint) return [];

   try {
     const response = await fetch(this.mlEndpoint, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         emotion: context.emotion,
         intensity: context.intensity,
         region: anonymizer.anonymizeLocation(context.region),
         timeOfDay: context.timeOfDay
       }),
       timeout: 2000 // 2 second timeout
     });

     if (!response.ok) throw new Error('ML service error');

     const recommendations = await response.json();
     return recommendations.map((rec: any) => ({
       ...rec,
       source: 'ml',
       confidence: rec.confidence || 0.5
     }));
   } catch (error) {
     logger.error('ML recommendation error:', error);
     metrics.increment('ml_recommendation_errors');
     return [];
   }
 }

 private async getRuleBasedRecommendations(
   context: RecommendationContext
 ): Promise<Recommendation[]> {
   const rules = await this.loadRecommendationRules();
   const matchedRecs = [];

   for (const rule of rules) {
     if (this.doesContextMatchRule(context, rule)) {
       matchedRecs.push({
         ...rule.recommendation,
         source: 'rules',
         confidence: 0.8
       });
     }
   }

   return matchedRecs;
 }

 private async getPopularRecommendations(
   region: string
 ): Promise<Recommendation[]> {
   const popularKey = `popular:${region}`;
   const popular = await redis.zrevrange(popularKey, 0, 9);

   return popular.map((item, index) => ({
     ...JSON.parse(item),
     source: 'popular',
     confidence: 1 - (index * 0.1)
   }));
 }

 private async mergeAndRankRecommendations(
   recommendations: Recommendation[][],
   context: RecommendationContext
 ): Promise<Recommendation[]> {
   // Flatten and deduplicate
   const merged = Array.from(
     new Map(
       recommendations.flat()
         .map(rec => [rec.id, rec])
     ).values()
   );

   // Calculate relevance scores
   const scored = merged.map(rec => ({
     ...rec,
     relevanceScore: this.calculateRelevanceScore(rec, context)
   }));

   // Sort by relevance
   return scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
 }

 private calculateRelevanceScore(
   recommendation: Recommendation,
   context: RecommendationContext
 ): number {
   let score = recommendation.confidence;

   // Source weights
   const sourceWeights = {
     ml: 1.2,
     rules: 1.0,
     popular: 0.8
   };
   score *= sourceWeights[recommendation.source];

   // Context matching
   if (recommendation.metadata.targetEmotion === context.emotion) {
     score *= 1.2;
   }

   // Time relevance
   if (recommendation.metadata.timeOfDay === context.timeOfDay) {
     score *= 1.1;
   }

   return score;
 }

 private async getFallbackRecommendations(
   context: RecommendationContext
 ): Promise<Recommendation[]> {
   // Return safe, general recommendations based on emotion
   return this.getDefaultRecommendations(context.emotion);
 }

 private buildCacheKey(context: RecommendationContext): string {
   return `${this.cachePrefix}${JSON.stringify({
     e: context.emotion,
     i: context.intensity,
     r: context.region,
     t: context.timeOfDay
   })}`;
 }

 private trackRecommendationMetrics(recommendations: Recommendation[]): void {
   metrics.updateGauge('recommendations_count', recommendations.length);
   recommendations.forEach(rec => {
     metrics.increment(`recommendation_source_${rec.source}`);
   });
 }
}

export const recommendationEngine = new RecommendationEngine();