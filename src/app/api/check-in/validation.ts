// src/app/api/check-in/validation.ts
import { z } from "zod";
import { VALID_EMOTIONS } from "@/config/emotions";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";

// Register metric for content moderation
metrics.registerCounter(
  'check_in_moderation_rejected', 
  'Number of check-ins rejected by content moderation',
  ['reason']
);

// Type for validated check-in data
export type CheckInRequest = {
  emotion: string;
  intensity: number;
  note?: string;
  region?: string;
  timestamp?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

/**
 * Validates and sanitizes a check-in request
 * Performs deep validation beyond schema validation
 */
export async function validateCheckIn(data: CheckInRequest): Promise<void> {
  try {
    // Validate note content if provided
    if (data.note) {
      await validateNoteContent(data.note);
    }

    // Validate timestamp if provided
    if (data.timestamp) {
      validateTimestamp(data.timestamp);
    }

    // Validate region if provided
    if (data.region) {
      validateRegion(data.region);
    }

    // Validate coordinates if provided
    if (data.coordinates) {
      validateCoordinates(data.coordinates);
    }
  } catch (error) {
    logger.warn('Check-in validation error', { error: String(error) });
    throw error;
  }
}

/**
 * Validates note content with content moderation rules
 */
async function validateNoteContent(note: string): Promise<void> {
  // Simple profanity/content filtering
  const profanityPatterns = [
    /\b(fuck|shit|ass|bitch|cunt|dick|pussy|cock|whore|slut)\b/i,
    /\b(nigger|faggot|retard|spic|chink|kike|wetback|towelhead)\b/i,
  ];

  for (const pattern of profanityPatterns) {
    if (pattern.test(note)) {
      metrics.increment('check_in_moderation_rejected', 1, { reason: 'profanity' });
      throw new Error("Note contains prohibited content");
    }
  }

  // Detect potential personally identifiable information
  const piiPatterns = [
    // Phone numbers
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    // Email addresses
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
    // Social security numbers
    /\b\d{3}[-]?\d{2}[-]?\d{4}\b/,
    // Credit card numbers (basic pattern)
    /\b(?:\d{4}[-\s]?){3}\d{4}\b/,
    // URLs
    /https?:\/\/[^\s]+/,
  ];

  for (const pattern of piiPatterns) {
    if (pattern.test(note)) {
      metrics.increment('check_in_moderation_rejected', 1, { reason: 'pii' });
      throw new Error("Note may not contain personal information");
    }
  }

  // Check for potential spam or abuse patterns
  if (note.length > 10 && 
      (note === note.toUpperCase() || 
        /(.)\1{4,}/.test(note) || // Repeated characters
        /\b(\w+)\b.*\b\1\b.*\b\1\b.*\b\1\b/i.test(note)) // Repeated words
      ) {
    metrics.increment('check_in_moderation_rejected', 1, { reason: 'spam_pattern' });
    throw new Error("Note contains spam patterns");
  }
}

/**
 * Validates timestamp is reasonable
 */
function validateTimestamp(timestamp: string): void {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Check if timestamp is in the future (allowing for clock skew)
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    if (date > fiveMinutesFromNow) {
      throw new Error("Timestamp cannot be in the future");
    }
    
    // Check if timestamp is too far in the past (older than 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (date < sevenDaysAgo) {
      throw new Error("Timestamp cannot be more than 7 days in the past");
    }
  } catch (error) {
    throw new Error("Invalid timestamp format or value");
  }
}

/**
 * Validates region code
 */
function validateRegion(region: string): void {
  // Check if region is a valid format (country code, country-region, etc.)
  const validRegionPattern = /^([A-Z]{2}(-[A-Z0-9]{1,3})?|GLOBAL)$/i;
  
  if (!validRegionPattern.test(region)) {
    throw new Error("Invalid region format");
  }
}

/**
 * Validates coordinates are valid land coordinates (not in the ocean)
 */
function validateCoordinates(coordinates: { latitude: number; longitude: number }): void {
  const { latitude, longitude } = coordinates;
  
  // Additional validation beyond basic range checks
  // Check if coordinates are not 0,0 (null island)
  if (Math.abs(latitude) < 0.0001 && Math.abs(longitude) < 0.0001) {
    throw new Error("Invalid coordinates");
  }
  
  // The following are examples of excluded coordinate ranges
  // Exclude certain ocean areas (example: middle of Pacific)
  if (latitude > -40 && latitude < 40 && 
      longitude > 160 && longitude < -140) {
    throw new Error("Invalid location");
  }
  
  // Exclude Antarctica
  if (latitude < -60) {
    throw new Error("Unsupported region");
  }
  
  // Exclude Arctic
  if (latitude > 80) {
    throw new Error("Unsupported region");
  }
}