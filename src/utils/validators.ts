// src/utils/validators.ts
import { z } from 'zod';
import { CheckInSchema } from '@/types/check-in';

// Intensity constants
const MIN_INTENSITY = 1;
const MAX_INTENSITY = 5;

export class Validator {
  static validateCheckIn(data: unknown) {
    return CheckInSchema.safeParse(data);
  }

  static validateRegion(region: string): boolean {
    return /^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(region);
  }

  static validateIntensity(intensity: number): boolean {
    return Number.isInteger(intensity) && 
           intensity >= MIN_INTENSITY && 
           intensity <= MAX_INTENSITY;
  }

  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .slice(0, 100);
  }
}