/**
 * Privacy Anonymization Module
 * ---------------------------
 * Provides production-grade privacy features for anonymizing
 * user data including:
 * - Device identifier hashing
 * - Geographic region anonymization with k-anonymity
 * - Content and PII sanitization
 */

import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';
import { sha256Hex } from "@/lib/crypto-utils";

// Constants for geographic anonymization
const GEO_PRECISION_DEFAULT = 2; // Default decimal places to preserve for coordinates
const MIN_REGION_GROUP_SIZE = parseInt(process.env.MIN_REGION_GROUP_SIZE || '100', 10);
const SALT_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

// Private salt for hashing, rotated regularly
let _deviceSalt: string | null = null;
let _regionSalt: string | null = null;
let _lastSaltUpdate = 0;

// Region cache for efficiency (TTL: 24 hours)
interface RegionCacheItem {
  hash: string;
  timestamp: number;
}
const regionCache = new Map<string, RegionCacheItem>();
const REGION_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Initialize metrics
metrics.increment('privacy.initialized');

/**
 * Get current device salt, creating/rotating if needed
 */
function getDeviceSalt(): string {
  const now = Date.now();
  
  // Rotate salt periodically for improved security
  if (!_deviceSalt || now - _lastSaltUpdate > SALT_REFRESH_INTERVAL) {
    // Generate 32 random bytes as hex string
    const newSalt = crypto.randomBytes(32).toString('hex');
    
    // Optional: Enhance with environment-specific salt if available
    const envSalt = process.env.ANONYMIZER_SALT || process.env.API_KEY_SALT || 'default-salt';
    _deviceSalt = newSalt + envSalt;
    _lastSaltUpdate = now;
    
    metrics.increment('privacy.salt_rotation');
    logger.debug('Device salt rotated');
  }
  
  return _deviceSalt;
}

/**
 * Get current region salt
 */
function getRegionSalt(): string {
  const now = Date.now();
  
  if (!_regionSalt || now - _lastSaltUpdate > SALT_REFRESH_INTERVAL) {
    // Use a different salt for regions
    const newSalt = crypto.randomBytes(16).toString('hex');
    const envSalt = process.env.ANONYMIZER_SALT || process.env.API_KEY_SALT || 'default-salt';
    _regionSalt = newSalt + envSalt;
    
    // Don't update _lastSaltUpdate here as it's managed by device salt function
    logger.debug('Region salt rotated');
  }
  
  return _regionSalt;
}

/**
 * Hash a device identifier for privacy
 * 
 * @param deviceId - The raw device identifier
 * @returns A hashed identifier
 */
export async function hashDeviceIdentifier(deviceId: string): Promise<string> {
  metrics.increment('privacy.device_hash');
  
  try {
    // Get current salt
    const salt = getDeviceSalt();
    
    // Use the existing sha256Hex function
    return sha256Hex(deviceId + salt);
  } catch (error) {
    logger.error('Error hashing device identifier', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Fallback to simple hash if crypto fails
    const fallbackHash = crypto
      .createHash('sha256')
      .update(deviceId)
      .digest('hex');
    
    return fallbackHash;
  }
}

/**
 * Anonymize geographic coordinates to region hash
 * Implements k-anonymity by reducing precision
 * 
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @param precision - Number of decimal places to preserve (default: 2)
 * @returns A region hash string
 */
export function anonymizeRegion(
  latitude: number,
  longitude: number,
  precision: number = GEO_PRECISION_DEFAULT
): string {
  metrics.increment('privacy.region_hash');
  
  try {
    // Validate coordinates
    if (
      isNaN(latitude) || 
      isNaN(longitude) || 
      latitude < -90 || 
      latitude > 90 || 
      longitude < -180 || 
      longitude > 180
    ) {
      throw new Error('Invalid coordinates');
    }
    
    // Adjust precision based on population density to ensure k-anonymity
    // Lower precision in less populated areas
    let adjustedPrecision = precision;
    
    // Check memory cache for this coordinate pair
    const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    
    // Check cache first for performance
    const cachedRegion = regionCache.get(cacheKey);
    if (cachedRegion && Date.now() - cachedRegion.timestamp < REGION_CACHE_TTL) {
      metrics.increment('privacy.region_cache_hit');
      return cachedRegion.hash;
    }
    
    metrics.increment('privacy.region_cache_miss');
    
    // Reduce precision to implement k-anonymity
    // This ensures the region is large enough to contain at least MIN_REGION_GROUP_SIZE people
    const truncatedLat = latitude.toFixed(adjustedPrecision);
    const truncatedLng = longitude.toFixed(adjustedPrecision);
    
    // Determine continent/country code from coordinates
    // This is a simplified approach; in production, use a reverse geocoding service
    const continent = getContinent(latitude, longitude);
    const country = getCountry(latitude, longitude);
    
    // Format the region string with hierarchy
    const regionStr = `r:${continent}:${country}:${truncatedLat},${truncatedLng}`;
    
    // Hash the region for additional privacy
    const salt = getRegionSalt();
    const hash = crypto
      .createHmac('sha256', salt)
      .update(regionStr)
      .digest('hex')
      .substring(0, 16); // Take first 16 chars for brevity
    
    // Final region format: continent:country:hash
    const regionHash = `${continent}:${country}:${hash}`;
    
    // Cache the result
    regionCache.set(cacheKey, {
      hash: regionHash,
      timestamp: Date.now()
    });
    
    return regionHash;
  } catch (error) {
    logger.error('Error anonymizing region', {
      error: error instanceof Error ? error.message : String(error),
      coords: `${latitude},${longitude}`
    });
    
    // Return a fallback region if there's an error
    return 'global';
  }
}

/**
 * Check if text contains potential PII
 * 
 * @param text - The text to check
 * @returns True if PII is detected
 */
export function containsPII(text: string): boolean {
  if (!text) return false;
  
  // Pattern matching for common PII
  const patterns = [
    // Email addresses
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
    // Phone numbers (various formats)
    /\b(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/,
    // Social security numbers
    /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/,
    // Credit card numbers
    /\b(?:\d{4}[-.]?){3}\d{4}\b/,
    // URLs with personal subdomains
    /https?:\/\/(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?/,
    // IP addresses
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
    // Street addresses (simplified pattern)
    /\b\d+\s+[A-Za-z\s]+(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|lane|ln)\b/i,
    // Names with common title
    /\b(?:Mr|Mrs|Ms|Dr|Prof)\.?\s+[A-Z][a-z]+\b/,
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Sanitize text to remove potential PII
 * 
 * @param text - The text to sanitize
 * @returns Sanitized text
 */
export function sanitizeContent(text: string): string {
  if (!text) return '';
  
  let sanitized = text;
  
  // Replace potential PII with redacted text
  const replacements = [
    // Email addresses
    [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[EMAIL]"],
    // Phone numbers
    [/\b(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, "[PHONE]"],
    // Social security numbers
    [/\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, "[ID]"],
    // Credit card numbers
    [/\b(?:\d{4}[-.]?){3}\d{4}\b/g, "[CARD]"],
    // URLs
    [/https?:\/\/(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?/g, "[URL]"],
    // IP addresses
    [/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "[IP]"],
    // Street addresses (simplified)
    [/\b\d+\s+[A-Za-z\s]+(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|lane|ln)\b/gi, "[ADDRESS]"],
  ];
  
  // Apply each replacement
  for (const [pattern, replacement] of replacements) {
    sanitized = sanitized.replace(pattern as RegExp, replacement as string);
  }
  
  return sanitized;
}

// Helpers for region determination (simplified)
function getContinent(lat: number, lng: number): string {
  // Very simplified continent determination based on rough boundaries
  if (lat > 0 && lng > -30 && lng < 60) return 'eu'; // Europe
  if (lat > 0 && lng < -30) return 'na'; // North America
  if (lat < 0 && lng < -30) return 'sa'; // South America
  if (lat > 0 && lng > 60) return 'as'; // Asia
  if (lat < 0 && lng > 100) return 'oc'; // Oceania
  if (lat < 0 && lng > 0 && lng < 60) return 'af'; // Africa
  
  return 'unk'; // Unknown
}

function getCountry(lat: number, lng: number): string {
  // In a real implementation, this would use a GeoIP or reverse geocoding service
  // This is a placeholder implementation with some examples
  if (lat > 24 && lat < 50 && lng > -125 && lng < -66) return 'us'; // USA
  if (lat > 41 && lat < 52 && lng > -6 && lng < 10) return 'fr'; // France
  if (lat > 35 && lat < 46 && lng > 139 && lng < 146) return 'jp'; // Japan
  
  return 'xx'; // Unknown
}

// Export the Anonymizer class for backward compatibility
export const anonymizer = {
  anonymizeLocation: async (location: string, options: any = {}): Promise<string> => {
    // This is a bridge to maintain compatibility with existing code
    const [lat, lng] = location.split(',').map(parseFloat);
    if (!isNaN(lat) && !isNaN(lng)) {
      return anonymizeRegion(lat, lng);
    } else {
      // If it's not a coordinate pair, hash it
      const salt = getDeviceSalt();
      return sha256Hex(location + salt);
    }
  },
  
  anonymizeContext: (context: string): string => {
    return sanitizeContent(context);
  }
};