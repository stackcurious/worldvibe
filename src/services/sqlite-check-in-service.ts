// @ts-nocheck
// src/services/sqlite-check-in-service.ts
import { randomUUID } from "crypto";
import prisma from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";
import { sanitizeText } from "@/lib/utils";
import { VALID_EMOTIONS } from "@/config/emotions";
import { CircuitBreaker } from "@/lib/circuit-breaker";
import { parseJSON, stringifyJSON } from "@/lib/db/sqlite-adapter";
import { regionHasher } from "@/lib/privacy/region-hash";
import { getDeviceIdentifier, updateDeviceRegion } from "@/lib/privacy/device-identifier";

// Type definitions
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
metrics.registerCounter('check_in_db_error', 'Database errors during check-in');
metrics.registerHistogram('check_in_persistence_time', 'Time to persist check-in to all stores');

// Circuit breakers for external services
const dbBreaker = new CircuitBreaker({
  service: 'database',
  failureThreshold: 3,
  resetTimeout: 30000,
  maxRetries: 2,
});

// Memory-based storage for streaks since we don't have Redis
const streakStorage = new Map<string, Record<string, string>>();
const historyStorage = new Map<string, Array<{date: string, emotion: string, key: string}>>();

/**
 * Simplified Service for check-ins with SQLite backend
 */
export class SQLiteCheckInService {
  /**
   * Create a new check-in, normalize data, and store in SQLite
   */
  async createCheckIn(params: CreateCheckInParams): Promise<CheckInResult> {
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
      
      // Store check-in in database
      await this.storeInDatabase({
        id,
        deviceId: params.deviceId,
        deviceHash: params.deviceFingerprint,
        emotion: normalizedEmotion,
        intensity: params.intensity,
        note: params.note ? sanitizeText(params.note) : null,
        regionHash: params.regionHash,
        timestamp: params.timestamp,
        coordinates: params.coordinates,
        sessionId: params.sessionId,
        userAgent: params.userAgent,
        dataRetention,
        deviceType: this.detectDeviceType(params.userAgent),
      });
      
      // Update streak and history in memory
      await this.updateStreakAndHistory(params.deviceId, normalizedEmotion);
      
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
   * Store check-in in SQLite database
   */
  private async storeInDatabase(checkIn: any): Promise<void> {
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
            privacyVersion: 1,
            // Handle coordinates for SQLite
            ...(checkIn.coordinates ? {
              latitude: checkIn.coordinates.latitude,
              longitude: checkIn.coordinates.longitude,
            } : {}),
          },
        });
        
        metrics.increment('check_in_stored');
      });
    } catch (error) {
      metrics.increment('check_in_db_error');
      logger.error("Failed to store check-in in database", { 
        error: String(error),
        checkInId: checkIn.id 
      });
      throw error;
    }
  }
  
  /**
   * Update user streak and check-in history (in-memory version since no Redis)
   */
  private async updateStreakAndHistory(deviceId: string, emotion: string): Promise<void> {
    try {
      const now = new Date();
      const dateKey = this.formatDateKey(now);
      
      // Update streak
      if (!streakStorage.has(deviceId)) {
        streakStorage.set(deviceId, {});
      }
      
      const streak = streakStorage.get(deviceId)!;
      streak[dateKey] = emotion;
      
      // Update history
      if (!historyStorage.has(deviceId)) {
        historyStorage.set(deviceId, []);
      }
      
      const history = historyStorage.get(deviceId)!;
      history.push({
        date: now.toISOString(),
        emotion,
        key: dateKey
      });
      
      // Trim history to prevent unbounded growth
      if (history.length > MAX_HISTORY_ITEMS) {
        history.splice(0, history.length - MAX_HISTORY_ITEMS);
      }
      
    } catch (error) {
      logger.warn("Failed to update streak data", { 
        error: String(error),
        deviceId
      });
      // Non-blocking error - allow check-in to succeed
    }
  }
  
  /**
   * Get user's current streak
   */
  async getStreak(deviceId: string): Promise<number> {
    try {
      const streak = streakStorage.get(deviceId);
      
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
    try {
      const history = historyStorage.get(deviceId) || [];
      return history.slice(-limit);
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