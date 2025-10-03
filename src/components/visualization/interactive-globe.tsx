// @ts-nocheck
"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { EMOTION_COLORS } from '@/config/emotions';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading Globe...</p>
      </div>
    </div>
  ),
});

// Check-in data point interface
export interface GlobeCheckIn {
  id: string;
  lat: number;
  lng: number;
  emotion: string;
  intensity: number;
  note?: string;
  timestamp: string;
  region?: string;
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
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);

  // Emotion color mapping
  const getEmotionColor = (emotion: string): string => {
    const emotionKey = emotion.charAt(0).toUpperCase() + emotion.slice(1);
    return EMOTION_COLORS[emotionKey as keyof typeof EMOTION_COLORS] || '#888888';
  };

  // Process check-ins for visualization
  const processedPoints = useMemo(() => {
    return checkIns.map((checkIn) => ({
      ...checkIn,
      color: getEmotionColor(checkIn.emotion),
      size: 0.05 + (checkIn.intensity / 5) * 0.15, // Size based on intensity
      altitude: 0.01 + (checkIn.intensity / 5) * 0.03, // Height based on intensity
    }));
  }, [checkIns]);

  // Initialize globe settings
  useEffect(() => {
    if (globeEl.current) {
      const globe = globeEl.current;

      // Set initial point of view
      globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 0);

      // Auto-rotation
      if (autoRotate) {
        globe.controls().autoRotate = true;
        globe.controls().autoRotateSpeed = 0.5;
      }

      // Enable zoom and pan
      globe.controls().enableZoom = true;
      globe.controls().minDistance = 101;
      globe.controls().maxDistance = 500;

      setIsReady(true);
    }
  }, [autoRotate]);

  // Handle point hover
  const handlePointHover = (point: any, prevPoint: any) => {
    if (point) {
      setHoveredPoint(point as GlobeCheckIn);
      // Get mouse position for tooltip
      document.addEventListener('mousemove', updateTooltipPosition);
    } else {
      setHoveredPoint(null);
      document.removeEventListener('mousemove', updateTooltipPosition);
    }
  };

  const updateTooltipPosition = (e: MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  // Cleanup
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', updateTooltipPosition);
    };
  }, []);

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Globe
        ref={globeEl}
        // Globe appearance
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl={showAtmosphere ? "//unpkg.com/three-globe/example/img/night-sky.png" : undefined}

        // Atmosphere
        showAtmosphere={showAtmosphere}
        atmosphereColor="#3b82f6"
        atmosphereAltitude={0.15}

        // Points data
        pointsData={processedPoints}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude="altitude"
        pointRadius="size"

        // Point interactions
        onPointClick={onPointClick}
        onPointHover={handlePointHover}

        // Point appearance
        pointsMerge={false}
        pointsTransitionDuration={1000}

        // Labels (custom HTML)
        pointLabel={(point: any) => {
          const p = point as GlobeCheckIn;
          return `
            <div style="
              background: rgba(0, 0, 0, 0.85);
              padding: 12px;
              border-radius: 8px;
              color: white;
              min-width: 200px;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.1);
            ">
              <div style="
                font-size: 16px;
                font-weight: bold;
                color: ${getEmotionColor(p.emotion)};
                margin-bottom: 8px;
                text-transform: capitalize;
              ">
                ${p.emotion}
              </div>
              ${p.note ? `
                <div style="
                  font-size: 14px;
                  margin-bottom: 8px;
                  color: rgba(255, 255, 255, 0.9);
                ">
                  "${p.note}"
                </div>
              ` : ''}
              <div style="
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.6);
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
              ">
                <span>Intensity: ${p.intensity}/5</span>
                <span>${formatTimestamp(p.timestamp)}</span>
              </div>
            </div>
          `;
        }}
      />

      {/* Custom hover tooltip (alternative to built-in) */}
      <AnimatePresence>
        {hoveredPoint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="fixed pointer-events-none z-50 hidden" // Hidden by default, Globe's built-in tooltip is better
            style={{
              left: tooltipPos.x + 15,
              top: tooltipPos.y - 10,
            }}
          >
            <div className="bg-gray-900/95 backdrop-blur-lg border border-white/10 rounded-lg p-4 shadow-2xl max-w-xs">
              <div
                className="text-lg font-bold mb-2 capitalize"
                style={{ color: getEmotionColor(hoveredPoint.emotion) }}
              >
                {hoveredPoint.emotion}
              </div>
              {hoveredPoint.note && (
                <p className="text-sm text-gray-300 mb-3">
                  "{hoveredPoint.note}"
                </p>
              )}
              <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-white/10">
                <span>Intensity: {hoveredPoint.intensity}/5</span>
                <span>{formatTimestamp(hoveredPoint.timestamp)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Globe controls info */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-white/80">
        <div className="flex items-center gap-4">
          <span>🖱️ Drag to rotate</span>
          <span>🔍 Scroll to zoom</span>
          <span>👆 Click point for details</span>
        </div>
      </div>

      {/* Check-in counter */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
        <div className="text-2xl font-bold text-white">
          {processedPoints.length.toLocaleString()}
        </div>
        <div className="text-xs text-gray-400">Active Check-ins</div>
      </div>

      {/* Loading overlay */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="animate-pulse text-blue-400 text-lg mb-2">
              Initializing Globe...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
