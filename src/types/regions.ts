// src/types/regions.ts
export interface RegionTrend {
  regionHash: string;
  name?: string;
  metrics: {
    emotion: string;
    intensity: number;
    count: number;
    trend: 'up' | 'down' | 'stable';
    percentageChange: number;
  }[];
  topEmotions: Array<{
    emotion: string;
    percentage: number;
    intensity: number;
  }>;
  timeSeriesData: Array<{
    timestamp: string;
    emotions: Record<string, number>;
  }>;
}

export interface RegionalInsights {
  dominantEmotion: string;
  averageIntensity: number;
  uniqueUsers: number;
  emotionalShift?: {
    from: string;
    to: string;
    timestamp: string;
  };
}