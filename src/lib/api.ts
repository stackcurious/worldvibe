// src/lib/api.ts
/**
 * WorldVibe API Client
 * 
 * This module provides a set of functions for interacting with the WorldVibe API.
 * It handles data fetching, error handling, and provides fallback data when needed.
 * 
 * Each function follows a consistent pattern:
 * 1. Attempt to fetch from the appropriate API endpoint
 * 2. Handle successful responses
 * 3. Transform data if necessary
 * 4. Handle errors with appropriate fallbacks
 */

import {
    GlobalInsightsData,
    RegionalData,
    EmotionDistributionData,
    TrendData,
    GeoData,
    CheckIn,
    CheckInPage,
    DashboardStats
  } from '@/types';
  
  /**
   * Fetch dashboard statistics for the stats grid
   * 
   * @returns Promise resolving to dashboard statistics
   */
  export async function fetchDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await fetch("/api/dashboard-stats", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching dashboard statistics:", error);
      
      // Return realistic mock data if API fails
      return {
        activeUsers: 8756,
        userChange: 12.4,
        globalCheckIns: 42381,
        checkInChange: 7.8,
        avgResponse: 1.2,
        responseChange: -5.2,
        engagement: 68,
        engagementChange: 4.3
      };
    }
  }
  
  /**
   * Fetch geographic data for map visualizations
   * 
   * @returns Promise resolving to GeoJSON data
   */
  export async function fetchGeoData(): Promise<GeoData> {
    try {
      const { WORLD_GEOJSON } = await import('@/config/geo');
      return WORLD_GEOJSON;
    } catch (error) {
      console.error("Error fetching geographic data:", error);
      throw error;
    }
  }
  
  /**
   * Fetch personalized recommendations based on user context
   * 
   * @param params - Emotion, intensity, and optional region to base recommendations on
   * @returns Promise resolving to an array of recommendations
   */
  export async function fetchRecommendations(params: {
    emotion: string;
    intensity: number;
    region?: string;
  }): Promise<any[]> {
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      throw error;
    }
  }
  
  /**
   * Fetch global insights data for dashboard visualizations
   * 
   * @returns Promise resolving to global insights data
   */
  export async function fetchGlobalInsights(): Promise<GlobalInsightsData> {
    try {
      const response = await fetch("/api/global-insights", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch global insights: ${response.statusText}`);
      }
      
      // Get the base response
      const baseData = await response.json();
      
      // If the API already returns GlobalInsightsData with all required fields, just return it
      if (baseData.regionalData && baseData.emotionDistribution && baseData.trends) {
        return baseData as GlobalInsightsData;
      }
      
      // Otherwise, enhance the data structure to match GlobalInsightsData
      const [regionalData, emotionDistribution, trends] = await Promise.all([
        fetchRegionalData(),
        fetchEmotionDistribution(),
        fetchTrends()
      ]);
      
      // Create a GlobalInsightsData object
      const insightsData: GlobalInsightsData = {
        totalCheckIns: baseData.totalCheckIns || 0,
        activeCountries: baseData.activeCountries || 0,
        trendingEmotion: baseData.trendingEmotion || 'happy',
        averageIntensity: baseData.averageIntensity || 0,
        dailyGrowth: baseData.dailyGrowth || 0,
        regionalData,
        emotionDistribution,
        trends,
        // Keep globalStats for backward compatibility
        globalStats: {
          totalCheckIns: baseData.totalCheckIns || 0,
          activeCountries: baseData.activeCountries || 0,
          trendingEmotion: baseData.trendingEmotion || 'happy',
          averageIntensity: baseData.averageIntensity || 0,
          dailyGrowth: baseData.dailyGrowth || 0,
        }
      };
      
      return insightsData;
    } catch (error) {
      console.error("Error fetching global insights:", error);
      throw error;
    }
  }
  
  /**
   * Fetch regional data for geographic visualizations
   * 
   * @returns Promise resolving to regional data array
   */
  async function fetchRegionalData(): Promise<RegionalData[]> {
    try {
      const response = await fetch("/api/regional-data");
      if (response.ok) {
        return await response.json();
      }
      
      // Fallback mock data if API fails or isn't implemented yet
      return [
        {
          regionCode: 'US',
          emotionalIndex: 0.75,
          dominantEmotion: 'happy',
          averageIntensity: 0.7,
          checkInCount: 2500,
          lastUpdated: new Date().toISOString()
        },
        {
          regionCode: 'CA',
          emotionalIndex: 0.82,
          dominantEmotion: 'content',
          averageIntensity: 0.8,
          checkInCount: 1200,
          lastUpdated: new Date().toISOString()
        },
        {
          regionCode: 'MX',
          emotionalIndex: 0.68,
          dominantEmotion: 'peaceful',
          averageIntensity: 0.65,
          checkInCount: 980,
          lastUpdated: new Date().toISOString()
        },
        {
          regionCode: 'GB',
          emotionalIndex: 0.71,
          dominantEmotion: 'content',
          averageIntensity: 0.69,
          checkInCount: 1850,
          lastUpdated: new Date().toISOString()
        },
        {
          regionCode: 'FR',
          emotionalIndex: 0.77,
          dominantEmotion: 'joyful',
          averageIntensity: 0.72,
          checkInCount: 1420,
          lastUpdated: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error("Error fetching regional data:", error);
      // Return minimal mock data on error
      return [
        {
          regionCode: 'US',
          emotionalIndex: 0.75,
          dominantEmotion: 'happy',
          averageIntensity: 0.7,
          checkInCount: 2500,
          lastUpdated: new Date().toISOString()
        }
      ];
    }
  }
  
  /**
   * Fetch emotion distribution data for pie charts
   * 
   * @returns Promise resolving to emotion distribution data
   */
  async function fetchEmotionDistribution(): Promise<EmotionDistributionData[]> {
    try {
      const response = await fetch("/api/emotion-distribution");
      if (response.ok) {
        return await response.json();
      }
      
      // Fallback mock data with realistic distribution
      return [
        { id: 'happy', label: 'Happy', value: 45, color: '#FFB800' },
        { id: 'content', label: 'Content', value: 20, color: '#4CAF50' },
        { id: 'sad', label: 'Sad', value: 15, color: '#2196F3' },
        { id: 'anxious', label: 'Anxious', value: 10, color: '#9C27B0' },
        { id: 'angry', label: 'Angry', value: 10, color: '#F44336' }
      ];
    } catch (error) {
      console.error("Error fetching emotion distribution:", error);
      // Return minimal mock data on error
      return [
        { id: 'happy', label: 'Happy', value: 100, color: '#FFB800' }
      ];
    }
  }
  
  /**
   * Fetch trend data for time-series visualizations
   * 
   * @returns Promise resolving to trend data
   */
  async function fetchTrends(): Promise<TrendData[]> {
    try {
      const response = await fetch("/api/trends");
      if (response.ok) {
        return await response.json();
      }
      
      // Generate realistic trend data
      return generateMockTrends();
    } catch (error) {
      console.error("Error fetching trends:", error);
      // Return minimal mock data on error
      return [
        {
          id: 'happiness-trend',
          color: '#FFB800',
          data: [
            { x: '2025-01-01', y: 50 },
            { x: '2025-02-01', y: 60 }
          ]
        }
      ];
    }
  }
  
  /**
   * Generate realistic mock trend data
   */
  function generateMockTrends(): TrendData[] {
    const today = new Date();
    const happinessData = [];
    const contentmentData = [];
    const anxietyData = [];
    
    // Generate realistic data with gentle trends
    let happinessValue = 50 + Math.random() * 10;
    let contentmentValue = 40 + Math.random() * 10;
    let anxietyValue = 30 + Math.random() * 10;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Add some randomness but maintain trends
      happinessValue += (Math.random() - 0.5) * 4;
      contentmentValue += (Math.random() - 0.5) * 3;
      anxietyValue += (Math.random() - 0.48) * 5; // Slight upward trend
      
      // Keep values in reasonable ranges
      happinessValue = Math.max(30, Math.min(70, happinessValue));
      contentmentValue = Math.max(25, Math.min(60, contentmentValue));
      anxietyValue = Math.max(20, Math.min(50, anxietyValue));
      
      happinessData.push({ x: dateString, y: happinessValue });
      contentmentData.push({ x: dateString, y: contentmentValue });
      anxietyData.push({ x: dateString, y: anxietyValue });
    }
    
    return [
      {
        id: 'happiness-trend',
        color: '#FFB800',
        data: happinessData
      },
      {
        id: 'contentment-trend',
        color: '#4CAF50',
        data: contentmentData
      },
      {
        id: 'anxiety-trend',
        color: '#9C27B0',
        data: anxietyData
      }
    ];
  }
  
  /**
   * Fetch check-ins with pagination support
   * 
   * @param pageParam - The cursor/page number for pagination
   * @returns Promise resolving to paginated check-in response
   */
  export async function fetchCheckIns(pageParam: number = 1): Promise<CheckInPage> {
    try {
      const response = await fetch(`/api/check-ins?page=${pageParam}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch check-ins: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle different API response formats
      if (data.items && (data.nextCursor !== undefined)) {
        return data;
      }
      
      // Format response to match expected structure
      return {
        items: Array.isArray(data) ? data : (data.items || []),
        nextCursor: pageParam < 5 ? pageParam + 1 : null, // Mock pagination logic
        totalCount: Array.isArray(data) ? data.length : (data.totalCount || data.items?.length || 0)
      };
    } catch (error) {
      console.error("Error fetching check-ins:", error);
      
      // Return mock data on error
      return {
        items: generateMockCheckIns(pageParam, 10),
        nextCursor: pageParam < 5 ? pageParam + 1 : null,
        totalCount: 50
      };
    }
  }
  
  /**
   * Generate mock check-in data with realistic values
   * 
   * @param page - The current page number
   * @param count - Number of items to generate
   * @returns Array of mock check-in objects
   */
  function generateMockCheckIns(page: number, count: number): CheckIn[] {
    const emotions = ['happy', 'sad', 'anxious', 'excited', 'peaceful', 'frustrated'];
    const regions = ['US', 'EU', 'ASIA', 'AFRICA', 'SA'];
    const mockCheckIns: CheckIn[] = [];
    
    const offset = (page - 1) * count;
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
      const id = `check-${offset + i + 1}`;
      // More realistic timestamps - more recent for newer items
      const ageInHours = (i + offset) * 1.5;
      const timestamp = new Date(now - ageInHours * 3600000).toISOString();
      
      mockCheckIns.push({
        id,
        emotion: emotions[Math.floor(Math.random() * emotions.length)],
        intensity: 3 + Math.random() * 7, // More realistic intensity between 3-10
        note: i % 3 === 0 ? `Feeling ${emotions[i % emotions.length]} today because of work` : undefined,
        timestamp,
        userId: `user-${1000 + Math.floor(Math.random() * 9000)}`, // 4-digit user IDs
        region: regions[Math.floor(Math.random() * regions.length)],
      });
    }
    
    return mockCheckIns;
  }