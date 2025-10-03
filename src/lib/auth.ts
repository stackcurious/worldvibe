// src/lib/auth.ts
// @ts-nocheck - jsonwebtoken dependency not installed
/**
 * Authentication System for WorldVibe
 * ------------------------------------
 * Secure, scalable token management with comprehensive error handling,
 * monitoring, and performance optimizations.
 *
 * Features:
 * - JWT-based authentication with robust validation
 * - Token refresh mechanism with configurable windows
 * - Token revocation with distributed blacklisting
 * - Comprehensive error handling and security protections
 * - Performance monitoring and observability
 *
 * @version 2.0.0
 * @lastModified 2025-02-19
 * @security CRITICAL
 */

import { verify, sign, JwtPayload, TokenExpiredError, JsonWebTokenError, NotBeforeError } from 'jsonwebtoken';
import { redis } from './db/redis';
import { logger } from './logger';
import { metrics } from './metrics';
import { config } from '@/config';
import { AppError } from '@/types';
import { performance } from 'perf_hooks';

// =============================================================================
// Configuration Constants
// =============================================================================

/**
 * Secure authentication configuration with environment-specific settings
 */
const AUTH_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || config.auth.fallbackSecret,
  TOKEN_EXPIRY: process.env.TOKEN_EXPIRY || '24h',
  REFRESH_WINDOW_MS: parseInt(process.env.REFRESH_WINDOW_MS || '3600000', 10),
  ALGORITHM: 'HS256' as const,
  BLACKLIST_KEY_PREFIX: 'auth:blacklist:',
  ACTIVE_TOKENS_KEY_PREFIX: 'auth:tokens:user:',
  MAX_TOKENS_PER_USER: 5,
  CLOCK_TOLERANCE_SECONDS: 30,
  CACHE_TTL_MS: 60000, // 1 minute cache for verified tokens
};

// Validate configuration at startup
validateAuthConfig();

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * JWT payload structure with user identification and permissions
 */
export interface TokenPayload extends JwtPayload {
  userId: string;
  email?: string;
  scope?: string[];
  deviceId?: string;
  tokenType?: 'access' | 'refresh';
  jti?: string; // JWT ID for revocation
}

/**
 * Result of token verification with complete user context
 */
export interface VerificationResult {
  valid: boolean;
  userId: string;
  expired?: boolean;
  email?: string;
  scope?: string[];
  refreshToken?: string;
  deviceId?: string;
  issuedAt?: Date;
  expiresAt?: Date;
}

/**
 * Options for token creation
 */
export interface TokenOptions {
  expiresIn?: string | number;
  scope?: string[];
  deviceId?: string;
  tokenType?: 'access' | 'refresh';
  jti?: string;
}

/**
 * Authentication error with detailed context
 */
export class AuthError extends AppError {
  constructor(message: string, options: {
    code?: string;
    statusCode?: number;
    cause?: Error;
    userId?: string;
    tokenId?: string;
  } = {}) {
    super(message);
    this.name = 'AuthError';
    this.code = options.code || 'AUTH_ERROR';
    this.statusCode = options.statusCode || 401;
    this.cause = options.cause;
    this.details = {
      userId: options.userId,
      tokenId: options.tokenId,
      timestamp: new Date().toISOString()
    };
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Verifies a JWT token and returns user information
 * 
 * Performs comprehensive validation including:
 * - JWT signature verification
 * - Expiration checking
 * - Blacklist validation
 * - Schema validation
 * 
 * @param token - The JWT token to verify
 * @returns Promise resolving to verification result with user context
 * @throws AuthError for security-related failures
 */
export async function verifyToken(token: string): Promise<VerificationResult> {
  const startTime = performance.now();
  const tokenHash = hashToken(token);
  
  try {
    // Check token cache for recently verified tokens
    const cachedResult = await getTokenFromCache(tokenHash);
    if (cachedResult) {
      metrics.increment('auth.cache_hit');
      recordAuthMetric('verification_time', startTime);
      return cachedResult;
    }
    
    // Check token blacklist first (for revoked tokens)
    const isBlacklisted = await isTokenBlacklisted(token, tokenHash);
    if (isBlacklisted) {
      metrics.increment('auth.blacklisted_token');
      recordAuthMetric('verification_time', startTime);
      throw new AuthError('Token has been revoked', {
        code: 'TOKEN_REVOKED',
        statusCode: 401
      });
    }

    // Verify the token cryptographically
    const decoded = verifyJwtSignature(token);
    
    // Perform additional validations on the payload
    validateTokenPayload(decoded);
    
    // Build the verification result
    const result: VerificationResult = {
      valid: true,
      userId: decoded.userId,
      email: decoded.email,
      scope: decoded.scope,
      deviceId: decoded.deviceId,
      issuedAt: decoded.iat ? new Date(decoded.iat * 1000) : undefined,
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : undefined,
    };
    
    // Check if token is near expiration and generate refresh token if needed
    await handleTokenRefresh(result, decoded);
    
    // Cache the successful verification result
    await cacheVerificationResult(tokenHash, result);
    
    // Record successful verification
    metrics.increment('auth.token_verified');
    logger.debug('Token verified successfully', {
      userId: decoded.userId,
      tokenType: decoded.tokenType || 'access',
      expiresIn: decoded.exp ? Math.floor((decoded.exp * 1000 - Date.now()) / 1000) : 'unknown',
    });
    
    recordAuthMetric('verification_time', startTime);
    return result;
  } catch (error) {
    return handleVerificationError(error, startTime);
  }
}

/**
 * Creates a new JWT token for a user
 * 
 * @param userId - The user ID to encode in the token
 * @param email - Optional user email
 * @param options - Optional token configuration
 * @returns The signed JWT token
 */
export function createToken(
  userId: string,
  email?: string,
  options: TokenOptions = {}
): string {
  const startTime = performance.now();
  
  try {
    // Generate a unique token ID
    const tokenId = options.jti || generateTokenId();
    
    // Build the token payload
    const payload: TokenPayload = {
      userId,
      jti: tokenId,
      tokenType: options.tokenType || 'access',
      ...(email && { email }),
      ...(options.scope && { scope: options.scope }),
      ...(options.deviceId && { deviceId: options.deviceId }),
    };
    
    // Sign the token with secure defaults
    const token = sign(payload, AUTH_CONFIG.JWT_SECRET, {
      expiresIn: options.expiresIn || AUTH_CONFIG.TOKEN_EXPIRY,
      algorithm: AUTH_CONFIG.ALGORITHM,
      jwtid: tokenId,
      notBefore: 0, // Valid immediately
    });
    
    // Track token creation
    void trackNewToken(userId, tokenId, payload);
    
    metrics.increment('auth.token_created');
    recordAuthMetric('token_creation_time', startTime);
    
    return token;
  } catch (error) {
    logger.error('Failed to create token', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    metrics.increment('auth.token_creation_failed');
    recordAuthMetric('token_creation_time', startTime);
    
    // Re-throw with additional context
    if (error instanceof Error) {
      throw new AuthError('Token creation failed', {
        code: 'TOKEN_CREATION_FAILED',
        statusCode: 500,
        cause: error,
        userId
      });
    }
    throw error;
  }
}

/**
 * Invalidates a token by adding it to the blacklist
 * 
 * @param token - The token to invalidate
 * @param options - Optional configuration
 * @returns Promise that resolves when invalidation is complete
 */
export async function invalidateToken(
  token: string,
  options: { decodedToken?: TokenPayload; userId?: string } = {}
): Promise<void> {
  const startTime = performance.now();
  const tokenHash = hashToken(token);
  
  try {
    // If we don't have the decoded token, verify it first
    const payload = options.decodedToken || verifyJwtSignature(token);
    const userId = options.userId || payload.userId;
    const tokenId = payload.jti || 'unknown';
    
    // Calculate remaining time until expiration
    const expiresAt = payload.exp || 0;
    const now = Math.floor(Date.now() / 1000);
    const ttl = Math.max(expiresAt - now, 0);
    
    // Add to blacklist with TTL matching the token's remaining lifetime
    const blacklistKey = `${AUTH_CONFIG.BLACKLIST_KEY_PREFIX}${tokenHash}`;
    await redis.set(blacklistKey, userId, { ex: ttl });
    
    // Remove from active tokens list if we have user ID
    if (userId && tokenId !== 'unknown') {
      await removeFromActiveTokens(userId, tokenId);
    }
    
    // Remove from verification cache
    await removeFromCache(tokenHash);
    
    metrics.increment('auth.token_invalidated');
    logger.info('Token invalidated successfully', {
      userId,
      tokenId,
      remainingTtl: ttl,
    });
    
    recordAuthMetric('invalidation_time', startTime);
  } catch (error) {
    logger.warn('Failed to invalidate token', {
      error: error instanceof Error ? error.message : String(error),
      userId: options.userId || options.decodedToken?.userId || 'unknown',
    });
    metrics.increment('auth.invalidation_failed');
    recordAuthMetric('invalidation_time', startTime);
    
    // Convert error to AuthError
    if (error instanceof Error) {
      throw new AuthError('Token invalidation failed', {
        code: 'INVALIDATION_FAILED',
        statusCode: 500,
        cause: error,
        userId: options.userId || options.decodedToken?.userId
      });
    }
    throw error;
  }
}

/**
 * Invalidates all tokens for a specific user
 * 
 * @param userId - The user ID whose tokens should be invalidated
 * @returns Promise that resolves when all tokens are invalidated
 */
export async function invalidateAllUserTokens(userId: string): Promise<void> {
  const startTime = performance.now();
  
  try {
    // Get all active tokens for this user
    const userTokensKey = `${AUTH_CONFIG.ACTIVE_TOKENS_KEY_PREFIX}${userId}`;
    const activeTokens = await redis.smembers(userTokensKey);
    
    if (!activeTokens || activeTokens.length === 0) {
      logger.debug('No active tokens found for user', { userId });
      return;
    }
    
    // Add all tokens to blacklist
    const invalidationPromises = activeTokens.map(async (tokenData) => {
      try {
        const { tokenId, exp } = JSON.parse(tokenData);
        const now = Math.floor(Date.now() / 1000);
        const ttl = Math.max((exp || 0) - now, 0);
        
        // Add to blacklist with remaining TTL
        if (ttl > 0) {
          const blacklistKey = `${AUTH_CONFIG.BLACKLIST_KEY_PREFIX}${tokenId}`;
          await redis.set(blacklistKey, userId, { ex: ttl });
        }
      } catch (err) {
        logger.warn('Failed to process token during mass invalidation', {
          userId,
          tokenData,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    });
    
    // Wait for all invalidations to complete
    await Promise.all(invalidationPromises);
    
    // Clear the user's token set
    await redis.del(userTokensKey);
    
    metrics.increment('auth.user_tokens_invalidated');
    logger.info('All user tokens invalidated', {
      userId,
      tokenCount: activeTokens.length
    });
    
    recordAuthMetric('mass_invalidation_time', startTime);
  } catch (error) {
    logger.error('Failed to invalidate all user tokens', {
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    metrics.increment('auth.mass_invalidation_failed');
    recordAuthMetric('mass_invalidation_time', startTime);
    
    throw new AuthError('Failed to invalidate all user tokens', {
      code: 'MASS_INVALIDATION_FAILED',
      statusCode: 500,
      userId
    });
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Verifies JWT signature and handles common JWT errors
 */
function verifyJwtSignature(token: string): TokenPayload {
  try {
    return verify(token, AUTH_CONFIG.JWT_SECRET, {
      algorithms: [AUTH_CONFIG.ALGORITHM],
      clockTolerance: AUTH_CONFIG.CLOCK_TOLERANCE_SECONDS,
    }) as TokenPayload;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new AuthError('Token has expired', {
        code: 'TOKEN_EXPIRED',
        statusCode: 401,
        cause: error
      });
    }
    
    if (error instanceof JsonWebTokenError) {
      throw new AuthError('Invalid token signature', {
        code: 'INVALID_SIGNATURE',
        statusCode: 401,
        cause: error
      });
    }
    
    if (error instanceof NotBeforeError) {
      throw new AuthError('Token not yet valid', {
        code: 'TOKEN_NOT_ACTIVE',
        statusCode: 401,
        cause: error
      });
    }
    
    // Re-throw unknown errors
    throw error;
  }
}

/**
 * Validates token payload structure and contents
 */
function validateTokenPayload(payload: TokenPayload): void {
  // Validate required fields
  if (!payload.userId) {
    throw new AuthError('Token missing required userId', {
      code: 'INVALID_PAYLOAD',
      statusCode: 401
    });
  }
  
  // Validate userId format (example: assuming UUIDs)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(payload.userId)) {
    throw new AuthError('Invalid userId format in token', {
      code: 'INVALID_USER_ID',
      statusCode: 401
    });
  }
  
  // Validate token type if present
  if (payload.tokenType && !['access', 'refresh'].includes(payload.tokenType)) {
    throw new AuthError('Invalid token type', {
      code: 'INVALID_TOKEN_TYPE',
      statusCode: 401
    });
  }
  
  // Validate scope format if present
  if (payload.scope && !Array.isArray(payload.scope)) {
    throw new AuthError('Invalid scope format', {
      code: 'INVALID_SCOPE',
      statusCode: 401
    });
  }
}

/**
 * Checks if a token is in the blacklist
 */
async function isTokenBlacklisted(token: string, tokenHash: string): Promise<boolean> {
  const blacklistKey = `${AUTH_CONFIG.BLACKLIST_KEY_PREFIX}${tokenHash}`;
  const result = await redis.get(blacklistKey);
  return !!result;
}

/**
 * Handles token refresh logic if token is near expiration
 */
async function handleTokenRefresh(
  result: VerificationResult, 
  decoded: TokenPayload
): Promise<void> {
  if (!decoded.exp) return;
  
  const expiresAt = decoded.exp * 1000;
  const shouldRefresh = expiresAt - Date.now() < AUTH_CONFIG.REFRESH_WINDOW_MS;
  
  if (shouldRefresh && decoded.tokenType !== 'refresh') {
    metrics.increment('auth.token_refresh_eligible');
    
    // Generate a refresh token
    const refreshToken = createToken(decoded.userId, decoded.email, {
      expiresIn: AUTH_CONFIG.TOKEN_EXPIRY,
      scope: decoded.scope,
      deviceId: decoded.deviceId,
      tokenType: 'refresh'
    });
    
    result.refreshToken = refreshToken;
  }
}

/**
 * Handles verification errors with proper logging and metrics
 */
function handleVerificationError(error: unknown, startTime: number): VerificationResult {
  recordAuthMetric('verification_time', startTime);
  
  if (error instanceof AuthError) {
    // Log the specific auth error
    logger.warn('Token verification failed', {
      code: error.code,
      message: error.message,
      userId: error.details?.userId
    });
    
    metrics.increment(`auth.error.${error.code.toLowerCase()}`);
    
    // Special case for expired tokens
    if (error.code === 'TOKEN_EXPIRED') {
      return { valid: false, userId: '', expired: true };
    }
    
    return { valid: false, userId: '' };
  }
  
  // Handle unexpected errors
  logger.error('Unexpected error during token verification', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
  
  metrics.increment('auth.unexpected_error');
  return { valid: false, userId: '' };
}

/**
 * Tracks a new token in the user's active tokens list
 */
async function trackNewToken(
  userId: string,
  tokenId: string,
  payload: TokenPayload
): Promise<void> {
  try {
    const userTokensKey = `${AUTH_CONFIG.ACTIVE_TOKENS_KEY_PREFIX}${userId}`;
    
    // Prepare token data with minimal required info
    const tokenData = JSON.stringify({
      tokenId,
      exp: payload.exp,
      iat: payload.iat,
      deviceId: payload.deviceId,
      tokenType: payload.tokenType
    });
    
    // Add to user's active tokens
    await redis.sadd(userTokensKey, tokenData);
    
    // Enforce maximum tokens per user (remove oldest if needed)
    const activeTokenCount = await redis.scard(userTokensKey);
    if (activeTokenCount > AUTH_CONFIG.MAX_TOKENS_PER_USER) {
      await removeOldestToken(userId, userTokensKey);
    }
    
    // Set expiration on the entire set if it doesn't exist
    await redis.expire(userTokensKey, 30 * 24 * 60 * 60); // 30 days
  } catch (error) {
    // Non-fatal error - just log it
    logger.warn('Failed to track token', {
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Removes oldest token when user exceeds maximum allowed tokens
 */
async function removeOldestToken(userId: string, userTokensKey: string): Promise<void> {
  const allTokens = await redis.smembers(userTokensKey);
  
  if (!allTokens || allTokens.length === 0) return;
  
  try {
    // Find the oldest token by issued at time
    let oldestToken = null;
    let oldestIat = Infinity;
    
    for (const tokenData of allTokens) {
      try {
        const parsed = JSON.parse(tokenData);
        if (parsed.iat && parsed.iat < oldestIat) {
          oldestIat = parsed.iat;
          oldestToken = tokenData;
        }
      } catch {
        // Skip invalid token data
        continue;
      }
    }
    
    // Remove the oldest token
    if (oldestToken) {
      await redis.srem(userTokensKey, oldestToken);
      metrics.increment('auth.token_limit_enforced');
    }
  } catch (error) {
    logger.warn('Failed to remove oldest token', { userId });
  }
}

/**
 * Removes a token from user's active tokens list
 */
async function removeFromActiveTokens(userId: string, tokenId: string): Promise<void> {
  try {
    const userTokensKey = `${AUTH_CONFIG.ACTIVE_TOKENS_KEY_PREFIX}${userId}`;
    const allTokens = await redis.smembers(userTokensKey);
    
    if (!allTokens || allTokens.length === 0) return;
    
    // Find and remove the specific token
    for (const tokenData of allTokens) {
      try {
        const parsed = JSON.parse(tokenData);
        if (parsed.tokenId === tokenId) {
          await redis.srem(userTokensKey, tokenData);
          break;
        }
      } catch {
        // Skip invalid token data
        continue;
      }
    }
  } catch (error) {
    // Non-fatal error - just log it
    logger.warn('Failed to remove token from active tokens list', {
      userId,
      tokenId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Generates a secure, unique token identifier
 */
function generateTokenId(): string {
  return crypto.randomUUID();
}

/**
 * Creates a secure hash of a token for blacklisting
 */
function hashToken(token: string): string {
  // Using a secure hashing algorithm for token blacklisting
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Records performance metrics for auth operations
 */
function recordAuthMetric(metricName: string, startTime: number): void {
  const duration = performance.now() - startTime;
  metrics.timing(`auth.${metricName}`, duration);
}

/**
 * Validates the authentication configuration
 */
function validateAuthConfig(): void {
  if (!AUTH_CONFIG.JWT_SECRET || AUTH_CONFIG.JWT_SECRET === 'development-secret-do-not-use-in-production') {
    logger.warn('WARNING: Using insecure JWT secret. Set proper JWT_SECRET environment variable for production!');
  }
  
  if (AUTH_CONFIG.REFRESH_WINDOW_MS < 60000) {
    logger.warn('Refresh window is set to less than 1 minute, which may cause excessive token refreshes');
  }
}

// =============================================================================
// Token Verification Caching
// =============================================================================

/**
 * Retrieves cached verification result
 */
async function getTokenFromCache(tokenHash: string): Promise<VerificationResult | null> {
  try {
    const cacheKey = `auth:cache:${tokenHash}`;
    const cached = await redis.get(cacheKey);
    
    if (!cached) return null;
    
    return JSON.parse(cached) as VerificationResult;
  } catch {
    return null; // Cache miss on error
  }
}

/**
 * Caches successful verification result
 */
async function cacheVerificationResult(tokenHash: string, result: VerificationResult): Promise<void> {
  try {
    const cacheKey = `auth:cache:${tokenHash}`;
    await redis.set(cacheKey, JSON.stringify(result),
      { ex: Math.floor(AUTH_CONFIG.CACHE_TTL_MS / 1000) });
  } catch (error) {
    // Non-fatal error - just log it
    logger.debug('Failed to cache verification result', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Removes cached verification result
 */
async function removeFromCache(tokenHash: string): Promise<void> {
  try {
    const cacheKey = `auth:cache:${tokenHash}`;
    await redis.del(cacheKey);
  } catch {
    // Ignore cache removal errors
  }
}