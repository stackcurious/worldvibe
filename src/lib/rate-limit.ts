// @ts-nocheck
// src/lib/rate-limit.ts

import type { NextRequest } from "next/server";
import { redis } from "@/lib/db/redis";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";

interface RateLimitConfig {
  requestLimit: number;
  windowSeconds: number;
  blockDuration: number;
  whitelistedIPs: Set<string>;
}

class RateLimiter {
  private readonly config: RateLimitConfig;
  private readonly keyPrefix = 'rate-limit:';
  private readonly blockListPrefix = 'rate-limit:blocked:';

  constructor() {
    this.config = {
      requestLimit: Number(process.env.RATE_LIMIT_REQUESTS) || 10,
      windowSeconds: Number(process.env.RATE_LIMIT_WINDOW) || 60,
      blockDuration: Number(process.env.RATE_LIMIT_BLOCK_DURATION) || 3600,
      whitelistedIPs: new Set(
        (process.env.RATE_LIMIT_WHITELIST || '').split(',').filter(Boolean)
      ),
    };
  }

  private getClientIP(req: NextRequest): string {
    return (
      req.headers.get("x-forwarded-for")?.split(',')[0] ||
      req.headers.get("x-real-ip") ||
      '127.0.0.1'
    );
  }

  private async isBlocked(ip: string): Promise<boolean> {
    try {
      const blocked = await redis.get(`${this.blockListPrefix}${ip}`);
      return !!blocked;
    } catch (error) {
      logger.error('Error checking blocked status:', error);
      return false;
    }
  }

  private async blockIP(ip: string): Promise<void> {
    try {
      await redis.set(
        `${this.blockListPrefix}${ip}`,
        Date.now(),
        { ex: this.config.blockDuration }
      );
      metrics.increment('rate_limit.ip_blocked');
      logger.warn('IP blocked due to rate limit violation', { ip });
    } catch (error) {
      logger.error('Error blocking IP:', error);
    }
  }

  async isRateLimited(req: NextRequest): Promise<{
    limited: boolean;
    remaining: number;
    reset: number;
  }> {
    const start = Date.now();
    const ip = this.getClientIP(req);

    try {
      // Check whitelist
      if (this.config.whitelistedIPs.has(ip)) {
        metrics.increment('rate_limit.whitelist_allowed');
        return { limited: false, remaining: this.config.requestLimit, reset: 0 };
      }

      // Check if IP is blocked
      if (await this.isBlocked(ip)) {
        metrics.increment('rate_limit.blocked_rejected');
        return { limited: true, remaining: 0, reset: this.config.blockDuration };
      }

      const key = `${this.keyPrefix}${ip}`;

      // Atomic increment and expire
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, this.config.windowSeconds);
      }

      // Get TTL for reset time
      const ttl = await redis.ttl(key);

      const limited = count > this.config.requestLimit;
      if (limited) {
        metrics.increment('rate_limit.exceeded');
        // Block IP if significantly over limit
        if (count > this.config.requestLimit * 2) {
          await this.blockIP(ip);
        }
      }

      const duration = Date.now() - start;
      metrics.timing('rate_limit.check_duration', duration);

      return {
        limited,
        remaining: Math.max(0, this.config.requestLimit - count),
        reset: ttl
      };
    } catch (error) {
      logger.error('Rate limit error:', error);
      metrics.increment('rate_limit.errors');
      
      // Fail open with warning
      logger.warn('Rate limiting failed, allowing request', { ip });
      return { limited: false, remaining: 0, reset: 0 };
    }
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limiting middleware
 */
export async function rateLimit(req: NextRequest): Promise<boolean> {
  const result = await rateLimiter.isRateLimited(req);
  
  // Add rate limit headers if available
  if (result.remaining >= 0) {
    req.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    req.headers.set('X-RateLimit-Reset', result.reset.toString());
  }

  return result.limited;
}

/**
 * Higher-order function to wrap handlers with rate limiting
 */
export function withRateLimit<T>(handler: (req: NextRequest) => Promise<T>) {
  return async (req: NextRequest): Promise<T> => {
    const { limited, remaining, reset } = await rateLimiter.isRateLimited(req);
    
    if (limited) {
      const error: any = new Error('Too Many Requests');
      error.status = 429;
      error.headers = {
        'Retry-After': reset.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': reset.toString()
      };
      throw error;
    }

    // Add rate limit headers
    const response = await handler(req);
    if (response && typeof response === 'object') {
      const headers = {
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString()
      };
      Object.assign(response.headers || {}, headers);
    }

    return response;
  };
}