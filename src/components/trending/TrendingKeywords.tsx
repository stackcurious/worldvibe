"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TrendingKeyword {
  word: string;
  count: number;
  emotion: string;
}

interface TrendingKeywordsProps {
  emotion?: string;
  limit?: number;
  refreshInterval?: number;
}

export function TrendingKeywords({ 
  emotion, 
  limit = 20, 
  refreshInterval = 60000 
}: TrendingKeywordsProps) {
  const [keywords, setKeywords] = useState<TrendingKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (emotion) params.append('emotion', emotion);
      params.append('limit', limit.toString());
      
      const response = await fetch(`/api/trending/keywords?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trending keywords');
      }
      
      const data = await response.json();
      setKeywords(data.keywords || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch keywords');
      console.error('Error fetching trending keywords:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchKeywords, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [emotion, limit, refreshInterval]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-6 bg-gray-700/50 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm">
        Failed to load trending keywords
      </div>
    );
  }

  if (keywords.length === 0) {
    return (
      <div className="text-gray-400 text-sm">
        No trending keywords available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {keywords.map((keyword, index) => (
        <motion.div
          key={keyword.word}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{keyword.word}</span>
            {keyword.emotion && (
              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                {keyword.emotion}
              </span>
            )}
          </div>
          <span className="text-gray-400 text-sm">
            {keyword.count}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
