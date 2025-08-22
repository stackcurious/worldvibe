/**
 * anonymous-limiter.ts
 *
 * Provides functionality to limit the frequency of anonymous check-ins using Redis.
 * This production-grade implementation uses a distributed Redis cache for rate limiting.
 *
 * @module anonymous-limiter
 * @version 1.0.0
 * @lastModified 2025-02-20
 */

import type { NextRequest } from "next/server";
import Redis from "ioredis";

// Ensure that the REDIS_URL environment variable is set.
if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not defined");
}

/**
 * Initialize a singleton Redis client.
 * Using a global variable prevents multiple instances in development or serverless environments.
 */
declare global {
  // eslint-disable-next-line no-var
  var __redisClient: Redis.Redis | undefined;
}

const redisClient: Redis.Redis = global.__redisClient || new Redis(process.env.REDIS_URL);

if (!global.__redisClient) {
  global.__redisClient = redisClient;
}

// Define the rate limit window in seconds (24 hours).
const RATE_LIMIT_WINDOW_SECONDS = 24 * 60 * 60;

/**
 * Returns the number of seconds until the next allowed check-in for an anonymous user.
 * The function uses Redis's TTL command on a key uniquely identified by the user's IP.
 *
 * @param {NextRequest} request - The Next.js API request object.
 * @returns {Promise<number>} - Seconds until the next check-in is allowed (0 if allowed immediately).
 */
export async function getTimeUntilNextCheckIn(request: NextRequest): Promise<number> {
  // Use the request IP as a unique key; fall back to a default if unavailable.
  const ip = request.ip || "127.0.0.1";
  const redisKey = `anonymous-checkin:${ip}`;

  try {
    // Retrieve the TTL (in seconds) of the rate limit key.
    const ttl = await redisClient.ttl(redisKey);

    // If the key does not exist or its TTL is negative, allow check-in immediately.
    if (ttl < 0) {
      return 0;
    }
    return ttl;
  } catch (error) {
    console.error(`Error fetching TTL from Redis for key ${redisKey}:`, error);
    // In case of a Redis error, fail open by allowing the check-in.
    return 0;
  }
}

/**
 * Updates the last check-in timestamp for an anonymous user.
 * This sets a Redis key with an expiration equal to the rate limit window.
 *
 * @param {NextRequest} request - The Next.js API request object.
 * @returns {Promise<void>}
 */
export async function updateAnonymousCheckIn(request: NextRequest): Promise<void> {
  const ip = request.ip || "127.0.0.1";
  const redisKey = `anonymous-checkin:${ip}`;

  try {
    // Set the key with a dummy value (current timestamp) and an expiration.
    await redisClient.set(redisKey, Date.now().toString(), "EX", RATE_LIMIT_WINDOW_SECONDS);
  } catch (error) {
    console.error(`Error setting rate limit key in Redis for key ${redisKey}:`, error);
    // In production, you might also log this error to a monitoring service.
  }
}
