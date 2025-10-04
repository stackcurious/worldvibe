"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TrendingKeyword {
  word: string;
  count: number;
  emotion: string;
}

interface EmotionWordCloudProps {
  emotion?: string;
  limit?: number;
  refreshInterval?: number;
}

export function EmotionWordCloud({ 
  emotion, 
  limit = 30, 
  refreshInterval = 60000 
}: EmotionWordCloudProps) {
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
      <div className="flex flex-wrap gap-2 p-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-700/50 rounded-full animate-pulse" style={{ width: `${Math.random() * 60 + 40}px` }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm p-4">
        Failed to load word cloud
      </div>
    );
  }

  if (keywords.length === 0) {
    return (
      <div className="text-gray-400 text-sm p-4">
        No trending words available
      </div>
    );
  }

  // Calculate size based on count
  const maxCount = Math.max(...keywords.map(k => k.count));
  const minCount = Math.min(...keywords.map(k => k.count));

  return (
    <div className="flex flex-wrap gap-2 p-4">
      {keywords.map((keyword, index) => {
        const size = Math.max(12, (keyword.count - minCount) / (maxCount - minCount) * 20 + 12);
        const opacity = Math.max(0.6, (keyword.count - minCount) / (maxCount - minCount) * 0.4 + 0.6);
        
        return (
          <motion.span
            key={keyword.word}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="inline-block px-3 py-1 rounded-full text-white font-medium hover:scale-105 transition-transform cursor-pointer"
            style={{
              fontSize: `${size}px`,
              backgroundColor: `rgba(59, 130, 246, ${opacity})`,
            }}
            title={`${keyword.word}: ${keyword.count} mentions`}
          >
            {keyword.word}
          </motion.span>
        );
      })}
    </div>
  );
}
