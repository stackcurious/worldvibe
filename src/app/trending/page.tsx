'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, Globe, Filter, MapPin, Clock, Heart } from 'lucide-react';
import { TrendingKeywords } from '@/components/trending/TrendingKeywords';
import { EmotionWordCloud } from '@/components/trending/EmotionWordCloud';
import { RecentVibes } from '@/components/vibes/RecentVibes';
import { EmotionReasons } from '@/components/vibes/EmotionReasons';
import Link from 'next/link';

const EMOTION_COLORS = {
  joy: '#FFB800',
  calm: '#4CAF50',
  stress: '#F44336',
  anticipation: '#FF9800',
  sadness: '#2196F3',
};

// Apple-inspired gradient backgrounds for each emotion
const EMOTION_GRADIENTS: Record<string, string> = {
  joy: 'bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500',
  calm: 'bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500',
  stress: 'bg-gradient-to-br from-rose-400 via-pink-400 to-red-500',
  sadness: 'bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500',
  anticipation: 'bg-gradient-to-br from-purple-400 via-fuchsia-400 to-pink-500',
};

const EMOTION_EMOJI: Record<string, string> = {
  joy: '😊',
  calm: '😌',
  stress: '😰',
  sadness: '😢',
  anticipation: '🤩',
};

interface Vibe {
  id: string;
  emotion: string;
  intensity: number;
  reason: string;
  region: string;
  timestamp: string;
  deviceType: string;
}

// Mock vibes data
const MOCK_VIBES: Vibe[] = [
  {
    id: 'mock-1',
    emotion: 'joy',
    intensity: 5,
    reason: "Just got accepted into my dream university! Years of hard work paying off! 🎓",
    region: "New York, US",
    timestamp: new Date(Date.now() - 180000).toISOString(),
    deviceType: 'mobile',
  },
  {
    id: 'mock-2',
    emotion: 'calm',
    intensity: 4,
    reason: "Morning yoga by the lake. The sunrise was absolutely breathtaking.",
    region: "Vancouver, CA",
    timestamp: new Date(Date.now() - 360000).toISOString(),
    deviceType: 'mobile',
  },
  {
    id: 'mock-3',
    emotion: 'anticipation',
    intensity: 5,
    reason: "Wedding day tomorrow! Can't sleep, too excited to marry my best friend! 💍",
    region: "Paris, FR",
    timestamp: new Date(Date.now() - 540000).toISOString(),
    deviceType: 'tablet',
  },
  {
    id: 'mock-4',
    emotion: 'joy',
    intensity: 4,
    reason: "My little one took their first steps today! Proudest parent moment ever ❤️",
    region: "Sydney, AU",
    timestamp: new Date(Date.now() - 720000).toISOString(),
    deviceType: 'mobile',
  },
  {
    id: 'mock-5',
    emotion: 'stress',
    intensity: 3,
    reason: "Presentation day. Deep breaths. I've prepared for this. I can do it!",
    region: "London, UK",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    deviceType: 'desktop',
  },
  {
    id: 'mock-6',
    emotion: 'calm',
    intensity: 5,
    reason: "Finished reading an incredible book. Sometimes you need to unplug and just read.",
    region: "Tokyo, JP",
    timestamp: new Date(Date.now() - 1080000).toISOString(),
    deviceType: 'tablet',
  },
  {
    id: 'mock-7',
    emotion: 'joy',
    intensity: 5,
    reason: "Rescued a puppy from the shelter today. Meet Max! He's perfect! 🐕",
    region: "Berlin, DE",
    timestamp: new Date(Date.now() - 1260000).toISOString(),
    deviceType: 'mobile',
  },
  {
    id: 'mock-8',
    emotion: 'anticipation',
    intensity: 4,
    reason: "About to board my first international flight. Adventure awaits!",
    region: "Mumbai, IN",
    timestamp: new Date(Date.now() - 1440000).toISOString(),
    deviceType: 'mobile',
  },
  {
    id: 'mock-9',
    emotion: 'calm',
    intensity: 4,
    reason: "Rainy Sunday afternoon with tea and a cozy blanket. Pure bliss.",
    region: "Seattle, US",
    timestamp: new Date(Date.now() - 1620000).toISOString(),
    deviceType: 'desktop',
  },
  {
    id: 'mock-10',
    emotion: 'joy',
    intensity: 5,
    reason: "Finally debt-free after 5 years! Financial freedom feels amazing!",
    region: "Toronto, CA",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    deviceType: 'desktop',
  },
  {
    id: 'mock-11',
    emotion: 'stress',
    intensity: 2,
    reason: "Job interview jitters but staying positive. Everything happens for a reason.",
    region: "Singapore, SG",
    timestamp: new Date(Date.now() - 1980000).toISOString(),
    deviceType: 'mobile',
  },
  {
    id: 'mock-12',
    emotion: 'anticipation',
    intensity: 5,
    reason: "Concert tickets secured! Going to see my favorite band live after 3 years! 🎸",
    region: "Los Angeles, US",
    timestamp: new Date(Date.now() - 2160000).toISOString(),
    deviceType: 'desktop',
  },
];

export default function TrendingPage() {
  const [activeTab, setActiveTab] = useState<'insights' | 'wall'>('wall');
  const [vibes, setVibes] = useState<Vibe[]>(MOCK_VIBES);
  const [loading, setLoading] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(20);
  const [usingMockData, setUsingMockData] = useState(true);

  useEffect(() => {
    if (activeTab === 'wall') {
      fetchVibes();
      const interval = setInterval(fetchVibes, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedEmotion]);

  const fetchVibes = async () => {
    setLoading(true);
    try {
      const url = selectedEmotion
        ? `/api/vibes/recent?limit=100&emotion=${selectedEmotion}`
        : '/api/vibes/recent?limit=100';
      const response = await fetch(url);

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      if (data.vibes && data.vibes.length > 0) {
        setVibes(data.vibes);
        setUsingMockData(false);
      }
    } catch (err) {
      console.error('Error fetching vibes:', err);
      // Keep using mock data on error
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const emotions = [
    { key: 'joy', label: 'Joy', emoji: '😊' },
    { key: 'calm', label: 'Calm', emoji: '😌' },
    { key: 'anticipation', label: 'Anticipation', emoji: '🤩' },
    { key: 'stress', label: 'Stress', emoji: '😰' },
    { key: 'sadness', label: 'Sadness', emoji: '😢' },
  ];

  const displayedVibes = vibes.slice(0, displayCount);
  const hasMore = vibes.length > displayCount;
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm px-6 py-3 rounded-full border border-purple-400/30 mb-6">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium text-purple-200">Real-time Global Insights</span>
          </div>

          <h1 className="text-6xl font-black mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500">
              Trending Moods
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover what's on everyone's mind right now. Real conversations from real people around the world.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setActiveTab('wall')}
            className={`px-8 py-4 rounded-full font-bold text-lg transition-all ${
              activeTab === 'wall'
                ? 'bg-gradient-to-r from-yellow-400 to-pink-500 text-white shadow-xl scale-105'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Mood Wall
            </div>
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-8 py-4 rounded-full font-bold text-lg transition-all ${
              activeTab === 'insights'
                ? 'bg-gradient-to-r from-yellow-400 to-pink-500 text-white shadow-xl scale-105'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Insights & Analytics
            </div>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'insights' ? (
          <>
        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Global Trending Keywords */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold">Global Trending</h2>
            </div>
            <TrendingKeywords limit={15} refreshInterval={30000} />
          </motion.div>

          {/* Recent Vibes Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold">Latest Vibes</h2>
            </div>
            <RecentVibes limit={15} refreshInterval={30000} />
          </motion.div>

          {/* Emotion Word Cloud */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10"
          >
            <h2 className="text-2xl font-bold mb-6">Joy Vibes</h2>
            <EmotionWordCloud emotion="joy" limit={25} refreshInterval={30000} />
          </motion.div>
        </div>

        {/* Emotion-Specific Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-4xl font-bold text-center mb-12">
            Trending by Emotion
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[
              { emotion: 'joy', emoji: '😊', color: EMOTION_COLORS.joy },
              { emotion: 'calm', emoji: '😌', color: EMOTION_COLORS.calm },
              { emotion: 'anticipation', emoji: '🤩', color: EMOTION_COLORS.anticipation },
              { emotion: 'stress', emoji: '😰', color: EMOTION_COLORS.stress },
              { emotion: 'sadness', emoji: '😢', color: EMOTION_COLORS.sadness },
            ].map((item, index) => (
              <motion.div
                key={item.emotion}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all"
                style={{ borderColor: `${item.color}40` }}
              >
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">{item.emoji}</div>
                  <h3 className="text-xl font-bold capitalize">{item.emotion}</h3>
                </div>

                {/* Why people feel this way */}
                <div className="mb-6">
                  <EmotionReasons
                    emotion={item.emotion}
                    emoji={item.emoji}
                    color={item.color}
                    limit={5}
                  />
                </div>

                {/* Trending keywords for this emotion */}
                <div className="pt-4 border-t border-white/10">
                  <TrendingKeywords
                    emotion={item.emotion}
                    limit={3}
                    refreshInterval={45000}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Updates in real-time • Refreshes every 30 seconds</span>
          </div>
        </motion.div>
          </>
        ) : (
          <>
        {/* Vibes Wall Content */}
        {/* Emotion Filter */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setSelectedEmotion(null)}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              selectedEmotion === null
                ? 'bg-white text-purple-900 shadow-xl scale-105'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              All Vibes
            </div>
          </button>
          {emotions.map((emotion) => (
            <button
              key={emotion.key}
              onClick={() => setSelectedEmotion(emotion.key)}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                selectedEmotion === emotion.key
                  ? 'bg-white text-purple-900 shadow-xl scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{emotion.emoji}</span>
                <span>{emotion.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-gray-300">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm">
              {vibes.length} {selectedEmotion ? `${selectedEmotion} ` : ''}moods shared • Updates in real-time
            </span>
          </div>
        </div>

        {loading && vibes.length === 0 ? (
          <div className="text-center py-20">
            <div className="animate-spin h-16 w-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white text-xl">Loading vibes...</p>
          </div>
        ) : displayedVibes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌍</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No {selectedEmotion || ''} vibes yet
            </h3>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
              Be the first to share how you're feeling!
            </p>
            <Link
              href="/checkin"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-semibold hover:shadow-xl transition-all"
            >
              Share Your Vibe
            </Link>
          </div>
        ) : (
          <>
            {/* Masonry Grid */}
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {displayedVibes.map((vibe, index) => {
                const gradient = EMOTION_GRADIENTS[vibe.emotion] || EMOTION_GRADIENTS.joy;
                const emoji = EMOTION_EMOJI[vibe.emotion] || '😊';

                return (
                  <motion.div
                    key={vibe.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="break-inside-avoid"
                  >
                    {/* Card with gradient background */}
                    <div className={`relative ${gradient} rounded-3xl p-6 shadow-2xl overflow-hidden group/card`}>
                      {/* Subtle overlay for text readability */}
                      <div className="absolute inset-0 bg-black/10" />

                      {/* Content */}
                      <div className="relative space-y-4 text-white">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-4xl drop-shadow-lg">{emoji}</span>
                            <div>
                              <h4 className="text-lg font-bold capitalize drop-shadow-md">
                                {vibe.emotion}
                              </h4>
                              <div className="flex gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Heart
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < vibe.intensity
                                        ? 'fill-white/90 text-white/90'
                                        : 'fill-white/30 text-white/30'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quote */}
                        <blockquote className="text-base font-medium leading-relaxed drop-shadow-md">
                          "{vibe.reason}"
                        </blockquote>

                        {/* Footer */}
                        <div className="space-y-2 pt-2 border-t border-white/20">
                          <div className="flex items-center gap-2 text-white/90 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium">{vibe.region}</span>
                          </div>
                          <div className="flex items-center justify-between text-white/80 text-xs">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(vibe.timestamp)}
                            </div>
                            <span className="capitalize">{vibe.deviceType}</span>
                          </div>
                        </div>
                      </div>

                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 transform translate-x-[-100%] group-hover/card:translate-x-[100%] transition-transform duration-1000" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center mt-12"
              >
                <button
                  onClick={() => setDisplayCount(displayCount + 20)}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full font-semibold text-white border border-white/20 transition-all hover:scale-105"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Load More Vibes
                  </div>
                </button>
              </motion.div>
            )}
          </>
        )}
          </>
        )}
      </div>
    </div>
  );
}
