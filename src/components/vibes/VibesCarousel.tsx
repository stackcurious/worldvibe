'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Clock, Heart } from 'lucide-react';
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

const EMOTION_COLORS: Record<string, string> = {
  joy: 'from-yellow-400/20 to-yellow-600/20 border-yellow-500/30',
  calm: 'from-green-400/20 to-green-600/20 border-green-500/30',
  stress: 'from-red-400/20 to-red-600/20 border-red-500/30',
  sadness: 'from-blue-400/20 to-blue-600/20 border-blue-500/30',
  anticipation: 'from-purple-400/20 to-purple-600/20 border-purple-500/30',
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(0);
  const [usingMockData, setUsingMockData] = useState(true);

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

  // Auto-advance carousel
  useEffect(() => {
    if (vibes.length === 0) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % vibes.length);
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(timer);
  }, [vibes.length]);

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % vibes.length);
  };

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + vibes.length) % vibes.length);
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
      <div className="relative h-64 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (vibes.length === 0) {
    return (
      <div className="relative h-64 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex items-center justify-center">
        <p className="text-gray-400">No vibes shared yet. Be the first!</p>
      </div>
    );
  }

  const currentVibe = vibes[currentIndex];
  const emotionColor = EMOTION_COLORS[currentVibe.emotion] || EMOTION_COLORS.joy;
  const emotionEmoji = EMOTION_EMOJI[currentVibe.emotion] || '😊';

  return (
    <div className="relative">
      {/* Main Carousel */}
      <div className="relative h-80 overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-white/10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 300 : -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -300 : 300 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0 p-8"
          >
            {/* Background gradient based on emotion */}
            <div className={`absolute inset-0 bg-gradient-to-br ${emotionColor} opacity-50`} />

            {/* Content */}
            <div className="relative h-full flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-5xl">{emotionEmoji}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-white capitalize">{currentVibe.emotion}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Heart
                            key={i}
                            className={`w-4 h-4 ${
                              i < currentVibe.intensity
                                ? 'fill-red-500 text-red-500'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-gray-400 text-sm">
                        {currentVibe.intensity}/5 intensity
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    {formatTimeAgo(currentVibe.timestamp)}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                    <MapPin className="w-4 h-4" />
                    {currentVibe.region.slice(0, 8)}...
                  </div>
                </div>
              </div>

              {/* Quote/Reason */}
              <div className="flex-1 flex items-center justify-center py-8">
                <blockquote className="text-3xl font-light text-white text-center leading-relaxed max-w-2xl">
                  "{currentVibe.reason}"
                </blockquote>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="text-gray-500 text-sm">
                  Anonymous • {currentVibe.deviceType}
                </div>
                <Link
                  href="/trending"
                  className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium flex items-center gap-1"
                >
                  View all vibes
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {vibes.slice(0, 10).map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-purple-500'
                : 'w-2 bg-gray-600 hover:bg-gray-500'
            }`}
          />
        ))}
      </div>

      {/* Live indicator / Preview mode */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {usingMockData ? (
          <>
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-xs text-yellow-400">Preview</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-gray-400">Live</span>
          </>
        )}
      </div>
    </div>
  );
}
