"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarHead } from '@/components/avatars/avatar-heads';
import { Clock, MapPin, TrendingUp } from 'lucide-react';

const EMOTION_COLORS: Record<string, string> = {
  joy: "#FFB800",
  calm: "#4CAF50",
  stress: "#F44336",
  anticipation: "#FF9800",
  sadness: "#2196F3",
};

const EMOTION_EMOJIS: Record<string, string> = {
  joy: "😊",
  calm: "😌",
  stress: "😰",
  anticipation: "🤩",
  sadness: "😢",
};

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white text-lg font-medium">Loading Globe...</p>
        <p className="text-gray-400 text-sm mt-2">Preparing emotional data visualization</p>
      </div>
    </div>
  ),
});

export interface GlobeCheckIn {
  id: string;
  lat: number;
  lng: number;
  emotion: string;
  intensity: number;
  note?: string;
  timestamp: string;
  region?: string;
  avatar?: string; // alex, jordan, sam, casey, taylor
}

interface InteractiveGlobeProps {
  checkIns: GlobeCheckIn[];
  onPointClick?: (checkIn: GlobeCheckIn) => void;
  autoRotate?: boolean;
  showAtmosphere?: boolean;
  className?: string;
}

export function InteractiveGlobe({
  checkIns = [],
  onPointClick,
  autoRotate = true,
  showAtmosphere = true,
  className = '',
}: InteractiveGlobeProps) {
  const globeEl = useRef<any>();
  const [hoveredPoint, setHoveredPoint] = useState<GlobeCheckIn | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Process check-ins for globe display
  const processedPoints = useMemo(() => {
    return checkIns.map((checkIn) => {
      const color = EMOTION_COLORS[checkIn.emotion.toLowerCase()] || '#888';
      const avatar = checkIn.avatar || ['alex', 'jordan', 'sam', 'casey', 'taylor'][Math.floor(Math.random() * 5)];

      return {
        ...checkIn,
        avatar,
        color,
        size: 0.15 + (checkIn.intensity / 5) * 0.25, // Size based on intensity
        altitude: 0.01 + (checkIn.intensity / 5) * 0.03, // Height based on intensity
      };
    });
  }, [checkIns]);

  // Auto-rotation
  useEffect(() => {
    if (autoRotate && globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
  }, [autoRotate]);

  // Point hover handler
  const handlePointHover = (point: any) => {
    setHoveredPoint(point || null);
    if (point) {
      // Track mouse position for tooltip
      document.addEventListener('mousemove', handleMouseMove);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Custom HTML marker for avatars
  const htmlElementFn = (d: any) => {
    const el = document.createElement('div');
    el.style.cssText = `
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: ${d.color}20;
      border: 3px solid ${d.color};
      box-shadow: 0 0 20px ${d.color}80;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      animation: pulse 2s infinite;
    `;

    // Add avatar inside
    const avatarContainer = document.createElement('div');
    avatarContainer.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      background: white;
    `;

    // Render mini avatar (simplified for DOM)
    const avatar = document.createElement('div');
    avatar.textContent = EMOTION_EMOJIS[d.emotion.toLowerCase()] || '😊';
    avatar.style.cssText = `
      font-size: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    `;

    avatarContainer.appendChild(avatar);
    el.appendChild(avatarContainer);

    // Hover effect
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.3)';
      el.style.boxShadow = `0 0 30px ${d.color}`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)';
      el.style.boxShadow = `0 0 20px ${d.color}80`;
    });

    return el;
  };

  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Globe */}
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundColor="rgba(0,0,0,0)"

        // HTML markers for avatars
        htmlElementsData={processedPoints}
        htmlElement={htmlElementFn}
        htmlAltitude={(d: any) => d.altitude}

        // Atmosphere
        atmosphereColor={showAtmosphere ? "#6366f1" : undefined}
        atmosphereAltitude={showAtmosphere ? 0.2 : 0}

        // Point hover and click
        {...({
          onHtmlElementHover: handlePointHover,
          onHtmlElementClick: (point: any) => onPointClick && onPointClick(point)
        } as any)}

        // Controls
        enablePointerInteraction={true}
      />

      {/* Rich Hover Tooltip */}
      <AnimatePresence>
        {hoveredPoint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed pointer-events-none z-50"
            style={{
              left: mousePos.x + 20,
              top: mousePos.y - 100,
            }}
          >
            <div
              className="relative backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden min-w-[320px] max-w-[380px] border-2"
              style={{
                background: `linear-gradient(135deg, ${EMOTION_COLORS[hoveredPoint.emotion.toLowerCase()]}15 0%, rgba(0,0,0,0.9) 100%)`,
                borderColor: EMOTION_COLORS[hoveredPoint.emotion.toLowerCase()],
              }}
            >
              {/* Header with Avatar */}
              <div className="flex items-start gap-4 p-4 border-b border-white/10">
                <div className="flex-shrink-0">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center border-2 bg-white"
                    style={{
                      borderColor: EMOTION_COLORS[hoveredPoint.emotion.toLowerCase()],
                    }}
                  >
                    <AvatarHead variant={(hoveredPoint.avatar || 'alex') as any} size={60} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-lg capitalize">
                      {hoveredPoint.avatar || 'Anonymous'}
                    </span>
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: EMOTION_COLORS[hoveredPoint.emotion.toLowerCase()] }}
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{hoveredPoint.region || 'Unknown location'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{getTimeAgo(hoveredPoint.timestamp)}</span>
                  </div>
                </div>
              </div>

              {/* Emotion & Intensity */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">
                      {EMOTION_EMOJIS[hoveredPoint.emotion.toLowerCase()] || '😊'}
                    </span>
                    <div>
                      <div
                        className="text-lg font-bold capitalize"
                        style={{ color: EMOTION_COLORS[hoveredPoint.emotion.toLowerCase()] }}
                      >
                        {hoveredPoint.emotion}
                      </div>
                      <div className="text-xs text-gray-400">Current feeling</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-300">
                      <TrendingUp className="w-4 h-4" />
                      Intensity
                    </div>
                    <div className="flex gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-8 rounded-full transition-all"
                          style={{
                            backgroundColor: i < hoveredPoint.intensity
                              ? EMOTION_COLORS[hoveredPoint.emotion.toLowerCase()]
                              : '#333',
                            opacity: i < hoveredPoint.intensity ? 1 : 0.3,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Note */}
                {hoveredPoint.note && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-xs text-gray-400 mb-2">What they're feeling:</div>
                    <p className="text-sm text-gray-300 italic line-clamp-3">
                      "{hoveredPoint.note}"
                    </p>
                  </div>
                )}
              </div>

              {/* Glow effect */}
              <div
                className="absolute inset-0 opacity-20 blur-xl -z-10"
                style={{ backgroundColor: EMOTION_COLORS[hoveredPoint.emotion.toLowerCase()] }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add pulse animation styles */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
