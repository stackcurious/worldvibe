"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface RecentVibe {
  id: string;
  emotion: string;
  intensity: number;
  reason: string;
  region: string;
  timestamp: string;
  deviceType: string;
}

interface RecentVibesProps {
  limit?: number;
  refreshInterval?: number;
  emotion?: string;
}

export function RecentVibes({ 
  limit = 20, 
  refreshInterval = 30000,
  emotion 
}: RecentVibesProps) {
  const [vibes, setVibes] = useState<RecentVibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVibes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (emotion) params.append('emotion', emotion);
      params.append('limit', limit.toString());
      
      const response = await fetch(`/api/vibes/recent?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent vibes');
      }
      
      const data = await response.json();
      setVibes(data.vibes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vibes');
      console.error('Error fetching recent vibes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVibes();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchVibes, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [emotion, limit, refreshInterval]);

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      joy: 'text-yellow-400',
      calm: 'text-green-400',
      stress: 'text-red-400',
      sadness: 'text-blue-400',
      anticipation: 'text-purple-400',
      anger: 'text-red-500',
      fear: 'text-orange-400',
      disgust: 'text-green-500',
      surprise: 'text-pink-400',
      trust: 'text-indigo-400',
    };
    return colors[emotion.toLowerCase()] || 'text-gray-400';
  };

  const getIntensityStars = (intensity: number) => {
    return '★'.repeat(intensity) + '☆'.repeat(5 - intensity);
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

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-3 bg-gray-800/50 rounded-lg">
            <div className="h-4 bg-gray-700/50 rounded animate-pulse mb-2" />
            <div className="h-3 bg-gray-700/50 rounded animate-pulse w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm">
        Failed to load recent vibes
      </div>
    );
  }

  if (vibes.length === 0) {
    return (
      <div className="text-gray-400 text-sm">
        No recent vibes available
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {vibes.map((vibe, index) => (
        <motion.div
          key={vibe.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`font-medium capitalize ${getEmotionColor(vibe.emotion)}`}>
                {vibe.emotion}
              </span>
              <span className="text-yellow-400 text-sm">
                {getIntensityStars(vibe.intensity)}
              </span>
            </div>
            <span className="text-gray-400 text-xs">
              {formatTimeAgo(vibe.timestamp)}
            </span>
          </div>
          
          <p className="text-gray-300 text-sm leading-relaxed">
            "{vibe.reason}"
          </p>
          
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Region: {vibe.region}</span>
            <span className="capitalize">{vibe.deviceType}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
