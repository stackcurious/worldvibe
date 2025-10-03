"use client";

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InteractiveGlobe, GlobeCheckIn } from '@/components/visualization/interactive-globe';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Globe as GlobeIcon, Pause, Play, Filter } from 'lucide-react';

export default function GlobePage() {
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

  // Fetch check-ins for the globe
  const { data: checkInsData, isLoading } = useQuery({
    queryKey: ['check-ins', selectedEmotion],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', '500'); // Show last 500 check-ins
      if (selectedEmotion) params.set('emotion', selectedEmotion);

      const response = await fetch(`/api/check-ins?${params}`);
      if (!response.ok) throw new Error('Failed to fetch check-ins');
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Transform data for globe
  const globePoints: GlobeCheckIn[] = (checkInsData?.data || [])
    .filter((checkIn: any) => checkIn.coordinates?.lat && checkIn.coordinates?.lng)
    .map((checkIn: any) => ({
      id: checkIn.id,
      lat: checkIn.coordinates.lat,
      lng: checkIn.coordinates.lng,
      emotion: checkIn.emotion,
      intensity: checkIn.intensity,
      note: checkIn.note,
      timestamp: checkIn.timestamp,
      region: checkIn.region,
    }));

  // Handle point click
  const handlePointClick = useCallback((point: GlobeCheckIn) => {
    console.log('Clicked point:', point);
    // Could open a modal with details
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-lg bg-gray-900/80 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GlobeIcon className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">WorldVibe Globe</h1>
                <p className="text-sm text-gray-400">
                  Real-time emotional pulse of the planet
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRotate(!autoRotate)}
                className="gap-2"
              >
                {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {autoRotate ? 'Pause' : 'Rotate'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Globe View */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filters & Stats */}
          <div className="lg:col-span-1 space-y-4">
            {/* Stats Card */}
            <Card className="p-6 bg-gray-800/50 backdrop-blur-lg border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-400" />
                Filters
              </h3>

              <div className="space-y-3">
                <button
                  onClick={() => setSelectedEmotion(null)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                    selectedEmotion === null
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  All Emotions
                </button>
                {['joy', 'calm', 'stress', 'anticipation', 'sadness'].map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => setSelectedEmotion(emotion)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-all capitalize ${
                      selectedEmotion === emotion
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-6 bg-gray-800/50 backdrop-blur-lg border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-400">Active Check-ins</div>
                  <div className="text-2xl font-bold text-white">
                    {globePoints.length.toLocaleString()}
                  </div>
                </div>
                {checkInsData?.pagination && (
                  <div>
                    <div className="text-sm text-gray-400">Total in Database</div>
                    <div className="text-2xl font-bold text-white">
                      {checkInsData.pagination.total.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Legend */}
            <Card className="p-6 bg-gray-800/50 backdrop-blur-lg border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Legend</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-300">Joy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-300">Calm</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-300">Stress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-gray-300">Anticipation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-300">Sadness</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  Point size represents intensity (1-5)
                </p>
              </div>
            </Card>
          </div>

          {/* Globe Container */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-800/30 backdrop-blur-lg border-white/10 overflow-hidden">
              <div className="relative" style={{ height: '80vh', minHeight: '600px' }}>
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-400">Loading global check-ins...</p>
                    </div>
                  </div>
                ) : (
                  <InteractiveGlobe
                    checkIns={globePoints}
                    onPointClick={handlePointClick}
                    autoRotate={autoRotate}
                    showAtmosphere={true}
                    className="w-full h-full"
                  />
                )}
              </div>
            </Card>

            {/* Info Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
            >
              <p className="text-sm text-blue-200">
                <strong>Live visualization:</strong> Showing the most recent {globePoints.length} emotional check-ins from around the world.
                Hover over points to see details. The globe auto-refreshes every 10 seconds.
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
