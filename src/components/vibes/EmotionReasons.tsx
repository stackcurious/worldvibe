'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, MessageCircle } from 'lucide-react';

interface Vibe {
  id: string;
  emotion: string;
  reason: string;
  relativeTime: string;
  intensity: number;
}

interface EmotionReasonsProps {
  emotion: string;
  emoji: string;
  color: string;
  limit?: number;
}

export function EmotionReasons({
  emotion,
  emoji,
  color,
  limit = 5,
}: EmotionReasonsProps) {
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const response = await fetch(`/api/vibes/recent?emotion=${emotion}&limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        setVibes(data.vibes || []);
      } catch (err) {
        console.error('Error fetching reasons:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReasons();
    const interval = setInterval(fetchReasons, 45000); // 45 seconds
    return () => clearInterval(interval);
  }, [emotion, limit]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (vibes.length === 0) {
    return (
      <div className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">
        No recent {emotion} vibes
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4" style={{ color }} />
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>
          Why people feel {emotion}
        </span>
      </div>

      {vibes.slice(0, 3).map((vibe, index) => (
        <motion.div
          key={vibe.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group relative"
        >
          <div
            className="text-sm text-gray-300 dark:text-gray-400 italic pl-3 border-l-2 py-1 hover:text-white transition-colors"
            style={{ borderColor: `${color}40` }}
          >
            "{vibe.reason}"
            <span className="text-xs text-gray-500 dark:text-gray-600 ml-2">
              {vibe.relativeTime}
            </span>
          </div>

          {/* Intensity indicator */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-full transition-all group-hover:w-2"
            style={{
              background: color,
              opacity: vibe.intensity / 20,
            }}
          />
        </motion.div>
      ))}

      {vibes.length > 3 && (
        <div className="text-xs text-gray-500 dark:text-gray-600 text-center pt-1">
          +{vibes.length - 3} more
        </div>
      )}
    </div>
  );
}
