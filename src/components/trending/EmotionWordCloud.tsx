'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TrendingKeyword {
  keyword: string;
  score: number;
  count: number;
}

interface EmotionWordCloudProps {
  emotion: string;
  limit?: number;
  refreshInterval?: number;
}

export function EmotionWordCloud({
  emotion,
  limit = 20,
  refreshInterval = 30000,
}: EmotionWordCloudProps) {
  const [keywords, setKeywords] = useState<TrendingKeyword[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const params = new URLSearchParams({
          type: 'emotion',
          emotion,
          limit: String(limit),
        });

        const response = await fetch(`/api/trending/keywords?${params}`);
        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        setKeywords(data.keywords || []);
      } catch (err) {
        console.error('Error fetching trending:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
    const interval = setInterval(fetchTrending, refreshInterval);
    return () => clearInterval(interval);
  }, [emotion, limit, refreshInterval]);

  if (loading) {
    return <div className="h-64 flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>;
  }

  if (keywords.length === 0) {
    return <div className="text-center text-gray-500 dark:text-gray-400 py-8">
      No trending words for {emotion} yet
    </div>;
  }

  const maxScore = Math.max(...keywords.map(k => k.score), 1);

  // Emotion-specific color schemes
  const emotionColors: Record<string, string[]> = {
    joy: ['text-yellow-400', 'text-yellow-500', 'text-yellow-600', 'text-amber-500'],
    calm: ['text-blue-400', 'text-blue-500', 'text-cyan-400', 'text-teal-400'],
    stress: ['text-red-400', 'text-red-500', 'text-orange-500', 'text-red-600'],
    sadness: ['text-indigo-400', 'text-blue-600', 'text-purple-400', 'text-slate-500'],
    anticipation: ['text-purple-400', 'text-purple-500', 'text-pink-400', 'text-fuchsia-400'],
  };

  const colors = emotionColors[emotion] || ['text-gray-400', 'text-gray-500', 'text-gray-600'];

  return (
    <div className="relative w-full h-64 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6">
      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-4 p-4">
        {keywords.map((item, index) => {
          // Calculate font size based on score (12px to 48px)
          const fontSize = 12 + (item.score / maxScore) * 36;

          // Random rotation for visual interest
          const rotation = (Math.random() - 0.5) * 20;

          // Random position offset
          const offsetX = (Math.random() - 0.5) * 100;
          const offsetY = (Math.random() - 0.5) * 100;

          const colorClass = colors[index % colors.length];

          return (
            <motion.span
              key={item.keyword}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 0.7 + (item.score / maxScore) * 0.3,
                scale: 1,
                x: offsetX,
                y: offsetY,
              }}
              transition={{
                duration: 0.5,
                delay: index * 0.05,
              }}
              className={`
                font-bold cursor-default select-none
                ${colorClass}
                hover:opacity-100 hover:scale-110
                transition-all duration-200
              `}
              style={{
                fontSize: `${fontSize}px`,
                transform: `rotate(${rotation}deg)`,
                lineHeight: 1,
              }}
              title={`${item.keyword}: ${item.count} mentions`}
            >
              {item.keyword}
            </motion.span>
          );
        })}
      </div>

      <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-500">
        {emotion} vibes
      </div>
    </div>
  );
}
