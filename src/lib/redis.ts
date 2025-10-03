// @ts-nocheck
// src/lib/db/redis.ts
import { Redis } from "@upstash/redis";
import { metrics } from "@/lib/metrics";

class SimpleRedisClient {
  private client: Redis;

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.error("❌ Redis environment variables missing");
      throw new Error("Redis configuration missing");
    }

    this.client = new Redis({
      url,
      token,
      automaticDeserialization: false,
      retry: {
        retries: 3,
        backoff: (retryCount) => Math.min(retryCount * 500, 3000)
      }
    });

    // Record successful initialization
    metrics.updateGauge('redis.initialized', 1);
  }

  async get(key: string): Promise<string | null> {
    try {
      const result = await this.client.get(key);
      metrics.increment('redis.get.success');
      return result;
    } catch (error) {
      console.error('Redis GET error:', { key, error });
      metrics.increment('redis.get.error');
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await this.client.set(key, value, { ex: ttl });
      } else {
        await this.client.set(key, value);
      }
      metrics.increment('redis.set.success');
      return true;
    } catch (error) {
      console.error('Redis SET error:', { key, error });
      metrics.increment('redis.set.error');
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      const result = await this.client.incr(key);
      metrics.increment('redis.incr.success');
      return result;
    } catch (error) {
      console.error('Redis INCR error:', { key, error });
      metrics.increment('redis.incr.error');
      return 0;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      metrics.increment('redis.del.success');
      return true;
    } catch (error) {
      console.error('Redis DEL error:', { key, error });
      metrics.increment('redis.del.error');
      return false;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      await this.client.expire(key, seconds);
      metrics.increment('redis.expire.success');
      return true;
    } catch (error) {
      console.error('Redis EXPIRE error:', { key, error });
      metrics.increment('redis.expire.error');
      return false;
    }
  }
}

// Export a singleton instance
export const redis = new SimpleRedisClient();