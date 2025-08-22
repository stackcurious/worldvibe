// src/services/analytics-service.ts
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";
import { redis } from "@/lib/db/redis";
import { CircuitBreaker } from "@/lib/circuit-breaker";

// Constants
const EMOTION_COUNT_PREFIX = 'analytics:emotion:count:';
const REGION_EMOTION_PREFIX = 'analytics:region:emotion:';
const INTENSITY_AVG_PREFIX = 'analytics:intensity:avg:';
const ANALYTICS_EXPIRY = 60 * 60 * 24 * 30; // 30 days
const REALTIME_EXPIRY = 60 * 60; // 1 hour

// Initialize metrics
metrics.registerCounter('analytics_processed', 'Check-ins processed for analytics');
metrics.registerCounter('analytics_errors', 'Errors in analytics processing');
metrics.registerHistogram('analytics_processing_time', 'Time to process check-in analytics');

// Types
interface CheckInData {
  id: string;
  emotion: string;
  intensity: number;
  regionHash: string;
  timestamp: Date;
}

interface EmotionSummary {
  emotion: string;
  count: number;
  percentage: number;
}

interface RegionSummary {
  regionHash: string;
  dominantEmotion: string;
  emotionCount: number;
  totalCount: number;
  percentage: number;
}

interface GlobalStats {
  totalCheckIns: number;
  emotionDistribution: Record<string, number>;
  avgIntensity: number;
  activeRegions: number;
  mostActiveRegion: string;
}

// Circuit breaker for Redis operations
const redisBreaker = new CircuitBreaker({
  service: 'redis-analytics',
  failureThreshold: 3,
  resetTimeout: 30000,
  maxRetries: 2,
});

/**
 * Service that handles analytics processing
 */
export class AnalyticsService {
  /**
   * Process a check-in for analytics
   */
  async processCheckIn(checkIn: CheckInData): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Process in parallel for better performance
      await Promise.all([
        this.updateGlobalCounts(checkIn),
        this.updateRegionalStats(checkIn),
        this.updateRealtimeStats(checkIn),
      ]);
      
      metrics.increment('analytics_processed');
      metrics.timing('analytics_processing_time', performance.now() - startTime);
    } catch (error) {
      metrics.increment('analytics_errors');
      logger.warn('Error processing analytics for check-in', {
        error: String(error),
        checkInId: checkIn.id
      });
      throw error;
    }
  }
  
  /**
   * Update global counters for emotions and intensities
   */
  private async updateGlobalCounts(checkIn: CheckInData): Promise<void> {
    try {
      await redisBreaker.execute(async () => {
        const { emotion, intensity } = checkIn;
        const date = new Date(checkIn.timestamp);
        
        // Format keys for different time granularities
        const dayKey = this.formatDateKey(date, 'day');
        const weekKey = this.formatDateKey(date, 'week');
        const monthKey = this.formatDateKey(date, 'month');
        
        // Use Redis multi to ensure atomicity
        const multi = redis.multi();
        
        // Increment emotion counts for each time granularity
        multi.hincrby(`${EMOTION_COUNT_PREFIX}${dayKey}`, emotion, 1);
        multi.hincrby(`${EMOTION_COUNT_PREFIX}${weekKey}`, emotion, 1);
        multi.hincrby(`${EMOTION_COUNT_PREFIX}${monthKey}`, emotion, 1);
        multi.hincrby(`${EMOTION_COUNT_PREFIX}all`, emotion, 1);
        
        // Update intensity averages
        // We store both sum and count to calculate true average
        multi.hincrby(`${INTENSITY_AVG_PREFIX}${dayKey}`, `${emotion}:sum`, intensity);
        multi.hincrby(`${INTENSITY_AVG_PREFIX}${dayKey}`, `${emotion}:count`, 1);
        
        multi.hincrby(`${INTENSITY_AVG_PREFIX}${weekKey}`, `${emotion}:sum`, intensity);
        multi.hincrby(`${INTENSITY_AVG_PREFIX}${weekKey}`, `${emotion}:count`, 1);
        
        multi.hincrby(`${INTENSITY_AVG_PREFIX}${monthKey}`, `${emotion}:sum`, intensity);
        multi.hincrby(`${INTENSITY_AVG_PREFIX}${monthKey}`, `${emotion}:count`, 1);
        
        multi.hincrby(`${INTENSITY_AVG_PREFIX}all`, `${emotion}:sum`, intensity);
        multi.hincrby(`${INTENSITY_AVG_PREFIX}all`, `${emotion}:count`, 1);
        
        // Set expiry on keys (except 'all')
        multi.expire(`${EMOTION_COUNT_PREFIX}${dayKey}`, ANALYTICS_EXPIRY);
        multi.expire(`${EMOTION_COUNT_PREFIX}${weekKey}`, ANALYTICS_EXPIRY);
        multi.expire(`${EMOTION_COUNT_PREFIX}${monthKey}`, ANALYTICS_EXPIRY);
        
        multi.expire(`${INTENSITY_AVG_PREFIX}${dayKey}`, ANALYTICS_EXPIRY);
        multi.expire(`${INTENSITY_AVG_PREFIX}${weekKey}`, ANALYTICS_EXPIRY);
        multi.expire(`${INTENSITY_AVG_PREFIX}${monthKey}`, ANALYTICS_EXPIRY);
        
        // Execute commands
        await multi.exec();
      });
    } catch (error) {
      logger.warn('Failed to update global counts', { error: String(error) });
      // Non-blocking error - allow processing to continue
    }
  }
  
  /**
   * Update region-specific stats
   */
  private async updateRegionalStats(checkIn: CheckInData): Promise<void> {
    try {
      await redisBreaker.execute(async () => {
        const { emotion, regionHash } = checkIn;
        const date = new Date(checkIn.timestamp);
        
        // Format keys for different time granularities
        const dayKey = this.formatDateKey(date, 'day');
        const weekKey = this.formatDateKey(date, 'week');
        const monthKey = this.formatDateKey(date, 'month');
        
        // Update region-emotion count for each time period
        const multi = redis.multi();
        
        // Increment region-emotion counts
        multi.hincrby(`${REGION_EMOTION_PREFIX}${regionHash}:${dayKey}`, emotion, 1);
        multi.hincrby(`${REGION_EMOTION_PREFIX}${regionHash}:${weekKey}`, emotion, 1);
        multi.hincrby(`${REGION_EMOTION_PREFIX}${regionHash}:${monthKey}`, emotion, 1);
        multi.hincrby(`${REGION_EMOTION_PREFIX}${regionHash}:all`, emotion, 1);
        
        // Set expiry on keys (except 'all')
        multi.expire(`${REGION_EMOTION_PREFIX}${regionHash}:${dayKey}`, ANALYTICS_EXPIRY);
        multi.expire(`${REGION_EMOTION_PREFIX}${regionHash}:${weekKey}`, ANALYTICS_EXPIRY);
        multi.expire(`${REGION_EMOTION_PREFIX}${regionHash}:${monthKey}`, ANALYTICS_EXPIRY);
        
        // Execute commands
        await multi.exec();
      });
    } catch (error) {
      logger.warn('Failed to update regional stats', { error: String(error) });
      // Non-blocking error - allow processing to continue
    }
  }
  
  /**
   * Update real-time stats for current hour/minute
   */
  private async updateRealtimeStats(checkIn: CheckInData): Promise<void> {
    try {
      await redisBreaker.execute(async () => {
        const { emotion, regionHash, intensity } = checkIn;
        const date = new Date(checkIn.timestamp);
        
        // Format keys for real-time stats
        const hourKey = this.formatTimeKey(date, 'hour');
        const minuteKey = this.formatTimeKey(date, 'minute');
        
        // Update real-time counts
        const realTimeKey = `realtime:${hourKey}`;
        const regionalRealTimeKey = `realtime:region:${regionHash}:${hourKey}`;
        
        const multi = redis.multi();
        
        // Global real-time stats
        multi.hincrby(realTimeKey, `emotion:${emotion}`, 1);
        multi.hincrby(realTimeKey, 'total', 1);
        multi.hset(realTimeKey, `last_update`, Date.now().toString());
        
        // Regional real-time stats
        multi.hincrby(regionalRealTimeKey, `emotion:${emotion}`, 1);
        multi.hincrby(regionalRealTimeKey, 'total', 1);
        
        // Set shorter expiry for real-time data
        multi.expire(realTimeKey, REALTIME_EXPIRY);
        multi.expire(regionalRealTimeKey, REALTIME_EXPIRY);
        
        // Execute commands
        await multi.exec();
      });
    } catch (error) {
      logger.warn('Failed to update real-time stats', { error: String(error) });
      // Non-blocking error - allow processing to continue
    }
  }
  
  /**
   * Get global emotion summary for a time period
   */
  async getGlobalEmotionSummary(
    period: 'day' | 'week' | 'month' | 'all' = 'day', 
    date: Date = new Date()
  ): Promise<EmotionSummary[]> {
    try {
      return await redisBreaker.execute(async () => {
        // Get the key based on period
        const key = period === 'all' 
          ? `${EMOTION_COUNT_PREFIX}all`
          : `${EMOTION_COUNT_PREFIX}${this.formatDateKey(date, period)}`;
        
        // Get emotion counts
        const emotionCounts = await redis.hgetall(key);
        
        if (!emotionCounts || Object.keys(emotionCounts).length === 0) {
          return [];
        }
        
        // Calculate total
        const total = Object.values(emotionCounts)
          .reduce((sum, count) => sum + parseInt(count, 10), 0);
        
        // Format results
        return Object.entries(emotionCounts)
          .map(([emotion, count]) => ({
            emotion,
            count: parseInt(count, 10),
            percentage: Math.round((parseInt(count, 10) / total) * 100)
          }))
          .sort((a, b) => b.count - a.count);
      });
    } catch (error) {
      logger.warn('Failed to get global emotion summary', { 
        error: String(error),
        period
      });
      return [];
    }
  }
  
  /**
   * Get regional emotion summary for a time period
   */
  async getRegionalEmotionSummary(
    regionHash: string,
    period: 'day' | 'week' | 'month' | 'all' = 'day',
    date: Date = new Date()
  ): Promise<EmotionSummary[]> {
    try {
      return await redisBreaker.execute(async () => {
        // Get the key based on period
        const key = period === 'all'
          ? `${REGION_EMOTION_PREFIX}${regionHash}:all`
          : `${REGION_EMOTION_PREFIX}${regionHash}:${this.formatDateKey(date, period)}`;
        
        // Get emotion counts
        const emotionCounts = await redis.hgetall(key);
        
        if (!emotionCounts || Object.keys(emotionCounts).length === 0) {
          return [];
        }
        
        // Calculate total
        const total = Object.values(emotionCounts)
          .reduce((sum, count) => sum + parseInt(count, 10), 0);
        
        // Format results
        return Object.entries(emotionCounts)
          .map(([emotion, count]) => ({
            emotion,
            count: parseInt(count, 10),
            percentage: Math.round((parseInt(count, 10) / total) * 100)
          }))
          .sort((a, b) => b.count - a.count);
      });
    } catch (error) {
      logger.warn('Failed to get regional emotion summary', {
        error: String(error),
        regionHash,
        period
      });
      return [];
    }
  }
  
  /**
   * Get real-time stats for the current hour
   */
  async getRealtimeStats(): Promise<any> {
    try {
      return await redisBreaker.execute(async () => {
        const now = new Date();
        const hourKey = this.formatTimeKey(now, 'hour');
        const realTimeKey = `realtime:${hourKey}`;
        
        const stats = await redis.hgetall(realTimeKey);
        
        if (!stats || Object.keys(stats).length === 0) {
          return {
            total: 0,
            emotions: {},
            lastUpdate: null
          };
        }
        
        // Extract emotion counts
        const emotions: Record<string, number> = {};
        let total = 0;
        
        Object.entries(stats).forEach(([key, value]) => {
          if (key.startsWith('emotion:')) {
            const emotion = key.replace('emotion:', '');
            emotions[emotion] = parseInt(value, 10);
          } else if (key === 'total') {
            total = parseInt(value, 10);
          }
        });
        
        return {
          total,
          emotions,
          lastUpdate: stats.last_update ? parseInt(stats.last_update, 10) : null
        };
      });
    } catch (error) {
      logger.warn('Failed to get real-time stats', { error: String(error) });
      return {
        total: 0,
        emotions: {},
        lastUpdate: null
      };
    }
  }
  
  /**
   * Format date key for analytics storage (YYYY-MM-DD, YYYY-WW, YYYY-MM)
   */
  private formatDateKey(date: Date, granularity: 'day' | 'week' | 'month'): string {
    const year = date.getFullYear();
    
    if (granularity === 'day') {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    if (granularity === 'week') {
      // ISO week number (1-53)
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const daysSinceFirstDay = Math.floor(
        (date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000)
      );
      const weekNumber = Math.ceil((daysSinceFirstDay + 
                                 firstDayOfYear.getDay() + 1) / 7);
      
      return `${year}-W${String(weekNumber).padStart(2, '0')}`;
    }
    
    if (granularity === 'month') {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    }
    
    return `${year}`;
  }
  
  /**
   * Format time key for real-time analytics (YYYY-MM-DD-HH, YYYY-MM-DD-HH-MM)
   */
  private formatTimeKey(date: Date, granularity: 'hour' | 'minute'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    
    if (granularity === 'hour') {
      return `${year}-${month}-${day}-${hour}`;
    }
    
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}-${hour}-${minute}`;
  }
}