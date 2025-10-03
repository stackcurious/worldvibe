// @ts-nocheck
// src/components/map/map-controls.tsx
"use client";
import { memo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ZoomIn, ZoomOut, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';

interface MapControlsProps {
 onZoomIn: () => void;
 onZoomOut: () => void;
 onCenter: () => void;
 onLocate: () => void;
 disabled?: boolean;
}

export const MapControls = memo(function MapControls({
 onZoomIn,
 onZoomOut,
 onCenter,
 onLocate,
 disabled
}: MapControlsProps) {
 return (
   <motion.div 
     className="absolute top-4 right-4 flex flex-col gap-2"
     initial={{ opacity: 0, x: 20 }}
     animate={{ opacity: 1, x: 0 }}
     transition={{ duration: 0.3 }}
   >
     <Tooltip content="Zoom In">
       <Button
         size="icon"
         variant="secondary"
         onClick={onZoomIn}
         disabled={disabled}
       >
         <ZoomIn className="w-4 h-4" />
       </Button>
     </Tooltip>

     <Tooltip content="Zoom Out">
       <Button
         size="icon"
         variant="secondary"
         onClick={onZoomOut}
         disabled={disabled}
       >
         <ZoomOut className="w-4 h-4" />
       </Button>
     </Tooltip>

     <Tooltip content="Center Map">
       <Button
         size="icon"
         variant="secondary"
         onClick={onCenter}
         disabled={disabled}
       >
         <Globe className="w-4 h-4" />
       </Button>
     </Tooltip>

     <Tooltip content="Find My Location">
       <Button
         size="icon"
         variant="secondary"
         onClick={onLocate}
         disabled={disabled}
       >
         <MapPin className="w-4 h-4" />
       </Button>
     </Tooltip>
   </motion.div>
 );
});