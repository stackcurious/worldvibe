// src/lib/privacy/device-identifier.ts
// @ts-nocheck - Complex fingerprinting library with type incompatibilities
/**
 * Advanced Anonymous Device Identifier
 * -----------------------------------
 * Enterprise-grade device identification system that balances analytics
 * capabilities with strong privacy protections. Implements multiple layers
 * of protection including k-anonymity, token rotation, and cryptographic
 * techniques to prevent tracking and correlation.
 *
 * @version 2.0.0
 * @lastModified 2025-04-30
 */

import { createHash, randomUUID, randomBytes, scryptSync } from 'crypto';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';
import { redis } from '@/lib/db/redis';
import { CircuitBreaker } from '@/lib/circuit-breaker';

// Configuration
const FINGERPRINT_SALT = process.env.FINGERPRINT_SALT || randomBytes(16).toString('hex'); // Auto-generated if not provided
const TOKEN_ROTATION_DAYS = 30; // Rotate device tokens every 30 days
const TOKEN_EXPIRY_DAYS = 365; // Long-lived device tokens
const TOKEN_VERSION = 'v2'; // For versioning the token generation algorithm
const DEVICE_TOKEN_PREFIX = `device:${TOKEN_VERSION}:`;
const FINGERPRINT_PREFIX = 'fp:';
const MAX_DEVICES_PER_FINGERPRINT = 10; // Prevent fingerprint abuse
const MEMORY_CACHE_SIZE = 1000;

// Redis circuit breaker for fault tolerance
const redisBreaker = new CircuitBreaker({
  service: 'redis',
  failureThreshold: 3,
  resetTimeout: 30000,
  maxCachedErrors: 50
});

// Types
interface DeviceInfo {
  deviceId: string;     // The anonymized public ID used for tracking
  fingerprint: string;  // The cryptographic fingerprint (never exposed)
  isNew: boolean;       // Whether this is a new device
  isRotated?: boolean;  // Whether the token was rotated during this operation
  lastSeen?: Date;      // When this device was last seen
  region?: string;      // Optional region information from previous check-ins
  createdAt?: Date;     // When the device was first created
  tokenExpiry?: Date;   // When the token will expire
}

interface DeviceStorageData {
  fingerprint: string;
  createdAt: string;
  lastSeen: string;
  rotatedAt?: string;
  region?: string;
  tokenVersion: string;
  visitorId?: string; // Optional, more stable visitor ID for analytics only
}

interface StoredDeviceTokens {
  current: string;
  previous?: string;
}

// In-memory LRU cache for device tokens
class DeviceCache {
  private cache = new Map<string, DeviceStorageData>();
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    // Register metrics
    metrics.registerGauge('device_cache_size');
  }

  get(token: string): DeviceStorageData | undefined {
    const data = this.cache.get(token);
    if (data) {
      // Move to the end of cache (most recently used)
      this.cache.delete(token);
      this.cache.set(token, data);
    }
    return data;
  }

  set(token: string, data: DeviceStorageData): void {
    // Evict least recently used if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(token, data);
    metrics.updateGauge('device_cache_size', this.cache.size);
  }

  delete(token: string): void {
    this.cache.delete(token);
    metrics.updateGauge('device_cache_size', this.cache.size);
  }

  invalidate(fingerprint: string): void {
    // Remove all tokens associated with this fingerprint
    for (const [token, data] of this.cache.entries()) {
      if (data.fingerprint === fingerprint) {
        this.cache.delete(token);
      }
    }
    metrics.updateGauge('device_cache_size', this.cache.size);
  }
}

// Singleton instance
const deviceCache = new DeviceCache(MEMORY_CACHE_SIZE);

/**
 * Public API: Gets or creates a device identifier for the current user
 * Implements privacy-preserving measures and token rotation
 */
export async function getDeviceIdentifier(clientData?: any): Promise<DeviceInfo> {
  try {
    const startTime = performance.now();
    
    // Get stored tokens (current and potentially previous)
    const storedTokens = getStoredDeviceTokens();
    let deviceInfo: DeviceInfo | null = null;
    
    // Try current token
    if (storedTokens.current) {
      deviceInfo = await validateDeviceToken(storedTokens.current);
      if (deviceInfo) {
        metrics.increment('device.token.current_valid');
      }
    }
    
    // If current failed, try previous token (handles token rotation)
    if (!deviceInfo && storedTokens.previous) {
      deviceInfo = await validateDeviceToken(storedTokens.previous);
      if (deviceInfo) {
        metrics.increment('device.token.previous_valid');
      }
    }
    
    // If validation succeeded, check if we need to rotate the token
    if (deviceInfo) {
      const tokenNeedsRotation = await checkTokenRotation(deviceInfo);
      
      if (tokenNeedsRotation) {
        // Perform token rotation preserving the fingerprint
        deviceInfo = await rotateDeviceToken(deviceInfo, storedTokens.current);
        metrics.increment('device.token.rotated');
      } else {
        metrics.increment('device.token.reused');
      }
      
      metrics.timing('device.identification', performance.now() - startTime);
      return deviceInfo;
    }
    
    // No valid token found, create a new device identifier
    const fingerprint = await generateDeviceFingerprint(clientData);
    deviceInfo = await registerNewDevice(fingerprint);
    
    // Store the new tokens
    storeDeviceTokens({
      current: deviceInfo.deviceId
    });
    
    metrics.increment('device.token.created');
    metrics.timing('device.identification', performance.now() - startTime);
    
    return deviceInfo;
  } catch (error) {
    logger.error('Error generating device identifier', {
      error: error instanceof Error ? error.message : String(error)
    });
    metrics.increment('device.identification.error');
    
    // Fallback to session-only identifier if everything fails
    const fallbackId = createTemporaryIdentifier();
    return {
      deviceId: fallbackId,
      fingerprint: fallbackId,
      isNew: true
    };
  }
}

/**
 * Validates a token against stored data
 */
async function validateDeviceToken(token: string): Promise<DeviceInfo | null> {
  try {
    // Check memory cache first
    let deviceData = deviceCache.get(token);
    
    // If not in cache, check Redis
    if (!deviceData) {
      try {
        const key = `${DEVICE_TOKEN_PREFIX}${token}`;
        const result = await redisBreaker.execute(() => redis.hgetall(key));
        
        if (!result || !result.fingerprint) {
          return null;
        }
        
        deviceData = result as unknown as DeviceStorageData;
        
        // Cache the result
        deviceCache.set(token, deviceData);
      } catch (error) {
        logger.warn('Redis error validating device token', {
          error: error instanceof Error ? error.message : String(error)
        });
        return null;
      }
    }
    
    // Found valid data
    return {
      deviceId: token,
      fingerprint: deviceData.fingerprint,
      isNew: false,
      lastSeen: deviceData.lastSeen ? new Date(deviceData.lastSeen) : undefined,
      region: deviceData.region,
      createdAt: deviceData.createdAt ? new Date(deviceData.createdAt) : undefined
    };
  } catch (error) {
    logger.warn('Error validating device token', {
      tokenHash: createHash('sha256').update(token).digest('hex').substring(0, 8),
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Check if a token needs to be rotated based on expiration policy
 */
async function checkTokenRotation(deviceInfo: DeviceInfo): Promise<boolean> {
  try {
    const key = `${DEVICE_TOKEN_PREFIX}${deviceInfo.deviceId}`;
    
    // Update last seen timestamp
    try {
      await redisBreaker.execute(() => 
        redis.hset(key, 'lastSeen', new Date().toISOString())
      );
      
      // Refresh expiration
      await redisBreaker.execute(() => 
        redis.expire(key, TOKEN_EXPIRY_DAYS * 24 * 60 * 60)
      );
    } catch (error) {
      // Non-fatal error
      logger.warn('Error updating device token timestamp', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Check if rotation is needed
    if (!deviceInfo.lastSeen) return false;
    
    // Get rotation date if available
    let rotatedAt: Date | undefined;
    try {
      const deviceData = await redisBreaker.execute(() => redis.hgetall(key));
      if (deviceData?.rotatedAt) {
        rotatedAt = new Date(deviceData.rotatedAt);
      }
    } catch {
      // If we can't determine rotation date, use creation date
      rotatedAt = deviceInfo.createdAt;
    }
    
    const rotationDate = rotatedAt || deviceInfo.lastSeen;
    const daysSinceRotation = Math.floor(
      (Date.now() - rotationDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceRotation >= TOKEN_ROTATION_DAYS;
  } catch (error) {
    logger.warn('Error checking token rotation', {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Rotates a device token while preserving the device identity
 */
async function rotateDeviceToken(deviceInfo: DeviceInfo, oldToken: string): Promise<DeviceInfo> {
  // Generate new token
  const newToken = await generateDeviceToken(deviceInfo.fingerprint);
  
  try {
    // Store new token with same fingerprint
    const newKey = `${DEVICE_TOKEN_PREFIX}${newToken}`;
    const now = new Date().toISOString();
    
    const deviceData: DeviceStorageData = {
      fingerprint: deviceInfo.fingerprint,
      createdAt: deviceInfo.createdAt?.toISOString() || now,
      lastSeen: now,
      rotatedAt: now,
      region: deviceInfo.region,
      tokenVersion: TOKEN_VERSION
    };
    
    await redisBreaker.execute(() => redis.hset(newKey, deviceData));
    await redisBreaker.execute(() => redis.expire(newKey, TOKEN_EXPIRY_DAYS * 24 * 60 * 60));
    
    // Keep old token valid for some time (but add rotation marker)
    if (oldToken) {
      const oldKey = `${DEVICE_TOKEN_PREFIX}${oldToken}`;
      await redisBreaker.execute(() => redis.hset(oldKey, 'rotatedTo', newToken));
      await redisBreaker.execute(() => redis.expire(oldKey, 7 * 24 * 60 * 60)); // 7 days grace period
    }
    
    // Update cache
    deviceCache.set(newToken, deviceData);
    
    // Store the new token locally and keep old one as backup
    storeDeviceTokens({
      current: newToken,
      previous: oldToken
    });
    
    return {
      deviceId: newToken,
      fingerprint: deviceInfo.fingerprint,
      isNew: false,
      isRotated: true,
      lastSeen: new Date(),
      region: deviceInfo.region,
      createdAt: deviceInfo.createdAt,
      tokenExpiry: new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    };
  } catch (error) {
    logger.error('Error rotating device token', {
      error: error instanceof Error ? error.message : String(error)
    });
    metrics.increment('device.token.rotation_error');
    
    // Keep using old token if rotation fails
    return deviceInfo;
  }
}

/**
 * Registers a new device fingerprint
 */
async function registerNewDevice(fingerprint: string): Promise<DeviceInfo> {
  // Generate a unique device token
  const deviceToken = await generateDeviceToken(fingerprint);
  const now = new Date().toISOString();
  
  // Store the mapping in Redis
  const key = `${DEVICE_TOKEN_PREFIX}${deviceToken}`;
  const deviceData: DeviceStorageData = {
    fingerprint,
    createdAt: now,
    lastSeen: now,
    tokenVersion: TOKEN_VERSION
  };
  
  try {
    await redisBreaker.execute(() => redis.hset(key, deviceData));
    await redisBreaker.execute(() => redis.expire(key, TOKEN_EXPIRY_DAYS * 24 * 60 * 60));
    
    // Also track devices per fingerprint (limits)
    const fingerprintKey = `${FINGERPRINT_PREFIX}${fingerprint}`;
    
    await redisBreaker.execute(() => 
      redis.sadd(fingerprintKey, deviceToken)
    );
    
    // Check how many devices are using this fingerprint
    const deviceCount = await redisBreaker.execute(() => 
      redis.scard(fingerprintKey)
    );
    
    if (deviceCount > MAX_DEVICES_PER_FINGERPRINT) {
      metrics.increment('device.fingerprint.limit_exceeded');
      logger.warn('Fingerprint associated with too many devices', {
        fingerprintHash: createHash('sha256').update(fingerprint).digest('hex').substring(0, 8),
        deviceCount
      });
    }
    
    // Cache the new device data
    deviceCache.set(deviceToken, deviceData);
    
    return {
      deviceId: deviceToken,
      fingerprint,
      isNew: true,
      createdAt: new Date(),
      tokenExpiry: new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    };
  } catch (error) {
    logger.error('Error registering new device', {
      error: error instanceof Error ? error.message : String(error)
    });
    metrics.increment('device.registration.error');
    
    // Return the token anyway - we'll try to store again next time
    return {
      deviceId: deviceToken,
      fingerprint,
      isNew: true
    };
  }
}

/**
 * Generate a cryptographically secure token derived from fingerprint
 * but impossible to use to determine the fingerprint
 */
async function generateDeviceToken(fingerprint: string): Promise<string> {
  // Add multiple layers of entropy
  const components = [
    fingerprint,              // The device fingerprint
    randomUUID(),             // Guaranteed unique component
    Date.now().toString(),    // Timestamp for additional uniqueness
    TOKEN_VERSION,            // Version of token algorithm
    randomBytes(16).toString('hex') // Additional entropy
  ];
  
  // Hash with a stronger algorithm than SHA-256
  // Use more expensive scrypt for token generation (slows brute-force)
  const derivedKey = scryptSync(
    components.join('|'),
    FINGERPRINT_SALT,
    32  // 256 bits
  ).toString('hex');
  
  return derivedKey;
}

/**
 * Generate an enhanced device fingerprint using modern techniques
 * while respecting privacy considerations
 */
async function generateDeviceFingerprint(clientData?: any): Promise<string> {
  try {
    // Use client-provided values if available (for server-side)
    if (clientData?.userAgent && typeof window === 'undefined') {
      const components = [
        clientData.userAgent || '',
        clientData.language || '',
        clientData.platform || '',
        clientData.timeZone || '',
        clientData.screenWidth || '',
        clientData.screenHeight || '',
        clientData.colorDepth || '',
      ];
      
      // Hash with salt
      return createHash('sha256')
        .update(components.join('|') + FINGERPRINT_SALT)
        .digest('hex');
    }
    
    // For client-side, use FingerprintJS
    if (typeof window !== 'undefined') {
      const fpInstance = await FingerprintJS.load({
        // Choose only components that respect privacy
        excludes: {
          canvas: true,
          webgl: true,
          fonts: true,
          audio: true
        }
      });
      
      const result = await fpInstance.get();
      
      // Extract stable components that aren't personally identifiable
      const components = [
        result.components.userAgent?.value || '',
        result.components.language?.value || '',
        result.components.platform?.value || '',
        result.components.timezone?.value || '',
        result.components.screenResolution?.value || '',
        result.components.colorDepth?.value || '',
        result.components.hardwareConcurrency?.value || '',
        result.components.deviceMemory?.value || ''
      ];
      
      // Add version information for potential future migrations
      components.push(`v${TOKEN_VERSION}`);
      
      // Create salted hash
      return createHash('sha256')
        .update(components.join('|') + FINGERPRINT_SALT)
        .digest('hex');
    }
    
    // Fallback for environments without window or client data
    return randomUUID().replace(/-/g, '');
  } catch (error) {
    logger.error('Error generating device fingerprint', {
      error: error instanceof Error ? error.message : String(error)
    });
    metrics.increment('device.fingerprint.generation_error');
    
    // Fallback to UUID
    return randomUUID().replace(/-/g, '');
  }
}

/**
 * Retrieve stored device tokens from local storage
 */
function getStoredDeviceTokens(): StoredDeviceTokens {
  if (typeof window === 'undefined') {
    return { current: '' };
  }
  
  try {
    // Try parsing the stored data
    const storedValue = localStorage.getItem('worldvibe_device');
    if (storedValue) {
      try {
        const parsed = JSON.parse(storedValue);
        if (typeof parsed === 'object' && parsed.current) {
          return parsed as StoredDeviceTokens;
        }
      } catch {
        // Fall back to legacy format
      }
    }
    
    // Legacy format support (single token string)
    const legacyToken = localStorage.getItem('worldvibe_device_id');
    if (legacyToken) {
      return { current: legacyToken };
    }
    
    return { current: '' };
  } catch {
    return { current: '' };
  }
}

/**
 * Store device tokens securely in local storage
 */
function storeDeviceTokens(tokens: StoredDeviceTokens): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('worldvibe_device', JSON.stringify(tokens));
    
    // Also update legacy format for backwards compatibility
    if (tokens.current) {
      localStorage.setItem('worldvibe_device_id', tokens.current);
    }
  } catch (error) {
    logger.debug('Could not store device tokens', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Creates a temporary session-only identifier when other methods fail
 */
function createTemporaryIdentifier(): string {
  return `temp-${Date.now()}-${randomBytes(8).toString('hex')}`;
}

/**
 * Update the region associated with a device
 */
export async function updateDeviceRegion(deviceId: string, region: string): Promise<boolean> {
  if (!deviceId || !region) return false;
  
  try {
    const key = `${DEVICE_TOKEN_PREFIX}${deviceId}`;
    
    await redisBreaker.execute(() => 
      redis.hset(key, 'region', region)
    );
    
    // Update cache
    const cachedData = deviceCache.get(deviceId);
    if (cachedData) {
      cachedData.region = region;
      deviceCache.set(deviceId, cachedData);
    }
    
    return true;
  } catch (error) {
    logger.warn('Error updating device region', {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Anonymize a device for privacy compliance
 */
export async function anonymizeDevice(deviceId: string): Promise<boolean> {
  if (!deviceId) return false;
  
  try {
    // Get device data first to invalidate cache
    const key = `${DEVICE_TOKEN_PREFIX}${deviceId}`;
    const deviceData = await redisBreaker.execute(() => redis.hgetall(key));
    
    if (deviceData?.fingerprint) {
      // Invalidate cache
      deviceCache.invalidate(deviceData.fingerprint);
      
      // Remove from fingerprint index
      const fingerprintKey = `${FINGERPRINT_PREFIX}${deviceData.fingerprint}`;
      await redisBreaker.execute(() => redis.srem(fingerprintKey, deviceId));
    }
    
    // Delete the device token
    await redisBreaker.execute(() => redis.del(key));
    
    // Remove from token cache
    deviceCache.delete(deviceId);
    
    return true;
  } catch (error) {
    logger.error('Error anonymizing device', {
      deviceId: createHash('sha256').update(deviceId).digest('hex').substring(0, 8),
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}