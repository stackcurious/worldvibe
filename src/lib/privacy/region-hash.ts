// src/lib/privacy/region-hash.ts
import { sha256Hex, randomBytesHex } from "@/lib/crypto-utils";
import { redis } from "../db/redis";
import { logger } from "../logger";
import { metrics } from "../monitoring";

interface RegionHashOptions {
  precision?: number;
  salt?: string;
  expiry?: number;
  minPopulation?: number; // For k-anonymity
  polygonPrecision?: number; // For geographic areas
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface PolygonPoint {
  lat: number;
  lng: number;
}

// Population brackets for k-anonymity protection
enum PopulationBracket {
  UNKNOWN = 'unknown',
  VERY_SMALL = '<10k',
  SMALL = '10k-100k',
  MEDIUM = '100k-1M',
  LARGE = '1M-10M',
  VERY_LARGE = '>10M'
}

class RegionHasher {
  private readonly defaultPrecision = 3;
  private readonly defaultPolygonPrecision = 2;
  private readonly defaultMinPopulation = 5000; // Default minimum to ensure k-anonymity
  private readonly salt: string;
  private readonly memoryCacheSize = 1000;
  private memoryCache: Map<string, string>;
  private readonly REGION_KEY_PREFIX = 'rgn:';
  private readonly polygonCache: Map<string, { hash: string, timestamp: number }>;
  private readonly polygonCacheExpiry = 3600000; // 1 hour in ms

  constructor() {
    // Use ENV‑provided salt if available; otherwise generate one
    this.salt = process.env.REGION_SALT || randomBytesHex(16);
    this.memoryCache = new Map();
    this.polygonCache = new Map();
    
    // Register metrics
    metrics.registerGauge('region_hash_memory_cache_size');
    metrics.registerGauge('region_hash_polygon_cache_size');
    metrics.registerHistogram('region_hash_generation_time');
    
    // Schedule periodic cache cleanup
    setInterval(() => this.cleanupPolygonCache(), 900000); // Every 15 minutes
  }

  /**
   * Hash a region identifier with privacy protections
   */
  async hashRegion(region: string, options: RegionHashOptions = {}): Promise<string> {
    const start = Date.now();
    try {
      // Check memory cache first
      const memoryCached = this.memoryCache.get(region);
      if (memoryCached) {
        metrics.increment("region_hash_memory_hit");
        return memoryCached;
      }

      // Check Redis cache
      try {
        const redisCached = await redis.get(`region:${region}`);
        if (redisCached) {
          metrics.increment("region_hash_redis_hit");
          this.updateMemoryCache(region, redisCached);
          return redisCached;
        }
      } catch (error) {
        // Continue with hash generation if Redis fails
        logger.warn("Redis cache unavailable for region hash", { error: String(error) });
        metrics.increment("region_hash_redis_errors");
      }

      // Generate a new hash
      const hash = await this.generateHash(region, options);

      // Cache the result
      await this.cacheHash(region, hash, options.expiry);

      // Record metrics
      metrics.timing("region_hash_generation", Date.now() - start);
      metrics.updateHistogram("region_hash_generation_time", Date.now() - start);
      metrics.updateGauge("region_hash_memory_cache_size", this.memoryCache.size);
      
      return hash;
    } catch (error) {
      logger.error("Region hashing error:", error);
      metrics.increment("region_hash_errors");
      throw error;
    }
  }

  /**
   * Anonymize coordinates with precision reduction and hashing
   */
  async anonymizeCoordinates(coords: Coordinates, options: RegionHashOptions = {}): Promise<string> {
    const precision = options.precision || this.defaultPrecision;
    
    // Reduce precision for privacy
    const reducedLat = parseFloat(coords.latitude.toFixed(precision));
    const reducedLng = parseFloat(coords.longitude.toFixed(precision));
    
    // Create a region representation
    const regionString = `${reducedLat},${reducedLng}`;
    
    // Hash the region with anonymity considerations
    return this.hashRegion(regionString, options);
  }

  /**
   * Hash polygon regions (for areas like neighborhoods, cities)
   */
  async hashPolygon(
    points: PolygonPoint[], 
    options: RegionHashOptions = {}
  ): Promise<string> {
    const polygonPrecision = options.polygonPrecision || this.defaultPolygonPrecision;
    
    // Create a cache key based on the polygon points
    const polygonKey = this.createPolygonKey(points);
    
    // Check cache first
    const cachedItem = this.polygonCache.get(polygonKey);
    if (cachedItem && Date.now() - cachedItem.timestamp < this.polygonCacheExpiry) {
      metrics.increment("region_hash_polygon_cache_hit");
      return cachedItem.hash;
    }
    
    // Reduce precision of all points
    const reducedPoints = points.map(point => ({
      lat: parseFloat(point.lat.toFixed(polygonPrecision)),
      lng: parseFloat(point.lng.toFixed(polygonPrecision))
    }));
    
    // Calculate the centroid
    const centroid = this.calculateCentroid(reducedPoints);
    
    // Use the centroid and point count as the region identifier
    const regionString = `poly:${centroid.lat},${centroid.lng}:${reducedPoints.length}`;
    
    // Hash the region
    const hash = await this.hashRegion(regionString, options);
    
    // Cache the result
    this.polygonCache.set(polygonKey, { hash, timestamp: Date.now() });
    metrics.updateGauge("region_hash_polygon_cache_size", this.polygonCache.size);
    
    return hash;
  }

  /**
   * Apply geographic clustering for privacy and to reduce hash variations
   */
  async hashWithKAnonymity(
    region: string, 
    population: number, 
    options: RegionHashOptions = {}
  ): Promise<string> {
    const minPopulation = options.minPopulation || this.defaultMinPopulation;
    
    // Apply k-anonymity by using population brackets instead of exact populations
    const popBracket = this.getPopulationBracket(population);
    
    // If population is too small, return a more general hash
    if (population < minPopulation) {
      // Extract country/higher-level region if possible
      const generalRegion = this.getGeneralRegion(region);
      return this.hashRegion(`${generalRegion}:${popBracket}`, options);
    }
    
    return this.hashRegion(`${region}:${popBracket}`, options);
  }

  /**
   * Create a secure hash for the region
   */
  private async generateHash(region: string, options: RegionHashOptions): Promise<string> {
    const precision = options.precision || this.defaultPrecision;
    const effectiveSalt = options.salt || this.salt;
    
    try {
      // Create a salted hash
      const hash = await sha256Hex(`${region}:${effectiveSalt}`);
      
      // Prefix for identification and return with specified precision
      return `${this.REGION_KEY_PREFIX}${hash.slice(0, precision * 2)}`;
    } catch (error) {
      logger.error("Error generating region hash", { error: String(error) });
      // Fallback to sync method if async fails
      const hash = sha256Hex(`${region}:${effectiveSalt}`);
      return `${this.REGION_KEY_PREFIX}${hash.slice(0, precision * 2)}`;
    }
  }

  /**
   * Cache the generated hash
   */
  private async cacheHash(region: string, hash: string, expiry = 86400): Promise<void> {
    try {
      // Update memory cache
      this.updateMemoryCache(region, hash);
      
      // Update Redis cache
      try {
        await redis.set(`region:${region}`, hash, { ex: expiry });
      } catch (error) {
        logger.warn("Redis caching unavailable for region hash", { 
          error: String(error),
          region: region.substring(0, 10) + '...' // Log only partial region for privacy
        });
      }
    } catch (error) {
      logger.error("Region hash caching error:", error);
    }
  }

  /**
   * Update the memory cache with LRU policy
   */
  private updateMemoryCache(region: string, hash: string): void {
    if (this.memoryCache.size >= this.memoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(region, hash);
  }

  /**
   * Calculate centroid of polygon points
   */
  private calculateCentroid(points: PolygonPoint[]): PolygonPoint {
    let sumLat = 0;
    let sumLng = 0;
    
    points.forEach(point => {
      sumLat += point.lat;
      sumLng += point.lng;
    });
    
    return {
      lat: sumLat / points.length,
      lng: sumLng / points.length
    };
  }

  /**
   * Create a stable key for polygon cache
   */
  private createPolygonKey(points: PolygonPoint[]): string {
    // Sort points for stable key generation
    const sortedPoints = [...points].sort((a, b) => {
      if (a.lat !== b.lat) return a.lat - b.lat;
      return a.lng - b.lng;
    });
    
    return sortedPoints.map(p => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|');
  }

  /**
   * Clean up expired polygon cache entries
   */
  private cleanupPolygonCache(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, item] of this.polygonCache.entries()) {
      if (now - item.timestamp > this.polygonCacheExpiry) {
        this.polygonCache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      logger.debug(`Cleaned up ${removedCount} expired polygon cache entries`);
      metrics.updateGauge("region_hash_polygon_cache_size", this.polygonCache.size);
    }
  }

  /**
   * Get population bracket for k-anonymity
   */
  private getPopulationBracket(population: number): PopulationBracket {
    if (population === undefined || population === null) {
      return PopulationBracket.UNKNOWN;
    }
    
    if (population < 10000) return PopulationBracket.VERY_SMALL;
    if (population < 100000) return PopulationBracket.SMALL;
    if (population < 1000000) return PopulationBracket.MEDIUM;
    if (population < 10000000) return PopulationBracket.LARGE;
    return PopulationBracket.VERY_LARGE;
  }

  /**
   * Extract general region (e.g., country) from detailed region
   */
  private getGeneralRegion(region: string): string {
    // Handling format like "US-CA" or "US/California"
    const parts = region.split(/[-\/]/);
    if (parts.length > 1) {
      return parts[0];
    }
    
    return region;
  }

  /**
   * Validate if string is a valid region hash
   */
  isValidRegionHash(hash: string): boolean {
    if (!hash || typeof hash !== 'string') return false;
    
    // Check prefix
    if (!hash.startsWith(this.REGION_KEY_PREFIX)) return false;
    
    // Check if remaining part is valid hex
    const hexPart = hash.slice(this.REGION_KEY_PREFIX.length);
    return /^[0-9a-f]+$/i.test(hexPart);
  }
}

export const regionHasher = new RegionHasher();

// Convenience exports
export const anonymizeCoordinates = (lat: number, lng: number, options?: RegionHashOptions) => 
  regionHasher.anonymizeCoordinates({ latitude: lat, longitude: lng }, options);

export const hashRegion = (region: string, options?: RegionHashOptions) => 
  regionHasher.hashRegion(region, options);

export const hashPolygonRegion = (points: PolygonPoint[], options?: RegionHashOptions) => 
  regionHasher.hashPolygon(points, options);

export const isValidRegionHash = (hash: string) => 
  regionHasher.isValidRegionHash(hash);