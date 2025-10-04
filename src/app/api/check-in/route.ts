// src/app/api/check-in/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { redis } from "@/lib/db/redis";
import { regionHasher } from "@/lib/privacy/region-hash";
import { getDeviceIdentifier, updateDeviceRegion } from "@/lib/privacy/device-identifier";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";
import { CheckInService } from "@/services/check-in-service";
import { CircuitBreaker } from "@/lib/circuit-breaker";
import { VALID_EMOTIONS } from "@/config/emotions";
import { validateCheckIn } from "./validation";

// Constants for rate limiting and performance
const RATE_LIMIT_WINDOW = 60 * 60 * 24; // 24 hours in seconds
const RATE_LIMIT_KEY_PREFIX = "rate:check-in:";
const CACHE_TTL = 60 * 60; // 1 hour cache for sensitive operations
const MAX_REQUEST_SIZE = 10 * 1024; // 10KB max request size

// Schema validation for incoming check-in requests
const checkInSchema = z.object({
  emotion: z.enum(VALID_EMOTIONS.map(e => e.toLowerCase()) as [string, ...string[]]),
  intensity: z.number().int().min(1).max(5).default(3),
  note: z.string().max(200).optional(),
  region: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
  avatar: z.string().optional(), // Avatar selection from frontend
}).passthrough(); // Allow additional fields without validation

// Types for consistency
type CheckInRequest = z.infer<typeof checkInSchema>;

// Initialize metrics
metrics.registerCounter('check_in_total', 'Total number of check-in attempts');
metrics.registerCounter('check_in_success', 'Successful check-ins');
metrics.registerCounter('check_in_error', 'Failed check-ins');
metrics.registerCounter('check_in_rate_limited', 'Rate limited check-ins');
metrics.registerCounter('check_in_invalid', 'Invalid check-in requests');
metrics.registerHistogram('check_in_duration_ms', 'Check-in processing time in milliseconds');
metrics.registerHistogram('check_in_payload_size_bytes', 'Size of check-in payloads in bytes');

// Circuit breakers for external services
const redisBreaker = new CircuitBreaker({
  service: 'redis',
  failureThreshold: 3,
  resetTimeout: 30000,
  maxRetries: 2,
});

const kafkaBreaker = new CircuitBreaker({
  service: 'kafka',
  failureThreshold: 2,
  resetTimeout: 60000,
  maxRetries: 1,
});

// Memory cache for device rate limits (helps when Redis is down)
const deviceRateLimits = new Map<string, { count: number, timestamp: number }>();

/**
 * Handle a check-in POST request
 */
export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const startTime = performance.now();
  
  // Track total check-in attempts
  metrics.increment('check_in_total');
  
  try {
    // Check content type
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 415 }
      );
    }
    
    // Check request size
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    metrics.updateHistogram('check_in_payload_size_bytes', contentLength);
    
    if (contentLength > MAX_REQUEST_SIZE) {
      logger.warn('Check-in request too large', { size: contentLength, maxSize: MAX_REQUEST_SIZE });
      metrics.increment('check_in_invalid');
      return NextResponse.json(
        { error: "Request too large" },
        { status: 413 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      logger.warn('Failed to parse check-in JSON', { error: String(error) });
      metrics.increment('check_in_invalid');
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Validate request using zod schema
    let validatedBody: CheckInRequest;
    try {
      validatedBody = checkInSchema.parse(body);
    } catch (error) {
      logger.warn('Invalid check-in data', { error: String(error) });
      metrics.increment('check_in_invalid');
      return NextResponse.json(
        { error: "Invalid request data", details: (error as Error).message },
        { status: 400 }
      );
    }
    
    // Apply additional validation rules
    try {
      await validateCheckIn(validatedBody);
    } catch (error) {
      logger.warn('Check-in validation failed', { error: String(error) });
      metrics.increment('check_in_invalid');
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 400 }
      );
    }

    // Get or create device identifier
    const clientData = {
      userAgent: request.headers.get("user-agent") || undefined,
      language: request.headers.get("accept-language") || undefined,
      timeZone: undefined,
      platform: undefined,
    };
    
    // Handle device identification
    const deviceHeaders = {
      "X-Device-ID": request.headers.get("X-Device-ID"),
      "X-Fingerprint": request.headers.get("X-Fingerprint"),
    };
    
    let deviceInfo;
    try {
      // Try to identify the device with provided headers, or generate new identifier
      if (deviceHeaders["X-Device-ID"]) {
        // Validate provided ID against our records
        deviceInfo = await getDeviceIdentifier({
          ...clientData,
          deviceId: deviceHeaders["X-Device-ID"],
          fingerprint: deviceHeaders["X-Fingerprint"] || undefined,
        });
      } else {
        // Generate new device ID
        deviceInfo = await getDeviceIdentifier(clientData);
      }
    } catch (error) {
      logger.error('Device identification error', { error: String(error) });
      // Use a temporary device ID if identification fails
      deviceInfo = {
        deviceId: `temp-${randomUUID()}`,
        fingerprint: randomUUID(),
        isNew: true
      };
    }

    // Check rate limit (one check-in per day for normal usage)
    const deviceId = deviceInfo.deviceId;
    const isRateLimited = await checkRateLimit(deviceId);
    
    if (isRateLimited) {
      metrics.increment('check_in_rate_limited');
      const nextAllowedTime = getNextAllowedTime(deviceId);
      
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "You can only check in once per day",
          nextAllowedAt: nextAllowedTime.toISOString(),
        },
        { status: 429 }
      );
    }

    // Process region information
    let regionHash: string;
    if (validatedBody.coordinates) {
      // If coordinates provided, anonymize them
      const { latitude, longitude } = validatedBody.coordinates;
      regionHash = await regionHasher.anonymizeCoordinates({ latitude, longitude });
      
      // Update device region for future reference
      await updateDeviceRegion(deviceId, regionHash);
    } else if (validatedBody.region) {
      // Use provided region code
      regionHash = await regionHasher.hashRegion(validatedBody.region);
    } else if (deviceInfo.region) {
      // Use saved region from previous check-ins
      regionHash = deviceInfo.region;
    } else {
      // Default to global for unlocated check-ins
      regionHash = await regionHasher.hashRegion('GLOBAL');
    }

    // Pre-flight database health check (using findFirst instead of $queryRaw for pgbouncer compatibility)
    try {
      await prisma.checkIn.findFirst({ take: 1 });
    } catch (dbError) {
      logger.error('Database health check failed before check-in', {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        requestId
      });

      return NextResponse.json({
        error: "Service temporarily unavailable",
        message: "Database is currently unavailable. Please try again in a few moments.",
        requestId
      }, {
        status: 503,
        headers: {
          'Retry-After': '30'
        }
      });
    }

    // Create check-in record
    const timestamp = new Date(validatedBody.timestamp || new Date().toISOString());
    const checkInService = new CheckInService();

    let checkInResult;
    try {
      checkInResult = await checkInService.createCheckIn({
        id: requestId,
        deviceId,
        deviceFingerprint: deviceInfo.fingerprint,
        emotion: validatedBody.emotion,
        intensity: validatedBody.intensity,
        note: validatedBody.note,
        regionHash,
        timestamp,
        coordinates: validatedBody.coordinates,
        sessionId: request.headers.get("X-Session-ID") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      });
    } catch (error) {
      logger.error('Failed to create check-in', {
        error: error instanceof Error ? error.message : String(error),
        requestId
      });
      
      return NextResponse.json({
        error: "Internal server error",
        message: "Failed to process check-in. Please try again.",
        requestId
      }, { status: 500 });
    }

    // Update rate limit
    await updateRateLimit(deviceId);
    
    // Calculate streak
    const streak = await checkInService.getStreak(deviceId);
    
    // Record success metrics
    metrics.increment('check_in_success');
    metrics.timing('check_in_duration_ms', performance.now() - startTime);
    
    // Build response with useful information
    const nextAllowedTime = getNextAllowedTime(deviceId);
    const response = {
      id: checkInResult.id,
      message: "Check-in recorded successfully",
      emotion: validatedBody.emotion,
      intensity: validatedBody.intensity,
      timestamp: checkInResult.timestamp.toISOString(),
      streak,
      nextAllowedAt: nextAllowedTime.toISOString(),
      tokenUpdated: deviceInfo.isRotated || false
    };

    // Return success
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    // Log detailed error
    logger.error('Check-in error', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: performance.now() - startTime
    });
    
    metrics.increment('check_in_error');

    // Return error response
    return NextResponse.json({
      error: "Internal server error",
      message: "Failed to process check-in",
      requestId
    }, { status: 500 });
  }
}

/**
 * Check if a device is rate limited
 */
async function checkRateLimit(deviceId: string): Promise<boolean> {
  try {
    // Check in-memory cache first (faster than Redis)
    const memoryLimit = deviceRateLimits.get(deviceId);
    if (memoryLimit) {
      const now = Math.floor(Date.now() / 1000);
      if (now - memoryLimit.timestamp < RATE_LIMIT_WINDOW) {
        return true;
      }
    }
    
    // Check Redis
    const key = `${RATE_LIMIT_KEY_PREFIX}${deviceId}`;
    
    // Use circuit breaker to prevent Redis failures from blocking check-ins
    return await redisBreaker.execute(async () => {
      const result = await redis.get(key);
      return !!result;
    });
  } catch (error) {
    // Log but don't block check-in if rate limiting fails
    logger.warn('Rate limiting check failed', { error: String(error) });
    return false;
  }
}

/**
 * Update rate limit for a device
 */
async function updateRateLimit(deviceId: string): Promise<void> {
  try {
    // Set Redis rate limit (expires after window)
    const key = `${RATE_LIMIT_KEY_PREFIX}${deviceId}`;
    
    // Use circuit breaker
    await redisBreaker.execute(async () => {
      await redis.set(key, '1', { ex: RATE_LIMIT_WINDOW });
    });
    
    // Update memory cache
    const now = Math.floor(Date.now() / 1000);
    deviceRateLimits.set(deviceId, { count: 1, timestamp: now });
    
    // Limit memory cache size (keep most recent 10,000 entries)
    if (deviceRateLimits.size > 10000) {
      const oldestKey = deviceRateLimits.keys().next().value;
      deviceRateLimits.delete(oldestKey);
    }
  } catch (error) {
    logger.warn('Failed to update rate limit', { error: String(error) });
  }
}

/**
 * Calculate next allowed check-in time
 */
function getNextAllowedTime(deviceId: string): Date {
  const memoryLimit = deviceRateLimits.get(deviceId);
  
  if (memoryLimit) {
    return new Date((memoryLimit.timestamp + RATE_LIMIT_WINDOW) * 1000);
  }
  
  // Default to 24 hours from now
  return new Date(Date.now() + RATE_LIMIT_WINDOW * 1000);
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Device-ID, X-Fingerprint, X-Session-ID',
      'Access-Control-Max-Age': '86400'
    }
  });
}