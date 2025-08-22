// src/types/ads.ts
export interface Ad {
    id: string;
    type: 'native' | 'banner' | 'suggestion';
    content: AdContent;
    placement: AdPlacement;
    targeting: AdTargeting;
    performance: AdPerformance;
  }
  
  export interface AdContent {
    title: string;
    description: string;
    imageUrl?: string;
    callToAction: string;
    link?: string;
  }
  
  export interface AdPlacement {
    position: 'feed' | 'sidebar' | 'modal';
    size: {
      width: number;
      height: number;
    };
    style?: Record<string, string>;
  }
  
  export interface AdTargeting {
    emotions: string[];
    regions: string[];
    timeRanges: string[];
    intensity?: {
      min: number;
      max: number;
    };
  }
  
  export interface AdPerformance {
    impressions: number;
    clicks: number;
    ctr: number;
    averageViewTime: number;
  }