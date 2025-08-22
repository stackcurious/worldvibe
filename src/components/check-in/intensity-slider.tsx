
// src/components/check-in/intensity-slider.tsx
"use client";

import { memo, useCallback } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/use-debounce';
import { useAnalytics } from '@/hooks/use-analytics';
import { cn } from '@/lib/utils';

interface IntensitySliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  emotion?: string;
}

const intensityLabels = {
  1: "Very Mild",
  2: "Mild",
  3: "Moderate",
  4: "Strong",
  5: "Very Strong"
};

export const IntensitySlider = memo(function IntensitySlider({
  value,
  onChange,
  disabled = false,
  emotion
}: IntensitySliderProps) {
  const debouncedValue = useDebounce(value, 300);
  const { trackEvent } = useAnalytics();

  const handleChange = useCallback((newValue: number[]) => {
    onChange(newValue[0]);
    trackEvent('intensity_changed', { value: newValue[0], emotion });
  }, [onChange, trackEvent, emotion]);

  const getIntensityColor = (val: number) => {
    if (val <= 2) return 'bg-blue-500 dark:bg-blue-400';
    if (val <= 3) return 'bg-green-500 dark:bg-green-400';
    if (val <= 4) return 'bg-yellow-500 dark:bg-yellow-400';
    return 'bg-red-500 dark:bg-red-400';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm"
    >
      <div className="flex justify-between items-center">
        <label className="text-base font-medium text-gray-900 dark:text-white">
          How intense is this feeling?
        </label>
        <AnimatePresence mode="wait">
          <motion.div
            key={value}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            className="flex items-center space-x-2"
          >
            <span className={cn(
              "px-3 py-1 rounded-full text-white text-sm font-medium",
              getIntensityColor(value)
            )}>
              {intensityLabels[value as keyof typeof intensityLabels]}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-10"
        value={[value]}
        onValueChange={handleChange}
        max={5}
        min={1}
        step={1}
        disabled={disabled}
        aria-label="Intensity"
      >
        <Slider.Track 
          className={cn(
            "bg-gray-200 dark:bg-gray-700 relative grow rounded-full h-2",
            "overflow-hidden transition-colors duration-200"
          )}
        >
          <Slider.Range className={cn(
            "absolute h-full rounded-full transition-all duration-200",
            getIntensityColor(value)
          )} />
        </Slider.Track>
        <Slider.Thumb
          className={cn(
            "block w-8 h-8 rounded-full bg-white dark:bg-gray-900",
            "shadow-lg ring-2 ring-offset-2 dark:ring-offset-gray-900",
            getIntensityColor(value),
            "focus:outline-none transition-transform duration-200",
            "hover:scale-110 hover:shadow-xl",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      </Slider.Root>

      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 px-1">
        <span>Barely Noticeable</span>
        <span>Very Intense</span>
      </div>
    </motion.div>
  );
});
