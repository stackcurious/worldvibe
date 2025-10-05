'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Activity, Globe } from 'lucide-react';

const EMOTION_COLORS: Record<string, string> = {
  joy: '#FFB800',
  calm: '#4CAF50',
  stress: '#F44336',
  anticipation: '#FF9800',
  sadness: '#2196F3',
};

const EMOTION_EMOJIS: Record<string, string> = {
  joy: '😊',
  calm: '😌',
  stress: '😰',
  anticipation: '🤩',
  sadness: '😢',
};

interface CountryStats {
  country: string;
  flag: string;
  checkIns: number;
  trend: number;
  dominantEmotion: string;
  emotionBreakdown: Record<string, number>;
  localTime: string;
  minutesSinceLastCheckIn?: number;
}

export function GlobalMoodByCountry() {
  const [countries, setCountries] = useState<CountryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchCountryStats = async () => {
    try {
      const response = await fetch('/api/countries/stats');
      const data = await response.json();

      if (data.countries && data.countries.length > 0) {
        setCountries(data.countries);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching country stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountryStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchCountryStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 animate-pulse">
            <div className="h-8 bg-white/10 rounded mb-4"></div>
            <div className="h-4 bg-white/10 rounded mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (countries.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">No country data available yet</p>
        <p className="text-sm text-gray-500 mt-2">Check-ins will appear here as they come in</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Global Mood by Country</h3>
          <p className="text-sm text-gray-400">
            Live emotional pulse from {countries.length} countries
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Last updated</div>
          <div className="text-sm text-gray-400">
            {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Country Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {countries.map((country, index) => {
          const emotionColor = EMOTION_COLORS[country.dominantEmotion] || '#888';
          const emotionEmoji = EMOTION_EMOJIS[country.dominantEmotion] || '😊';
          const isRecent = country.minutesSinceLastCheckIn && country.minutesSinceLastCheckIn < 5;

          return (
            <motion.div
              key={country.country}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="relative group"
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
                {/* Live indicator for recent activity */}
                {isRecent && (
                  <div className="absolute top-3 right-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}

                {/* Country Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{country.flag}</span>
                      <h4 className="text-lg font-bold text-white">{country.country}</h4>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{country.localTime}</span>
                    </div>
                  </div>
                </div>

                {/* Dominant Emotion */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{emotionEmoji}</span>
                      <div>
                        <div
                          className="text-sm font-bold capitalize"
                          style={{ color: emotionColor }}
                        >
                          {country.dominantEmotion}
                        </div>
                        <div className="text-xs text-gray-500">Dominant mood</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emotion Breakdown */}
                {Object.keys(country.emotionBreakdown).length > 0 && (
                  <div className="mb-4">
                    <div className="flex gap-1 h-6">
                      {Object.entries(country.emotionBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([emotion, percentage]) => (
                          <div
                            key={emotion}
                            className="transition-all hover:opacity-80"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: EMOTION_COLORS[emotion] || '#888',
                              borderRadius: '4px',
                            }}
                            title={`${emotion}: ${percentage}%`}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Activity className="w-4 h-4" />
                    <span>{country.checkIns} check-ins</span>
                  </div>

                  {country.trend !== 0 && (
                    <div className={`flex items-center gap-1 ${
                      country.trend > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {country.trend > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="font-medium">{Math.abs(country.trend)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Updates every 30 seconds • Sorted by recent activity</span>
        </div>
      </div>
    </div>
  );
}