// src/types/analytics.ts
export interface AnalyticsData {
    id: string;
    timestamp: string;
    metrics: EmotionMetrics;
    trends: TrendData[];
    regional: RegionalData;
    comparisons: ComparisonData;
  }
  
  export interface EmotionMetrics {
    emotion: string;
    avgIntensity: number;
    count: number;
    percentageChange: number;
    dominant: boolean;
  }
  
  export interface TrendData {
    timeframe: string;
    data: Array<{
      timestamp: string;
      emotion: string;
      value: number;
      baseline: number;
    }>;
  }
  
  export interface RegionalData {
    regionHash: string;
    metrics: EmotionMetrics[];
    topRegions: Array<{
      region: string;
      dominantEmotion: string;
      intensity: number;
    }>;
  }
  
  export interface ComparisonData {
    previousPeriod: EmotionMetrics[];
    yearOverYear?: EmotionMetrics[];
  }
  
  export type TimeRange = '1h' | '24h' | '7d' | '30d' | '90d';
  