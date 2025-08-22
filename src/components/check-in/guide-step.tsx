// src/components/check-in/guide-step.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";

interface GuideStepProps {
  message: string;
  position?: "right" | "left" | "top" | "bottom";
  isActive: boolean;
}

export const GuideStep = ({ message, position = "right", isActive }: GuideStepProps) => {
  const getPositionStyles = () => {
    switch (position) {
      case "right":
        return "-right-8 top-1/2 translate-x-full -translate-y-1/2";
      case "left":
        return "-left-8 top-1/2 -translate-x-full -translate-y-1/2";
      case "top":
        return "top-0 left-1/2 -translate-x-1/2 -translate-y-full";
      case "bottom":
        return "bottom-0 left-1/2 -translate-x-1/2 translate-y-full";
      default:
        return "-right-8 top-1/2 translate-x-full -translate-y-1/2";
    }
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`absolute ${getPositionStyles()}`}
        >
          <div className="relative">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg max-w-xs">
              <p className="text-sm">{message}</p>
            </div>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -right-4 top-1/2 transform -translate-y-1/2"
            >
              <div className="w-3 h-3 bg-blue-500 transform rotate-45" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};