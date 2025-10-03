"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Users } from "lucide-react";

const EMOTION_COLORS = {
  joy: "#FFB800",
  calm: "#4CAF50",
  stress: "#F44336",
  anticipation: "#FF9800",
  sadness: "#2196F3",
};

const EMOTION_EMOJIS = {
  joy: "😊",
  calm: "😌",
  stress: "😰",
  anticipation: "🤩",
  sadness: "😢",
};

// Mock country data - in production, fetch from API
const COUNTRIES_DATA = [
  {
    country: "United States",
    flag: "🇺🇸",
    checkIns: 8234,
    trend: 12.5,
    dominantEmotion: "joy",
    emotionBreakdown: { joy: 38, calm: 25, stress: 18, anticipation: 12, sadness: 7 },
    localTime: "3:24 PM",
  },
  {
    country: "United Kingdom",
    flag: "🇬🇧",
    checkIns: 4521,
    trend: 8.3,
    dominantEmotion: "calm",
    emotionBreakdown: { calm: 42, joy: 28, stress: 15, anticipation: 10, sadness: 5 },
    localTime: "8:24 PM",
  },
  {
    country: "Japan",
    flag: "🇯🇵",
    checkIns: 6183,
    trend: -3.2,
    dominantEmotion: "stress",
    emotionBreakdown: { stress: 35, calm: 30, joy: 20, anticipation: 10, sadness: 5 },
    localTime: "4:24 AM",
  },
  {
    country: "Brazil",
    flag: "🇧🇷",
    checkIns: 3892,
    trend: 15.7,
    dominantEmotion: "joy",
    emotionBreakdown: { joy: 45, calm: 22, anticipation: 18, stress: 10, sadness: 5 },
    localTime: "4:24 PM",
  },
  {
    country: "Germany",
    flag: "🇩🇪",
    checkIns: 3456,
    trend: 6.1,
    dominantEmotion: "calm",
    emotionBreakdown: { calm: 40, joy: 30, stress: 15, anticipation: 10, sadness: 5 },
    localTime: "9:24 PM",
  },
  {
    country: "Australia",
    flag: "🇦🇺",
    checkIns: 2987,
    trend: 10.2,
    dominantEmotion: "joy",
    emotionBreakdown: { joy: 42, calm: 28, anticipation: 15, stress: 10, sadness: 5 },
    localTime: "6:24 AM",
  },
  {
    country: "India",
    flag: "🇮🇳",
    checkIns: 5621,
    trend: 18.9,
    dominantEmotion: "anticipation",
    emotionBreakdown: { anticipation: 38, joy: 25, calm: 20, stress: 12, sadness: 5 },
    localTime: "12:54 AM",
  },
  {
    country: "Canada",
    flag: "🇨🇦",
    checkIns: 2341,
    trend: 7.4,
    dominantEmotion: "calm",
    emotionBreakdown: { calm: 44, joy: 28, stress: 12, anticipation: 10, sadness: 6 },
    localTime: "3:24 PM",
  },
  {
    country: "France",
    flag: "🇫🇷",
    checkIns: 2876,
    trend: -2.1,
    dominantEmotion: "calm",
    emotionBreakdown: { calm: 36, joy: 30, stress: 18, anticipation: 10, sadness: 6 },
    localTime: "9:24 PM",
  },
  {
    country: "South Korea",
    flag: "🇰🇷",
    checkIns: 4123,
    trend: 5.8,
    dominantEmotion: "stress",
    emotionBreakdown: { stress: 32, calm: 28, joy: 22, anticipation: 12, sadness: 6 },
    localTime: "4:24 AM",
  },
  {
    country: "Mexico",
    flag: "🇲🇽",
    checkIns: 2654,
    trend: 13.2,
    dominantEmotion: "joy",
    emotionBreakdown: { joy: 46, anticipation: 22, calm: 18, stress: 10, sadness: 4 },
    localTime: "2:24 PM",
  },
  {
    country: "Spain",
    flag: "🇪🇸",
    checkIns: 2198,
    trend: 9.5,
    dominantEmotion: "joy",
    emotionBreakdown: { joy: 44, calm: 26, anticipation: 15, stress: 10, sadness: 5 },
    localTime: "9:24 PM",
  },
];

export function CountryGrid() {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"checkIns" | "trend">("checkIns");

  const sortedCountries = [...COUNTRIES_DATA].sort((a, b) => {
    if (sortBy === "checkIns") return b.checkIns - a.checkIns;
    return b.trend - a.trend;
  });

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2">
            Global Mood by Country
          </h2>
          <p className="text-gray-300">
            Real-time emotional data from around the world 🌍
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
          const dominantColor = EMOTION_COLORS[data.dominantEmotion as keyof typeof EMOTION_COLORS];

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
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {data.trend > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(data.trend)}%
                  </div>
                </div>

                {/* Check-ins count */}
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-2xl font-bold text-white">
                    {data.checkIns.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-400">check-ins</span>
                </div>

                {/* Dominant emotion */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">
                      {EMOTION_EMOJIS[data.dominantEmotion as keyof typeof EMOTION_EMOJIS]}
                    </span>
                    <span
                      className="text-sm font-bold capitalize"
                      style={{ color: dominantColor }}
                    >
                      {data.dominantEmotion} ({data.emotionBreakdown[data.dominantEmotion as keyof typeof data.emotionBreakdown]}%)
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
                      .map(([emotion, percent]) => (
                        <div key={emotion} className="flex items-center gap-2">
                          <div className="w-16 text-xs text-gray-400 capitalize">
                            {emotion}
                          </div>
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: EMOTION_COLORS[emotion as keyof typeof EMOTION_COLORS],
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
        Showing top {COUNTRIES_DATA.length} countries • Updated in real-time
      </motion.div>
    </div>
  );
}
