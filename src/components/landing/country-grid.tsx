"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Users, Loader2 } from "lucide-react";

const EMOTION_COLORS: Record<string, string> = {
  joy: "#FFB800",
  calm: "#4CAF50",
  stress: "#F44336",
  anticipation: "#FF9800",
  sadness: "#2196F3",
  happy: "#FFB800",
  anxious: "#FF9800",
  excited: "#FF6B35",
  grateful: "#10B981",
  frustrated: "#EF4444",
};

const EMOTION_EMOJIS: Record<string, string> = {
  joy: "😊",
  calm: "😌",
  stress: "😰",
  anticipation: "🤩",
  sadness: "😢",
  happy: "😊",
  anxious: "😰",
  excited: "🤩",
  grateful: "🙏",
  frustrated: "😤",
};

interface CountryData {
  country: string;
  flag: string;
  checkIns: number;
  trend: number;
  dominantEmotion: string;
  emotionBreakdown: Record<string, number>;
  localTime: string;
  activityScore: number;
}

// Mock data for initial display
const MOCK_COUNTRIES: CountryData[] = [
  {
    country: "United States",
    flag: "🇺🇸",
    checkIns: 1247,
    trend: 12,
    dominantEmotion: "joy",
    emotionBreakdown: { joy: 42, calm: 28, stress: 15, anticipation: 10, sadness: 5 },
    localTime: "10:30 AM",
    activityScore: 95,
  },
  {
    country: "United Kingdom",
    flag: "🇬🇧",
    checkIns: 832,
    trend: 8,
    dominantEmotion: "calm",
    emotionBreakdown: { calm: 38, joy: 32, stress: 18, sadness: 7, anticipation: 5 },
    localTime: "3:30 PM",
    activityScore: 87,
  },
  {
    country: "India",
    flag: "🇮🇳",
    checkIns: 2156,
    trend: 24,
    dominantEmotion: "anticipation",
    emotionBreakdown: { anticipation: 45, joy: 30, calm: 15, stress: 8, sadness: 2 },
    localTime: "8:00 PM",
    activityScore: 98,
  },
  {
    country: "Germany",
    flag: "🇩🇪",
    checkIns: 567,
    trend: -3,
    dominantEmotion: "calm",
    emotionBreakdown: { calm: 40, joy: 25, stress: 20, sadness: 10, anticipation: 5 },
    localTime: "4:30 PM",
    activityScore: 72,
  },
  {
    country: "Japan",
    flag: "🇯🇵",
    checkIns: 945,
    trend: 15,
    dominantEmotion: "stress",
    emotionBreakdown: { stress: 35, calm: 30, joy: 20, sadness: 10, anticipation: 5 },
    localTime: "11:30 PM",
    activityScore: 88,
  },
  {
    country: "Brazil",
    flag: "🇧🇷",
    checkIns: 1034,
    trend: 18,
    dominantEmotion: "joy",
    emotionBreakdown: { joy: 48, calm: 22, anticipation: 18, stress: 8, sadness: 4 },
    localTime: "11:30 AM",
    activityScore: 91,
  },
  {
    country: "Australia",
    flag: "🇦🇺",
    checkIns: 423,
    trend: 5,
    dominantEmotion: "calm",
    emotionBreakdown: { calm: 45, joy: 35, anticipation: 10, stress: 7, sadness: 3 },
    localTime: "12:30 AM",
    activityScore: 68,
  },
  {
    country: "Canada",
    flag: "🇨🇦",
    checkIns: 678,
    trend: 9,
    dominantEmotion: "joy",
    emotionBreakdown: { joy: 40, calm: 32, anticipation: 15, stress: 10, sadness: 3 },
    localTime: "10:30 AM",
    activityScore: 82,
  },
];

export function CountryGrid() {
  const [countries, setCountries] = useState<CountryData[]>(MOCK_COUNTRIES);
  const [loading, setLoading] = useState(true);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"checkIns" | "trend">("checkIns");
  const [usingMockData, setUsingMockData] = useState(true);

  useEffect(() => {
    fetchCountryData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCountryData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCountryData = async () => {
    try {
      const response = await fetch('/api/countries/stats');
      const data = await response.json();

      if (data.countries && data.countries.length > 0) {
        setCountries(data.countries);
        setUsingMockData(false);
      }
    } catch (error) {
      console.error('Error fetching country data:', error);
      // Keep using mock data on error
    } finally {
      setLoading(false);
    }
  };

  const sortedCountries = [...countries].sort((a, b) => {
    if (sortBy === "checkIns") return b.checkIns - a.checkIns;
    return b.trend - a.trend;
  });

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading global mood data...</p>
        </div>
      </div>
    );
  }

  if (countries.length === 0) {
    return (
      <div className="w-full">
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🌍</div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Be the First to Share Your Vibe!
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            No check-ins yet from around the world. Start the global conversation by sharing how you feel today.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2">
            Global Mood by Country
          </h2>
          <p className="text-gray-300">
            Real-time emotional data from {countries.length} {countries.length === 1 ? 'country' : 'countries'} 🌍
          </p>
        </div>

        {/* Sort buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy("checkIns")}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              sortBy === "checkIns"
                ? "bg-white/20 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Most Active
          </button>
          <button
            onClick={() => setSortBy("trend")}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              sortBy === "trend"
                ? "bg-white/20 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Trending
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedCountries.map((data, index) => {
          const isHovered = hoveredCountry === data.country;
          const dominantColor = EMOTION_COLORS[data.dominantEmotion] || EMOTION_COLORS.calm;
          const dominantEmoji = EMOTION_EMOJIS[data.dominantEmotion] || EMOTION_EMOJIS.calm;

          return (
            <motion.div
              key={data.country}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onHoverStart={() => setHoveredCountry(data.country)}
              onHoverEnd={() => setHoveredCountry(null)}
              className="relative group cursor-pointer"
              whileHover={{ y: -8 }}
            >
              <div
                className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 overflow-hidden transition-all h-full"
                style={{
                  borderColor: isHovered ? dominantColor : "rgba(255,255,255,0.1)",
                  backgroundColor: isHovered ? `${dominantColor}10` : "rgba(255,255,255,0.05)",
                }}
              >
                {/* Glow effect */}
                {isHovered && (
                  <motion.div
                    className="absolute inset-0 blur-xl -z-10"
                    style={{ backgroundColor: dominantColor }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                  />
                )}

                {/* Country header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{data.flag}</span>
                    <div>
                      <h3 className="font-bold text-white text-lg">{data.country}</h3>
                      <p className="text-xs text-gray-400">{data.localTime} local</p>
                    </div>
                  </div>

                  {/* Trend badge */}
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                      data.trend > 0
                        ? "bg-green-500/20 text-green-400"
                        : data.trend < 0
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {data.trend > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : data.trend < 0 ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : (
                      <span>~</span>
                    )}
                    {data.trend !== 0 && `${Math.abs(data.trend)}%`}
                  </div>
                </div>

                {/* Check-ins count */}
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-2xl font-bold text-white">
                    {data.checkIns.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-400">check-in{data.checkIns !== 1 ? 's' : ''}</span>
                </div>

                {/* Dominant emotion */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{dominantEmoji}</span>
                    <span
                      className="text-sm font-bold capitalize"
                      style={{ color: dominantColor }}
                    >
                      {data.dominantEmotion}
                      {data.emotionBreakdown[data.dominantEmotion] &&
                        ` (${data.emotionBreakdown[data.dominantEmotion]}%)`
                      }
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">Most common feeling</div>
                </div>

                {/* Emotion breakdown bars - show on hover */}
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: isHovered ? "auto" : 0,
                    opacity: isHovered ? 1 : 0,
                  }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-3 border-t border-white/10">
                    <div className="text-xs text-gray-400 mb-2">Emotion breakdown:</div>
                    {Object.entries(data.emotionBreakdown)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5) // Show top 5 emotions
                      .map(([emotion, percent]) => (
                        <div key={emotion} className="flex items-center gap-2">
                          <div className="w-16 text-xs text-gray-400 capitalize">
                            {emotion}
                          </div>
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: EMOTION_COLORS[emotion] || EMOTION_COLORS.calm,
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.5, delay: 0.1 }}
                            />
                          </div>
                          <div className="w-10 text-xs text-gray-300 text-right">
                            {percent}%
                          </div>
                        </div>
                      ))}
                  </div>
                </motion.div>

                {/* Pulse animation on active emotion */}
                {isHovered && (
                  <motion.div
                    className="absolute top-3 right-3 w-2 h-2 rounded-full"
                    style={{ backgroundColor: dominantColor }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-gray-400 text-sm"
      >
        Showing {countries.length} active {countries.length === 1 ? 'country' : 'countries'} • Updated in real-time • Refreshes every 30 seconds
      </motion.div>
    </div>
  );
}
