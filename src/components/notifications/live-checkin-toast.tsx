"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock } from 'lucide-react';
import { EMOTION_COLORS, EMOTION_ICONS } from '@/config/emotions';

interface CheckInNotification {
  id: string;
  userName: string;
  location: string;
  emotion: string;
  intensity: number;
  note?: string;
  timestamp: Date;
}

export function LiveCheckInToast() {
  const [notifications, setNotifications] = useState<CheckInNotification[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Poll for new check-ins
  useEffect(() => {
    const fetchLatestCheckIn = async () => {
      try {
        const response = await fetch('/api/check-ins?limit=1');
        const data = await response.json();

        if (data.success && data.data.length > 0) {
          const checkIn = data.data[0];

          // Create notification
          const notification: CheckInNotification = {
            id: checkIn.id,
            userName: generateAnonymousName(checkIn.region),
            location: formatLocation(checkIn.region),
            emotion: checkIn.emotion,
            intensity: checkIn.intensity,
            note: checkIn.note,
            timestamp: new Date(checkIn.timestamp),
          };

          // Only add if it's new (not already in notifications)
          setNotifications(prev => {
            if (prev.some(n => n.id === notification.id)) return prev;
            return [notification, ...prev].slice(0, 5); // Keep max 5
          });

          // Auto-remove after 8 seconds if not hovered
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
          }, 8000);
        }
      } catch (error) {
        console.error('Failed to fetch check-ins:', error);
      }
    };

    // Fetch every 5 seconds
    const interval = setInterval(fetchLatestCheckIn, 5000);
    fetchLatestCheckIn(); // Initial fetch

    return () => clearInterval(interval);
  }, []);

  // Generate anonymous but memorable names
  const generateAnonymousName = (region: string) => {
    const adjectives = ['Happy', 'Thoughtful', 'Peaceful', 'Curious', 'Energetic', 'Reflective', 'Bright', 'Serene'];
    const nouns = ['Traveler', 'Soul', 'Spirit', 'Wanderer', 'Dreamer', 'Explorer', 'Thinker', 'Seeker'];

    const seed = region.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const adj = adjectives[seed % adjectives.length];
    const noun = nouns[(seed * 7) % nouns.length];

    return `${adj} ${noun}`;
  };

  const formatLocation = (regionHash: string) => {
    // Extract readable location from hash (simplified)
    const locations = [
      'New York, USA', 'London, UK', 'Tokyo, Japan', 'Paris, France',
      'Sydney, Australia', 'Toronto, Canada', 'Berlin, Germany', 'Mumbai, India',
      'São Paulo, Brazil', 'Dubai, UAE', 'Singapore', 'Amsterdam, Netherlands',
      'Barcelona, Spain', 'Seoul, South Korea', 'Mexico City, Mexico'
    ];

    const seed = regionHash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return locations[seed % locations.length];
  };

  const getEmotionColor = (emotion: string) => {
    const key = emotion.charAt(0).toUpperCase() + emotion.slice(1);
    return EMOTION_COLORS[key as keyof typeof EMOTION_COLORS] || '#888';
  };

  const getEmotionIcon = (emotion: string) => {
    const key = emotion.charAt(0).toUpperCase() + emotion.slice(1);
    return EMOTION_ICONS[key as keyof typeof EMOTION_ICONS] || '💭';
  };

  const getTimeAgo = (timestamp: Date) => {
    const seconds = Math.floor((new Date().getTime() - timestamp.getTime()) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      <div className="flex flex-col gap-3 items-end">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification, index) => {
            const isHovered = hoveredId === notification.id;
            const emotionColor = getEmotionColor(notification.emotion);

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: 100, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }
                }}
                exit={{
                  opacity: 0,
                  x: 100,
                  scale: 0.8,
                  transition: { duration: 0.2 }
                }}
                className="pointer-events-auto"
                onMouseEnter={() => setHoveredId(notification.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  zIndex: 50 - index,
                }}
              >
                <motion.div
                  className="relative"
                  animate={{
                    scale: isHovered ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Main Notification Card */}
                  <div
                    className="relative backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden min-w-[320px] max-w-[380px]"
                    style={{
                      background: `linear-gradient(135deg, ${emotionColor}15 0%, rgba(0,0,0,0.85) 100%)`,
                      border: `1px solid ${emotionColor}40`,
                    }}
                  >
                    {/* Animated Gradient Border */}
                    <div
                      className="absolute inset-0 opacity-50"
                      style={{
                        background: `linear-gradient(45deg, ${emotionColor}30, transparent)`,
                      }}
                    />

                    {/* Close Button */}
                    <button
                      onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                      className="absolute top-3 right-3 z-10 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <X className="w-4 h-4 text-white/60" />
                    </button>

                    <div className="relative p-4">
                      {/* Header with Emotion Icon */}
                      <div className="flex items-start gap-3 mb-3">
                        <motion.div
                          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                          style={{
                            background: `${emotionColor}20`,
                            border: `2px solid ${emotionColor}`,
                          }}
                          animate={{
                            scale: isHovered ? [1, 1.1, 1] : 1,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {getEmotionIcon(notification.emotion)}
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-semibold text-white truncate">
                              {notification.userName}
                            </span>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {getTimeAgo(notification.timestamp)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-300">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{notification.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Emotion & Intensity */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-medium capitalize"
                            style={{ color: emotionColor }}
                          >
                            {notification.emotion}
                          </span>
                        </div>

                        {/* Intensity Dots */}
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full transition-all"
                              style={{
                                backgroundColor: i < notification.intensity ? emotionColor : '#333',
                                opacity: i < notification.intensity ? 1 : 0.3,
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Expandable Note Section */}
                      <AnimatePresence>
                        {isHovered && notification.note && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <p className="text-sm text-gray-300 italic line-clamp-3">
                                "{notification.note}"
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Live Indicator */}
                      <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
                        <motion.div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: emotionColor }}
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                        />
                        <span className="text-xs text-gray-400">Live</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <motion.div
                      className="h-1"
                      style={{ backgroundColor: `${emotionColor}` }}
                      initial={{ scaleX: 1 }}
                      animate={{ scaleX: isHovered ? 1 : 0 }}
                      transition={{
                        duration: isHovered ? 0 : 8,
                        ease: "linear"
                      }}
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>

                  {/* Hover Tooltip */}
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-8 left-0 right-0 text-center"
                    >
                      <p className="text-xs text-gray-400 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full inline-block">
                        Hover to keep, move away to dismiss
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
