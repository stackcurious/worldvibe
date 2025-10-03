// src/components/map/heat-layer.tsx
// @ts-nocheck - Mapbox dependency not installed
"use client";
import { memo, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useTheme } from 'next-themes';
import { HEAT_MAP_COLORS, INTENSITY_SCALES } from '@/config/map';
import type { HeatData } from '@/types';

interface HeatLayerProps {
 mapInstance: mapboxgl.Map;
 data: HeatData[];
 intensity?: number;
 radius?: number;
 opacity?: number;
}

export const HeatLayer = memo(function HeatLayer({
 mapInstance,
 data,
 intensity = 1,
 radius = 30,
 opacity = 0.7
}: HeatLayerProps) {
 const layerId = useRef('emotion-heat');
 const { theme } = useTheme();

 useEffect(() => {
   if (!mapInstance || !data.length) return;

   // Add heat map source
   mapInstance.addSource(layerId.current, {
     type: 'geojson',
     data: {
       type: 'FeatureCollection',
       features: data.map(point => ({
         type: 'Feature',
         geometry: {
           type: 'Point',
           coordinates: [point.lng, point.lat]
         },
         properties: {
           intensity: point.intensity,
           emotion: point.emotion
         }
       }))
     }
   });

   // Add heat map layer with performance optimizations
   mapInstance.addLayer({
     id: layerId.current,
     type: 'heatmap',
     source: layerId.current,
     maxzoom: 15,
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
         0, intensity,
         15, intensity * 3
       ],
       'heatmap-color': HEAT_MAP_COLORS[theme],
       'heatmap-radius': [
         'interpolate',
         ['linear'],
         ['zoom'],
         0, radius,
         15, radius * 2
       ],
       'heatmap-opacity': opacity
     }
   });

   return () => {
     if (mapInstance.getLayer(layerId.current)) {
       mapInstance.removeLayer(layerId.current);
     }
     if (mapInstance.getSource(layerId.current)) {
       mapInstance.removeSource(layerId.current);
     }
   };
 }, [mapInstance, data, intensity, radius, opacity, theme]);

 return null;
});

