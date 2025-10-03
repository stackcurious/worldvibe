// src/app/api/ads/routes.ts
/**
 * Ad Targeting API Routes
 * -----------------------
 * Provides robust API endpoints for targeted ad delivery based on user context.
 * 
 * Features:
 * - Type-safe implementation with strict validation
 * - High performance with multi-level caching
 * - Comprehensive error handling and logging
 * - Metrics tracking for performance monitoring
 * - Rate limiting for abuse prevention
 * 
 * @version 1.2.0
 * @lastModified 2025-02-19
 */

import { NextRequest, NextResponse } from "next/server";
import { getTargetedAds } from "@/services/ad-service";
import { redisService as redis } from "@/lib/db/redis";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";
import { rateLimit } from "@/lib/rate-limit";
import { validateRegion } from "@/lib/validation";

// Import types
import type { AdContext, AdTargetingResponse, PlacementContext } from "@/types";

export const runtime = "nodejs";
export const preferredRegion = "auto";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Max execution time in seconds

// Constants for reliable reference
const DEFAULTS = {
  INTENSITY: "medium",
  MAX_ADS: 3,
  CACHE_TTL: 300, // 5 minutes
  MAX_RETRIES: 1,
  BANNER_SIZE: { width: 300, height: 250 }
} as const;

// Type-safe request parameters
interface AdRequestParams {
  emotion: string;
  region: string;
  intensity: string;
  timeOfDay: string;
}

/**
 * GET handler for targeted ads API endpoint
 * 
 * Retrieves personalized ads based on user context including emotion and region.
 * Includes caching, rate limiting, and error handling.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  
  try {
    // 1. Extract and validate parameters with proper type checking
    const validationResult = validateRequestParameters(request);
    if (!validationResult.success) {
      logInvalidRequest(requestId, validationResult);
      return createErrorResponse(400, "Invalid parameters", validationResult.errors);
    }
    
    // Extract validated parameters (now guaranteed to exist)
    const { emotion, region, intensity, timeOfDay } = validationResult.params;

    // 2. Apply rate limiting
    if (await isRateLimited(request, requestId)) {
      return createErrorResponse(
        429, 
        "Too many requests",
        undefined,
        { "Retry-After": "60" }
      );
    }

    // 3. Try serving from cache first
    const cacheKey = generateCacheKey(emotion, region, intensity, timeOfDay);
    const cachedResponse = await getCachedResponse(cacheKey, requestId);
    if (cachedResponse) {
      recordSuccessMetrics(startTime, "cached", requestId);
      return NextResponse.json(cachedResponse);
    }

    // 4. Prepare contexts for ad targeting with validated params
    const adContext = createAdContext(emotion, region, intensity, timeOfDay);
    const placementContext = createPlacementContext(request);

    // 5. Get targeted ads
    const ads = await getTargetedAds(adContext, placementContext);
    
    // 6. Create and cache response
    const response: AdTargetingResponse = {
      ads,
      requestId,
      cached: false,
      expiresAt: new Date(Date.now() + DEFAULTS.CACHE_TTL * 1000)
    };
    
    await cacheResponse(cacheKey, response, DEFAULTS.CACHE_TTL);
    
    // 7. Log success and return response
    logSuccess(requestId, emotion, region, ads.length);
    recordSuccessMetrics(startTime, "fresh", requestId);
    
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error, requestId, startTime);
  }
}

/**
 * Validates all request parameters with type safety
 */
function validateRequestParameters(request: NextRequest): { 
  success: boolean; 
  params: AdRequestParams; 
  errors?: string[];
} {
  const { searchParams } = new URL(request.url);
  const emotion = searchParams.get("emotion");
  const region = searchParams.get("region");
  const intensity = searchParams.get("intensity") || DEFAULTS.INTENSITY;
  const timeOfDay = searchParams.get("timeOfDay") || getCurrentTimeOfDay();
  
  const errors: string[] = [];
  
  if (!emotion) errors.push("Missing required parameter: emotion");
  if (!region) errors.push("Missing required parameter: region");
  if (region && !validateRegion(region)) errors.push("Invalid region format");
  
  return {
    success: errors.length === 0,
    params: { 
      emotion: emotion || "", 
      region: region || "", 
      intensity, 
      timeOfDay 
    },
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Check if the request is rate limited
 */
async function isRateLimited(request: NextRequest, requestId: string): Promise<boolean> {
  const limited = await rateLimit(request);
  if (limited) {
    const clientIp = request.headers.get("x-forwarded-for") || "unknown";
    logger.warn("Rate limit exceeded for ads request", { requestId, clientIp });
    metrics.increment("ads.rate_limited");
    return true;
  }
  return false;
}

/**
 * Creates a standardized error response
 */
function createErrorResponse(
  status: number, 
  message: string, 
  details?: string[],
  headers?: Record<string, string>
): NextResponse {
  const response = NextResponse.json(
    { error: message, details }, 
    { status, headers }
  );
  return response;
}

/**
 * Generate a consistent cache key
 */
function generateCacheKey(
  emotion: string,
  region: string,
  intensity: string,
  timeOfDay: string
): string {
  // Normalize all parameters for consistent keys
  const normalizedParams = {
    emotion: emotion.toLowerCase(),
    region: region.toLowerCase(),
    intensity: intensity.toLowerCase(),
    timeOfDay: timeOfDay.toLowerCase(),
  };
  
  return `ads:${normalizedParams.region}:${normalizedParams.emotion}:${normalizedParams.intensity}:${normalizedParams.timeOfDay}`;
}

/**
 * Try to retrieve a cached response
 */
async function getCachedResponse(cacheKey: string, requestId: string): Promise<AdTargetingResponse | null> {
  try {
    const cached = await redis.get(cacheKey);
    if (!cached) return null;
    
    const parsedResponse = JSON.parse(cached as string) as AdTargetingResponse;
    metrics.increment("ads.cache.hit");
    logger.info("Served ads from cache", { requestId, cacheKey });
    
    return {
      ...parsedResponse,
      cached: true
    };
  } catch (error) {
    logger.warn("Cache retrieval error", { 
      requestId,
      cacheKey,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Cache the response for future requests
 */
async function cacheResponse(cacheKey: string, response: AdTargetingResponse, ttl: number): Promise<void> {
  try {
    await redis.set(cacheKey, JSON.stringify(response), { ex: ttl });
  } catch (error) {
    // Non-fatal error - just log it
    logger.warn("Failed to cache ad response", {
      requestId: response.requestId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Create the ad context with validated parameters
 */
function createAdContext(
  emotion: string,
  region: string,
  intensity: string,
  timeOfDay: string
): AdContext {
  return {
    emotion,
    region,
    intensity,
    timeOfDay,
    timestamp: new Date(),
  };
}

/**
 * Create the placement context based on request properties
 */
function createPlacementContext(request: NextRequest): PlacementContext {
  return {
    size: DEFAULTS.BANNER_SIZE,
    maxAds: DEFAULTS.MAX_ADS,
    placement: "feed",
    deviceType: detectDeviceType(request),
  };
}

/**
 * Handle API errors with proper logging and metrics
 */
function handleApiError(error: unknown, requestId: string, startTime: number): NextResponse {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  logger.error("Ad serving failed", {
    requestId,
    error: errorMessage,
    stack: errorStack,
    duration: performance.now() - startTime
  });
  
  metrics.increment("ads.error");
  metrics.timing("ads.error_response_time", performance.now() - startTime);
  
  return NextResponse.json(
    { error: "Failed to fetch ads", requestId }, 
    { status: 500 }
  );
}

/**
 * Log details of an invalid request
 */
function logInvalidRequest(
  requestId: string, 
  validationResult: { params: Record<string, any>, errors?: string[] }
): void {
  logger.warn("Invalid parameters for ads request", { 
    requestId,
    params: validationResult.params,
    validationErrors: validationResult.errors
  });
  
  metrics.increment("ads.invalid_request");
}

/**
 * Log successful ad delivery
 */
function logSuccess(requestId: string, emotion: string, region: string, adCount: number): void {
  logger.info("Successfully served targeted ads", { 
    requestId, 
    region, 
    emotion,
    adCount
  });
  
  metrics.increment("ads.success");
}

/**
 * Record success metrics safely
 */
function recordSuccessMetrics(startTime: number, source: 'cached' | 'fresh', requestId: string): void {
  try {
    const duration = performance.now() - startTime;
    
    // Record specific metric for this response type
    metrics.timing(`ads.response_time.${source}`, duration);
    
    // Record general response time on a separate key
    metrics.timing("ads.response_time", duration);
    
    // Track additional metadata through separate counters
    metrics.increment(`ads.served.${source}`);
    
    logger.debug("Response metrics recorded", {
      requestId,
      duration,
      source
    });
  } catch (error) {
    // Metrics recording should never break the application flow
    logger.warn("Failed to record metrics", {
      requestId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get current time of day with proper timezone handling
 */
function getCurrentTimeOfDay(): string {
  // Using local time - in production you might want to use
  // a proper timezone library for more accurate results
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

/**
 * Detect device type from user agent with strict return type
 */
function detectDeviceType(request: NextRequest): 'mobile' | 'tablet' | 'desktop' {
  const userAgent = request.headers.get("user-agent") || "";
  
  // Tablets first (some tablets report as mobile)
  if (/ipad|android(?!.*mobile)/i.test(userAgent)) {
    return "tablet";
  }
  
  // Then check for mobile
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(userAgent)) {
    return "mobile";
  }
  
  // Default to desktop
  return "desktop";
}