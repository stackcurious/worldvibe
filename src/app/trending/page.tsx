'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, Globe } from 'lucide-react';
import { TrendingKeywords } from '@/components/trending/TrendingKeywords';
import { EmotionWordCloud } from '@/components/trending/EmotionWordCloud';
import { RecentVibes } from '@/components/vibes/RecentVibes';
import { EmotionReasons } from '@/components/vibes/EmotionReasons';

const EMOTION_COLORS = {
  joy: '#FFB800',
  calm: '#4CAF50',
  stress: '#F44336',
  anticipation: '#FF9800',
  sadness: '#2196F3',
};

export default function TrendingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm px-6 py-3 rounded-full border border-purple-400/30 mb-6">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium text-purple-200">Real-time Global Insights</span>
          </div>

          <h1 className="text-6xl font-black mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500">
              Trending Vibes
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover what's on everyone's mind right now. Real conversations from real people around the world.
          </p>
        </motion.div>

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
      </div>
    </div>
  );
}
