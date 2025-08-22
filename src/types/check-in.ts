// src/types/check-in.ts
import { z } from 'zod';

export const CheckInSchema = z.object({
  id: z.string().uuid(),
  token: z.string().min(32).max(64),
  region: z.string().min(2).max(100),
  emotion: z.enum(['Joy', 'Calm', 'Stress', 'Anticipation', 'Sadness']),
  intensity: z.number().int().min(1).max(5),
  context: z.string().max(100).optional(),
  deviceHash: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional()
});

export type CheckIn = z.infer<typeof CheckInSchema>;

export interface CheckInResponse {
  success: boolean;
  data?: CheckIn;
  error?: string;
  nextAllowedCheckIn?: string;
}

export interface CheckInStats {
  streakCount: number;
  totalCheckIns: number;
  lastCheckIn: string | null;
  commonEmotions: Array<{
    emotion: string;
    count: number;
    percentage: number;
  }>;
}