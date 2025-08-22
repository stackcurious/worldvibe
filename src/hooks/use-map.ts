"use client";
import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useTheme } from 'next-themes';
import { MAP_STYLES } from '@/config/constants';

interface MapOptions extends mapboxgl.MapboxOptions {
  onLoad?: (map: mapboxgl.Map) => void;
  onError?: (error: Error) => void;
}

export function useMap(
  containerRef: React.RefObject<HTMLDivElement>,
  options: MapOptions
) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { theme } = useTheme();

  const initializeMap = useCallback(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      mapRef.current = new mapboxgl.Map({
        container: containerRef.current,
        style: MAP_STYLES[theme],
        ...options
      });

      mapRef.current.on('load', () => {
        options.onLoad?.(mapRef.current!);
      });

      // Add controls
      mapRef.current.addControl(new mapboxgl.NavigationControl());
      mapRef.current.addControl(new mapboxgl.ScaleControl());

      // Add error handling
      mapRef.current.on('error', (e) => {
        options.onError?.(e.error);
      });
    } catch (error) {
      options.onError?.(error as Error);
    }
  }, [containerRef, options, theme]);

  // Handle theme changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(MAP_STYLES[theme]);
    }
  }, [theme]);

  // Initialize map
  useEffect(() => {
    initializeMap();
    return () => {
      mapRef.current?.remove();
    };
  }, [initializeMap]);

  return mapRef;
}