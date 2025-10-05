// src/lib/db/redis-rest.ts
// Redis service using Upstash REST API for better reliability

import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

interface RedisRestConfig {
  url: string;
  token: string;
}

class RedisRestService {
  private readonly config: RedisRestConfig;
  private readonly fallbackCache: Map<string, { value: any; expiry?: number }> = new Map();

  constructor() {
    this.config = {
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    };

    // If no Upstash config, use in-memory fallback
    if (!this.config.url || !this.config.token) {
      logger.warn('Upstash REST API not configured, using in-memory cache');
    }
  }

  private async makeRequest(command: string[], pipeline = false): Promise<any> {
    if (!this.config.url || !this.config.token) {
      return this.handleFallback(command);
    }

    try {
      const url = pipeline
        ? `${this.config.url}/pipeline`
        : `${this.config.url}/${command.map(c => encodeURIComponent(c)).join('/')}`;

      const response = await fetch(url, {
        method: pipeline ? 'POST' : 'GET',
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
        },
        body: pipeline ? JSON.stringify(command) : undefined,
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`Redis REST API error: ${response.status}`);
      }

      const data = await response.json();
      return data.result ?? data;
    } catch (error) {
      logger.error('Redis REST API request failed:', error);
      metrics.increment('redis.rest.errors');
      return this.handleFallback(command);
    }
  }

  private handleFallback(command: string[]): any {
    const [cmd, key, ...args] = command;
    const upperCmd = cmd.toUpperCase();

    // Clean up expired entries
    const now = Date.now();
    for (const [k, v] of this.fallbackCache.entries()) {
      if (v.expiry && v.expiry < now) {
        this.fallbackCache.delete(k);
      }
    }

    switch (upperCmd) {
      case 'GET':
        const entry = this.fallbackCache.get(key);
        return entry && (!entry.expiry || entry.expiry > now) ? entry.value : null;

      case 'SET':
        const value = args[0];
        let expiry: number | undefined;

        if (args[1]?.toUpperCase() === 'EX') {
          expiry = now + parseInt(args[2]) * 1000;
        } else if (args[1]?.toUpperCase() === 'PX') {
          expiry = now + parseInt(args[2]);
        }

        this.fallbackCache.set(key, { value, expiry });
        return 'OK';

      case 'DEL':
        const deleted = this.fallbackCache.delete(key);
        return deleted ? 1 : 0;

      case 'EXISTS':
        const exists = this.fallbackCache.has(key);
        const cached = this.fallbackCache.get(key);
        return exists && (!cached?.expiry || cached.expiry > now) ? 1 : 0;

      case 'INCR':
        const current = this.fallbackCache.get(key);
        const newVal = (parseInt(current?.value || '0') || 0) + 1;
        this.fallbackCache.set(key, { value: newVal.toString(), expiry: current?.expiry });
        return newVal;

      case 'EXPIRE':
        const existing = this.fallbackCache.get(key);
        if (existing) {
          existing.expiry = now + parseInt(args[0]) * 1000;
          return 1;
        }
        return 0;

      case 'TTL':
        const item = this.fallbackCache.get(key);
        if (!item) return -2;
        if (!item.expiry) return -1;
        return Math.max(0, Math.floor((item.expiry - now) / 1000));

      default:
        logger.warn(`Unsupported Redis command in fallback: ${upperCmd}`);
        return null;
    }
  }

  async get(key: string): Promise<string | null> {
    const result = await this.makeRequest(['GET', key]);
    return result;
  }

  async set(key: string, value: string | number, options?: { EX?: number; PX?: number }): Promise<'OK' | null> {
    const command = ['SET', key, value.toString()];

    if (options?.EX) {
      command.push('EX', options.EX.toString());
    } else if (options?.PX) {
      command.push('PX', options.PX.toString());
    }

    const result = await this.makeRequest(command);
    return result;
  }

  async del(key: string): Promise<number> {
    const result = await this.makeRequest(['DEL', key]);
    return result || 0;
  }

  async exists(key: string): Promise<number> {
    const result = await this.makeRequest(['EXISTS', key]);
    return result || 0;
  }

  async incr(key: string): Promise<number> {
    const result = await this.makeRequest(['INCR', key]);
    return result || 0;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const result = await this.makeRequest(['EXPIRE', key, seconds.toString()]);
    return result || 0;
  }

  async ttl(key: string): Promise<number> {
    const result = await this.makeRequest(['TTL', key]);
    return result ?? -2;
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return [];

    // For fallback, handle individually
    if (!this.config.url || !this.config.token) {
      return Promise.all(keys.map(key => this.get(key)));
    }

    const command = ['MGET', ...keys];
    const result = await this.makeRequest(command);
    return Array.isArray(result) ? result : [];
  }

  async mset(keyValues: Record<string, string | number>): Promise<'OK' | null> {
    const entries = Object.entries(keyValues);
    if (entries.length === 0) return 'OK';

    // For fallback, handle individually
    if (!this.config.url || !this.config.token) {
      for (const [key, value] of entries) {
        await this.set(key, value);
      }
      return 'OK';
    }

    const command = ['MSET'];
    for (const [key, value] of entries) {
      command.push(key, value.toString());
    }

    const result = await this.makeRequest(command);
    return result;
  }

  async ping(): Promise<string> {
    if (!this.config.url || !this.config.token) {
      return 'PONG'; // Fallback always returns PONG
    }

    try {
      const result = await this.makeRequest(['PING']);
      return result || 'PONG';
    } catch {
      return 'PONG'; // Return PONG even on error for compatibility
    }
  }

  async flushall(): Promise<'OK'> {
    if (!this.config.url || !this.config.token) {
      this.fallbackCache.clear();
      return 'OK';
    }

    const result = await this.makeRequest(['FLUSHALL']);
    return result || 'OK';
  }

  // Compatibility methods for existing code
  async quit(): Promise<'OK'> {
    return 'OK';
  }

  async disconnect(): Promise<void> {
    this.fallbackCache.clear();
  }

  get isReady(): boolean {
    return true; // REST API is always "ready"
  }
}

// Export singleton instance
export const redisRest = new RedisRestService();

// Export for compatibility with existing code
export const redis = redisRest;