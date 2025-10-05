// src/services/check-in-service.ts
import { randomUUID } from "crypto";
import prisma from "@/lib/db/prisma";
import { redis } from "@/lib/db/redis";
import { produceEvent } from "@/lib/realtime/kafka-producer";
import { publishToWebSocket } from "@/lib/realtime/websocket";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";
import { CircuitBreaker } from "@/lib/circuit-breaker";
import { AnalyticsService } from "./analytics-service";
import { timescaleDB } from "@/lib/db/timescale";
import { VALID_EMOTIONS } from "@/config/emotions";
import { SQLiteCheckInService } from "./sqlite-check-in-service";
import { processNoteForTrending } from "./trending-notes-service";

// Placeholder for sanitizeText since it's missing
const sanitizeText = (text: string) => text?.replace(/[<>]/g, '') || null;

// Determine if we're using SQLite (check DATABASE_URL)
const usingSQLite = process.env.DATABASE_URL?.includes('sqlite') || 
                   process.env.DATABASE_URL?.includes('file:');

// Create SQLite service instance if needed
const sqliteService = usingSQLite ? new SQLiteCheckInService() : null;

// Type definitions for PostgreSQL implementation
interface Coordinates {
  latitude: number;
  longitude: number;
}

interface CreateCheckInParams {
  id?: string;
  deviceId: string;
  deviceFingerprint: string;
  emotion: string;
  intensity: number;
  note?: string;
  regionHash: string;
  timestamp: Date;
  coordinates?: Coordinates;
  sessionId?: string;
  userAgent?: string;
}

interface CheckInResult {
  id: string;
  emotion: string;
  intensity: number;
  timestamp: Date;
  regionHash: string;
}

// Constants
const STREAK_KEY_PREFIX = 'streak:';
const STREAK_EXPIRY = 60 * 60 * 24 * 90; // 90 days in seconds
const DEVICE_HISTORY_PREFIX = 'history:';
const MAX_HISTORY_ITEMS = 100;

// Initialize metrics
metrics.registerCounter('check_in_created', 'Check-ins created');
metrics.registerCounter('check_in_stored', 'Check-ins stored in database');
metrics.registerCounter('check_in_redis_error', 'Redis errors during check-in');
metrics.registerCounter('check_in_kafka_error', 'Kafka errors during check-in');
metrics.registerCounter('check_in_db_error', 'Database errors during check-in');
metrics.registerHistogram('check_in_persistence_time', 'Time to persist check-in to all stores');

// Circuit breakers for external services
const dbBreaker = new CircuitBreaker({
  service: 'database',
  failureThreshold: 3,
  resetTimeout: 30000,
  maxRetries: 2,
});

const redisBreaker = new CircuitBreaker({
  service: 'redis',
  failureThreshold: 3,
  resetTimeout: 30000,
  maxRetries: 2,
});

const timescaleBreaker = new CircuitBreaker({
  service: 'timescale',
  failureThreshold: 2,
  resetTimeout: 60000,
  maxRetries: 1,
});

const kafkaBreaker = new CircuitBreaker({
  service: 'kafka',
  failureThreshold: 2,
  resetTimeout: 60000,
  maxRetries: 1,
});

/**
 * Service that handles check-in domain logic
 */
export class CheckInService {
  private analyticsService: AnalyticsService;
  
  constructor() {
    this.analyticsService = new AnalyticsService();
  }
  
  /**
   * Create a new check-in, normalize data, and distribute to all necessary systems
   */
  async createCheckIn(params: any): Promise<any> {
    // Use SQLite implementation if available
    if (usingSQLite && sqliteService) {
      return sqliteService.createCheckIn(params);
    }
    
    // PostgreSQL implementation
    metrics.increment('check_in_created');
    const persistenceTimer = metrics.startTimer('check_in_persistence_time');
    
    try {
      // Normalize emotion (case-insensitive matching)
      const normalizedEmotion = this.normalizeEmotion(params.emotion);
      
      // Generate ID if not provided
      const id = params.id || randomUUID();
      
      // Calculate data retention period (1 year from check-in date)
      const dataRetention = new Date(params.timestamp);
      dataRetention.setFullYear(dataRetention.getFullYear() + 1);
      
      // Prepare check-in record
      const checkIn = {
        id,
        deviceId: params.deviceId,
        deviceHash: params.deviceFingerprint,
        emotion: normalizedEmotion,
        intensity: params.intensity,
        note: params.note || null,
        regionHash: params.regionHash,
        timestamp: params.timestamp,
        latitude: params.coordinates?.latitude || null,
        longitude: params.coordinates?.longitude || null,
        sessionId: params.sessionId,
        userAgent: params.userAgent,
        dataRetention,
        privacyVersion: 1, // Current privacy policy version
        deviceType: this.detectDeviceType(params.userAgent),
        createdAt: new Date(),
        processedAt: null,
      };
      
      // Store check-in data in multiple systems
      // Use Promise.allSettled to prevent non-critical failures from blocking
      const [dbResult, ...otherResults] = await Promise.allSettled([
        this.storeInPrimaryDatabase(checkIn), // Critical - must succeed
        this.storeInTimeseriesDatabase(checkIn), // Non-critical
        this.updateStreakAndHistory(params.deviceId, normalizedEmotion), // Non-critical
        this.publishToStreamingPlatforms(checkIn), // Non-critical
      ]);

      // Check if primary database storage failed (critical)
      if (dbResult.status === 'rejected') {
        throw dbResult.reason;
      }

      // Log non-critical failures without blocking
      otherResults.forEach((result, idx) => {
        if (result.status === 'rejected') {
          const operations = ['TimescaleDB', 'Streak Update', 'Streaming'];
          logger.warn(`Non-critical operation failed: ${operations[idx]}`, {
            operation: operations[idx],
            error: String(result.reason),
            checkInId: id,
          });
        }
      });
      
      // Update analytics data (non-blocking)
      this.analyticsService.processCheckIn({
        id,
        emotion: normalizedEmotion,
        intensity: params.intensity,
        regionHash: params.regionHash,
        timestamp: params.timestamp,
      }).catch(error => {
        logger.warn("Failed to process analytics for check-in", {
          error: String(error),
          checkInId: id
        });
      });

      // Process note for trending (non-blocking)
      if (params.note) {
        processNoteForTrending(
          params.note,
          normalizedEmotion,
          id
        ).catch((error: unknown) => {
          logger.warn("Failed to process note for trending", {
            error: String(error),
            checkInId: id
          });
        });
      }
      
      persistenceTimer();
      
      // Return minimal result
      return {
        id,
        emotion: normalizedEmotion,
        intensity: params.intensity,
        timestamp: params.timestamp,
        regionHash: params.regionHash,
      };
    } catch (error) {
      logger.error("Failed to create check-in", { error: String(error) });
      persistenceTimer();
      throw error;
    }
  }
  
  /**
   * Store check-in in primary database
   */
  private async storeInPrimaryDatabase(checkIn: any): Promise<void> {
    try {
      await dbBreaker.execute(async () => {
        await prisma.checkIn.create({
          data: {
            id: checkIn.id,
            deviceId: checkIn.deviceId,
            regionHash: checkIn.regionHash,
            emotion: checkIn.emotion,
            intensity: checkIn.intensity,
            note: checkIn.note,
            createdAt: checkIn.timestamp,
            processedAt: null,
            deviceType: checkIn.deviceType,
            deviceHash: checkIn.deviceHash,
            userAgent: checkIn.userAgent,
            sessionId: checkIn.sessionId,
            dataRetention: checkIn.dataRetention,
            privacyVersion: checkIn.privacyVersion,
            latitude: checkIn.latitude,
            longitude: checkIn.longitude,
          },
        });
        
        metrics.increment('check_in_stored');
      });
    } catch (error) {
      metrics.increment('check_in_db_error');
      logger.error("Failed to store check-in in primary database", { 
        error: String(error),
        checkInId: checkIn.id 
      });
      throw error;
    }
  }
  
  /**
   * Store check-in in time-series database for analytics
   */
  private async storeInTimeseriesDatabase(checkIn: any): Promise<void> {
    try {
      // Use circuit breaker to prevent TimescaleDB failures from blocking check-ins
      await timescaleBreaker.execute(async () => {
        // Store in time-series database if available
        if (timescaleDB) {
          await timescaleDB.query(`
            INSERT INTO emotion_events 
            (check_in_id, device_id, emotion, intensity, region_hash, time) 
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            checkIn.id,
            checkIn.deviceId,
            checkIn.emotion,
            checkIn.intensity,
            checkIn.regionHash,
            checkIn.timestamp
          ]);
        }
      });
    } catch (error) {
      // Non-blocking - log error but allow check-in to succeed
      logger.warn("Failed to store check-in in time-series database", { 
        error: String(error),
        checkInId: checkIn.id
      });
    }
  }
  
  /**
   * Update user streak and check-in history
   */
  private async updateStreakAndHistory(deviceId: string, emotion: string): Promise<void> {
    try {
      // Use circuit breaker to prevent Redis failures from blocking check-ins
      await redisBreaker.execute(async () => {
        const now = new Date();
        const dateKey = this.formatDateKey(now);
        const streakKey = `${STREAK_KEY_PREFIX}${deviceId}`;
        const historyKey = `${DEVICE_HISTORY_PREFIX}${deviceId}`;
        
        // Get current streak (multi to ensure atomicity)
        const multi = redis.multi();
        
        // Store today's check-in
        multi.hset(streakKey, dateKey, emotion);
        
        // Set expiry to ensure data eventually gets cleaned up
        multi.expire(streakKey, STREAK_EXPIRY);
        
        // Add to history list (right push for chronological order)
        multi.rpush(historyKey, JSON.stringify({
          date: now.toISOString(),
          emotion,
          key: dateKey
        }));
        
        // Trim history list to prevent unbounded growth
        multi.ltrim(historyKey, -MAX_HISTORY_ITEMS, -1);
        
        // Set expiry on history too
        multi.expire(historyKey, STREAK_EXPIRY);
        
        // Execute all commands
        await multi.exec();
      });
    } catch (error) {
      metrics.increment('check_in_redis_error');
      logger.warn("Failed to update streak data", { 
        error: String(error),
        deviceId
      });
      // Non-blocking error - allow check-in to succeed
    }
  }
  
  /**
   * Publish check-in to real-time streaming platforms
   */
  private async publishToStreamingPlatforms(checkIn: any): Promise<void> {
    try {
      // Prepare a sanitized event for streaming (no PII)
      const streamEvent = {
        id: checkIn.id,
        emotion: checkIn.emotion,
        intensity: checkIn.intensity,
        region: checkIn.regionHash,
        timestamp: checkIn.timestamp.toISOString(),
      };
      
      // Send to Kafka for stream processing
      try {
        await kafkaBreaker.execute(async () => {
          await produceEvent('check-ins', streamEvent);
        });
      } catch (error) {
        metrics.increment('check_in_kafka_error');
        logger.warn("Failed to publish check-in to Kafka", { 
          error: String(error),
          checkInId: checkIn.id 
        });
        // Non-blocking error
      }
      
      // Push to WebSocket clients
      try {
        // This is deliberately not behind a circuit breaker since it's just a broadcast
        // to existing connections and doesn't affect persistence
        await publishToWebSocket('check-ins', streamEvent);
      } catch (error) {
        logger.debug("Failed to publish check-in to WebSocket", { 
          error: String(error),
          checkInId: checkIn.id 
        });
        // Non-blocking error
      }
    } catch (error) {
      logger.warn("Failed to publish check-in to streaming platforms", { 
        error: String(error),
        checkInId: checkIn.id 
      });
      // Non-blocking error - allow check-in to succeed
    }
  }
  
  /**
   * Get user's current streak
   */
  async getStreak(deviceId: string): Promise<number> {
    // Use SQLite implementation if available
    if (usingSQLite && sqliteService) {
      return sqliteService.getStreak(deviceId);
    }
    
    try {
      return await redisBreaker.execute(async () => {
        const streakKey = `${STREAK_KEY_PREFIX}${deviceId}`;
        const streak = await redis.hgetall(streakKey);
        
        if (!streak || Object.keys(streak).length === 0) {
          return 1; // First check-in
        }
        
        const today = this.formatDateKey(new Date());
        
        // If no check-in today yet, don't count today
        if (!streak[today]) {
          return 1; // Reset streak since it's not continuous
        }
        
        // Count consecutive days backwards
        let consecutiveDays = 1; // Today
        let currentDate = new Date();
        
        for (let i = 1; i <= 365; i++) { // Max 365 days back
          currentDate.setDate(currentDate.getDate() - 1);
          const dateKey = this.formatDateKey(currentDate);
          
          if (streak[dateKey]) {
            consecutiveDays++;
          } else {
            break; // Streak broken
          }
        }
        
        return consecutiveDays;
      });
    } catch (error) {
      logger.warn("Failed to calculate streak", { 
        error: String(error),
        deviceId 
      });
      return 1; // Default to 1 if we can't calculate
    }
  }
  
  /**
   * Get user's check-in history
   */
  async getHistory(deviceId: string, limit: number = 30): Promise<any[]> {
    // Use SQLite implementation if available
    if (usingSQLite && sqliteService) {
      return sqliteService.getHistory(deviceId, limit);
    }
    
    try {
      return await redisBreaker.execute(async () => {
        const historyKey = `${DEVICE_HISTORY_PREFIX}${deviceId}`;
        const history = await redis.lrange(historyKey, -limit, -1);
        
        return history.map((item: string) => JSON.parse(item));
      });
    } catch (error) {
      logger.warn("Failed to get check-in history", { 
        error: String(error),
        deviceId 
      });
      return []; // Empty array if we can't fetch history
    }
  }
  
  /**
   * Format date for streak storage (YYYY-MM-DD)
   */
  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
  
  
  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent?: string): string {
    if (!userAgent) return 'OTHER';
    
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile')) return 'MOBILE';
    if (ua.includes('tablet')) return 'TABLET';
    if (ua.includes('ipad')) return 'TABLET';
    if (ua.includes('android') && !ua.includes('mobile')) return 'TABLET';
    if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) return 'DESKTOP';
    
    return 'OTHER';
  }
  
  /**
   * Normalize emotion to match our schema
   */
  private normalizeEmotion(emotion: string): string {
    // Convert first letter to uppercase and rest to lowercase
    const normalized = emotion.charAt(0).toUpperCase() + emotion.slice(1).toLowerCase();
    
    // Validate against our list of valid emotions
    if (VALID_EMOTIONS.includes(normalized as any)) {
      return normalized;
    }
    
    // Handle aliases/synonyms
    const emotionMap: Record<string, string> = {
      'happy': 'Joy',
      'content': 'Calm',
      'anxious': 'Stress',
      'excited': 'Anticipation',
      'peaceful': 'Calm',
      'angry': 'Stress',
      'frustrated': 'Stress',
      'cheerful': 'Joy',
      'relaxed': 'Calm',
      'worried': 'Stress',
      'joyful': 'Joy',
      'afraid': 'Stress',
      'tired': 'Sadness',
      'sad': 'Sadness',
      'upset': 'Sadness',
    };
    
    // Look up in map (case-insensitive)
    const normalizedKey = emotion.toLowerCase();
    if (normalizedKey in emotionMap) {
      return emotionMap[normalizedKey];
    }
    
    // Default to the first valid emotion if no match found
    logger.warn(`Unrecognized emotion normalized: ${emotion} -> ${VALID_EMOTIONS[0]}`);
    return VALID_EMOTIONS[0];
  }
}