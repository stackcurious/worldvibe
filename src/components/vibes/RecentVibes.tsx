'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin, Clock } from 'lucide-react';

interface Vibe {
  id: string;
  emotion: string;
  intensity: number;
  reason: string;
  region: string;
  timestamp: string;
  relativeTime: string;
  deviceType: string;
}

interface RecentVibesProps {
  emotion?: string;
  limit?: number;
  refreshInterval?: number;
}

const EMOTION_CONFIG = {
  joy: { emoji: '😊', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200', border: 'border-yellow-300 dark:border-yellow-700' },
  calm: { emoji: '😌', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200', border: 'border-green-300 dark:border-green-700' },
  stress: { emoji: '😰', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200', border: 'border-red-300 dark:border-red-700' },
  anticipation: { emoji: '🤩', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200', border: 'border-purple-300 dark:border-purple-700' },
  sadness: { emoji: '😢', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200', border: 'border-blue-300 dark:border-blue-700' },
};

export function RecentVibes({
  emotion,
  limit = 10,
  refreshInterval = 30000,
}: RecentVibesProps) {
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVibes = async () => {
      try {
        const params = new URLSearchParams({
          limit: String(limit),
        });

        if (emotion) {
          params.append('emotion', emotion);
        }

        const response = await fetch(`/api/vibes/recent?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch vibes');
        }

        const data = await response.json();
        setVibes(data.vibes || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchVibes();
    const interval = setInterval(fetchVibes, refreshInterval);
    return () => clearInterval(interval);
  }, [emotion, limit, refreshInterval]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white/5 rounded-xl p-4">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 dark:text-red-400 text-sm p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        {error}
      </div>
    );
  }

  if (vibes.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No vibes shared yet. Be the first! 💫
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {vibes.map((vibe, index) => {
          const emotionConfig = EMOTION_CONFIG[vibe.emotion as keyof typeof EMOTION_CONFIG] || EMOTION_CONFIG.joy;

          return (
            <motion.div
              key={vibe.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`
                relative overflow-hidden rounded-xl p-4 border-2
                bg-white/5 backdrop-blur-sm
                ${emotionConfig.border}
                hover:bg-white/10 transition-all duration-200
                group
              `}
            >
              {/* Intensity indicator */}
              <div
                className="absolute top-0 left-0 h-full opacity-20"
                style={{
                  width: `${(vibe.intensity / 10) * 100}%`,
                  background: `linear-gradient(to right, currentColor, transparent)`,
                }}
              />

              <div className="relative flex gap-3">
                {/* Emotion icon */}
                <div className={`
                  flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl
                  ${emotionConfig.color}
                `}>
                  {emotionConfig.emoji}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Reason/Note */}
                  <p className="text-white font-medium mb-2 leading-relaxed">
                    "{vibe.reason}"
                  </p>

                  {/* Meta info */}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400 dark:text-gray-500">
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" style={{ opacity: vibe.intensity / 10 }} />
                      <span className="capitalize">{vibe.emotion}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{vibe.relativeTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{vibe.region.slice(0, 6)}...</span>
                    </div>
                  </div>
                </div>

                {/* Intensity badge */}
                <div className={`
                  flex-shrink-0 px-2 py-1 rounded-full text-xs font-bold
                  ${emotionConfig.color}
                `}>
                  {vibe.intensity}/10
                </div>
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 rounded-xl transition-all pointer-events-none" />
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
        Live updates • Refreshes every {refreshInterval / 1000}s
      </div>
    </div>
  );
}
