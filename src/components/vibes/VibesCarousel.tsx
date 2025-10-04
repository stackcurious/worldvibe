'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Heart, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Vibe {
  id: string;
  emotion: string;
  intensity: number;
  reason: string;
  region: string;
  timestamp: string;
  deviceType: string;
}

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

// Mock vibes for initial display
const MOCK_VIBES: Vibe[] = [
  {
    id: 'mock-1',
    emotion: 'joy',
    intensity: 4,
    reason: "Just landed my dream job! All the hard work finally paid off 🎉",
    region: "San Francisco, US",
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
    deviceType: 'mobile',
  },
  {
    id: 'mock-2',
    emotion: 'calm',
    intensity: 5,
    reason: "Morning meditation by the ocean. The waves sound like pure peace.",
    region: "Sydney, AU",
    timestamp: new Date(Date.now() - 600000).toISOString(), // 10 min ago
    deviceType: 'mobile',
  },
  {
    id: 'mock-3',
    emotion: 'anticipation',
    intensity: 5,
    reason: "First date tonight with someone special. Butterflies everywhere!",
    region: "London, UK",
    timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
    deviceType: 'desktop',
  },
  {
    id: 'mock-4',
    emotion: 'stress',
    intensity: 3,
    reason: "Finals week is brutal but I've got this. Coffee is my best friend right now.",
    region: "Toronto, CA",
    timestamp: new Date(Date.now() - 1200000).toISOString(), // 20 min ago
    deviceType: 'mobile',
  },
  {
    id: 'mock-5',
    emotion: 'joy',
    intensity: 5,
    reason: "My baby said 'mama' for the first time! My heart is so full ❤️",
    region: "Tokyo, JP",
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    deviceType: 'mobile',
  },
  {
    id: 'mock-6',
    emotion: 'calm',
    intensity: 4,
    reason: "Finished a great book and having tea on my balcony. Simple pleasures.",
    region: "Berlin, DE",
    timestamp: new Date(Date.now() - 2400000).toISOString(), // 40 min ago
    deviceType: 'tablet',
  },
  {
    id: 'mock-7',
    emotion: 'anticipation',
    intensity: 4,
    reason: "Boarding my flight to Paris! First international trip in years!",
    region: "New York, US",
    timestamp: new Date(Date.now() - 3000000).toISOString(), // 50 min ago
    deviceType: 'mobile',
  },
  {
    id: 'mock-8',
    emotion: 'joy',
    intensity: 5,
    reason: "Just adopted the cutest puppy from the shelter. Meet Luna! 🐶",
    region: "Mumbai, IN",
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    deviceType: 'mobile',
  },
];

export function VibesCarousel() {
  const [vibes, setVibes] = useState<Vibe[]>(MOCK_VIBES);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchVibes = async () => {
      try {
        const response = await fetch('/api/vibes/recent?limit=20');
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

    fetchVibes();
    const interval = setInterval(fetchVibes, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (!scrollContainerRef.current || isPaused) return;

    const startAutoScroll = () => {
      autoScrollIntervalRef.current = setInterval(() => {
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const cardWidth = 400; // 320px card + 24px gap
          const maxScroll = container.scrollWidth - container.clientWidth;

          // If we're at the end, smoothly scroll back to start
          if (container.scrollLeft >= maxScroll - 10) {
            container.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            // Scroll to next card
            container.scrollBy({ left: cardWidth, behavior: 'smooth' });
          }
        }
      }, 4000); // Auto-scroll every 4 seconds
    };

    startAutoScroll();

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [isPaused]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return (
      <div className="relative h-96 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          <h3 className="text-2xl font-bold text-white">Live Vibes from Around the World</h3>
          {usingMockData && (
            <span className="px-3 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
              Preview Mode
            </span>
          )}
        </div>
        <Link
          href="/trending"
          className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium"
        >
          View all →
        </Link>
      </div>

      {/* Scrollable Cards Container */}
      <div
        className="relative group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {vibes.map((vibe, index) => {
            const gradient = EMOTION_GRADIENTS[vibe.emotion] || EMOTION_GRADIENTS.joy;
            const emoji = EMOTION_EMOJI[vibe.emotion] || '😊';

            return (
              <motion.div
                key={vibe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 w-80 snap-start"
              >
                {/* Card with gradient background */}
                <div className={`relative h-80 rounded-3xl ${gradient} p-8 shadow-2xl overflow-hidden group/card`}>
                  {/* Subtle overlay for text readability */}
                  <div className="absolute inset-0 bg-black/10" />

                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-between text-white">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-5xl drop-shadow-lg">{emoji}</span>
                        <div>
                          <h4 className="text-xl font-bold capitalize drop-shadow-md">
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
                    <div className="flex-1 flex items-center py-6">
                      <blockquote className="text-lg font-medium leading-relaxed drop-shadow-md">
                        "{vibe.reason}"
                      </blockquote>
                    </div>

                    {/* Footer */}
                    <div className="space-y-2">
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

        {/* Scroll buttons - appear on hover */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110"
        >
          <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110"
        >
          <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Bottom hint */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">
          {isPaused ? (
            <>Auto-scroll paused • Hover away to resume</>
          ) : (
            <>Auto-scrolling • Hover to pause • {vibes.length} vibes</>
          )}
        </p>
      </div>
    </div>
  );
}
