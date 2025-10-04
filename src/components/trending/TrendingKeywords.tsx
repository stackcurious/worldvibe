'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrendingKeyword {
  keyword: string;
  score: number;
  count: number;
}

interface TrendingKeywordsProps {
  type?: 'global' | 'emotion';
  emotion?: string;
  limit?: number;
  refreshInterval?: number; // milliseconds
}

export function TrendingKeywords({
  type = 'global',
  emotion,
  limit = 10,
  refreshInterval = 30000, // 30 seconds default
}: TrendingKeywordsProps) {
  const [keywords, setKeywords] = useState<TrendingKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const params = new URLSearchParams({
          type,
          limit: String(limit),
        });

        if (type === 'emotion' && emotion) {
          params.append('emotion', emotion);
        }

        const response = await fetch(`/api/trending/keywords?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch trending keywords');
        }

        const data = await response.json();
        setKeywords(data.keywords || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();

    // Set up refresh interval
    const interval = setInterval(fetchTrending, refreshInterval);

    return () => clearInterval(interval);
  }, [type, emotion, limit, refreshInterval]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 dark:text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (keywords.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm">
        No trending keywords yet. Check back soon!
      </div>
    );
  }

  // Calculate max score for relative sizing
  const maxScore = Math.max(...keywords.map(k => k.score), 1);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {type === 'emotion' && emotion
          ? `Trending in ${emotion}`
          : 'Trending Now'}
      </h3>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {keywords.map((item, index) => {
            // Calculate relative size (1-2x)
            const scale = 1 + (item.score / maxScore) * 1;

            // Generate color based on index
            const colors = [
              'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
              'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
              'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
              'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200',
              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
              'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200',
            ];
            const colorClass = colors[index % colors.length];

            return (
              <motion.div
                key={item.keyword}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className={`
                  inline-flex items-center gap-1 px-3 py-1.5 rounded-full
                  ${colorClass}
                  transition-all duration-200 hover:shadow-md
                `}
                style={{
                  fontSize: `${scale}rem`,
                }}
              >
                <span className="font-medium">{item.keyword}</span>
                <span className="text-xs opacity-70">
                  {item.count}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Updates every {refreshInterval / 1000}s
      </div>
    </div>
  );
}
