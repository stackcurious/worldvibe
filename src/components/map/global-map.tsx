// src/components/map/global-map.tsx
"use client";
import { useRef, useEffect, memo } from "react";
import mapboxgl from "mapbox-gl";
import { useTheme } from "next-themes";
import { useMapData } from "@/hooks/use-map-data";
import { MAP_STYLES } from "@/config/map";
import type { MapMarker } from "@/types";

interface GlobalMapProps {
  markers?: MapMarker[];
  initialView?: {
    center: [number, number];
    zoom: number;
  };
  onRegionClick?: (region: string) => void;
}

export const GlobalMap = memo(function GlobalMap({
  markers = [],
  initialView = { center: [0, 20], zoom: 1.5 },
  onRegionClick
}: GlobalMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { theme } = useTheme();
  const { data: mapData, isLoading } = useMapData();

  useEffect(() => {
    if (!mapboxgl.accessToken || !mapContainer.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[theme],
      center: initialView.center,
      zoom: initialView.zoom,
      maxZoom: 9,
      minZoom: 1,
      attributionControl: false
    });

    const map = mapRef.current;

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add performance optimizations
    map.on('load', () => {
      // Add custom layers for better performance
      map.addSource('emotions', {
        type: 'geojson',
        data: mapData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Add heat map layer
      map.addLayer({
        id: 'emotion-heat',
        type: 'heatmap',
        source: 'emotions',
        maxzoom: 9,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 0,
            6, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            9, 3
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            9, 20
          ],
          'heatmap-opacity': 0.7
        }
      });
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.remove();
    };
  }, [theme, initialView, mapData]);

  // Update markers efficiently
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(({ lat, lng, emotion, intensity }) => {
      const marker = new mapboxgl.Marker({
        color: getEmotionColor(emotion, intensity),
        scale: getMarkerScale(intensity)
      })
        .setLngLat([lng, lat])
        .addTo(mapRef.current!);
      
      markersRef.current.push(marker);
    });
  }, [markers]);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
});