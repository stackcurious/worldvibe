"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/classnames";

export interface EmotionIconProps {
  emotion: string;
  className?: string;
  size?: number;
}

// A more robust, case‑insensitive mapping of emotion names to emojis.
// Adjust or extend this mapping as needed.
const emotionMap: Record<string, string> = {
  joy: "😊",
  trust: "🤝",
  fear: "😨",
  surprise: "😮",
  sadness: "😢",
  anticipation: "🤔",
  anger: "😠",
  disgust: "🤢",
  happy: "😊",
  calm: "😌",
  excited: "🤩",
  love: "❤️",
  tired: "😴",
  nervous: "😰",
  neutral: "😐",
};

export function EmotionIcon({ emotion, className, size = 40 }: EmotionIconProps) {
  // Convert the emotion to lowercase for case-insensitive matching.
  const lowerEmotion = emotion.toLowerCase();
  const emoji = emotionMap[lowerEmotion] || "❓";

  return (
    <motion.div
      className={cn(
        "flex items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow-md transition-all",
        className
      )}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.7,
      }}
    >
      {emoji}
    </motion.div>
  );
}
