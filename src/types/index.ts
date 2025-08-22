// src/types/index.ts
// =====================================================
// WorldVibe - Comprehensive Type Definitions
// =====================================================
//
// This file houses all major types used across the app,
// organized by domain for production-grade robustness.
//
// Last updated: 2025-02-19
// =====================================================

// -----------------------------------------------------
// 1. General Utility Types
// -----------------------------------------------------
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  metadata?: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    hasNextPage: boolean;
  };
}

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;
  isOperational?: boolean;
}

/**
 * Optional<T> - makes all fields optional.
 */
export type Optional<T> = {
  [P in keyof T]?: T[P];
};

/**
 * DeepPartial<T> - recursive partial.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Immutable<T> - makes type deeply readonly
 */
export type Immutable<T> = {
  readonly [P in keyof T]: T[P] extends object ? Immutable<T[P]> : T[P];
};

// -----------------------------------------------------
// 2. User / Auth Types
// -----------------------------------------------------
export interface UserPreferences {
  theme?: "light" | "dark" | "system";
  notifications?: boolean;
  region?: string;
  language?: string;
  emailFrequency?: "daily" | "weekly" | "never";
  privacySettings?: {
    shareAnalytics: boolean;
    shareLocation: boolean;
    advertisingConsent: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Date;
  lastLogin?: Date;
}

export type AuthStatus = "authenticated" | "unauthenticated" | "loading";

// -----------------------------------------------------
// 3. Emotions & Mood
// -----------------------------------------------------
export interface EmotionData {
  emotion: string;
  count: number;
  color?: string;
  percentage?: number;
}

export interface MoodData {
  id: string;
  emotion: string;
  intensity: number;
  note?: string;
  timestamp: string; // or Date if you parse it as a Date
  userId?: string;
  region?: string;
  tags?: string[];
  source?: "manual" | "detected" | "imported";
}

export type EmotionIntensity = "low" | "medium" | "high" | number;

// -----------------------------------------------------
// 4. Check-In
// -----------------------------------------------------
/**
 * CheckIn - an individual user check‑in with mood/emotion data.
 */
export interface CheckIn {
  id: string;
  userId: string;
  emotion: string;
  intensity: number;
  region: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  device?: string;
  appVersion?: string;
}

/**
 * CheckInData - payload for creating/fetching check‑ins.
 */
export interface CheckInData {
  userId: string;
  emotion: string;
  intensity: number;
  region: string;
  timestamp: Date;
  note?: string;
  tags?: string[];
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export interface CheckInFilters {
  userId?: string;
  emotion?: string | string[];
  region?: string | string[];
  timeRange?: {
    from: Date;
    to: Date;
  };
  minIntensity?: number;
  maxIntensity?: number;
}

// -----------------------------------------------------
// 5. Ads & Targeting
// -----------------------------------------------------
/**
 * AdContent - the content displayed in an advertisement.
 */
export interface AdContent {
  title: string;
  description: string;
  cta: string;
  imageUrl?: string;
  placement: "feed" | "sidebar" | "native";
  formats?: {
    mobile?: {
      imageUrl: string;
      dimensions: { width: number; height: number };
    };
    desktop?: {
      imageUrl: string;
      dimensions: { width: number; height: number };
    };
  };
}

/**
 * TargetingRules - rules defining which ads match user attributes.
 */
export interface TargetingRules {
  emotions: string[];
  regions: string[];
  timeRanges: string[];
  minIntensity?: number;
  maxIntensity?: number;
  deviceTypes?: ("mobile" | "tablet" | "desktop")[];
  userSegments?: string[];
  excludedSegments?: string[];
}

/**
 * AdPlacement - basic ad placement details.
 */
export interface AdPlacement {
  id: string;
  adType: string;
  content: AdContent;
  priority: number;
  targeting: TargetingRules;
  startDate?: Date;
  endDate?: Date;
  budget?: {
    total: number;
    spent: number;
    currency: string;
  };
}

/**
 * Ad - extended ad type that may include recommendations or other data.
 */
export interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  url: string;
  category: string;
  dimensions: {
    width: number;
    height: number;
  };
  placement?: string;
  content?: AdContent;
  targeting?: TargetingRules;
  relevanceScore?: number;
  recommendations?: any[];
  expiresAt?: Date;
  impressionPixel?: string;
  clickPixel?: string;
  viewPixel?: string;
  metadata?: Record<string, any>;
}

/**
 * AdTargetingRequest - shape of the targeting parameters
 * the server expects for returning ads.
 */
export interface AdTargetingRequest {
  emotion: string;
  region: string;
  timestamp: Date;
  intensity?: string;
  deviceType?: string;
  timeOfDay?: string;
  userId?: string;
  sessionId?: string;
}

/**
 * PlacementContext - details describing how ads should be placed:
 * sizing, maximum ads allowed, etc.
 */
export interface PlacementContext {
  size: {
    width: number;
    height: number;
  };
  maxAds: number;
  placement?: 'feed' | 'sidebar' | 'article' | 'popup';
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  position?: 'top' | 'middle' | 'bottom';
  format?: 'image' | 'video' | 'carousel' | 'native';
  viewportSize?: {
    width: number;
    height: number;
  };
}

/**
 * AdContext - context containing user and environment information for ad targeting
 */
export interface AdContext {
  emotion: string;
  intensity?: string;
  region: string;
  timeOfDay?: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  interests?: string[];
  recentViews?: string[];
  preferences?: Record<string, any>;
  consent?: {
    personalization: boolean;
    thirdParty: boolean;
  };
}

/**
 * AdPerformanceMetrics - ad performance analytics data
 */
export interface AdPerformanceMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  viewability: number;
  ctr: number;
  completionRate?: number;
  engagementTime?: number;
}

/**
 * AdTargetingResponse - response structure for ad targeting API
 */
export interface AdTargetingResponse {
  ads: Ad[];
  requestId: string;
  cached: boolean;
  expiresAt?: Date;
}

// -----------------------------------------------------
// 6. Analytics, Insights & Events
// -----------------------------------------------------
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
  deviceInfo?: {
    type: string;
    os: string;
    browser: string;
  };
}

export interface AnalyticsResponse {
  success: boolean;
  events?: AnalyticsEvent[];
  error?: string;
  processingTime?: number;
}

/**
 * RegionTrends - an example for storing region-specific trend data.
 */
export interface RegionTrends {
  region: string;
  trend: TrendData[];
  dominantEmotion: string;
  checkInCount: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface InsightData {
  id: string;
  title: string;
  description: string;
  category: string;
  source: string;
  timestamp: Date;
  metrics: Record<string, number>;
  trend?: TrendData[];
}

// -----------------------------------------------------
// 7. Geographic Types
// -----------------------------------------------------
export interface GeoFeature {
  type: string;
  properties: {
    name: string;
    code: string;
    population?: number;
    areaKm2?: number;
    timezone?: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

export interface GeoData {
  type: string;
  features: GeoFeature[];
  metadata?: {
    generatedAt: string;
    source: string;
    version: string;
  };
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

// -----------------------------------------------------
// 8. Charts & Visualization
// -----------------------------------------------------
export interface DataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
  tooltip?: string;
  data?: any;
}

export interface TrendData {
  id: string;
  color: string;
  data: DataPoint[];
  name?: string;
  category?: string;
  metadata?: Record<string, any>;
}

/**
 * RegionalData - for region-based analytics, e.g. a heatmap.
 */
export interface RegionalData {
  regionCode: string;
  emotionalIndex: number;
  dominantEmotion: string;
  averageIntensity: number;
  checkInCount: number;
  lastUpdated?: string;
  change?: {
    emotionalIndex: number;
    dominantEmotion?: string;
    checkInCount: number;
  };
  breakdown?: Record<string, number>;
}

export interface ChartConfig {
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  legend?: boolean;
  colors?: string[];
  animations?: boolean;
  tooltip?: boolean;
  height?: number;
  width?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// -----------------------------------------------------
// 9. Distribution & Global Stats
// -----------------------------------------------------
export interface EmotionDistributionData {
  id: string;
  label: string;
  value: number;
  color: string;
  percentage?: number;
  change?: number;
}

export interface GlobalStats {
  totalCheckIns: number;
  activeCountries: number;
  trendingEmotion: string;
  averageIntensity: number;
  dailyGrowth: number;
  updatedAt: Date;
  periodComparisonStats?: {
    checkInGrowth: number;
    emotionShift: Record<string, number>;
    newRegions: number;
  };
}

export interface GlobalInsightsData {
  /**
   * A list of region-based metrics.
   */
  regionalData: RegionalData[];

  /**
   * Data for an emotion distribution pie chart.
   */
  emotionDistribution: EmotionDistributionData[];

  /**
   * A list of time-series trends, e.g. for a line chart.
   */
  trends: TrendData[];

  /**
   * Optional - high‑level stats about check-ins, trending emotion, etc.
   */
  globalStats?: GlobalStats;
  
  /**
   * Time range this data represents
   */
  timeRange: {
    from: Date;
    to: Date;
    label: TimeRange;
  };
}

// -----------------------------------------------------
// 10. Time Ranges & Chart Controls
// -----------------------------------------------------
/**
 * TimeRange - if your code references "24h", "7d", "30d", or "custom".
 */
export type TimeRange = "24h" | "7d" | "30d" | "90d" | "custom";

/**
 * Timeframe - if your hooks / components specifically use "24h" | "week" | "month"
 * or any other combination. Adjust as needed.
 */
export type Timeframe = "24h" | "7d" | "30d" | "week" | "month" | "quarter" | "year";

/**
 * TimeOfDay - represents different parts of the day for targeting
 */
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

/**
 * ChartOptions - optional example type for chart controls.
 */
export interface ChartOptions {
  timeframe?: TimeRange;
  region?: string;
  emotion?: string;
  comparison?: boolean;
  aggregate?: "sum" | "average" | "median";
  interval?: "hour" | "day" | "week" | "month";
  filters?: Record<string, any>;
  smoothing?: number;
}

// -----------------------------------------------------
// 11. Theme & Styling
// -----------------------------------------------------
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  surface: string;
  muted: string;
}

export enum EmotionType {
  JOYFUL = "joyful",
  PEACEFUL = "peaceful",
  STRESSED = "stressed",
  ANXIOUS = "anxious",
  ENERGETIC = "energetic",
  TIRED = "tired",
  GRATEFUL = "grateful",
  EXCITED = "excited",
  CONTENT = "content",
  FRUSTRATED = "frustrated",
  BORED = "bored",
  HOPEFUL = "hopeful",
}

export enum ChartType {
  LINE = "line",
  BAR = "bar",
  PIE = "pie",
  AREA = "area",
  SCATTER = "scatter",
  RADAR = "radar",
  HEATMAP = "heatmap",
  BUBBLE = "bubble",
}

// -----------------------------------------------------
// 12. Hooks Return Types
// -----------------------------------------------------
export interface UseAnalyticsReturn {
  trackEvent: (name: string, properties?: Record<string, any>) => void;
  pageView: (page: string) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  group?: (groupId: string, traits?: Record<string, any>) => void;
  reset: () => void;
  isInitialized: boolean;
}

export interface UseThemeReturn {
  theme: string;
  setTheme: (theme: string) => void;
  systemTheme?: string;
  isDark: boolean;
  colors: ThemeColors;
}

export interface UseCheckInsReturn {
  checkIns: CheckIn[];
  isLoading: boolean;
  error: Error | null;
  fetchCheckIns: (filters?: CheckInFilters) => Promise<void>;
  createCheckIn: (data: CheckInData) => Promise<CheckIn>;
  updateCheckIn: (id: string, data: Partial<CheckInData>) => Promise<CheckIn>;
  deleteCheckIn: (id: string) => Promise<boolean>;
}

export interface UseTargetedAdsReturn {
  ads: Ad[];
  isLoading: boolean;
  error: Error | null;
  fetchAds: (context: AdContext) => Promise<Ad[]>;
  refreshAds: () => Promise<Ad[]>;
  markAdSeen: (adId: string) => void;
  markAdClicked: (adId: string) => void;
}

// -----------------------------------------------------
// 13. App Configuration
// -----------------------------------------------------
export interface AppConfig {
  apiUrl: string;
  environment: "development" | "staging" | "production";
  version: string;
  features: {
    analytics: boolean;
    darkMode: boolean;
    sharing: boolean;
    locationServices: boolean;
    offlineMode: boolean;
    adTargeting: boolean;
    premium: boolean;
  };
  theme: {
    colors: ThemeColors;
    spacing: Record<string, string>;
    breakpoints: Record<string, string>;
    fontSizes: Record<string, string>;
    borderRadius: Record<string, string>;
    shadows: Record<string, string>;
  };
  services: {
    sentry?: {
      dsn: string;
      environment: string;
    };
    analytics?: {
      provider: string;
      key: string;
    };
    monitoring?: {
      endpoint: string;
      refreshInterval: number;
    };
  };
  performance: {
    caching: {
      ttl: number;
      maxEntries: number;
    };
    lazyLoading: boolean;
    prefetching: boolean;
  };
}

// -----------------------------------------------------
// 14. Constants
// -----------------------------------------------------
export const EMOTION_COLORS: Record<EmotionType, string> = {
  [EmotionType.JOYFUL]: "#FFB800",
  [EmotionType.PEACEFUL]: "#4CAF50",
  [EmotionType.STRESSED]: "#F44336",
  [EmotionType.ANXIOUS]: "#9C27B0",
  [EmotionType.ENERGETIC]: "#2196F3",
  [EmotionType.TIRED]: "#607D8B",
  [EmotionType.GRATEFUL]: "#00BCD4",
  [EmotionType.EXCITED]: "#FF9800",
  [EmotionType.CONTENT]: "#8BC34A",
  [EmotionType.FRUSTRATED]: "#E91E63",
  [EmotionType.BORED]: "#9E9E9E",
  [EmotionType.HOPEFUL]: "#00BFA5",
};

export const TIME_RANGES: TimeRange[] = ["24h", "7d", "30d", "90d", "custom"];
export const TIMEFRAMES: Timeframe[] = ["24h", "7d", "30d", "week", "month", "quarter", "year"];
export const TIMES_OF_DAY: TimeOfDay[] = ["morning", "afternoon", "evening", "night"];

export const DEFAULT_CHART_HEIGHT = 300;
export const DEFAULT_CHART_WIDTH = 600;
export const DEFAULT_TIMEFRAME: TimeRange = "24h";
export const MAX_ITEMS_PER_PAGE = 50;
export const ANIMATION_DURATION = 300;

// -----------------------------------------------------
// 15. API & Service Types
// -----------------------------------------------------
export interface ServiceOptions {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

export interface ServiceResponse<T> {
  data: T;
  status: number;
  headers?: Record<string, string>;
  duration?: number;
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  signal?: AbortSignal;
  withCredentials?: boolean;
}

// -----------------------------------------------------
// 16. Caching & Storage
// -----------------------------------------------------
export interface CacheEntry<T> {
  data: T;
  expiry: number;
  version: string;
}

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

// -----------------------------------------------------
// 17. Queue & Background Tasks
// -----------------------------------------------------
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface BackgroundTask<T = any> {
  id: string;
  type: string;
  data: T;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
  attempts: number;
  maxAttempts: number;
}

export interface TaskQueueMetrics {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalTasks: number;
  averageProcessingTime: number;
}