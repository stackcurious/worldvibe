// src/lib/ads/placement.ts
import { redis } from '../db/redis';
import { metrics } from '../monitoring';
import { logger } from '../logger';

interface PlacementOptions {
 regionHash: string;
 emotion: string;
 deviceType: 'mobile' | 'desktop' | 'tablet';
 viewport: { width: number; height: number };
 currentRoute: string;
}

interface PlacementResult {
 location: 'feed' | 'sidebar' | 'modal' | 'banner';
 size: { width: number; height: number };
 maxAds: number;
 style: Record<string, string>;
 priority: number;
}

class AdPlacement {
 private readonly placementCache = new Map<string, PlacementResult>();
 private readonly cacheDuration = 60000; // 1 minute

 async determinePlacement(options: PlacementOptions): Promise<PlacementResult> {
   const start = Date.now();
   
   try {
     // Check memory cache
     const cacheKey = this.generateCacheKey(options);
     const cachedPlacement = this.placementCache.get(cacheKey);
     
     if (cachedPlacement && Date.now() - start < this.cacheDuration) {
       metrics.increment('placement_cache_hit');
       return cachedPlacement;
     }

     // Get regional performance data
     const regionPerformance = await this.getRegionPerformance(options.regionHash);
     
     // Calculate optimal placement
     const placement = this.calculatePlacement(options, regionPerformance);
     
     // Update cache
     this.placementCache.set(cacheKey, placement);
     
     metrics.timing('placement_calculation', Date.now() - start);
     return placement;
   } catch (error) {
     logger.error('Placement determination error:', error);
     metrics.increment('placement_errors');
     
     // Return safe default placement
     return this.getDefaultPlacement(options.deviceType);
   }
 }

 private async getRegionPerformance(regionHash: string): Promise<any> {
   const key = `ad:performance:${regionHash}`;
   
   try {
     const performance = await redis.get(key);
     return performance ? JSON.parse(performance) : null;
   } catch (error) {
     logger.error('Region performance fetch error:', error);
     return null;
   }
 }

 private calculatePlacement(
   options: PlacementOptions,
   performance: any
 ): PlacementResult {
   // Start with device-specific base placement
   let placement = this.getDefaultPlacement(options.deviceType);

   // Adjust based on viewport
   if (options.viewport.width < 768) {
     placement.location = 'feed';
     placement.size = { width: options.viewport.width - 32, height: 250 };
   }

   // Adjust based on route
   if (options.currentRoute.includes('/dashboard')) {
     placement.location = 'sidebar';
     placement.maxAds = 2;
   }

   // Adjust based on emotion
   if (options.emotion === 'Stress' || options.emotion === 'Sadness') {
     placement.maxAds = Math.min(placement.maxAds, 1);
     placement.style = {
       ...placement.style,
       opacity: '0.8',
       transition: 'all 0.3s ease'
     };
   }

   // Adjust based on performance data
   if (performance) {
     placement.priority = this.calculatePriorityFromPerformance(performance);
   }

   return placement;
 }

 private getDefaultPlacement(deviceType: string): PlacementResult {
   switch (deviceType) {
     case 'mobile':
       return {
         location: 'feed',
         size: { width: 300, height: 250 },
         maxAds: 2,
         style: { margin: '16px 0' },
         priority: 1
       };
     case 'tablet':
       return {
         location: 'sidebar',
         size: { width: 300, height: 600 },
         maxAds: 3,
         style: { margin: '24px 0' },
         priority: 2
       };
     default:
       return {
         location: 'sidebar',
         size: { width: 300, height: 600 },
         maxAds: 4,
         style: { margin: '32px 0' },
         priority: 3
       };
   }
 }

 private calculatePriorityFromPerformance(performance: any): number {
   const { clickRate, viewTime, conversions } = performance;
   
   let priority = 1;
   
   if (clickRate > 2) priority += 1;
   if (viewTime > 30) priority += 1;
   if (conversions > 0) priority += 2;
   
   return Math.min(priority, 5);
 }

 private generateCacheKey(options: PlacementOptions): string {
   return `${options.regionHash}:${options.emotion}:${options.deviceType}:${options.currentRoute}`;
 }

 clearCache(): void {
   this.placementCache.clear();
   metrics.increment('placement_cache_clear');
 }
}

export const adPlacement = new AdPlacement();