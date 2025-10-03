"use client";

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { VALID_EMOTIONS, EMOTION_COLORS, EMOTION_ICONS, EMOTION_DESCRIPTIONS } from '@/config/emotions';

interface EmotionSelectorProps {
  onChange: (emotion: string) => void;
  selectedEmotion: string | null;
}

// Map emotions from config
const emotions = VALID_EMOTIONS.map(emotion => ({
  label: emotion,
  value: emotion.toLowerCase(),
  emoji: EMOTION_ICONS[emotion],
  color: EMOTION_COLORS[emotion]
}));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25
    }
  }
};

export const EmotionSelector = memo(function EmotionSelector({ 
  onChange,
  selectedEmotion
}: EmotionSelectorProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-medium text-gray-900 dark:text-white mb-6 text-center"
      >
        How are you feeling?
      </motion.h2>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        {emotions.map(({ label, value, emoji, color }) => (
          <motion.button
            key={value}
            variants={itemVariants}
            onClick={() => onChange(value)}
            className={cn(
              "relative p-6 rounded-2xl border-2 transition-all duration-300",
              "hover:shadow-lg hover:scale-105 active:scale-95",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
              "bg-white dark:bg-gray-800",
              selectedEmotion === value
                ? "border-blue-500 shadow-md"
                : "border-gray-100 dark:border-gray-700"
            )}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence>
              {selectedEmotion === value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full"
                >
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-white text-sm absolute inset-0 flex items-center justify-center"
                  >
                    ✓
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <span className="text-4xl mb-4 block" role="img" aria-label={label}>
              {emoji}
            </span>
            <span className={cn(
              "text-sm font-medium block",
              "text-gray-900 dark:text-white"
            )}>
              {label}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
});