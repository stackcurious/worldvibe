// src/services/trending-notes-service.ts
import { redis } from '@/lib/db/redis';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

// Stop words to filter out common words
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
  'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
  'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
  'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
  'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
  'most', 'us', 'is', 'am', 'are', 'was', 'were', 'been', 'being', 'has', 'had',
  'does', 'did', 'doing', 'very', 'really', 'too', 'much', 'many', 'more', 'less',
  'feel', 'feeling', 'felt', 'im', 'ive', 'dont', 'cant', 'wont', 'wasnt', 'werent'
]);

// Redis key patterns
const TRENDING_PREFIX = 'trending:';
const GLOBAL_KEYWORDS = `${TRENDING_PREFIX}global:keywords`;
const EMOTION_KEYWORDS = (emotion: string) => `${TRENDING_PREFIX}emotion:${emotion}:keywords`;
const REGION_KEYWORDS = (region: string) => `${TRENDING_PREFIX}region:${region}:keywords`;
const HOURLY_KEYWORDS = (hour: string) => `${TRENDING_PREFIX}hourly:${hour}:keywords`;

// TTL for trending data
const TRENDING_TTL = 60 * 60 * 24; // 24 hours
const HOURLY_TTL = 60 * 60 * 6; // 6 hours

interface TrendingKeyword {
  keyword: string;
  score: number;
  count: number;
}

interface ProcessNoteParams {
  note: string;
  emotion: string;
  regionHash?: string;
  timestamp: Date;
}

export class TrendingNotesService {
  /**
   * Extract keywords from a note text
   */
  private extractKeywords(text: string): string[] {
    // Convert to lowercase and remove punctuation
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');

    // Split into words
    const words = cleanText.split(/\s+/).filter(word => {
      // Filter out stop words and short words
      return word.length >= 3 && !STOP_WORDS.has(word);
    });

    return words;
  }

  /**
   * Extract n-gram phrases (2-3 word combinations)
   */
  private extractPhrases(text: string): string[] {
    const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/);
    const phrases: string[] = [];

    // 2-word phrases
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (!STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i + 1])) {
        phrases.push(phrase);
      }
    }

    // 3-word phrases
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (!STOP_WORDS.has(words[i]) && words[i].length >= 3) {
        phrases.push(phrase);
      }
    }

    return phrases;
  }

  /**
   * Calculate recency-weighted score
   * More recent notes get higher scores
   */
  private calculateScore(timestamp: Date): number {
    const now = Date.now();
    const noteTime = timestamp.getTime();
    const ageInHours = (now - noteTime) / (1000 * 60 * 60);

    // Exponential decay: score decreases as note gets older
    // Recent notes (< 1 hour) get score close to 1
    // 12 hour old notes get score ~0.25
    // 24 hour old notes get score ~0.06
    return Math.exp(-ageInHours / 6);
  }

  /**
   * Add keywords to Redis sorted set with score
   */
  private async addToTrending(
    key: string,
    keywords: string[],
    score: number,
    ttl: number
  ): Promise<void> {
    try {
      const pipeline = [];

      // Add each keyword with its score
      for (const keyword of keywords) {
        pipeline.push(['zincrby', key, score, keyword]);
      }

      // Set TTL
      pipeline.push(['expire', key, ttl]);

      // Execute pipeline (using individual commands since we don't have pipeline method)
      for (const keyword of keywords) {
        await redis.zincrby(key, score, keyword);
      }
      await redis.expire(key, ttl);

    } catch (error) {
      logger.error('Error adding to trending', { key, error });
      // Don't throw - trending is non-critical
    }
  }

  /**
   * Process a note and update trending data
   * This should be called asynchronously after check-in creation
   */
  async processNote(params: ProcessNoteParams): Promise<void> {
    const startTime = performance.now();

    try {
      if (!params.note || params.note.trim().length < 5) {
        return; // Skip very short notes
      }

      const keywords = this.extractKeywords(params.note);
      if (keywords.length === 0) {
        return; // No valid keywords
      }

      const score = this.calculateScore(params.timestamp);
      const hour = params.timestamp.toISOString().slice(0, 13); // YYYY-MM-DDTHH

      // Add to global trending
      await this.addToTrending(GLOBAL_KEYWORDS, keywords, score, TRENDING_TTL);

      // Add to emotion-specific trending
      await this.addToTrending(
        EMOTION_KEYWORDS(params.emotion),
        keywords,
        score,
        TRENDING_TTL
      );

      // Add to region-specific trending (if region available)
      if (params.regionHash) {
        await this.addToTrending(
          REGION_KEYWORDS(params.regionHash),
          keywords,
          score,
          TRENDING_TTL
        );
      }

      // Add to hourly trending
      await this.addToTrending(
        HOURLY_KEYWORDS(hour),
        keywords,
        score,
        HOURLY_TTL
      );

      metrics.increment('trending.notes_processed');
      metrics.timing('trending.process_duration', performance.now() - startTime);

    } catch (error) {
      logger.error('Error processing note for trending', {
        error: error instanceof Error ? error.message : String(error),
        emotion: params.emotion,
      });
      metrics.increment('trending.process_error');
      // Don't throw - this is a background task
    }
  }

  /**
   * Get global trending keywords
   */
  async getGlobalTrending(limit: number = 20): Promise<TrendingKeyword[]> {
    try {
      const results = await redis.zrevrangebyscore(
        GLOBAL_KEYWORDS,
        '+inf',
        '-inf',
        { limit: { offset: 0, count: limit }, withScores: true }
      );

      return this.formatTrendingResults(results);
    } catch (error) {
      logger.error('Error getting global trending', { error });
      return [];
    }
  }

  /**
   * Get emotion-specific trending keywords
   */
  async getEmotionTrending(emotion: string, limit: number = 20): Promise<TrendingKeyword[]> {
    try {
      const results = await redis.zrevrangebyscore(
        EMOTION_KEYWORDS(emotion),
        '+inf',
        '-inf',
        { limit: { offset: 0, count: limit }, withScores: true }
      );

      return this.formatTrendingResults(results);
    } catch (error) {
      logger.error('Error getting emotion trending', { emotion, error });
      return [];
    }
  }

  /**
   * Get region-specific trending keywords
   */
  async getRegionTrending(region: string, limit: number = 20): Promise<TrendingKeyword[]> {
    try {
      const results = await redis.zrevrangebyscore(
        REGION_KEYWORDS(region),
        '+inf',
        '-inf',
        { limit: { offset: 0, count: limit }, withScores: true }
      );

      return this.formatTrendingResults(results);
    } catch (error) {
      logger.error('Error getting region trending', { region, error });
      return [];
    }
  }

  /**
   * Get hourly trending for a specific hour
   */
  async getHourlyTrending(hour: string, limit: number = 20): Promise<TrendingKeyword[]> {
    try {
      const results = await redis.zrevrangebyscore(
        HOURLY_KEYWORDS(hour),
        '+inf',
        '-inf',
        { limit: { offset: 0, count: limit }, withScores: true }
      );

      return this.formatTrendingResults(results);
    } catch (error) {
      logger.error('Error getting hourly trending', { hour, error });
      return [];
    }
  }

  /**
   * Format Redis sorted set results into TrendingKeyword objects
   */
  private formatTrendingResults(results: Array<{ value: string; score: number }>): TrendingKeyword[] {
    return results.map(item => ({
      keyword: item.value,
      score: item.score,
      count: Math.round(item.score * 100), // Approximate count from score
    }));
  }

  /**
   * Clean up old trending data
   * This can be run periodically
   */
  async cleanup(): Promise<void> {
    try {
      const pattern = `${TRENDING_PREFIX}*`;
      const keys = await redis.keys(pattern);

      for (const key of keys) {
        const ttl = await redis.ttl(key);
        if (ttl === -1) {
          // Key has no expiry, set one
          await redis.expire(key, TRENDING_TTL);
        }
      }

      logger.info('Trending data cleanup completed', { keysProcessed: keys.length });
    } catch (error) {
      logger.error('Error during trending cleanup', { error });
    }
  }
}

// Export singleton instance
export const trendingNotesService = new TrendingNotesService();
