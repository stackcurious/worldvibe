// src/components/check-in/share-card.tsx
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShareCardProps {
  emotion: string;
  intensity: number;
  streak: number;
  date: string;
}

export const ShareCard = ({ emotion, intensity, streak, date }: ShareCardProps) => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-[300px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden"
    >
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Mood Check</h3>
          <span className="text-sm text-gray-400">{date}</span>
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          <motion.span
            className="text-6xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {emotion}
          </motion.span>
          
          <div className="text-center">
            <h4 className="text-2xl font-semibold text-white mb-3">{emotion}</h4>
            <div className="flex justify-center space-x-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: 32 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "w-4 rounded",
                    i < intensity ? "bg-blue-500" : "bg-gray-700"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Daily Streak</span>
            <div className="flex items-center space-x-2">
              <motion.span
                className="text-xl font-bold text-white"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {streak}
              </motion.span>
              <span className="text-lg">🔥</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};